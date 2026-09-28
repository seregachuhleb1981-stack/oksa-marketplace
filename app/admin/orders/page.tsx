import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { items: true } });
  return <main className="catalog-shell"><header className="catalog-header"><Link className="brand" href="/"><span className="brand-mark">O</span><span>OKSA</span></Link><Link className="catalog-back" href="/admin">← Адмін-панель</Link></header>
    <section className="catalog-intro"><span className="eyebrow">Замовлення</span><h1>Замовлення клієнтів.</h1></section>
    {orders.length===0?<div className="empty-state"><h2>Замовлень ще немає</h2><p>Нові замовлення з'являться тут автоматично.</p></div>:
    <div className="admin-orders">{orders.map(order=><article className="admin-order" key={order.id}><div><strong>{order.number}</strong><span>{order.status}</span><span>{new Date(order.createdAt).toLocaleString("uk-UA")}</span></div><div><strong>{order.customerName}</strong><span>{order.customerPhone}</span><span>{order.city}, {order.deliveryBranch}</span></div><strong>{Number(order.total).toLocaleString("uk-UA")} ₴</strong><div className="admin-order-items">{order.items.map(item=><span key={item.id}>{item.name} × {item.quantity}</span>)}</div></article>)}</div>}
  </main>;
}
