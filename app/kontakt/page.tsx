"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { ArrowRight, Handbag, Mail, MapPin, Phone } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/contexts/language-context";
import { milkShakeTreatments, studioServices } from "@/lib/studio-content";
import { sendContactInquiryEmail } from "./actions";

const responseWindows = [
  "Upiti do 15h: odgovor istog dana",
  "Hitni termini: prioritetna obrada",
  "Online: 7 dana u nedelji",
] as const;

const contactNodes = [
  {
    title: "Poziv i Viber",
    value: "+381643877555",
    detail: "Radni dani 09:00-21:00 | Subota 09:00-18:00",
    Icon: Phone,
    stagger: "contact-card-stagger-1",
  },
  {
    title: "Email",
    value: "hello@ladygagastudio.rs",
    detail: "Pisani plan tretmana i preporuka proizvoda u roku od 24h.",
    Icon: Mail,
    stagger: "contact-card-stagger-2",
  },
  {
    title: "Lokacija",
    value: "Trg đačkog bataljona bb, Šabac",
    detail: "Parking i gradski prevoz u blizini studija.",
    Icon: MapPin,
    stagger: "contact-card-stagger-3",
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
      setStatusMessage(
        "Potrebno je da prihvatite politiku privatnosti i pravila korišćenja."
      );
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
        setStatusMessage("Poruka je uspešno poslata.");
      } else {
        setStatus("error");
        setStatusMessage(
          `Upit je sačuvan, ali email nije poslat: ${emailResult.error}`
        );
      }
    } catch {
      setStatus("error");
      setStatusMessage("Slanje nije uspelo. Pokušajte ponovo za par sekundi.");
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-bg" aria-hidden="true" />

        <div className="contact-hero-inner">
          <p className="contact-eyebrow">Kontakt</p>

          <h1 className="contact-title">
            Pošaljite poruku i dobijate jasan plan za vašu kosu.
          </h1>

          <p className="contact-lead">
            Ostavite upit za tretman, koloraciju, keratin ili frizuru. Dobijate
            predlog usluge i preporuku proizvoda za održavanje rezultata.
          </p>

          <div className="contact-hero-actions">
            <a href="#contact-form-section" className="contact-hero-btn-primary">
              Pošaljite poruku
              <ArrowRight size={16} strokeWidth={2} />
            </a>
            <Link href="/proizvodi" className="contact-hero-btn-ghost">
              Proizvodi za negu
              <Handbag size={16} strokeWidth={2} />
            </Link>
          </div>

          <div className="contact-chips">
            {responseWindows.map((item) => (
              <span key={item} className="contact-chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="contact-cards-grid">
        {contactNodes.map((node) => {
          const Icon = node.Icon;
          return (
            <article key={node.title} className={`contact-card ${node.stagger}`}>
              <div className="contact-card-inner">
                <div className="contact-card-icon">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h2 className="contact-card-title">{node.title}</h2>
                <p className="contact-card-value">{node.value}</p>
                <p className="contact-card-detail">{node.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="contact-services">
        <div className="contact-services-inner">
          <div className="contact-services-layout">
            <div className="contact-services-copy">
              <div className="contact-services-header">
                <p className="contact-eyebrow">Šta možete zakazati</p>
                <h2>Usluge i tretmani koje klijentkinje najčešće biraju.</h2>
              </div>

              <p className="contact-services-intro">
                Svaki termin planiramo prema trenutnom stanju kose, prethodnim
                hemijskim procesima i rezultatu koji želite da postignete.
              </p>

              <div className="contact-services-panels">
                <article className="contact-services-panel">
                  <div className="contact-services-panel-head">
                    <p className="contact-services-panel-kicker">Najtraženije</p>
                    <h3>Usluge</h3>
                  </div>
                  <ul className="contact-services-list">
                    {studioServices.map((service) => (
                      <li key={service}>
                        <span className="contact-list-dot" />
                        {service}
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="contact-services-panel">
                  <div className="contact-services-panel-head">
                    <p className="contact-services-panel-kicker">
                      Profesionalna nega
                    </p>
                    <h3>Milk Shake protokoli</h3>
                  </div>
                  <ul className="contact-services-list">
                    {milkShakeTreatments.map((treatment) => (
                      <li key={treatment.name}>
                        <span className="contact-list-dot" />
                        {treatment.name}
                      </li>
                    ))}
                  </ul>
                </article>
              </div>
            </div>

            <figure className="contact-services-media">
              <div className="contact-services-media-frame">
                <Image
                  src="/slike/kontakt-slika.avif"
                  alt="Atmosfera studija Lady Gaga"
                  width={800}
                  height={1000}
                  sizes="(max-width: 1023px) 100vw, 34vw"
                  className="contact-services-video"
                />
              </div>
              <figcaption className="contact-services-media-caption">
                Mirna atmosfera, precizan pregled i preporuka nege za kuću.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="contact-form-section" className="contact-map-form">
        <article className="contact-map-card">
          <div className="contact-map-inner">
            <p className="contact-eyebrow">Mapa dolaska</p>
            <h2>Locirajte studio i planirajte dolazak.</h2>
            <p>
              Ako dolazite prvi put, napišite u poruci da ste nova klijentkinja
              i dobijate smernice za najbrži dolazak.
            </p>
            <iframe
              title="Studio Lady Gaga mapa"
              src="https://www.google.com/maps?q=Trg%20%C4%91a%C4%8Dkog%20bataljona%2C%20%C5%A0abac&output=embed"
              loading="lazy"
              className="contact-map-iframe"
            />
          </div>
        </article>

        <form onSubmit={submit} className="contact-form-card">
          <div className="contact-form-inner">
            <div className="contact-form-header">
              <p className="contact-eyebrow">Kontakt forma</p>
              <h2>{t.contact.form}</h2>
              <p>U poruci navedite kratko stanje kose i želju koju imate.</p>
            </div>

            {status === "sent" && (
              <div className="contact-alert-success">
                <p>{statusMessage}</p>
              </div>
            )}
            {status === "error" && (
              <div className="contact-alert-error">
                <p>{statusMessage}</p>
              </div>
            )}

            <div className="contact-form-fields">
              <div className="contact-form-field">
                <label htmlFor="contact-name">{t.contact.name}</label>
                <input
                  id="contact-name"
                  required
                  placeholder={t.contact.name}
                  value={form.name}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-email">{t.contact.email}</label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  placeholder={t.contact.email}
                  value={form.email}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      email: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="contact-form-field">
                <label htmlFor="contact-message">{t.contact.message}</label>
                <textarea
                  id="contact-message"
                  required
                  placeholder={t.contact.message}
                  value={form.message}
                  onChange={(event) =>
                    setForm((value) => ({
                      ...value,
                      message: event.target.value,
                    }))
                  }
                  className="contact-form-textarea"
                />
              </div>
            </div>

            <label
              className="contact-form-consent"
              htmlFor="contact-legal-consent"
            >
              <input
                id="contact-legal-consent"
                type="checkbox"
                required
                checked={legalAccepted}
                onChange={(event) => setLegalAccepted(event.target.checked)}
              />
              <span>
                Potvrđujem da sam pročitala i prihvatam{" "}
                <Link href="/politika-privatnosti">Politiku privatnosti</Link>{" "}
                i <Link href="/pravila-koriscenja">Pravila korišćenja</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={status === "sending" || !legalAccepted}
              className="contact-form-submit"
            >
              {status === "sending" ? "Slanje..." : t.contact.submit}
            </button>

            <p className="contact-form-footer">
              Za brzu kupovinu preporučenih artikala otvorite{" "}
              <Link href="/proizvodi">stranicu proizvoda</Link>.
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
