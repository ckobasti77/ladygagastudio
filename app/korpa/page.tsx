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
      <section className="page-grid orbit-page cart-orbit">
        <article className="orbit-hero orbit-reveal">
          <div className="orbit-hud" aria-hidden>
            <span>Korpa</span>
            <strong>Studio Lady Gaga | Pregled korpe</strong>
          </div>

          <p className="orbit-eyebrow">Korpa</p>
          <h1>Vaša korpa je trenutno prazna.</h1>
          <p className="orbit-lead">
            Dodajte proizvode iz kataloga i nastavite na plaćanje.
          </p>

          <div className="orbit-actions">
            <Link href="/proizvodi" className="primary-btn orbit-main-action">
              Idi na proizvode
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-grid orbit-page cart-orbit">
      <article className="orbit-hero orbit-reveal">
        <div className="orbit-hud" aria-hidden>
          <span>Korpa</span>
          <strong>Studio Lady Gaga | Pregled korpe</strong>
        </div>

        <p className="orbit-eyebrow">Korpa</p>
        <h1>Pregled korpe i priprema za naručivanje</h1>
        <p className="orbit-lead">
          U korpi imate <strong>{itemCount}</strong> artikala. Pregledajte stavke i nastavite na plaćanje.
        </p>

        <div className="orbit-metric-row">
          <article className="orbit-metric">
            <strong>{itemCount}</strong>
            <span>artikala u korpi</span>
          </article>
          <article className="orbit-metric">
            <strong>{formatRsd(subtotal)}</strong>
            <span>ukupan iznos</span>
          </article>
          <article className="orbit-metric">
            <strong>{items.length}</strong>
            <span>razlicitih proizvoda</span>
          </article>
        </div>
      </article>

      <section className="cart-layout orbit-reveal">
        <article className="orbit-panel cart-items-panel">
          <div className="cart-head">
            <div>
              <p className="orbit-panel-tag">Artikli</p>
              <h2>Artikli u korpi</h2>
            </div>
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

        <aside className="orbit-panel cart-summary-panel">
          <p className="orbit-panel-tag">Rezime</p>
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
              Nastavi na plaćanje
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
