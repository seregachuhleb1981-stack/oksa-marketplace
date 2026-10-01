"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/lib/cart";

export default function CheckoutPage(){
 const router=useRouter();
 const [items,setItems]=useState<CartItem[]>([]);
 const [submitting,setSubmitting]=useState(false);
 const [error,setError]=useState("");
 useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("oksa-cart")||"[]"))}catch{}},[]);
 const total=items.reduce((s,i)=>s+i.price*i.quantity,0);
 return <main className="catalog-shell"><header className="catalog-header"><Link className="brand" href="/"><span className="brand-mark">O</span><span>OKSA</span></Link><Link className="catalog-back" href="/cart">← Кошик</Link></header>
 <section className="checkout-layout"><div><span className="eyebrow">Оформлення</span><h1>Оформити замовлення.</h1><form className="checkout-form" onSubmit={async(e)=>{e.preventDefault();setSubmitting(true);setError("");const form=new FormData(e.currentTarget);const res=await fetch("/api/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:String(form.get("name")||""),phone:String(form.get("phone")||""),email:String(form.get("email")||""),city:String(form.get("city")||""),branch:String(form.get("branch")||""),comment:String(form.get("comment")||""),items:items.map(i=>({id:i.id,quantity:i.quantity}))})});if(res.ok){const data=await res.json();localStorage.removeItem("oksa-cart");router.push("/order-success?number="+encodeURIComponent(data.order.number))}else{const data=await res.json().catch(()=>null);setError(data?.error||"Не вдалося оформити замовлення");setSubmitting(false)}}}><label>Ім’я<input required name="name" autoComplete="name"/></label><label>Телефон<input required name="phone" type="tel" autoComplete="tel"/></label><label>Email<input name="email" type="email" autoComplete="email"/></label><label>Місто<input required name="city" autoComplete="address-level2"/></label><label>Відділення Нової пошти<input required name="branch"/></label><label>Коментар<textarea name="comment" rows={4}/></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit" disabled={!items.length||submitting}>{submitting ? "Оформлення…" : "Підтвердити замовлення"} <span>→</span></button></form></div><aside className="cart-summary"><span className="eyebrow">Ваше замовлення</span>{items.map(i=><div className="checkout-line" key={i.id}><span>{i.name} × {i.quantity}</span><strong>{(i.price*i.quantity).toLocaleString("uk-UA")} ₴</strong></div>)}<hr/><div><strong>Разом</strong><strong>{total.toLocaleString("uk-UA")} ₴</strong></div></aside></section></main>;
}
