"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/cart-context";

function formatRsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 RSD";
  return `${value.toLocaleString("sr-Latn-RS")} RSD`;
}

export default function CartPage() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <section className="page-grid cart-page">
        <article className="hero cart-hero">
          <p className="eyebrow">Korpa</p>
          <h1>Vaša korpa je trenutno prazna.</h1>
          <p className="subtitle">Dodajte proizvode iz kataloga i nastavite na placanje.</p>
          <Link href="/proizvodi" className="primary-btn">
            Idi na proizvode
          </Link>
        </article>
      </section>
    );
  }

  return (
    <section className="page-grid cart-page">
      <article className="hero cart-hero">
        <p className="eyebrow">Korpa</p>
        <h1>Pregled korpe i priprema za naručivanje</h1>
        <p className="subtitle">
          U korpi imate <strong>{itemCount}</strong> artikala.
        </p>
      </article>

      <section className="cart-layout">
        <article className="toolbar-card cart-items-card">
          <div className="cart-head">
            <h2>Artikli u korpi</h2>
            <button type="button" className="ghost-btn danger" onClick={clearCart}>
              Isprazni korpu
            </button>
          </div>

          <div className="cart-items-grid">
            {items.map((item) => (
              <article key={item.productId} className="cart-item-card">
                <div className="cart-item-media">
                  <Image src={item.image || "/logo.png"} alt={item.title} width={520} height={520} />
                </div>
                <div className="cart-item-main">
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                  <p className="cart-item-price">
                    {formatRsd(item.finalUnitPrice)}
                    {item.discount > 0 ? <span>{formatRsd(item.unitPrice)}</span> : null}
                  </p>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-qty-controls">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      aria-label={`Smanji količinu za ${item.title}`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => setQuantity(item.productId, Number(event.target.value))}
                      aria-label={`Količina za ${item.title}`}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.stock > 0 && item.quantity >= item.stock}
                      aria-label={`Povećaj količinu za ${item.title}`}
                    >
                      +
                    </button>
                  </div>
                  <p className="cart-line-total">{formatRsd(item.finalUnitPrice * item.quantity)}</p>
                  <button type="button" className="ghost-btn danger" onClick={() => removeItem(item.productId)}>
                    Ukloni
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="toolbar-card cart-summary-card">
          <h2>Rezime korpe</h2>
          <div className="cart-summary-line">
            <span>Ukupno artikala</span>
            <strong>{itemCount}</strong>
          </div>
          <div className="cart-summary-line cart-summary-total">
            <span>Ukupno za plaćanje</span>
            <strong>{formatRsd(subtotal)}</strong>
          </div>
          <div className="cart-summary-actions">
            <Link href="/placanje" className="primary-btn">
              Nastavi na placanje
            </Link>
            <Link href="/proizvodi" className="ghost-btn">
              Dodaj još proizvoda
            </Link>
          </div>
        </aside>
      </section>
    </section>
  );
}
