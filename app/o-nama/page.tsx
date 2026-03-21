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
  { label: "Zadovoljnih klijentkinja", value: "500+" },
  { label: "Specijalizacija", value: "Blajhana i oštećena kosa" },
  { label: "Rezultat", value: "Lep + zdrav + dugotrajan" },
] as const;

export default function AboutPage() {
  return (
    <div className="about-editorial">
      {/* ── Hero ── */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <p className="about-eyebrow">O studiju</p>
          <h1 className="about-hero-title">
            Prostor gde se lepota neguje kroz znanje, preciznost i sigurnost.
          </h1>
          <p className="about-hero-lead">
            {founderStory[0]} {founderStory[1]}
          </p>

          <div className="about-hero-actions">
            <Link href="/kontakt" className="about-btn-primary">
              Zakaži konsultaciju
            </Link>
            <Link href="/proizvodi" className="about-btn-ghost">
              Pogledaj proizvode
            </Link>
          </div>

          <div className="about-highlights">
            {studioHighlights.map((item) => (
              <div key={item.label} className="about-highlight-card">
                <span className="about-highlight-label">{item.label}</span>
                <strong className="about-highlight-value">{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder / Philosophy + Video ── */}
      <section className="about-founder">
        <div className="about-founder-inner">
          <div className="about-founder-text">
            <div className="about-glass-card about-founder-card">
              <p className="about-tag">Lični potpis</p>
              <h2 className="about-section-title">
                Svaka klijentkinja dobija plan koji odgovara baš njenoj kosi.
              </h2>
              <div className="about-founder-paragraphs">
                {founderStory.slice(2).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <blockquote className="about-quote">
                Lepota je više od izgleda. To je samopouzdanje koje nosiš sa
                sobom.
              </blockquote>
            </div>
          </div>

          <div className="about-founder-media">
            <div className="about-video-wrap">
              <video
                controls
                preload="metadata"
                playsInline
                poster={studioGallery[3].src}
              >
                <source src={studioVideos[1].src} type="video/webm" />
              </video>
              <p className="about-video-caption">Studio atmosfera</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quality Pillars ── */}
      <section className="about-pillars">
        <div className="about-pillars-inner">
          {qualityPillars.map((pillar, i) => (
            <div key={pillar.title} className="about-glass-card about-pillar-card">
              <span className="about-watermark" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="about-tag">Studio princip</p>
              <h2 className="about-pillar-title">{pillar.title}</h2>
              <p className="about-pillar-text">{pillar.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services ── */}
      <section className="about-services">
        <div className="about-services-inner">
          <div className="about-glass-card about-services-card">
            <p className="about-tag">Usluge</p>
            <h2 className="about-section-title">
              Tretmani kose, koloracije, keratin i frizure.
            </h2>
            <div className="about-chips">
              {studioServices.map((service) => (
                <span key={service} className="about-chip">
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Milk Shake Treatments ── */}
      <section className="about-treatments">
        <div className="about-treatments-inner">
          <div className="about-treatments-header">
            <p className="about-tag">Milk Shake protokoli</p>
            <h2 className="about-section-title">
              Profesionalni tretmani koje kombinujemo prema realnom stanju vlasi.
            </h2>
          </div>
          <div className="about-treatments-grid">
            {milkShakeTreatments.map((treatment, i) => (
              <div key={treatment.name} className="about-glass-card about-treatment-card">
                <span className="about-watermark about-watermark-sm" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="about-treatment-benefit">{treatment.benefit}</span>
                <h3 className="about-treatment-name">{treatment.name}</h3>
                <p className="about-treatment-desc">{treatment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="about-gallery">
        <div className="about-gallery-inner">
          <p className="about-tag">Transformacije</p>
          <h2 className="about-section-title">
            Detalji rada kroz fotografije iz studija.
          </h2>
          <div className="about-gallery-mosaic">
            {studioGallery.slice(4, 10).map((image) => (
              <figure key={image.src} className="about-gallery-figure">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={760}
                  height={950}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="about-cta">
        <div className="about-glass-card about-cta-card">
          <p className="about-tag">Dobrodošli</p>
          <h2 className="about-cta-title">
            Ovde se neguju kvalitet, sigurnost i transformacija.
          </h2>
          <p className="about-cta-text">
            Ako želiš da osvežiš boju, oporaviš kosu ili pripremiš novu
            frizuru, pošalji poruku i dobićeš jasan plan rada.
          </p>
          <div className="about-hero-actions">
            <Link href="/kontakt" className="about-btn-primary">
              Rezerviši termin
            </Link>
            <Link href="/proizvodi" className="about-btn-ghost">
              Aktiviraj kućnu negu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
