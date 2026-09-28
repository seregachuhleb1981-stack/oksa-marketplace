const categories = [
  { name: "Аксесуари", icon: "◈" },
  { name: "Одяг та взуття", icon: "◇" },
  { name: "Дім і побут", icon: "⌂" },
  { name: "Ремонт і будівництво", icon: "▦" },
  { name: "Спорт і туризм", icon: "△" },
  { name: "Електроніка", icon: "▣" }
];

export default function HomePage() {
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
          {categories.map((category) => (
            <a className="category-card" href="/catalog" key={category.name}>
              <span className="category-icon">{category.icon}</span>
              <span>{category.name}</span>
              <small>Переглянути →</small>
            </a>
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