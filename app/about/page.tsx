"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

const missionLayers = [
  {
    title: "Signal dijagnostika",
    text: "Svaki tretman pocinje mapiranjem teksture, poroznosti i istorije bojenja da bismo dobili precizan plan.",
  },
  {
    title: "Color engineering",
    text: "Kombinujemo napredne tehnike bojenja sa zastitnim protokolima kako bi boja ostala cista i postojana.",
  },
  {
    title: "Post-salon algoritam",
    text: "Dobijas personalizovanu rutinu i tacno odabrane proizvode kako bi rezultat trajao i van salona.",
  },
] as const;

const timelineEvents = [
  {
    phase: "01 / Scan",
    description: "Ultra brza konsultacija i procena stanja kose pre prvog poteza.",
  },
  {
    phase: "02 / Sculpt",
    description: "Precizno sisanje, forma i volumen prilagodjeni tvom svakodnevnom ritmu.",
  },
  {
    phase: "03 / Sustain",
    description: "Ritual za kucnu negu koji cuva sjaj, boju i teksturu izmedju termina.",
  },
] as const;

const capsuleMetrics = [
  { label: "Godina iskustva", value: "12+" },
  { label: "Tretmana mesecno", value: "380" },
  { label: "Premium proizvoda", value: "57" },
] as const;

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <section className="page-grid orbit-page about-orbit">
      <article className="orbit-hero orbit-reveal">
        <div className="orbit-hud" aria-hidden>
          <span>Neural Beauty Lab</span>
          <strong>Studio Lady Gaga | Beograd</strong>
        </div>

        <p className="orbit-eyebrow">O nama</p>
        <h1>{t.about.title} iz sledece dimenzije lepote.</h1>
        <p className="orbit-lead">
          {t.about.text} Nas tim spaja salonski craft i laboratorijsku preciznost kako bi svaka promena bila
          moderna, nosiva i dugotrajna.
        </p>

        <div className="orbit-actions">
          <Link href="/contact" className="primary-btn orbit-main-action">
            Zakazi signal konsultaciju
          </Link>
          <Link href="/products" className="ghost-btn orbit-second-action">
            Pogledaj premium arsenal
          </Link>
        </div>

        <div className="orbit-metric-row">
          {capsuleMetrics.map((metric) => (
            <article key={metric.label} className="orbit-metric">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>
      </article>

      <section className="orbit-grid orbit-reveal">
        {missionLayers.map((layer, index) => (
          <article key={layer.title} className="orbit-panel orbit-layer-card">
            <p className="orbit-panel-tag">Layer 0{index + 1}</p>
            <h2>{layer.title}</h2>
            <p>{layer.text}</p>
          </article>
        ))}
      </section>

      <section className="orbit-split orbit-reveal">
        <article className="orbit-panel">
          <p className="orbit-panel-tag">Studio Manifest</p>
          <h2>Nas pristup je spoj estetike, discipline i tehnologije.</h2>
          <p>
            Ne radimo genericke tretmane. Svaki look gradimo kao personalizovan projekat kroz jasne faze, sa
            fokusom na zdravlje kose i dugotrajnu formu.
          </p>
          <div className="orbit-timeline">
            {timelineEvents.map((event) => (
              <article key={event.phase} className="orbit-timeline-item">
                <strong>{event.phase}</strong>
                <span>{event.description}</span>
              </article>
            ))}
          </div>
        </article>

        <article className="orbit-panel orbit-aside-panel">
          <p className="orbit-panel-tag">Signature Protocols</p>
          <h3>Sta nas izdvaja</h3>
          <ul className="orbit-list">
            <li>Mapiranje boje i teksture pre svakog hemijskog procesa.</li>
            <li>Balans volumena i forme koji traje i van prvog stylinga.</li>
            <li>Precizna preporuka proizvoda prema tempu tvog dana.</li>
            <li>Rezultati koji izgledaju premium i na kameri i uzivo.</li>
          </ul>
        </article>
      </section>

      <section className="orbit-final orbit-reveal">
        <p className="orbit-panel-tag">Next Orbit</p>
        <h2>Spremna za sledeci level stila?</h2>
        <p>
          Posalji nam ideju ili fotografiju inspiracije, a mi vracamo jasan plan tretmana i rutine za negu.
        </p>
        <div className="orbit-actions">
          <Link href="/contact" className="primary-btn orbit-main-action">
            Otvori kontakt stanicu
          </Link>
          <Link href="/products" className="ghost-btn orbit-second-action">
            Aktiviraj kucnu negu
          </Link>
        </div>
      </section>
    </section>
  );
}
