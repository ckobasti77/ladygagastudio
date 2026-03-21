"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/contexts/cart-context";
import { sendCheckoutOrderEmail } from "./actions";

type SubscribeToMarketingArgs = {
  email: string;
  firstName: string;
  lastName: string;
  source: "registration" | "checkout";
};

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
  const subscribeToMarketing = useMutation(api.users.subscribeToMarketing) as unknown as (args: SubscribeToMarketingArgs) => Promise<void>;

  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);

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

    if (!legalAccepted) {
      setStatus("error");
      setStatusMessage("Potrebno je da prihvatite pravila korišćenja i politiku privatnosti.");
      return;
    }

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

      let emailResult: SendOrderConfirmationResult;
      try {
        emailResult = (await sendCheckoutOrderEmail({
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customer: order.customer,
          items: order.items,
          totals: order.totals,
        })) as SendOrderConfirmationResult;
      } catch (emailError: unknown) {
        emailResult = {
          ok: false,
          error: resolveErrorMessage(emailError),
        };
      }

      if (marketingAccepted && form.email.trim()) {
        try {
          await subscribeToMarketing({
            email: form.email.trim(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            source: "checkout",
          });
        } catch {
          // Marketing subscription failure should not block the order
        }
      }

      clearCart();
      setCreatedOrderNumber(order.orderNumber);
      setForm(emptyForm);
      setLegalAccepted(false);
      setMarketingAccepted(false);
      setStatus("success");
      setStatusMessage(
        emailResult.ok
          ? "Narudžbina je uspesno sacuvana i poslata na email admina."
          : `Narudžbina je sacuvana, ali email nije poslat: ${emailResult.error}`,
      );
    } catch (error: unknown) {
      setStatus("error");
      setStatusMessage(resolveErrorMessage(error));
    }
  };

  if (items.length === 0 && status !== "success") {
    return (
      <section className="page-grid orbit-page checkout-orbit">
        <article className="orbit-hero orbit-reveal">
          <div className="orbit-hud" aria-hidden>
            <span>Placanje</span>
            <strong>Studio Lady Gaga | Narudžbina</strong>
          </div>

          <p className="orbit-eyebrow">Placanje</p>
          <h1>Nema artikala za narucivanje.</h1>
          <p className="orbit-lead">Dodajte proizvode u korpu pa nastavite na placanje.</p>

          <div className="orbit-actions">
            <Link href="/proizvodi" className="primary-btn orbit-main-action">
              Idi na proizvode
            </Link>
            <Link href="/korpa" className="ghost-btn orbit-second-action">
              Nazad na korpu
            </Link>
          </div>
        </article>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="page-grid orbit-page checkout-orbit">
        <article className="orbit-hero orbit-reveal">
          <div className="orbit-hud" aria-hidden>
            <span>Potvrda</span>
            <strong>Studio Lady Gaga | Narudžbina kreirana</strong>
          </div>

          <p className="orbit-eyebrow">Placanje</p>
          <h1>Narudžbina je uspesno kreirana.</h1>
          <p className="orbit-lead">
            {statusMessage}
            {createdOrderNumber ? ` Broj narudžbine: ${createdOrderNumber}.` : ""}
          </p>

          <div className="orbit-actions">
            <Link href="/proizvodi" className="primary-btn orbit-main-action">
              Nastavi kupovinu
            </Link>
            <Link href="/kontakt" className="ghost-btn orbit-second-action">
              Kontakt
            </Link>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="page-grid orbit-page checkout-orbit">
      <article className="orbit-hero orbit-reveal">
        <div className="orbit-hud" aria-hidden>
          <span>Placanje</span>
          <strong>Studio Lady Gaga | Narudžbina</strong>
        </div>

        <p className="orbit-eyebrow">Placanje</p>
        <h1>Unesite podatke i potvrdite narudžbinu</h1>
        <p className="orbit-lead">Placanje karticom nije ukljuceno. Narudžbina se salje direktno na email admina.</p>

        <div className="orbit-metric-row">
          <article className="orbit-metric">
            <strong>{itemCount}</strong>
            <span>komada</span>
          </article>
          <article className="orbit-metric">
            <strong>{formatRsd(subtotal)}</strong>
            <span>ukupan iznos</span>
          </article>
          <article className="orbit-metric">
            <strong>{items.length}</strong>
            <span>proizvoda</span>
          </article>
        </div>
      </article>

      {status !== "idle" ? (
        <p className={`status-msg orbit-reveal ${status === "error" ? "admin-status-error" : ""}`}>
          {statusMessage}
          {createdOrderNumber ? ` (Broj narudžbine: ${createdOrderNumber})` : ""}
        </p>
      ) : null}

      <section className="checkout-layout orbit-reveal">
        <form className="orbit-panel checkout-form-panel" onSubmit={onSubmit}>
          <p className="orbit-panel-tag">Podaci kupca</p>
          <h2>Podaci za isporuku</h2>
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

          <div className="legal-consent-block">
            <label className="legal-consent-checkbox" htmlFor="checkout-legal-consent">
              <input
                id="checkout-legal-consent"
                type="checkbox"
                required
                checked={legalAccepted}
                onChange={(event) => setLegalAccepted(event.target.checked)}
              />
              <span>
                Potvrđujem da sam procitala i prihvatam <Link href="/pravila-korišćenja">Pravila korišćenja</Link> i{" "}
                <Link href="/politika-privatnosti">Politiku privatnosti</Link>.
              </span>
            </label>

            <label className="legal-consent-checkbox" htmlFor="checkout-marketing-consent">
              <input
                id="checkout-marketing-consent"
                type="checkbox"
                checked={marketingAccepted}
                onChange={(event) => setMarketingAccepted(event.target.checked)}
              />
              <span>Opcionalno: pristajem da mi povremeno stizu promo ponude i novosti studija email-om.</span>
            </label>
          </div>

          <div className="checkout-form-actions">
            <button type="submit" className="primary-btn" disabled={status === "submitting" || !legalAccepted}>
              {status === "submitting" ? "Obrada narudžbine..." : "Potvrdi narudžbinu"}
            </button>
            <Link href="/korpa" className="ghost-btn">
              Nazad na korpu
            </Link>
          </div>
        </form>

        <aside className="orbit-panel checkout-summary-panel">
          <p className="orbit-panel-tag">Rezime</p>
          <h2>Rezime narudžbine</h2>
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
