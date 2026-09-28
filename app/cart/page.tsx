"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/cart";

const KEY="oksa-cart";

export default function CartPage(){
  const [items,setItems]=useState<CartItem[]>([]);
  useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem(KEY)||"[]"))}catch{setItems([])}},[]);
  const save=(next:CartItem[])=>{setItems(next);localStorage.setItem(KEY,JSON.stringify(next))};
  const total=useMemo(()=>items.reduce((sum,i)=>sum+i.price*i.quantity,0),[items]);
  const change=(id:string,quantity:number)=>save(items.map(i=>i.id===id?{...i,quantity:Math.max(1,Math.min(99,quantity))}:i));
  const remove=(id:string)=>save(items.filter(i=>i.id!==id));
  return <main className="catalog-shell"><header className="catalog-header"><Link className="brand" href="/"><span className="brand-mark">O</span><span>OKSA</span></Link><Link className="catalog-back" href="/catalog">← До каталогу</Link></header>
    <section className="catalog-intro"><span className="eyebrow">Кошик</span><h1>Твоє замовлення.</h1></section>
    {items.length===0?<div className="empty-state"><h2>Кошик порожній</h2><p>Додай товари з каталогу, щоб продовжити.</p><Link className="primary-button" href="/catalog">До каталогу <span>→</span></Link></div>:
    <div className="cart-layout"><div className="cart-items">{items.map(i=><article className="cart-item" key={i.id}><div className="cart-thumb">{i.image?<img src={i.image} alt=""/>:<span>OKSA</span>}</div><div className="cart-main"><Link href={`/product/${i.slug}`}><h2>{i.name}</h2></Link><span>{i.price.toLocaleString("uk-UA")} ₴</span><div className="qty"><button onClick={()=>change(i.id,i.quantity-1)} aria-label="Зменшити">−</button><strong>{i.quantity}</strong><button onClick={()=>change(i.id,i.quantity+1)} aria-label="Збільшити">+</button><button className="remove" onClick={()=>remove(i.id)}>Видалити</button></div></div><strong>{(i.price*i.quantity).toLocaleString("uk-UA")} ₴</strong></article>)}</div>
    <aside className="cart-summary"><span className="eyebrow">Разом</span><div><span>Товари</span><strong>{total.toLocaleString("uk-UA")} ₴</strong></div><div><span>Доставка</span><span>Розрахунок на оформленні</span></div><hr/><div><strong>До сплати</strong><strong>{total.toLocaleString("uk-UA")} ₴</strong></div><Link className="primary-button" href="/checkout">Оформити замовлення <span>→</span></Link></aside></div>}
  </main>;
}
