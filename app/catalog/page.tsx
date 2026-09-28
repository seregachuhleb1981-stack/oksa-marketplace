import Link from "next/link";
import { getCategories, getProducts } from "@/lib/catalog";

type Props = { searchParams: Promise<{ q?: string; category?: string; page?: string }> };

export default async function CatalogPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || "1"));
  const [{ items, total, pages }, categories] = await Promise.all([getProducts({ q: params.q, category: params.category, page }), getCategories()]);
  const query = (nextPage: number) => `/catalog?${params.q ? `q=${encodeURIComponent(params.q)}&` : ""}${params.category ? `category=${encodeURIComponent(params.category)}&` : ""}page=${nextPage}`;
  return <main className="catalog-shell">
    <header className="catalog-header"><Link className="brand" href="/"><span className="brand-mark">O</span><span>OKSA</span></Link><Link className="catalog-back" href="/">← На головну</Link></header>
    <section className="catalog-intro"><span className="eyebrow">Каталог</span><h1>Знайди те, що потрібно.</h1><form className="catalog-search"><input name="q" defaultValue={params.q} placeholder="Пошук товарів..." aria-label="Пошук товарів" /><button type="submit">Знайти</button></form></section>
    <div className="catalog-layout">
      <aside className="catalog-sidebar"><strong>Категорії</strong><Link href="/catalog">Усі товари</Link>{categories.map((cat)=><Link href={`/catalog?category=${encodeURIComponent(cat.slug)}`} key={cat.id}>{cat.name}</Link>)}</aside>
      <section><div className="catalog-meta"><span>{total} товарів</span><span>Сторінка {page} / {pages}</span></div>
      {items.length===0 ? <div className="empty-state"><h2>Товарів поки немає</h2><p>Каталог наповнюється. Спробуйте інший запит.</p></div> :
      <div className="product-grid">{items.map((product)=><Link className="product-card" href={`/product/${product.slug}`} key={product.id}><div className="product-image">{product.images[0]?.url ? <img src={product.images[0].url} alt="" loading="lazy"/> : <span>OKSA</span>}</div><div className="product-info"><span className="product-category">{product.category?.name || "Товар"}</span><h2>{product.name}</h2><div className="product-bottom"><strong>{Number(product.price).toLocaleString("uk-UA")} ₴</strong><span>{product.available ? "Є в наявності" : "Немає в наявності"}</span></div></div></Link>)}</div>}
      {pages>1 && <nav className="pagination" aria-label="Пагінація">{page>1 && <Link href={query(page-1)}>← Назад</Link>}{page<pages && <Link href={query(page+1)}>Далі →</Link>}</nav>}</section>
    </div>
  </main>;
}
