"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { BadgeCheck, Banknote, Copy, Download, QrCode, Truck } from "lucide-react";
import { api } from "@/convex/_generated/api";
import CartRewardMeter from "@/components/cart-reward-meter";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { BONUS_PERCENT, shippingLabel, shippingNote } from "@/lib/cart-rewards";
import { buildIpsQrForOrder, isIpsPaymentAvailable, sendCheckoutOrderEmail, type IpsQrResult } from "./actions";

const LAST_ORDER_STORAGE_KEY = "studio_lady_gaga_last_order_v1";

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
    shortName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    finalUnitPrice: number;
    bonusApplied: boolean;
    payableUnitPrice: number;
    lineTotal: number;
  }>;
  totals: {
    totalItems: number;
    totalAmount: number;
    goodsTotal: number;
    bonusSavings: number;
  };
  freeShipping: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: "not_required" | "awaiting" | "confirmed";
  paymentPurpose: string;
  paymentReference: string;
};

type PaymentMethod = "cod" | "ips";

type SendOrderConfirmationResult = { ok: true } | { ok: false; error: string };

/** Sačuvano u sessionStorage da osvežavanje stranice ne obriše IPS QR kod. */
type LastOrderSnapshot = {
  orderNumber: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  freeShipping: boolean;
  message: string;
  ips: IpsQrResult | null;
};

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
  return "Naručivanje nije uspelo. Pokušajte ponovo.";
}

