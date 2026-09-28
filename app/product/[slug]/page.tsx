import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import AddToCartButton from "./AddToCartButton";
export const dynamic = "force-dynamic";
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getProduct(slug); if (!product) notFound();
  return <main className="product-page"><header className="catalog-header"><Link className="brand" href="/"><span className="brand-mark">O</span><span>OKSA</span></Link><Link className="catalog-back" href="/catalog">← До каталогу</Link></header>
    <div className="product-detail"><div className="product-gallery">{product.images.length ? product.images.map((image)=><img key={image.id} src={image.url} alt={image.alt || product.name}/>) : <div className="product-gallery-empty">OKSA</div>}</div>
    <div className="product-copy"><span className="eyebrow">{product.category?.name || "Каталог"}</span><h1>{product.name}</h1>{product.brand && <p className="product-brand">{product.brand.name}</p>}<div className="detail-price">{Number(product.price).toLocaleString("uk-UA")} ₴</div><p className="availability">{product.available ? "● Є в наявності" : "● Немає в наявності"}</p>{product.description && <div className="description">{product.description}</div>}<AddToCartButton item={{ id: product.id, sku: product.sku, name: product.name, slug: product.slug, price: Number(product.price), image: product.images[0]?.url || null, quantity: 1, available: product.available }} />
    {product.attributes.length>0 && <div className="attributes"><h2>Характеристики</h2>{product.attributes.map((a)=><div className="attribute" key={a.id}><span>{a.name}</span><strong>{a.value}</strong></div>)}</div>}</div></div></main>;
}
