import { XMLParser } from "fast-xml-parser";
import { prisma } from "./prisma";
import { getServerEnv } from "./env";

type XmlNode = Record<string, unknown>;
type XmlOffer = XmlNode;

function text(value: unknown): string | undefined {
  if (typeof value === "string" || typeof value === "number") {
    const result = String(value).trim();
    return result || undefined;
  }
  return undefined;
}

function arrayOf<T>(value: T | T[] | undefined): T[] {
  return value === undefined ? [] : Array.isArray(value) ? value : [value];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function uniqueSlug(base: string, sku: string): string {
  return `${slugify(base) || "product"}-${slugify(sku) || "item"}`;
}

function field(node: XmlNode, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = node[key];

    if (Array.isArray(value)) {
      const first = value.map(text).find(Boolean);
      if (first) return first;
      continue;
    }

    const result = text(value);
    if (result) return result;
  }

  return undefined;
}

function values(node: XmlNode, ...keys: string[]): string[] {
  const result: string[] = [];

  for (const key of keys) {
    const value = node[key];
    const items = Array.isArray(value) ? value : [value];

    for (const item of items) {
      const parsed = text(item);
      if (parsed && !result.includes(parsed)) result.push(parsed);
    }
  }

  return result;
}

function priceValue(value: string | undefined): number {
  if (!value) return Number.NaN;
  const normalized = value.replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function googleAvailable(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.toLowerCase().trim();
  return !["out of stock", "out_of_stock", "unavailable", "false"].includes(
    normalized
  );
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
      headers: {
        "User-Agent": "OKSA-Product-Importer/1.0",
        "Accept": "application/xml,text/xml,application/rss+xml,*/*"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(90_000)
    });

    if (!response.ok) {
      throw new Error(
        `Не вдалося отримати файл постачальника: HTTP ${response.status}`
      );
    }

    const xml = await response.text();

    await setStage(
      runId,
      `Етап: XML отримано (${xml.length} символів), визначаю формат`
    );

    const parser = new XMLParser({
      ignoreAttributes: false,
      trimValues: true,
      processEntities: false
    });

    const parsed = parser.parse(xml) as XmlNode;
    const ymlShop = (parsed.yml_catalog as XmlNode | undefined)?.shop as
      | XmlNode
      | undefined;
    const rssChannel = (parsed.rss as XmlNode | undefined)?.channel as
      | XmlNode
      | undefined;
    const atomFeed = parsed.feed as XmlNode | undefined;

    let root: XmlNode | undefined;
    let format = "";

    if (ymlShop) {
      root = ymlShop;
      format = "YML";
    } else if (rssChannel) {
      root = rssChannel;
      format = "Google/RSS";
    } else if (atomFeed) {
      root = atomFeed;
      format = "Feed";
    }

    if (!root) {
      const topKeys = Object.keys(parsed).join(", ");
      throw new Error(
        `Некоректний XML: не знайдено YML shop або RSS channel. Кореневі вузли: ${topKeys || "невідомо"}`
      );
    }

    await setStage(runId, `Етап: формат ${format}, читаю каталог`);

    const categoryIds = new Map<string, string>();

    const categoriesNode = root.categories as XmlNode | undefined;
    const categories = arrayOf<XmlNode>(
      categoriesNode?.category as XmlNode | XmlNode[] | undefined
    );

    for (const raw of categories) {
      const id = field(raw, "@_id", "id");
      const name = field(raw, "#text", "name", "title");

      if (!id || !name) continue;

      const slug = `${slugify(name)}-${slugify(id)}`;

      const category = await prisma.category.upsert({
        where: { slug },
        create: { name, slug, sortOrder: 0 },
        update: { name }
      });

      categoryIds.set(id, category.id);
    }

    for (const raw of categories) {
      const id = field(raw, "@_id", "id");
      const parentId = field(raw, "@_parentId", "parentId");

      if (!id || !parentId) continue;

      const categoryDbId = categoryIds.get(id);
      const parentDbId = categoryIds.get(parentId);

      if (categoryDbId && parentDbId) {
        await prisma.category.update({
          where: { id: categoryDbId },
          data: { parentId: parentDbId }
        });
      }
    }

    let offers: XmlOffer[];

    if (format === "YML") {
      const offersNode = root.offers as XmlNode | undefined;
      offers = arrayOf<XmlOffer>(
        offersNode?.offer as XmlOffer | XmlOffer[] | undefined
      );
    } else {
      offers = arrayOf<XmlOffer>(
        root.item as XmlOffer | XmlOffer[] | undefined
      );
    }

    if (!offers.length) {
      throw new Error(
        `XML завантажено, але товари не знайдено у форматі ${format}`
      );
    }

    let processed = 0;
    let created = 0;
    let updated = 0;
    let failed = 0;
    const importedSkus = new Set<string>();

    await setStage(
      runId,
      `Етап: формат ${format}, знайдено товарів ${offers.length}, починаю імпорт`
    );

    for (let offset = 0; offset < offers.length; offset += 20) {
      const batch = offers.slice(offset, offset + 20);

      for (const offer of batch) {
        try {
          const sku =
            field(
              offer,
              "vendorCode",
              "@_id",
              "g:id",
              "id",
              "offerId",
              "sku"
            ) || `item-${processed + 1}`;

          const name = field(
            offer,
            "name_ua",
            "name",
            "g:title",
            "title",
            "productname"
          );

          const promoPriceRaw = priceValue(
            field(offer, "price_promo", "promo_price", "g:sale_price", "sale_price")
          );

          const regularPriceRaw = priceValue(
            field(offer, "price", "g:price")
          );

          const priceRaw = Number.isFinite(promoPriceRaw)
            ? promoPriceRaw
            : regularPriceRaw;
          const oldPriceRaw = priceValue(
            field(offer, "oldprice", "old_price", "g:price_old", "g:compare_at_price")
          );

          if (!name || !Number.isFinite(priceRaw) || priceRaw < 0) {
            failed++;
            processed++;
            continue;
          }

          const categoryValue =
            field(
              offer,
              "categoryId",
              "g:product_type",
              "product_type",
              "category",
              "g:google_product_category"
            ) || "Інші товари";

          let categoryId = categoryIds.get(categoryValue);

          if (!categoryId) {
            const categorySlug = `${slugify(categoryValue)}-feed`;
            const category = await prisma.category.upsert({
              where: { slug: categorySlug },
              create: {
                name: categoryValue,
                slug: categorySlug,
                sortOrder: 0
              },
              update: { name: categoryValue }
            });

            categoryId = category.id;
            categoryIds.set(categoryValue, category.id);
          }

          const allImages = values(
            offer,
            "picture",
            "g:image_link",
            "image_link",
            "image",
            "g:additional_image_link"
          );

          const description = field(
            offer,
            "description_ua",
            "description",
            "g:description",
            "summary"
          );

          const stockQuantity = priceValue(
            field(offer, "stock_quantity", "quantity", "stock")
          );

          const available =
            format === "YML"
              ? String(offer["@_available"] ?? "true").toLowerCase() !==
                  "false" &&
                (!Number.isFinite(stockQuantity) || stockQuantity > 0)
              : googleAvailable(
                  field(offer, "g:availability", "availability")
                );

          const currency =
            field(offer, "currencyId", "currency", "g:currency") || "UAH";

          const existing = await prisma.product.findUnique({
            where: { sku }
          });

          const product = await prisma.product.upsert({
            where: { sku },
            create: {
              sku,
              name,
              slug: uniqueSlug(name, sku),
              description,
              price: priceRaw,
              oldPrice: Number.isFinite(oldPriceRaw) ? oldPriceRaw : null,
              currency,
              available,
              categoryId,
              vendorCode: field(offer, "vendorCode", "article", "@_id") || sku,
              images: {
                create: allImages.map((url, sortOrder) => ({
                  url,
                  sortOrder
                }))
              }
            },
            update: {
              name,
              description,
              price: priceRaw,
              oldPrice: Number.isFinite(oldPriceRaw) ? oldPriceRaw : null,
              currency,
              available,
              categoryId,
              images: {
                deleteMany: {},
                create: allImages.map((url, sortOrder) => ({
                  url,
                  sortOrder
                }))
              }
            }
          });

          importedSkus.add(sku);

          if (existing) {
            updated++;
          } else {
            created++;
          }

          const params = arrayOf<XmlNode>(
            offer.param as XmlNode | XmlNode[] | undefined
          );

          const feedAttributes: Array<{ name: string; value: string }> = [];
          const attributeFields: Array<[string, string]> = [
            ["Бренд", "g:brand"],
            ["Бренд", "vendor"],
            ["Код товару", "vendorCode"],
            ["Артикул", "article"],
            ["Ціна без акції", "price"],
            ["Акційна ціна", "price_promo"],
            ["Кількість", "stock_quantity"],
            ["GTIN", "g:gtin"],
            ["MPN", "g:mpn"],
            ["Стан", "g:condition"],
            ["Посилання", "g:link"],
            ["Посилання", "url"]
          ];

          const seenAttributes = new Set<string>();

          for (const [label, key] of attributeFields) {
            const value = field(offer, key);
            const signature = `${label}:${value || ""}`;
            if (value && !seenAttributes.has(signature)) {
              feedAttributes.push({ name: label, value });
              seenAttributes.add(signature);
            }
          }

          const parsedParams = params.flatMap((param) => {
            const key = field(param, "@_name", "name");
            const value = field(param, "#text", "value");
            return key && value ? [{ name: key, value }] : [];
          });

          await prisma.productAttribute.deleteMany({
            where: { productId: product.id }
          });

          const attributes = [...feedAttributes, ...parsedParams];

          if (attributes.length) {
            await prisma.productAttribute.createMany({
              data: attributes.map(({ name, value }) => ({
                productId: product.id,
                name,
                value
              }))
            });
          }
        } catch (error) {
          failed++;
          console.error("OKSA import product error:", error);
        }

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

    if (failed === 0) {
      await setStage(
        runId,
        "Етап: новий каталог імпортовано без помилок, видаляю товари зі старого фіду"
      );

      const staleProducts = await prisma.product.findMany({
        where: { sku: { notIn: Array.from(importedSkus) } },
        select: { id: true }
      });

      if (staleProducts.length) {
        await prisma.product.deleteMany({
          where: { id: { in: staleProducts.map(({ id }) => id) } }
        });
      }

      await prisma.category.deleteMany({
        where: { products: { none: {} } }
      });

      await prisma.brand.deleteMany({
        where: { products: { none: {} } }
      });
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
        error: failed
          ? `Імпорт завершено: помилок ${failed}; старі товари збережено для безпеки`
          : `Імпорт завершено успішно: ${created} створено, ${updated} оновлено, старі товари видалено`
      }
    });
  } catch (error) {
    console.error("OKSA supplier import failed:", error);

    await prisma.importRun.update({
      where: { id: runId },
      data: {
        finishedAt: new Date(),
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Невідома помилка імпорту"
      }
    });
  }
}

export async function startSupplierImport() {
  const running = await prisma.importRun.findFirst({
    where: { status: "running" },
    orderBy: { startedAt: "desc" }
  });

  if (running) {
    const staleAfterMs = 15 * 60 * 1000;
    const isStale =
      Date.now() - running.startedAt.getTime() > staleAfterMs;

    if (!isStale) {
      return {
        runId: running.id,
        alreadyRunning: true
      };
    }

    await prisma.importRun.update({
      where: { id: running.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        error:
          "Попередній імпорт завис або був перерваний; автоматично завершено як failed."
      }
    });
  }

  const run = await prisma.importRun.create({
    data: { status: "running" }
  });

  void runSupplierImport(run.id);

  return {
    runId: run.id,
    alreadyRunning: false
  };
}
