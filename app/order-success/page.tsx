import Link from "next/link";

export default async function OrderSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const { number } = await searchParams;

  return (
    <main className="empty-state page-empty">
      <span className="eyebrow">OKSA</span>
      <h1>Замовлення прийнято.</h1>
      <p>
        Дякуємо!{number ? <> Номер замовлення: <strong>{number}</strong>.</> : " Замовлення успішно створено."}
      </p>
      <Link className="primary-button" href="/catalog">
        Повернутися до каталогу <span>→</span>
      </Link>
    </main>
  );
}
