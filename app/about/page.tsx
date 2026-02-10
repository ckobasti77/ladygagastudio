"use client";

import Image from "next/image";
import Link from "next/link";
import {
  founderStory,
  milkShakeTreatments,
  qualityPillars,
  studioGallery,
  studioServices,
  studioVideos,
} from "@/lib/studio-content";

const studioHighlights = [
  { label: "Godina iskustva", value: "12+" },
  { label: "Specijalizacija", value: "Blajhana i ostecena kosa" },
  { label: "Rezultat", value: "Lep + zdrav + dugotrajan" },
] as const;

export default function AboutPage() {
  return (
    <section className="page-grid orbit-page about-orbit about-rebuild">
      <article className="orbit-hero orbit-reveal">
        <div className="orbit-hud" aria-hidden>
          <span>Founder Story</span>
          <strong>Dragana | Studio Lady Gaga no 1</strong>
        </div>

        <p className="orbit-eyebrow">O studiju</p>
        <h1>Prostor gde se lepota neguje kroz znanje, preciznost i sigurnost.</h1>
        <p className="orbit-lead">
          {founderStory[0]} {founderStory[1]}
        </p>

        <div className="orbit-actions">
          <Link href="/contact" className="primary-btn orbit-main-action">
            Zakazi konsultaciju
          </Link>
          <Link href="/products" className="ghost-btn orbit-second-action">
            Pogledaj proizvode
          </Link>
        </div>

        <div className="orbit-metric-row">
          {studioHighlights.map((item) => (
            <article key={item.label} className="orbit-metric">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </div>
      </article>

      <section className="orbit-split orbit-reveal about-founder-split">
        <article className="orbit-panel">
          <p className="orbit-panel-tag">Licni potpis</p>
          <h2>Svaka klijentkinja dobija plan koji odgovara bas njenoj kosi.</h2>
          <div className="about-founder-copy">
            {founderStory.slice(2).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="about-founder-note">
            Lepota je vise od izgleda. To je samopouzdanje koje nosis sa sobom.
          </p>
        </article>

        <article className="orbit-panel about-founder-media">
          <p className="orbit-panel-tag">Studio atmosfera</p>
          <Image src={studioGallery[2].src} alt={studioGallery[2].alt} width={920} height={920} sizes="(max-width: 1080px) 100vw, 34vw" />
          <video controls preload="metadata" playsInline poster={studioGallery[3].src}>
            <source src={studioVideos[1].src} type="video/webm" />
          </video>
        </article>
      </section>

      <section className="orbit-grid orbit-reveal">
        {qualityPillars.map((pillar) => (
          <article key={pillar.title} className="orbit-panel orbit-layer-card">
            <p className="orbit-panel-tag">Studio princip</p>
            <h2>{pillar.title}</h2>
            <p>{pillar.text}</p>
          </article>
        ))}
      </section>

      <section className="orbit-panel orbit-reveal about-service-board">
        <p className="orbit-panel-tag">Usluge</p>
        <h2>Tretmani kose, koloracije, keratin, sminka i frizure.</h2>
        <div className="about-service-chips">
          {studioServices.map((service) => (
            <span key={service} className="home-chip">
              {service}
            </span>
          ))}
        </div>
      </section>

      <section className="orbit-panel orbit-reveal about-treatment-board">
        <p className="orbit-panel-tag">Milk Shake protokoli</p>
        <h2>Profesionalni tretmani koje kombinujemo prema realnom stanju vlasi.</h2>
        <div className="about-treatment-grid">
          {milkShakeTreatments.map((treatment) => (
            <article key={treatment.name}>
              <p>{treatment.benefit}</p>
              <h3>{treatment.name}</h3>
              <span>{treatment.description}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="orbit-panel orbit-reveal about-gallery-wall">
        <p className="orbit-panel-tag">Transformacije</p>
        <h2>Detalji rada kroz fotografije iz studija.</h2>
        <div className="about-gallery-grid">
          {studioGallery.slice(4, 10).map((image) => (
            <figure key={image.src}>
              <Image src={image.src} alt={image.alt} width={760} height={760} sizes="(max-width: 760px) 50vw, 20vw" />
            </figure>
          ))}
        </div>
      </section>

      <section className="orbit-final orbit-reveal">
        <p className="orbit-panel-tag">Dobrodosli</p>
        <h2>Ovde se neguju kvalitet, sigurnost i transformacija.</h2>
        <p>
          Ako zelis da osvezis boju, oporavis kosu ili pripremis glam look, posalji poruku i dobices jasan plan rada.
        </p>
        <div className="orbit-actions">
          <Link href="/contact" className="primary-btn orbit-main-action">
            Rezervisi termin
          </Link>
          <Link href="/products" className="ghost-btn orbit-second-action">
            Aktiviraj kucnu negu
          </Link>
        </div>
      </section>
    </section>
  );
}
