import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [products, categories, orders, imports] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.importRun.findMany({ orderBy: { startedAt: "desc" }, take: 5 })
  ]);

  return <main className="catalog-shell"><header className="catalog-header"><Link className="brand" href="/"><span className="brand-mark">O</span><span>OKSA</span></Link><span className="catalog-back">Адмін-панель</span></header>
    <section className="catalog-intro"><span className="eyebrow">Керування</span><h1>OKSA Admin.</h1><p>Огляд каталогу, замовлень та синхронізації даних.</p></section>
    <section className="admin-stats"><div><strong>{products}</strong><span>Товарів</span></div><div><strong>{categories}</strong><span>Категорій</span></div><div><strong>{orders}</strong><span>Замовлень</span></div></section>
    <section className="admin-panel"><div className="section-heading"><div><span className="eyebrow">Синхронізація</span><h2>Останні імпорти</h2></div><Link className="primary-button" href="/admin/orders">Замовлення <span>→</span></Link></div>
      <div className="admin-table">{imports.length===0?<div className="empty-state"><h2>Імпортів ще немає</h2><p>Після запуску синхронізації результати з'являться тут.</p></div>:imports.map(run=><div className="admin-row" key={run.id}><strong>{run.status}</strong><span>{run.processed} оброблено</span><span>{run.created} створено</span><span>{run.updated} оновлено</span><span>{run.failed} помилок</span></div>)}</div>
    </section>
  </main>;
}
