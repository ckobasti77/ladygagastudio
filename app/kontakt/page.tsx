"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/contexts/language-context";
import {
  milkShakeTreatments,
  studioGallery,
  studioServices,
  studioVideos,
} from "@/lib/studio-content";
import { sendContactInquiryEmail } from "./actions";
import { Mail, MapPin, Phone } from "lucide-react";

const responseWindows = [
  "Upiti do 15h: odgovor istog dana",
  "Hitni termini: prioritetna obrada",
  "Online podrska: 7 dana u nedelji",
] as const;

const contactNodes = [
  {
    title: "Poziv i Viber",
    value: "+381643877555",
    detail: "Radni dani 09:00-21:00 | Subota 09:00-18:00",
    Icon: Phone,
    watermark: "01",
  },
  {
    title: "Email",
    value: "hello@ladygagastudio.rs",
    detail: "Pisani plan tretmana i preporuka proizvoda u roku od 24h.",
    Icon: Mail,
    watermark: "02",
  },
  {
    title: "Lokacija",
    value: "Trg \u0111a\u010dkog bataljona, \u0160abac",
    detail: "Parking i gradski prevoz u blizini studija.",
    Icon: MapPin,
    watermark: "03",
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
        "Potrebno je da prihvatite politiku privatnosti i pravila koriscenja."
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
        setStatusMessage("Poruka je uspesno poslata.");
      } else {
        setStatus("error");
        setStatusMessage(
          `Upit je sacuvan, ali email nije poslat: ${emailResult.error}`
        );
      }
    } catch {
      setStatus("error");
      setStatusMessage(
        "Slanje nije uspelo. Pokusajte ponovo za par sekundi."
      );
    }
  };

  return (
    <div className="editorial-contact relative space-y-20 py-10 md:space-y-28 md:py-16">
      {/* Ethereal background glows */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-24 left-[18%] h-[420px] w-[420px] rounded-full bg-amber-200/20 blur-[120px] dark:bg-amber-800/[0.07]" />
        <div className="absolute right-[5%] top-[50%] h-[360px] w-[360px] rounded-full bg-rose-200/15 blur-[100px] dark:bg-rose-900/[0.06]" />
        <div className="absolute bottom-[15%] left-[35%] h-[280px] w-[280px] rounded-full bg-orange-100/20 blur-[90px] dark:bg-orange-900/[0.05]" />
      </div>

      {/* ───────────────── HERO ───────────────── */}
      <section className="relative mx-auto max-w-3xl text-center">
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[9rem] leading-none tracking-tight opacity-[0.035] md:text-[13rem] dark:opacity-[0.06]"
          style={{ fontFamily: "var(--serif-font)" }}
          aria-hidden="true"
        >
          KONTAKT
        </span>

        <div className="relative space-y-6">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.28em] text-[var(--accent)]">
            Kontakt
          </p>

          <h1
            className="text-[clamp(1.9rem,5.2vw,3.5rem)] font-medium leading-[1.08] tracking-tight text-[var(--text)]"
            style={{ fontFamily: "var(--serif-font)" }}
          >
            Posaljite poruku i dobijate jasan plan za vasu kosu.
          </h1>

          <p className="mx-auto max-w-xl text-base leading-[1.7] text-[var(--muted)] md:text-[1.08rem]">
            Ostavite upit za tretman, koloraciju, keratin ili frizuru. Dobijate
            predlog usluge i preporuku proizvoda za odrzavanje rezultata.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            {responseWindows.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/50 bg-white/[0.42] px-4 py-2 text-[0.78rem] font-semibold shadow-lg shadow-black/[0.04] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-white/[0.1] dark:bg-white/[0.06] dark:shadow-black/20"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── CONTACT CARDS ───────────────── */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6">
        {contactNodes.map((node, index) => {
          const Icon = node.Icon;
          const stagger = [
            "md:translate-y-0",
            "md:-translate-y-5",
            "md:translate-y-3",
          ];
          return (
            <article
              key={node.title}
              className={`group relative overflow-hidden rounded-[1.5rem] border border-white/50 bg-white/[0.4] p-7 shadow-xl shadow-black/[0.04] backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl dark:border-white/[0.1] dark:bg-neutral-900/[0.38] dark:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)] ${stagger[index]}`}
            >
              <span
                className="pointer-events-none absolute -right-2 -top-4 select-none text-[6rem] leading-none opacity-[0.06] dark:opacity-[0.09]"
                style={{ fontFamily: "var(--serif-font)" }}
                aria-hidden="true"
              >
                {node.watermark}
              </span>

              <div className="relative space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100/70 text-[var(--accent)] dark:bg-amber-950/40">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <h2 className="text-[1.1rem] font-semibold text-[var(--text)]">
                  {node.title}
                </h2>
                <p
                  className="text-[0.92rem] font-medium leading-snug text-[var(--text)]"
                  style={{ fontFamily: "var(--display-font)" }}
                >
                  {node.value}
                </p>
                <p className="text-[0.84rem] leading-relaxed text-[var(--muted)]">
                  {node.detail}
                </p>
              </div>
            </article>
          );
        })}
      </section>

      {/* ───────────────── SERVICES ───────────────── */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/45 bg-white/[0.32] p-7 shadow-xl shadow-black/[0.04] backdrop-blur-md dark:border-white/[0.08] dark:bg-neutral-900/[0.3] dark:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] sm:p-10 md:p-12">
        <span
          className="pointer-events-none absolute right-4 top-3 select-none text-[6rem] leading-none tracking-tight opacity-[0.03] sm:text-[8rem] md:text-[10rem] dark:opacity-[0.05]"
          style={{ fontFamily: "var(--serif-font)" }}
          aria-hidden="true"
        >
          STUDIO
        </span>

        <div className="relative space-y-10">
          <div className="max-w-2xl space-y-3">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.28em] text-[var(--accent)]">
              Sta mozete zakazati
            </p>
            <h2
              className="text-[clamp(1.4rem,3.2vw,2.2rem)] font-medium leading-[1.14] text-[var(--text)]"
              style={{ fontFamily: "var(--serif-font)" }}
            >
              Usluge i tretmani koje najcesce biraju klijentkinje.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[var(--text)]">
                Usluge
              </h3>
              <ul className="space-y-2.5">
                {studioServices.map((service) => (
                  <li
                    key={service}
                    className="flex items-start gap-3 text-[0.88rem] leading-relaxed text-[var(--muted)]"
                  >
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {service}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[var(--text)]">
                Milk Shake protokoli
              </h3>
              <ul className="space-y-2.5">
                {milkShakeTreatments.map((treatment) => (
                  <li
                    key={treatment.name}
                    className="flex items-start gap-3 text-[0.88rem] leading-relaxed text-[var(--muted)]"
                  >
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />
                    {treatment.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4 md:col-span-2 lg:col-span-1">
              <h3 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[var(--text)]">
                Atmosfera studija
              </h3>
              <video
                controls
                preload="metadata"
                playsInline
                poster={studioGallery[0].src}
                className="aspect-[4/5] w-full rounded-2xl object-cover shadow-md"
              >
                <source src={studioVideos[2].src} type="video/webm" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── MAP & FORM ───────────────── */}
      <section className="relative grid grid-cols-1 items-start gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-0">
        {/* Map */}
        <article className="relative z-10 overflow-hidden rounded-[2rem] border border-white/45 bg-white/[0.35] p-7 shadow-xl shadow-black/[0.04] backdrop-blur-md dark:border-white/[0.08] dark:bg-neutral-900/[0.3] dark:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] sm:p-9 md:p-10">
          <span
            className="pointer-events-none absolute -left-1 top-2 select-none text-[5rem] leading-none opacity-[0.04] dark:opacity-[0.07]"
            style={{ fontFamily: "var(--serif-font)" }}
            aria-hidden="true"
          >
            MAPA
          </span>

          <div className="relative space-y-5">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.28em] text-[var(--accent)]">
              Mapa dolaska
            </p>
            <h2
              className="text-[clamp(1.3rem,2.8vw,1.9rem)] font-medium leading-[1.14] text-[var(--text)]"
              style={{ fontFamily: "var(--serif-font)" }}
            >
              Locirajte studio i planirajte dolazak.
            </h2>
            <p className="max-w-md text-[0.88rem] leading-relaxed text-[var(--muted)]">
              Ako dolazite prvi put, napisite u poruci da ste nova klijentkinja
              i dobijate smernice za najbrzi dolazak.
            </p>
            <iframe
              title="Studio Lady Gaga mapa"
              src="https://www.google.com/maps?q=Trg%20%C4%91a%C4%8Dkog%20bataljona%2C%20%C5%A0abac&output=embed"
              loading="lazy"
              className="aspect-[16/10] w-full rounded-2xl border-0 shadow-sm"
            />
          </div>
        </article>

        {/* Form */}
        <form
          onSubmit={submit}
          className="relative z-20 overflow-hidden rounded-[2rem] border border-white/50 bg-white/[0.45] p-7 shadow-2xl shadow-black/[0.06] backdrop-blur-lg dark:border-white/[0.1] dark:bg-neutral-900/[0.4] dark:shadow-[0_24px_50px_-16px_rgba(0,0,0,0.6)] sm:p-9 md:p-10 lg:-ml-8 lg:mt-14"
        >
          <span
            className="pointer-events-none absolute right-3 -top-1 select-none text-[5.5rem] leading-none tracking-tight opacity-[0.035] dark:opacity-[0.06]"
            style={{ fontFamily: "var(--serif-font)" }}
            aria-hidden="true"
          >
            FORMA
          </span>

          <div className="relative space-y-6">
            <div className="space-y-2">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.28em] text-[var(--accent)]">
                Kontakt forma
              </p>
              <h2
                className="text-[clamp(1.3rem,2.8vw,1.9rem)] font-medium leading-[1.14] text-[var(--text)]"
                style={{ fontFamily: "var(--serif-font)" }}
              >
                {t.contact.form}
              </h2>
              <p className="text-[0.86rem] text-[var(--muted)]">
                U poruci navedite kratko stanje kose i zelju koju imate.
              </p>
            </div>

            {status === "sent" && (
              <div className="rounded-xl border border-emerald-300/40 bg-emerald-50/50 p-4 dark:border-emerald-800/30 dark:bg-emerald-950/25">
                <p className="text-[0.86rem] text-emerald-700 dark:text-emerald-300">
                  {statusMessage}
                </p>
              </div>
            )}
            {status === "error" && (
              <div className="rounded-xl border border-red-300/40 bg-red-50/50 p-4 dark:border-red-800/30 dark:bg-red-950/25">
                <p className="text-[0.86rem] text-red-600 dark:text-red-300">
                  {statusMessage}
                </p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"
                >
                  {t.contact.name}
                </label>
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
                  className="w-full border-b border-[var(--border)] bg-transparent pb-3 pt-1 text-[var(--text)] transition-colors duration-300 placeholder:opacity-40 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"
                >
                  {t.contact.email}
                </label>
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
                  className="w-full border-b border-[var(--border)] bg-transparent pb-3 pt-1 text-[var(--text)] transition-colors duration-300 placeholder:opacity-40 focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--muted)]"
                >
                  {t.contact.message}
                </label>
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
                  className="min-h-[130px] w-full resize-vertical rounded-xl border border-white/30 bg-white/[0.18] p-4 text-[var(--text)] transition-colors duration-300 placeholder:opacity-40 focus:border-[var(--accent)] focus:outline-none dark:border-white/[0.08] dark:bg-white/[0.05]"
                />
              </div>
            </div>

            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/25 bg-white/[0.15] p-3.5 transition-colors hover:bg-white/[0.25] dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              htmlFor="contact-legal-consent"
            >
              <input
                id="contact-legal-consent"
                type="checkbox"
                required
                checked={legalAccepted}
                onChange={(event) => setLegalAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="text-[0.76rem] leading-relaxed text-[var(--muted)]">
                Potvrdjujem da sam procitala i prihvatam{" "}
                <Link
                  href="/politika-privatnosti"
                  className="font-medium text-[var(--accent)] underline underline-offset-2"
                >
                  Politiku privatnosti
                </Link>{" "}
                i{" "}
                <Link
                  href="/pravila-koriscenja"
                  className="font-medium text-[var(--accent)] underline underline-offset-2"
                >
                  Pravila koriscenja
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={status === "sending" || !legalAccepted}
              className="editorial-contact-submit w-full rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-strong)] px-6 py-3.5 text-[0.92rem] font-semibold text-white shadow-lg shadow-amber-800/15 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg dark:shadow-black/30"
            >
              {status === "sending" ? "Slanje..." : t.contact.submit}
            </button>

            <p className="text-center text-[0.78rem] text-[var(--muted)]">
              Za brzu kupovinu preporucenih artikala otvorite{" "}
              <Link
                href="/proizvodi"
                className="font-semibold text-[var(--accent)] underline underline-offset-2"
              >
                stranicu proizvoda
              </Link>
              .
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
