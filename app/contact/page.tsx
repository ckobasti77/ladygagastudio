"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/contexts/language-context";

const responseWindows = [
  "Upiti do 15h: odgovor istog dana",
  "Hitni termini: prioritetna obrada",
  "Online podrska: 7 dana u nedelji",
] as const;

const contactNodes = [
  {
    title: "Pozivna linija",
    value: "+381 60 123 4567",
    detail: "Radni dani 09:00-21:00 | Subota 09:00-18:00",
  },
  {
    title: "Email kanal",
    value: "kontakt@studioladygaga.rs",
    detail: "Detaljan odgovor i plan tretmana u roku od 24h.",
  },
  {
    title: "Lokacija",
    value: "Bulevar Lepote 12, Beograd",
    detail: "Parking zona i gradski prevoz u krugu od 100m.",
  },
] as const;

type InquiryStatus = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const { t } = useLanguage();
  const createInquiry = useMutation(api.orders.createInquiry);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<InquiryStatus>("idle");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      await createInquiry(form);
      setForm({ name: "", email: "", message: "" });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="page-grid orbit-page contact-orbit">
      <article className="orbit-hero contact-hero orbit-reveal">
        <div className="orbit-hud" aria-hidden>
          <span>Contact Station</span>
          <strong>Studio Lady Gaga | Open Channel</strong>
        </div>

        <p className="orbit-eyebrow">Kontakt</p>
        <h1>{t.contact.title} centar za sledeci nivo frizure.</h1>
        <p className="orbit-lead">
          {t.contact.subtitle}. Posalji poruku, zahtev za termin ili ideju look-a i vracamo ti konkretan plan.
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
            <p className="orbit-panel-tag">Signal node</p>
            <h2>{node.title}</h2>
            <strong>{node.value}</strong>
            <p>{node.detail}</p>
          </article>
        ))}
      </section>

      <section className="orbit-split contact-split orbit-reveal">
        <article className="orbit-panel contact-map-card">
          <p className="orbit-panel-tag">Geo beacon</p>
          <h2>Lociraj salon i aktiviraj dolazak.</h2>
          <p>
            Ako dolazis prvi put, posalji poruku i dobices najbrzu rutu, info o parkingu i preporuceni termin.
          </p>
          <iframe title="Studio Lady Gaga mapa" src="https://www.google.com/maps?q=Belgrade&output=embed" loading="lazy" />
        </article>

        <form className="orbit-panel contact-form-panel" onSubmit={submit}>
          <p className="orbit-panel-tag">Direct uplink</p>
          <h2>{t.contact.form}</h2>
          <p>Unesi osnovne informacije i tim ti salje povratnu poruku sa sledecim koracima.</p>

          {status === "sent" ? <p className="status-msg contact-status success">Poruka je uspesno poslata.</p> : null}
          {status === "error" ? (
            <p className="status-msg contact-status error">Slanje nije uspelo. Pokusaj ponovo za par sekundi.</p>
          ) : null}

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

          <button type="submit" className="primary-btn contact-submit" disabled={status === "sending"}>
            {status === "sending" ? "Slanje..." : t.contact.submit}
          </button>

          <p className="contact-footnote">
            Za inspiraciju look-a mozes odmah pogledati i <Link href="/products">nase proizvode</Link>.
          </p>
        </form>
      </section>
    </section>
  );
}
