import Link from "next/link";
export default function OrderSuccessPage(){return <main className="empty-state page-empty"><span className="eyebrow">OKSA</span><h1>Замовлення прийнято.</h1><p>Дякуємо. Номер замовлення буде показано після підтвердження.</p><Link className="primary-button" href="/catalog">Повернутися до каталогу <span>→</span></Link></main>}
