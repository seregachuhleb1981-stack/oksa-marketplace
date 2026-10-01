import Link from "next/link";
import { getCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <main className="catalog-shell">
      <header className="catalog-header">
        <Link className="brand" href="/">
          <span className="brand-mark">O</span>
          <span>OKSA</span>
        </Link>
        <Link className="catalog-back" href="/catalog">
          ← До каталогу
        </Link>
      </header>

      <section className="catalog-intro">
        <span className="eyebrow">Категорії</span>
        <h1>Обери напрямок.</h1>
        <p>Переглядай товари за категоріями та їх підкатегоріями.</p>
      </section>

      <section className="category-grid">
        {categories.map((category) => (
          <article className="category-card" key={category.id}>
            <span className="category-icon">◈</span>
            <strong>{category.name}</strong>
            <small>
              {category.children.length
                ? `${category.children.length} підкатегорій`
                : "Переглянути товари"}
            </small>

            <Link href={`/catalog?category=${encodeURIComponent(category.slug)}`}>
              Усі товари →
            </Link>

            {category.children.length > 0 && (
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {category.children.map((child) => (
                  <Link
                    href={`/catalog?category=${encodeURIComponent(child.slug)}`}
                    key={child.id}
                  >
                    {child.name} →
                  </Link>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
