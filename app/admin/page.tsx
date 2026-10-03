import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ClearCatalogButton from "./ClearCatalogButton";
import { startSupplierImport } from "@/lib/importer";

export const dynamic = "force-dynamic";

function importLabel(status: string) {
  switch (status) {
    case "running":
      return "Виконується";
    case "completed":
      return "Завершено";
    case "completed_with_errors":
      return "Завершено з помилками";
    case "failed":
      return "Помилка";
    default:
      return status;
  }
}

export default async function AdminPage() {
  async function startImport(formData: FormData) {
    "use server";

    const expectedPassword = process.env.ADMIN_ACCESS_TOKEN;
    const suppliedPassword = String(formData.get("importPassword") ?? "");

    if (!expectedPassword || suppliedPassword !== expectedPassword) {
      redirect("/admin?importError=1");
    }

    await startSupplierImport();
    redirect("/admin?importStarted=1");
  }

  async function clearCatalog() {
    "use server";
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.brand.deleteMany();
  }

  const [products, categories, orders, imports] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.category.count(),
    prisma.order.count(),
    prisma.importRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5
    })
  ]);

  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <Link className="brand" href="/">
          <span className="brand-mark">O</span>
          <span>OKSA</span>
        </Link>
        <span className="catalog-back">Адмін-панель</span>
      </header>

      <section className="catalog-intro">
        <span className="eyebrow">Керування</span>
        <h1>Адмін-панель OKSA.</h1>
        <p>Огляд каталогу, замовлень та синхронізації даних.</p>
      </section>

      <section className="admin-stats">
        <div>
          <strong>{products}</strong>
          <span>Активних товарів</span>
        </div>
        <div>
          <strong>{categories}</strong>
          <span>Категорій</span>
        </div>
        <div>
          <strong>{orders}</strong>
          <span>Замовлень</span>
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Синхронізація</span>
            <h2>Імпорт каталогу</h2>
          </div>

          <form action={startImport} style={{display:"grid",gap:8,justifyItems:"end"}}>
            <input
              name="importPassword"
              type="password"
              placeholder="Пароль для запуску імпорту"
              autoComplete="current-password"
              required
              style={{padding:12,minWidth:260}}
            />
            <button className="primary-button" type="submit">
              Запустити імпорт <span>→</span>
            </button>
          </form>
        </div>

        <div className="admin-table">
          {imports.length === 0 ? (
            <div className="empty-state">
              <h2>Імпортів ще немає</h2>
              <p>Після запуску синхронізації результати з’являться тут.</p>
            </div>
          ) : (
            imports.map((run) => {
              const progress = run.processed
                ? Math.min(100, Math.round((run.processed / Math.max(run.processed + run.failed, 1)) * 100))
                : 0;

              return (
                <div className="admin-row" key={run.id}>
                  <strong>{importLabel(run.status)}</strong>
                  <span>{run.processed} оброблено</span>
                  <span>{run.created} створено</span>
                  <span>{run.updated} оновлено</span>
                  <span>{run.failed} помилок</span>
                  {run.status === "running" && (
                    <span>Прогрес: {progress}%</span>
                  )}
                  {run.error && (
                    <small>{run.error}</small>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="admin-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Каталог</span>
            <h2>Очистити каталог</h2>
          </div>
          <ClearCatalogButton action={clearCatalog} />
        </div>
        <p style={{color:"var(--muted)",fontSize:13}}>
          Видаляє всі товари, зображення, характеристики, категорії та бренди. Замовлення та історія імпортів залишаються.
        </p>
      </section>

      <section className="admin-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Замовлення</span>
            <h2>Керування замовленнями</h2>
          </div>

          <Link className="primary-button" href="/admin/orders">
            Замовлення <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
