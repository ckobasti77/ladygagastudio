"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/contexts/language-context";
import { milkShakeTreatments, studioGallery, studioServices, studioVideos } from "@/lib/studio-content";
import { sendContactInquiryEmail } from "./actions";

const responseWindows = [
  "Upiti do 15h: odgovor istog dana",
  "Hitni termini: prioritetna obrada",
  "Online podrska: 7 dana u nedelji",
] as const;

const contactNodes = [
  {
    title: "Poziv i Viber",
    value: "+381 60 123 4567",
    detail: "Radni dani 09:00-21:00 | Subota 09:00-18:00",
  },
  {
    title: "Email",
    value: "kontakt@studioladygaga.rs",
    detail: "Pisani plan tretmana i preporuka proizvoda u roku od 24h.",
  },
  {
    title: "Lokacija",
    value: "Bulevar Lepote 12, Beograd",
    detail: "Parking i gradski prevoz u blizini studija.",
  },
] as const;

type InquiryStatus = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const { t } = useLanguage();
  const createInquiry = useMutation(api.orders.createInquiry);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<InquiryStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!legalAccepted) {
      setStatus("error");
      setStatusMessage("Potrebno je da prihvatite politiku privatnosti i pravila koriscenja.");
      return;
    }

    setStatus("sending");
    setStatusMessage("");

    try {
      const createdAt = Date.now();
      await createInquiry(form);
      const emailResult = await sendContactInquiryEmail({
        ...form,
        createdAt,
      });
      setForm({ name: "", email: "", message: "" });
      setLegalAccepted(false);
      if (emailResult.ok) {
        setStatus("sent");
        setStatusMessage("Poruka je uspesno poslata.");
      } else {
        setStatus("error");
        setStatusMessage(`Upit je sacuvan, ali email nije poslat: ${emailResult.error}`);
      }
    } catch {
      setStatus("error");
      setStatusMessage("Slanje nije uspelo. Pokusajte ponovo za par sekundi.");
    }
  };

  return (
    <section className="page-grid orbit-page contact-orbit">
      <article className="orbit-hero contact-hero orbit-reveal">
        <div className="orbit-hud" aria-hidden>
          <span>Rezervacije</span>
          <strong>Studio Lady Gaga | Direktan kontakt</strong>
        </div>

        <p className="orbit-eyebrow">Kontakt</p>
        <h1>Posaljite poruku i dobijate jasan plan za vasu kosu.</h1>
        <p className="orbit-lead">
          Ostavite upit za tretman, koloraciju, keratin ili frizuru. Dobijate predlog usluge i preporuku proizvoda za
          odrzavanje rezultata.
        </p>

        <div className="orbit-badge-row">
          {responseWindows.map((item) => (
            <span key={item} className="orbit-badge-pill">
              {item}
            </span>
          ))}
        </div>
      </article>

      <section className="contact-node-grid orbit-reveal">
        {contactNodes.map((node) => (
          <article key={node.title} className="orbit-panel contact-node-card">
            <p className="orbit-panel-tag">Kontakt tacka</p>
            <h2>{node.title}</h2>
            <strong>{node.value}</strong>
            <p>{node.detail}</p>
          </article>
        ))}
      </section>

      <section className="orbit-panel orbit-reveal contact-offer-board">
        <p className="orbit-panel-tag">Sta mozete zakazati</p>
        <h2>Usluge i tretmani koje najcesce biraju klijentkinje.</h2>
        <div className="contact-offer-grid">
          <article>
            <h3>Usluge</h3>
            <ul>
              {studioServices.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </article>
          <article>
            <h3>Milk Shake protokoli</h3>
            <ul>
              {milkShakeTreatments.map((treatment) => (
                <li key={treatment.name}>{treatment.name}</li>
              ))}
            </ul>
          </article>
          <article className="contact-offer-video">
            <h3>Atmosfera studija</h3>
            <video controls preload="metadata" playsInline poster={studioGallery[0].src}>
              <source src={studioVideos[2].src} type="video/webm" />
            </video>
          </article>
        </div>
      </section>

      <section className="orbit-split contact-split orbit-reveal">
        <article className="orbit-panel contact-map-card">
          <p className="orbit-panel-tag">Mapa dolaska</p>
          <h2>Locirajte studio i planirajte dolazak.</h2>
          <p>
            Ako dolazite prvi put, napisite u poruci da ste nova klijentkinja i dobijate smernice za najbrzi dolazak.
          </p>
          <iframe title="Studio Lady Gaga mapa" src="https://www.google.com/maps?q=Belgrade&output=embed" loading="lazy" />
        </article>

        <form className="orbit-panel contact-form-panel" onSubmit={submit}>
          <p className="orbit-panel-tag">Kontakt forma</p>
          <h2>{t.contact.form}</h2>
          <p>U poruci navedite kratko stanje kose i zelju koju imate.</p>

          {status === "sent" ? <p className="status-msg contact-status success">{statusMessage}</p> : null}
          {status === "error" ? <p className="status-msg contact-status error">{statusMessage}</p> : null}

          <label className="contact-label" htmlFor="contact-name">
            {t.contact.name}
          </label>
          <input
            id="contact-name"
            required
            placeholder={t.contact.name}
            value={form.name}
            onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
          />

          <label className="contact-label" htmlFor="contact-email">
            {t.contact.email}
          </label>
          <input
            id="contact-email"
            required
            type="email"
            placeholder={t.contact.email}
            value={form.email}
            onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
          />

          <label className="contact-label" htmlFor="contact-message">
            {t.contact.message}
          </label>
          <textarea
            id="contact-message"
            required
            placeholder={t.contact.message}
            value={form.message}
            onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))}
          />

          <label className="legal-consent-checkbox" htmlFor="contact-legal-consent">
            <input
              id="contact-legal-consent"
              type="checkbox"
              required
              checked={legalAccepted}
              onChange={(event) => setLegalAccepted(event.target.checked)}
            />
            <span>
              Potvrdjujem da sam procitala i prihvatam <Link href="/politika-privatnosti">Politiku privatnosti</Link> i{" "}
              <Link href="/pravila-koriscenja">Pravila koriscenja</Link>.
            </span>
          </label>

          <button type="submit" className="primary-btn contact-submit" disabled={status === "sending" || !legalAccepted}>
            {status === "sending" ? "Slanje..." : t.contact.submit}
          </button>

          <p className="contact-footnote">
            Za brzu kupovinu preporucenih artikala otvorite <Link href="/proizvodi">stranicu proizvoda</Link>.
          </p>
        </form>
      </section>
    </section>
  );
}
