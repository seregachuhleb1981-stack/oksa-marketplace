import Link from "next/link";
import { getCategories } from "@/lib/catalog";

const categoryIcons = ["◈", "◇", "⌂", "▦", "△", "▣"];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <main className="site-shell">
      <header className="header">
        <a className="brand" href="/" aria-label="OKSA">
          <span className="brand-mark">O</span>
          <span>OKSA</span>
        </a>
        <nav className="nav" aria-label="Основна навігація">
          <a href="/catalog">Каталог</a>
          <a href="/categories">Категорії</a>
          <a href="/favorites">Обране</a>
        </nav>
        <div className="header-actions">
          <a className="icon-button" href="/search" aria-label="Пошук">⌕</a>
          <a className="icon-button" href="/cart" aria-label="Кошик">🛒</a>
          <a className="account-button" href="/account">Увійти</a>
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">Новий український маркетплейс</span>
          <h1>Обирай.<br />Замовляй.<br /><em>Отримуй.</em></h1>
          <p>Знаходь потрібне серед тисяч товарів та оформлюй замовлення зручно.</p>
          <a className="primary-button" href="/catalog">Перейти до каталогу <span>→</span></a>
        </div>
        <div className="hero-card" aria-hidden="true">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-product">OKSA</div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><span className="eyebrow">Знайди своє</span><h2>Популярні категорії</h2></div>
          <a href="/categories">Усі категорії →</a>
        </div>
        <div className="category-grid">
          {categories.slice(0, 6).map((category, index) => (
            <Link className="category-card" href={`/catalog?category=${encodeURIComponent(category.slug)}`} key={category.id}>
              <span className="category-icon">{categoryIcons[index % categoryIcons.length]}</span>
              <span>{category.name}</span>
              <small>Переглянути →</small>
            </Link>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div><strong>OKSA</strong><span>Обирай. Замовляй. Отримуй.</span></div>
        <span>© {new Date().getFullYear()} OKSA</span>
      </footer>
    </main>
  );
}