import { XMLParser } from "fast-xml-parser";
import { prisma } from "./prisma";
import { getServerEnv } from "./env";

type XmlNode = Record<string, unknown>;
type XmlOffer = XmlNode;

function text(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return undefined;
}
function arrayOf<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}
function slugify(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9а-яіїєґ]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}
function uniqueSlug(base: string, sku: string): string {
  return `${slugify(base) || "product"}-${slugify(sku) || "item"}`;
}

async function setStage(runId: string, stage: string) {
  await prisma.importRun.update({
    where: { id: runId },
    data: { error: stage }
  });
}

async function runSupplierImport(runId: string) {
  try {
    const { SUPPLIER_FEED_URL } = getServerEnv();
    await setStage(runId, "Етап: завантаження XML");
    const response = await fetch(SUPPLIER_FEED_URL, {
      headers: { "User-Agent": "OKSA-Product-Importer/1.0", "Accept": "application/xml,text/xml,*/*" },
      cache: "no-store",
      signal: AbortSignal.timeout(90_000)
    });
    if (!response.ok) throw new Error(`Feed request failed: HTTP ${response.status}`);

    await setStage(runId, `Етап: XML отримано (HTTP ${response.status}), читаю файл`);
    const xml = await response.text();
    await setStage(runId, `Етап: XML завантажено (${xml.length} символів), розбір XML`);
    const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });
    const root = parser.parse(xml)?.yml_catalog?.shop as XmlNode | undefined;
    if (!root) throw new Error("Invalid YML/XML: shop node not found");

    await setStage(runId, "Етап: XML розібрано, обробка категорій");
    const categories = arrayOf<XmlNode>(root.categories ? ((root.categories as XmlNode).category as XmlNode | XmlNode[] | undefined) : undefined);
    const categoryIds = new Map<string, string>();

    for (const raw of categories) {
      const id = text(raw["@_id"]);
      const name = text(raw["#text"] ?? raw);
      if (!id || !name) continue;
      const slug = `${slugify(name)}-${slugify(id)}`;
      const category = await prisma.category.upsert({ where: { slug }, create: { name, slug, sortOrder: 0 }, update: { name } });
      categoryIds.set(id, category.id);
    }
    for (const raw of categories) {
      const id = text(raw["@_id"]);
      const parentId = text(raw["@_parentId"]);
      if (!id || !parentId) continue;
      const categoryDbId = categoryIds.get(id);
      const parentDbId = categoryIds.get(parentId);
      if (categoryDbId && parentDbId) await prisma.category.update({ where: { id: categoryDbId }, data: { parentId: parentDbId } });
    }

    const offersNode = root.offers as XmlNode | undefined;
    const offers = arrayOf<XmlOffer>(offersNode?.offer as XmlOffer | XmlOffer[] | undefined);
    let processed = 0, created = 0, updated = 0, failed = 0;

    await setStage(runId, `Етап: знайдено товарів ${offers.length}, починаю імпорт`);

    for (let offset = 0; offset < offers.length; offset += 20) {
      const batch = offers.slice(offset, offset + 20);
      for (const offer of batch) {
        try {
          const sku = text(offer.vendorCode) || text(offer["@_id"]);
          const name = text(offer.name);
          const priceRaw = Number(text(offer.price));
          if (!sku || !name || !Number.isFinite(priceRaw) || priceRaw < 0) { failed++; processed++; continue; }

          const categoryValue = text(offer.categoryId);
          const categoryId = categoryValue ? categoryIds.get(categoryValue) : undefined;
          const images = arrayOf(offer.picture as string | string[] | undefined).map(text).filter(Boolean) as string[];
          const description = text(offer.description);
          const available = String(offer["@_available"] ?? "true").toLowerCase() !== "false";
          const existing = await prisma.product.findUnique({ where: { sku } });

          const product = await prisma.product.upsert({
            where: { sku },
            create: { sku, name, slug: uniqueSlug(name, sku), description, price: priceRaw, available, categoryId, vendorCode: sku, images: { create: images.map((url, sortOrder) => ({ url, sortOrder })) } },
            update: { name, description, price: priceRaw, available, categoryId, images: { deleteMany: {}, create: images.map((url, sortOrder) => ({ url, sortOrder })) } }
          });
          if (existing) updated++; else created++;

          const params = arrayOf<XmlNode>(offer.param as XmlNode | XmlNode[] | undefined);
          await prisma.productAttribute.deleteMany({ where: { productId: product.id } });
          if (params.length) {
            await prisma.productAttribute.createMany({
              data: params.flatMap((param) => {
                const key = text(param["@_name"]);
                const value = text(param["#text"] ?? param);
                return key && value ? [{ productId: product.id, name: key, value }] : [];
              })
            });
          }
        } catch { failed++; }
        processed++;
      }
      await prisma.importRun.update({
        where: { id: runId },
        data: {
          processed,
          created,
          updated,
          failed,
          error: `Етап: товари ${processed}/${offers.length}`
        }
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    await prisma.importRun.update({
      where: { id: runId },
      data: {
        finishedAt: new Date(),
        status: failed ? "completed_with_errors" : "completed",
        processed,
        created,
        updated,
        failed,
        error: failed ? `Помилок під час імпорту: ${failed}` : null
      }
    });
  } catch (error) {
    await prisma.importRun.update({ where: { id: runId }, data: { finishedAt: new Date(), status: "failed", error: error instanceof Error ? error.message : "Unknown error" } });
  }
}

export async function startSupplierImport() {
  const running = await prisma.importRun.findFirst({
    where: { status: "running" },
    orderBy: { startedAt: "desc" }
  });

  if (running) {
    const staleAfterMs = 15 * 60 * 1000;
    const isStale = Date.now() - running.startedAt.getTime() > staleAfterMs;

    if (!isStale) {
      return { runId: running.id, alreadyRunning: true };
    }

    await prisma.importRun.update({
      where: { id: running.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error: "Попередній імпорт завис або був перерваний; автоматично завершено як failed."
      }
    });
  }

  const run = await prisma.importRun.create({ data: { status: "running" } });
  void runSupplierImport(run.id);
  return { runId: run.id, alreadyRunning: false };
}
