"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/contexts/cart-context";
import { sendCheckoutOrderEmail } from "./actions";

type CheckoutForm = {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  number: string;
  postalCode: string;
  city: string;
  phone: string;
  note: string;
};

type PlaceOrderResult = {
  orderId: string;
  orderNumber: string;
  createdAt: number;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    street: string;
    number: string;
    postalCode: string;
    city: string;
    phone: string;
    note?: string;
  };
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    finalUnitPrice: number;
    lineTotal: number;
  }>;
  totals: {
    totalItems: number;
    totalAmount: number;
  };
};

type SendOrderConfirmationResult =
  | { ok: true }
  | { ok: false; error: string };

const emptyForm: CheckoutForm = {
  firstName: "",
  lastName: "",
  email: "",
  street: "",
  number: "",
  postalCode: "",
  city: "",
  phone: "",
  note: "",
};

function formatRsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 RSD";
  return `${value.toLocaleString("sr-Latn-RS")} RSD`;
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Narucivanje nije uspelo. Pokusajte ponovo.";
}

export default function CheckoutPage() {
  const { items, itemCount, subtotal, clearCart } = useCart();
  const placeOrder = useMutation(api.orders.placeOrder) as unknown as (args: {
    items: Array<{ productId: string; quantity: number }>;
    customer: CheckoutForm;
  }) => Promise<PlaceOrderResult>;

  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    [items],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (checkoutItems.length === 0) {
      setStatus("error");
      setStatusMessage("Korpa je prazna.");
      return;
    }

    setStatus("submitting");
    setStatusMessage("");

    try {
      const order = await placeOrder({
        items: checkoutItems,
        customer: {
          ...form,
          note: form.note.trim(),
        },
      });

      const emailResult = (await sendCheckoutOrderEmail({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        customer: order.customer,
        items: order.items,
        totals: order.totals,
      })) as SendOrderConfirmationResult;

      clearCart();
      setCreatedOrderNumber(order.orderNumber);
      setForm(emptyForm);
      setStatus("success");
      setStatusMessage(
        emailResult.ok
          ? "Narudzbina je uspesno sacuvana i poslata na email admina."
          : `Narudzbina je sacuvana, ali email nije poslat: ${emailResult.error}`,
      );
    } catch (error: unknown) {
      setStatus("error");
      setStatusMessage(resolveErrorMessage(error));
    }
  };

  if (items.length === 0 && status !== "success") {
    return (
      <section className="page-grid checkout-page">
        <article className="hero checkout-hero">
          <p className="eyebrow">Checkout</p>
          <h1>Nema artikala za narucivanje.</h1>
          <p className="subtitle">Dodajte proizvode u korpu pa nastavite na checkout.</p>
          <Link href="/products" className="primary-btn">
            Idi na proizvode
          </Link>
        </article>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="page-grid checkout-page">
        <article className="hero checkout-hero">
          <p className="eyebrow">Checkout</p>
          <h1>Narudzbina je uspesno kreirana.</h1>
          <p className="subtitle">
            {statusMessage}
            {createdOrderNumber ? ` Broj narudzbine: ${createdOrderNumber}.` : ""}
          </p>
          <div className="checkout-form-actions">
            <Link href="/products" className="primary-btn">
              Nastavi kupovinu
            </Link>
            <Link href="/contact" className="ghost-btn">
              Kontakt
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-grid checkout-page">
      <article className="hero checkout-hero">
        <p className="eyebrow">Checkout</p>
        <h1>Unesite podatke i potvrdite narudzbinu</h1>
        <p className="subtitle">
          Placanje karticom nije ukljuceno. Narudzbina se salje direktno na email admina.
        </p>
      </article>

      {status !== "idle" ? (
        <p
          className={`status-msg ${status === "error" ? "admin-status-error" : ""}`}
        >
          {statusMessage}
          {createdOrderNumber ? ` (Broj narudzbine: ${createdOrderNumber})` : ""}
        </p>
      ) : null}

      <section className="checkout-layout">
        <form className="toolbar-card checkout-form-card" onSubmit={onSubmit}>
          <h2>Podaci kupca</h2>
          <div className="checkout-grid-2">
            <input
              required
              placeholder="Ime"
              value={form.firstName}
              onChange={(event) => setForm((value) => ({ ...value, firstName: event.target.value }))}
            />
            <input
              required
              placeholder="Prezime"
              value={form.lastName}
              onChange={(event) => setForm((value) => ({ ...value, lastName: event.target.value }))}
            />
          </div>
          <div className="checkout-grid-2">
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
            />
            <input
              required
              placeholder="Telefon"
              value={form.phone}
              onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))}
            />
          </div>
          <div className="checkout-grid-2">
            <input
              required
              placeholder="Ulica"
              value={form.street}
              onChange={(event) => setForm((value) => ({ ...value, street: event.target.value }))}
            />
            <input
              required
              placeholder="Broj"
              value={form.number}
              onChange={(event) => setForm((value) => ({ ...value, number: event.target.value }))}
            />
          </div>
          <div className="checkout-grid-2">
            <input
              required
              placeholder="Postanski broj"
              value={form.postalCode}
              onChange={(event) => setForm((value) => ({ ...value, postalCode: event.target.value }))}
            />
            <input
              required
              placeholder="Mesto"
              value={form.city}
              onChange={(event) => setForm((value) => ({ ...value, city: event.target.value }))}
            />
          </div>
          <textarea
            placeholder="Napomena (opciono)"
            value={form.note}
            onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))}
          />

          <div className="checkout-form-actions">
            <button type="submit" className="primary-btn" disabled={status === "submitting"}>
              {status === "submitting" ? "Obrada narudzbine..." : "Potvrdi narudzbinu"}
            </button>
            <Link href="/cart" className="ghost-btn">
              Nazad na korpu
            </Link>
          </div>
        </form>

        <aside className="toolbar-card checkout-summary-card">
          <h2>Rezime narudzbine</h2>
          <div className="checkout-summary-items">
            {items.map((item) => (
              <article key={item.productId} className="checkout-summary-item">
                <div>
                  <h3>{item.title}</h3>
                  <p>
                    {item.quantity} x {formatRsd(item.finalUnitPrice)}
                  </p>
                </div>
                <strong>{formatRsd(item.quantity * item.finalUnitPrice)}</strong>
              </article>
            ))}
          </div>
          <div className="cart-summary-line">
            <span>Ukupno komada</span>
            <strong>{itemCount}</strong>
          </div>
          <div className="cart-summary-line cart-summary-total">
            <span>Ukupan iznos</span>
            <strong>{formatRsd(subtotal)}</strong>
          </div>
        </aside>
      </section>
    </section>
  );
}
