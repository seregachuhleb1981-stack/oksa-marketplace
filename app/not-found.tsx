import Link from "next/link";
export default function NotFound(){return <main className="empty-state page-empty"><span className="eyebrow">404</span><h1>Сторінку не знайдено</h1><p>Можливо, товар був переміщений або посилання застаріло.</p><Link className="primary-button" href="/catalog">Повернутися до каталогу <span>→</span></Link></main>;}