export default function CheckoutPage() {
  const { session } = useAuth();
  const { lines, items, itemCount, goodsTotal, subtotal, rewards, clearCart } = useCart();
  const placeOrder = useMutation(api.orders.placeOrder) as unknown as (args: {
    items: Array<{ productId: string; quantity: number; addedAt: number }>;
    customer: CheckoutForm;
    paymentMethod: PaymentMethod;
  }) => Promise<PlaceOrderResult>;
  const subscribeToMarketing = useMutation(api.users.subscribeToMarketing) as unknown as (
    args: SubscribeToMarketingArgs,
  ) => Promise<void>;

  const [form, setForm] = useState<CheckoutForm>(emptyForm);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("cod");
  const [ipsAvailable, setIpsAvailable] = useState(false);
  const [lastOrder, setLastOrder] = useState<LastOrderSnapshot | null>(null);
  const [restoredOrder, setRestoredOrder] = useState<LastOrderSnapshot | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Bez IPS podataka u env-u opcija se uopšte ne nudi — pouzeće i dalje radi.
  const paymentMethod: PaymentMethod = ipsAvailable ? selectedPaymentMethod : "cod";

  useEffect(() => {
    let active = true;
    isIpsPaymentAvailable()
      .then((available) => {
        if (active) setIpsAvailable(available);
      })
      .catch(() => {
        if (active) setIpsAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Osvežavanje stranice ne sme da obriše QR kod za uplatu.
  useEffect(() => {
    const raw = window.sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LastOrderSnapshot;
      if (!parsed?.orderNumber) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- učitavanje sačuvane narudžbine posle montiranja
      setRestoredOrder(parsed);
    } catch {
      window.sessionStorage.removeItem(LAST_ORDER_STORAGE_KEY);
    }
  }, []);

  // Vraćena narudžbina se prikazuje samo dok je korpa prazna — čim kupac
  // ponovo napuni korpu, prednost ima nova narudžbina.
  const showsRestoredOrder = status === "idle" && restoredOrder !== null && items.length === 0;
  const successOrder = status === "success" ? lastOrder : showsRestoredOrder ? restoredOrder : null;
  const isSuccessView = status === "success" || showsRestoredOrder;
  const successOrderNumber = status === "success" ? createdOrderNumber : (restoredOrder?.orderNumber ?? null);
  const successMessage = status === "success" ? statusMessage : (restoredOrder?.message ?? "");

  const startNewOrder = () => {
    window.sessionStorage.removeItem(LAST_ORDER_STORAGE_KEY);
    setRestoredOrder(null);
    setLastOrder(null);
    setCreatedOrderNumber(null);
    setStatusMessage("");
    setStatus("idle");
  };

  useEffect(() => {
    if (!isSuccessView) return;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [isSuccessView]);

  const copyToClipboard = useCallback(async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      setCopiedField(null);
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    const profileFirstName = session.firstName?.trim() ?? "";
    const profileLastName = session.lastName?.trim() ?? "";
    const profileEmail = session.email?.trim() ?? "";

    if (!profileFirstName && !profileLastName && !profileEmail) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate checkout fields from session only when they are still empty
    setForm((current) => {
      const shouldFillFirstName = !current.firstName.trim() && profileFirstName.length > 0;
      const shouldFillLastName = !current.lastName.trim() && profileLastName.length > 0;
      const shouldFillEmail = !current.email.trim() && profileEmail.length > 0;

      if (!shouldFillFirstName && !shouldFillLastName && !shouldFillEmail) {
        return current;
      }

      return {
        ...current,
        firstName: shouldFillFirstName ? profileFirstName : current.firstName,
        lastName: shouldFillLastName ? profileLastName : current.lastName,
        email: shouldFillEmail ? profileEmail : current.email,
      };
    });
  }, [session]);

  const checkoutItems = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        // Server na osnovu ovoga ponovo utvrđuje ko dobija bonus od 15%.
        addedAt: item.addedAt,
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
        paymentMethod,
      });

      // QR se pravi pre mejla — ako slanje mejla padne, kupac i dalje dobija kod za uplatu.
      let ipsResult: IpsQrResult | null = null;
      if (order.paymentMethod === "ips") {
        try {
          ipsResult = await buildIpsQrForOrder({
            orderNumber: order.orderNumber,
            amount: order.totals.totalAmount,
            productShortNames: order.items.map((item) => item.shortName),
            purpose: order.paymentPurpose,
            reference: order.paymentReference,
          });
        } catch (qrError: unknown) {
          ipsResult = { ok: false, error: resolveErrorMessage(qrError) };
        }
      }

      let emailResult: SendOrderConfirmationResult;
      try {
        emailResult = (await sendCheckoutOrderEmail({
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          customer: order.customer,
          items: order.items,
          totals: order.totals,
          paymentMethod: order.paymentMethod,
          freeShipping: order.freeShipping,
          paymentPurpose: order.paymentPurpose,
          paymentReference: order.paymentReference,
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

      const orderFeedbackMessage = emailResult.ok
        ? "Narudžbina je uspešno poslata i email obaveštenje je isporučeno adminu."
        : "Narudžbina je uspešno kreirana, ali email obaveštenje adminu nije poslato. Porudžbina je ipak sačuvana u evidenciji narudžbina.";
      setStatusMessage(orderFeedbackMessage);

      const snapshot: LastOrderSnapshot = {
        orderNumber: order.orderNumber,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totals.totalAmount,
        freeShipping: order.freeShipping,
        message: orderFeedbackMessage,
        ips: ipsResult,
      };
      setLastOrder(snapshot);
      window.sessionStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error: unknown) {
      setStatus("error");
      setStatusMessage(resolveErrorMessage(error));
    }
  };

  if (items.length === 0 && !isSuccessView) {
    return (
      <section className="page-grid orbit-page checkout-orbit">
        <article className="orbit-hero orbit-reveal">
          <div className="orbit-hud" aria-hidden>
            <span>Plaćanje</span>
            <strong>Studio Lady Gaga | Narudžbina</strong>
          </div>

          <p className="orbit-eyebrow">Plaćanje</p>
          <h1>Nema artikala za naručivanje.</h1>
          <p className="orbit-lead">Dodajte proizvode u korpu pa nastavite na plaćanje.</p>

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

  if (isSuccessView) {
    const isIpsOrder = successOrder?.paymentMethod === "ips";
    const ips = successOrder?.ips;

    return (
      <section className="page-grid orbit-page checkout-orbit">
        <article className="orbit-hero orbit-reveal">
          <div className="orbit-hud" aria-hidden>
            <span>Potvrda</span>
            <strong>Studio Lady Gaga | Narudžbina kreirana</strong>
          </div>

          <p className="orbit-eyebrow">Plaćanje</p>
          <h1>Narudžbina je uspešno kreirana.</h1>
          <p className="orbit-lead">
            {successMessage}
            {successOrderNumber ? ` Broj narudžbine: ${successOrderNumber}.` : ""}
          </p>

          {successOrder && !isIpsOrder ? (
            <p className="checkout-success-note">
              <Banknote aria-hidden />
              <span>
                Plaćate <strong>{formatRsd(successOrder.totalAmount)}</strong> kuriru pri preuzimanju.
                {successOrder.freeShipping
                  ? " Poštarina je besplatna."
                  : " Poštarina se plaća kuriru po njihovom cenovniku."}
              </span>
            </p>
          ) : null}

          <div className="orbit-actions">
            <Link href="/proizvodi" className="primary-btn orbit-main-action">
              Nastavi kupovinu
            </Link>
            <button type="button" className="ghost-btn orbit-second-action" onClick={startNewOrder}>
              Nova narudžbina
            </button>
            <Link href="/kontakt" className="ghost-btn orbit-second-action">
              Kontakt
            </Link>
          </div>
        </article>

        {isIpsOrder ? (
          ips?.ok ? (
            <article className="orbit-panel ips-panel orbit-reveal">
              <p className="orbit-panel-tag">IPS QR plaćanje</p>
              <h2>Skenirajte kod u svojoj m-banking aplikaciji</h2>
              <p className="ips-panel-lead">
                Otvorite aplikaciju svoje banke, izaberite skeniranje IPS QR koda i potvrdite uplatu. Iznos, primalac i
                svrha se popunjavaju automatski.
              </p>

              <div className="ips-panel-body">
                <div className="ips-qr-frame">
                  <div className="ips-qr-code" dangerouslySetInnerHTML={{ __html: ips.svg }} />
                  <a className="ghost-btn ips-qr-download" href={ips.pngDataUrl} download={`${successOrderNumber}-ips.png`}>
                    <Download aria-hidden />
                    Preuzmi QR kod
                  </a>
                </div>

                <div className="ips-details">
                  <p className="ips-details-title">Podaci za ručnu uplatu</p>
                  {(
                    [
                      { key: "recipient", label: "Primalac", value: ips.recipientName },
                      {
                        key: "recipientPlace",
                        label: "Adresa primaoca",
                        value: [ips.recipientAddress, ips.recipientCity].filter(Boolean).join(", "),
                      },
                      { key: "account", label: "Račun primaoca", value: ips.account },
                      { key: "amount", label: "Iznos", value: ips.formattedAmount },
                      { key: "code", label: "Šifra plaćanja", value: ips.paymentCode },
                      { key: "purpose", label: "Svrha uplate", value: ips.purpose },
                      { key: "reference", label: "Poziv na broj (model 00)", value: ips.reference },
                    ] as const
                  )
                    .filter((row) => row.value.length > 0)
                    .map((row) => (
                      <div key={row.key} className="ips-details-row">
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                        <button
                          type="button"
                          className="ips-copy-btn"
                          onClick={() => copyToClipboard(row.key, row.value)}
                          aria-label={`Kopiraj: ${row.label}`}
                        >
                          {copiedField === row.key ? <BadgeCheck aria-hidden /> : <Copy aria-hidden />}
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <p className="ips-panel-warning">
                <QrCode aria-hidden />
                <span>
                  Porudžbinu šaljemo tek kada uplata bude evidentirana na računu. Ako uplatite van radnog vremena banke,
                  sredstva mogu da legnu tek narednog radnog dana.
                </span>
              </p>
            </article>
          ) : (
            <article className="orbit-panel ips-panel ips-panel-error orbit-reveal">
              <p className="orbit-panel-tag">IPS QR plaćanje</p>
              <h2>QR kod nije mogao da se generiše</h2>
              <p className="ips-panel-lead">
                {ips?.error ?? "Nepoznata greška."} Porudžbina <strong>{successOrderNumber}</strong> je sačuvana —
                kontaktirajte nas i poslaćemo vam podatke za uplatu.
              </p>
              <div className="orbit-actions">
                <Link href="/kontakt" className="primary-btn orbit-main-action">
                  Kontaktirajte nas
                </Link>
              </div>
            </article>
          )
        ) : null}
      </section>
    );
  }

  return (
    <section className="page-grid orbit-page checkout-orbit">
      <article className="orbit-hero orbit-reveal">
        <div className="orbit-hud" aria-hidden>
          <span>Plaćanje</span>
          <strong>Studio Lady Gaga | Narudžbina</strong>
        </div>

        <p className="orbit-eyebrow">Plaćanje</p>
        <h1>Unesite podatke i potvrdite narudžbinu</h1>
        <p className="orbit-lead">
          Birate između plaćanja pouzećem i online uplate preko IPS QR koda. Plaćanje karticom na sajtu nije omogućeno.
        </p>

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
              placeholder="Poštanski broj"
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

          <fieldset className="checkout-payment-fieldset">
            <legend>Način plaćanja</legend>

            <label className={`checkout-payment-option ${paymentMethod === "cod" ? "is-selected" : ""}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setSelectedPaymentMethod("cod")}
              />
              <Banknote className="checkout-payment-glyph" aria-hidden />
              <span className="checkout-payment-copy">
                <strong>Plaćanje pouzećem</strong>
                <small>Plaćate kuriru gotovinom pri preuzimanju paketa.</small>
              </span>
            </label>

            {ipsAvailable ? (
              <label className={`checkout-payment-option ${paymentMethod === "ips" ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ips"
                  checked={paymentMethod === "ips"}
                  onChange={() => setSelectedPaymentMethod("ips")}
                />
                <QrCode className="checkout-payment-glyph" aria-hidden />
                <span className="checkout-payment-copy">
                  <strong>IPS QR — online, unapred</strong>
                  <small>
                    Posle potvrde dobijate QR kod koji skenirate u m-banking aplikaciji. Paket šaljemo čim uplata bude
                    evidentirana.
                  </small>
                </span>
              </label>
            ) : (
              <p className="checkout-payment-unavailable">
                IPS QR plaćanje trenutno nije dostupno. Narudžbinu možete završiti plaćanjem pouzećem.
              </p>
            )}

            {paymentMethod === "ips" ? (
              <p className="checkout-payment-note">
                Uplata se ne potvrđuje automatski. Paket kreće tek kada sredstva legnu na račun studija — ako uplatite
                van radnog vremena banke, to može biti tek narednog radnog dana.
              </p>
            ) : null}
          </fieldset>

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
                Potvrđujem da sam pročitala i prihvatam <Link href="/pravila-koriscenja">Pravila korišćenja</Link> i{" "}
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
              <span>Opcionalno: pristajem da mi povremeno stižu promo ponude i novosti studija mejlom.</span>
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
            {lines.map((item) => (
              <article key={item.productId} className="checkout-summary-item">
                <div>
                  <h3>
                    {item.title}
                    {item.bonusApplied ? <span className="checkout-summary-bonus">Bonus −{BONUS_PERCENT}%</span> : null}
                  </h3>
                  <p>
                    {item.quantity} x {formatRsd(item.payableUnitPrice)}
                  </p>
                </div>
                <strong>{formatRsd(item.lineTotal)}</strong>
              </article>
            ))}
          </div>

          <CartRewardMeter rewards={rewards} className="cart-summary-meter" />

          <div className="cart-summary-line">
            <span>Ukupno komada</span>
            <strong>{itemCount}</strong>
          </div>
          <div className="cart-summary-line">
            <span>Vrednost artikala</span>
            <strong>{formatRsd(goodsTotal)}</strong>
          </div>
          {rewards.bonusSavings > 0 ? (
            <div className="cart-summary-line cart-summary-bonus">
              <span>Bonus popust −{BONUS_PERCENT}%</span>
              <strong>−{formatRsd(rewards.bonusSavings)}</strong>
            </div>
          ) : null}
          <div className={`cart-summary-line cart-summary-shipping ${rewards.freeShipping ? "is-free" : ""}`}>
            <span>
              <Truck aria-hidden />
              Dostava
            </span>
            <strong>{shippingLabel(rewards.freeShipping)}</strong>
          </div>
          <p className="cart-summary-shipping-note">{shippingNote(rewards.freeShipping)}</p>
          <div className="cart-summary-line cart-summary-total">
            <span>Ukupan iznos</span>
            <strong>{formatRsd(subtotal)}</strong>
          </div>
        </aside>
      </section>
    </section>
  );
}
