"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PremiumTreatmentShowcase } from "@/components/premium-treatment-showcase";
import { founderStory, qualityPillars, studioGallery } from "@/lib/studio-content";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Handbag,
  MessageCircle,
  PackageSearch,
  Palette,
  Scissors,
  SendHorizontal,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Award,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

type HomeProduct = {
  _id: string;
  title: string;
  subtitle: string;
  stock: number;
  price: number;
  discount: number;
  recommended: boolean;
  finalPrice: number;
  categoryName: string;
  image: string;
};

type HomeCategorySlider = {
  categoryId: string;
  categoryName: string;
  products: HomeProduct[];
};

type HomeSnapshot = {
  catalogCount: number;
  inStockCount: number;
  topCategories: Array<{
    categoryId: string;
    name: string;
    count: number;
  }>;
  featuredProducts: HomeProduct[];
  sidebarProducts: HomeProduct[];
  featuredCategorySliders: HomeCategorySlider[];
};

type HeroFeatureCard = {
  label: string;
  heroTitle: readonly string[];
  description: string;
  cta: string;
  href: string;
  image: string;
  alt: string;
  variant: "salon" | "shop";
};

const EMPTY_SNAPSHOT: HomeSnapshot = {
  catalogCount: 0,
  inStockCount: 0,
  topCategories: [],
  featuredProducts: [],
  sidebarProducts: [],
  featuredCategorySliders: [],
};

const HERO_FEATURE_CARDS = [
  {
    label: "Frizerski salon",
    heroTitle: ["Šišanje,", "koloracije", "i tretmani"],
    description:
      "Profesionalna nega za oštećenu, blajhanu i zahtevnu kosu, uz individualan pristup svakom tipu vlasi.",
    cta: "Zakaži termin",
    href: "/kontakt",
    image: "/slike/gaga/1.avif",
    alt: "Rad u frizerskom salonu Studio Lady Gaga",
    variant: "salon",
    title: "Oštećena i blajhana kosa",
    text: "Intenzivna obnova uz pažljivo očuvanje kvaliteta vlasi.",
  },
  {
    label: "Ponuda proizvoda",
    heroTitle: ["Proizvodi", "za negu i", "održavanje"],
    description:
      "Šamponi, maske, tretmani i profesionalna nega za kućnu upotrebu i dugotrajan rezultat.",
    cta: "Proizvodi za negu",
    href: "/proizvodi",
    image: "/slike/gaga/2.avif",
    alt: "Premium proizvodi za negu i održavanje kose",
    variant: "shop",
    title: "Koloracije i korekcije boje",
    text: "Precizno birane nijanse bez neželjenih tonova.",
  },
  {
    Icon: Sparkles,
    title: "Keratin tretmani",
    text: "Glatkoća, sjaj i lakše održavanje tokom svakog dana.",
  },
  {
    Icon: Droplets,
    title: "Dubinska nega i oporavak",
    text: "Plan nege koji odgovara realnom stanju vaše kose.",
  },
  {
    Icon: Scissors,
    title: "Svečane i dnevne frizure",
    text: "Glam završnica i postojan oblik za svaku priliku.",
  },
  {
    Icon: MessageCircle,
    title: "Konsultacija i rutina",
    text: "Jasan plan održavanja rezultata i nakon tretmana.",
  },
] as const;

const HERO_SERVICE_CARDS = [
  {
    Icon: ShieldCheck,
    title: "Oštećena i blajhana kosa",
    text: "Intenzivna obnova uz pažljivo očuvanje kvaliteta vlasi.",
  },
  {
    Icon: Palette,
    title: "Koloracije i korekcije boje",
    text: "Precizno birane nijanse bez neželjenih tonova.",
  },
  {
    Icon: Sparkles,
    title: "Keratin tretmani",
    text: "Glatkoća, sjaj i lakše održavanje tokom svakog dana.",
  },
  {
    Icon: Droplets,
    title: "Dubinska nega i oporavak",
    text: "Plan nege koji odgovara realnom stanju vaše kose.",
  },
  {
    Icon: Scissors,
    title: "Svečane i dnevne frizure",
    text: "Glam završnica i postojan oblik za svaku priliku.",
  },
  {
    Icon: MessageCircle,
    title: "Konsultacija i rutina",
    text: "Jasan plan održavanja rezultata i nakon tretmana.",
  },
] as const;

const HOME_BEFORE_AFTER_EXAMPLES = [
  {
    before: "/slike/pre-1.avif",
    after: "/slike/posle-1.avif",
  },
  {
    before: "/slike/pre-2.avif",
    after: "/slike/posle-2.avif",
  },
] as const;

export default function HomePage() {
  const snapshot = (useQuery(api.products.homeSnapshot, {}) as HomeSnapshot | undefined) ?? EMPTY_SNAPSHOT;
  const { featuredProducts, featuredCategorySliders, sidebarProducts } = snapshot;
  const sidebarDisplayProducts = sidebarProducts;
  const sliderSections = featuredCategorySliders.length > 0
    ? featuredCategorySliders
    : featuredProducts.length > 0
      ? [{ categoryId: "featured-fallback", categoryName: "Preporučeni proizvodi", products: featuredProducts }]
      : [];
  const heroFeatureCards = HERO_FEATURE_CARDS.slice(0, 2) as unknown as HeroFeatureCard[];

  return (
    <div className="page-grid home-page xeno-home">
      <section className="home-panel home-reveal xeno-hero" aria-labelledby="home-hero-heading">
        <div className="xeno-hero-bg" aria-hidden="true" />

        <div className="xeno-hero-portrait">
          <Image
            src="/slike/gaga/gaga.avif"
            alt=""
            aria-hidden="true"
            width={880}
            height={1100}
            sizes="(max-width: 980px) 0px, 34vw"
            loading="eager"
            className="xeno-hero-portrait-img"
          />
        </div>

        <div className="xeno-hero-header">
          <figure className="xeno-hero-portrait-mobile" aria-hidden="true">
            <Image
              src="/slike/gaga/gaga.avif"
              alt=""
              width={400}
              height={500}
              sizes="44vw"
              loading="eager"
            />
          </figure>

          <h1 id="home-hero-heading">
            Lepota i potpuna transformacija kose na jednom mestu.
          </h1>
          <p className="xeno-hero-subtitle">
            Iza studija stoji dugogodišnja posvećenost vrhunskoj nezi kose, preciznost u radu i pažnja prema svakom detalju.
          </p>
          <p className="xeno-hero-subtitle xeno-hero-subtitle-secondary">
            Specijalizovana sam za regeneraciju oštećene kose, zahtevne koloracije, kao i glamurozne frizure koje ističu prirodnu lepotu i stil svake žene.
          </p>
          <p className="xeno-hero-subtitle xeno-hero-subtitle-secondary">
            U studiju Lady Gaga No. 1 svaki klijent dobija individualni pristup, profesionalne tretmane i rezultat koji spaja zdravu kosu i savršenu estetiku.
          </p>
        </div>

        <div className="xeno-hero-card-grid" aria-label="Glavne opcije studija">
          {heroFeatureCards.map((card) => (
            <article
              key={card.label}
              className={`xeno-hero-feature-card ${card.variant === "salon" ? "is-salon" : "is-shop"}`}
            >
              <div className="xeno-hero-feature-copy">
                <p className="xeno-hero-feature-chip">{card.label}</p>
                <h2>
                  {card.heroTitle.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h2>
                <p>{card.description}</p>
                <Link
                  href={card.href}
                  className={`xeno-hero-card-action ${card.variant === "salon" ? "is-salon-action" : "is-shop-action"}`}
                >
                  {card.cta}
                  {card.variant === "shop" && <Handbag size={16} strokeWidth={2} />}
                </Link>
              </div>

              <div className="xeno-hero-feature-media">
                <div className="xeno-hero-feature-media-shell">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 760px) 100vw, (max-width: 980px) 50vw, 23vw"
                    className="xeno-hero-feature-image"
                    loading="lazy"
                  />
                </div>
              </div>
            </article>
          ))}

          <div className="xeno-hero-delivery-banner">
            <Zap className="xeno-hero-delivery-icon" aria-hidden="true" />
            <span className="xeno-hero-delivery-text">Dostava za <strong>48h</strong> na teritoriji Srbije</span>
            <Image
              src="/serbia-flag.png"
              alt="Zastava Srbije"
              width={28}
              height={18}
              className="xeno-hero-delivery-flag"
            />
          </div>
        </div>
      </section>

      <section className="home-panel home-reveal xeno-hero-services-section">
        <div className="xeno-hero-services-grid">
          {HERO_SERVICE_CARDS.map((card, i) => {
            const Icon = card.Icon;
            return (
              <article
                key={card.title}
                className="xeno-hero-service-card"
                style={{ "--card-i": i } as React.CSSProperties}
              >
                <span className="xeno-hero-service-icon" aria-hidden="true">
                  <Icon />
                </span>
                <div className="xeno-hero-service-content">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
                <span className="xeno-hero-service-arrow" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 13L13 5M13 5H6M13 5V12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </article>
            );
          })}
        </div>
      </section>

      <PremiumTreatmentShowcase />

      <section className="xeno-after-hero home-reveal">
        <div className="xeno-main-column">
          <section className="home-panel home-reveal xeno-story">
            <div className="xeno-story-copy">
              <div className="home-section-head xeno-story-head">
                <div className="home-kicker home-kicker-row">
                  <Sparkles className="home-kicker-glyph" aria-hidden="true" />
                  <span>Vizija studija</span>
                </div>
                <h2>Svaki tretman je osmišljen da kosa izgleda luksuzno odmah, a rezultat ostane stabilan i dugotrajan.</h2>
              </div>

              {founderStory.slice(2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <div className="xeno-story-highlights" aria-label="Glavni principi rada">
                <span>Personalizovan plan</span>
                <span>Premium preparati</span>
                <span>Dugotrajan rezultat</span>
              </div>
            </div>

            <div className="xeno-story-media">
              <Image
                src="/slike/gaga/3.avif"
                alt={studioGallery[1].alt}
                width={900}
                height={900}
                sizes="(max-width: 980px) 100vw, 36vw"
                loading="lazy"
              />
            </div>
          </section>

          <section className="home-panel home-reveal xeno-pillars">
            <div className="home-section-head">
              <p className="home-kicker home-kicker-row">
                <ShieldCheck className="home-kicker-glyph" aria-hidden="true" />
                <span>Studio standard</span>
              </p>
              <h2>Preciznost, bezbednost i personalizovan plan za svaku klijentkinju.</h2>
            </div>

            <div className="xeno-pillar-grid">
              {qualityPillars.map((pillar) => (
                <article key={pillar.title} className="xeno-pillar-card" data-cosmic-tilt style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <h3 style={{ color: '#9b7c68', minHeight: '25%', display: 'flex', alignItems: 'start' }}>{pillar.title}</h3>
                  <p style={{ height: '75%', display: 'flex', justifyContent: 'start' }}>{pillar.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="home-panel home-reveal xeno-bestworks-section">
            <div className="xeno-section-head xeno-bestworks-head">
              <div className="home-section-head">
                <p className="home-kicker home-kicker-row">
                  <Award className="home-kicker-glyph" aria-hidden="true" />
                  <span>Pre i posle</span>
                </p>
                <h2>Od studija do vidljive razlike.</h2>
              </div>
            </div>

            <div className="xeno-bestworks-layout">
              <article className="xeno-bestworks-studio" data-cosmic-tilt>
                <p className="xeno-before-after-title">Studio</p>
                <div className="xeno-bestworks-card xeno-bestworks-single">
                  <div className="xeno-bestworks-media">
                    <Image
                      src="/slike/o-nama-slika.avif"
                      alt="Fotografija iz studija Lady Gaga"
                      width={1200}
                      height={900}
                      sizes="(max-width: 760px) 100vw, 30vw"
                      loading="lazy"
                    />
                  </div>
                  <p className="xeno-bestworks-label">Ambijent</p>
                </div>
              </article>

              <div className="xeno-before-after-stack">
                {HOME_BEFORE_AFTER_EXAMPLES.map((example, index) => (
                  <article key={example.before} className="xeno-before-after-example" data-cosmic-tilt>
                    <div className="xeno-before-after-topline">
                      <p className="xeno-before-after-title">Primer {String(index + 1).padStart(2, "0")}</p>
                      <span>Pre i posle</span>
                    </div>

                    <div className="xeno-before-after-grid">
                      <article className="xeno-bestworks-card xeno-bestworks-compare is-before">
                        <div className="xeno-bestworks-media">
                          <Image
                            src={example.before}
                            alt={`Pre tretmana ${index + 1}`}
                            width={600}
                            height={750}
                            sizes="(max-width: 760px) 100vw, 26vw"
                            loading="lazy"
                          />
                        </div>
                        <p className="xeno-bestworks-label">Pre</p>
                      </article>

                      <div className="xeno-before-after-divider" aria-hidden="true">
                        <span>→</span>
                      </div>

                      <article className="xeno-bestworks-card xeno-bestworks-compare is-after">
                        <div className="xeno-bestworks-media">
                          <Image
                            src={example.after}
                            alt={`Posle tretmana ${index + 1}`}
                            width={600}
                            height={750}
                            sizes="(max-width: 760px) 100vw, 26vw"
                            loading="lazy"
                          />
                        </div>
                        <p className="xeno-bestworks-label">Posle</p>
                      </article>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>


          <section className="home-panel home-reveal xeno-products">
            <div className="xeno-section-head">
              <div className="home-section-head">
                <p className="home-kicker home-kicker-row">
                  <ShoppingBag className="home-kicker-glyph" aria-hidden="true" />
                  <span>Istaknute kategorije</span>
                </p>
                <h2>Istaknute kategorije koje klijentkinje najviše biraju za kućnu negu.</h2>
              </div>
              <Link href="/proizvodi" className="ghost-btn home-second-action">
                Kompletna ponuda
              </Link>
            </div>

            {sliderSections.length === 0 ? (
              <p className="home-empty">Nova selekcija proizvoda će biti aktivirana uskoro.</p>
            ) : (
              <div className="xeno-category-slider-stack">
                {sliderSections.map((slider) => (
                  <FeaturedCategorySlider key={slider.categoryId} categoryName={slider.categoryName} products={slider.products} />
                ))}
              </div>
            )}
          </section>

          <section style={{ display: 'flex', flexDirection: 'column' }} className="home-panel home-reveal xeno-final-cta">
            <div>
              <p className="home-kicker home-kicker-row">
                <SendHorizontal className="home-kicker-glyph" aria-hidden="true" />
                <span>Sledeći korak</span>
              </p>
              <h2>Pošaljite inspiraciju, a mi vraćamo jasan plan tretmana i preporuku proizvoda.</h2>
              <p>
                Cilj je rezultat koji izgleda odlično odmah, ali i ostaje stabilan tokom narednih nedelja.
              </p>
            </div>

            <div className="home-hero-actions">
              <Link href="/kontakt" className="primary-btn home-main-action">
                Kontakt i rezervacija
              </Link>
              <Link href="/o-nama" className="ghost-btn home-second-action">
                Upoznaj studio
              </Link>
            </div>
          </section>
        </div>

        <aside className="xeno-sidebar-column">
          <article className="home-panel xeno-sidebar-products-card xeno-sidebar-sticky">
            <p className="home-kicker home-kicker-row">
              <PackageSearch className="home-kicker-glyph" aria-hidden="true" />
              <span>Naša preporuka</span>
            </p>

            {sidebarDisplayProducts.length === 0 ? (
              <p className="home-empty">Trenutno nema preporučenih proizvoda.</p>
            ) : (
              <div className="xeno-sidebar-products-scroll">
                {sidebarDisplayProducts.map((product) => (
                  <Link key={product._id} href={`/proizvodi/${product._id}`} className="xeno-sidebar-product">
                    <Image src={product.image || "/logo.png"} alt={product.title} width={164} height={164} />
                    <div className="xeno-sidebar-product-body">
                      <h3>{product.title}</h3>
                      <p>{formatRsd(product.finalPrice)}</p>
                      <span>{product.stock > 0 ? `${product.stock} kom` : "Rasprodato"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href="/proizvodi" className="primary-btn">
              Pogledaj sve proizvode
            </Link>
          </article>
        </aside>
      </section>

    </div>
  );
}

function FeaturedCategorySlider({
  categoryName,
  products,
}: {
  categoryName: string;
  products: HomeProduct[];
}) {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(products.length > 1);
  const sliderId = useId();
  const [rail, setRail] = useState<HTMLDivElement | null>(null);

  const updateScrollState = useCallback(() => {
    if (!rail) return;
    const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
    setCanScrollPrev(rail.scrollLeft > 4);
    setCanScrollNext(rail.scrollLeft < maxScrollLeft - 4);
  }, [rail]);

  useEffect(() => {
    if (!rail) return;
    const frame = window.requestAnimationFrame(() => updateScrollState());
    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [products.length, rail, updateScrollState]);

  const scrollRail = (direction: -1 | 1) => {
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>(".xeno-slider-card");
    const gapValue = window.getComputedStyle(rail).columnGap || window.getComputedStyle(rail).gap || "0";
    const gap = Number.parseFloat(gapValue);
    const step = card ? card.getBoundingClientRect().width + (Number.isFinite(gap) ? gap : 0) : rail.clientWidth * 0.8;
    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  return (
    <section className="xeno-category-slider-block">
      <div className="xeno-category-slider-head">
        <div className="xeno-category-slider-title-wrap">
          <h3>{categoryName}</h3>
          <p>{products.length} proizvoda · prevuci ili koristi strelice</p>
        </div>
      </div>

      <div className="xeno-category-slider-stage">
        <button
          type="button"
          className="xeno-category-slider-arrow xeno-category-slider-arrow-side"
          aria-label={`Prethodni proizvodi za kategoriju ${categoryName}`}
          aria-controls={sliderId}
          disabled={!canScrollPrev}
          onClick={() => scrollRail(-1)}
        >
          <ChevronLeft />
        </button>

        <div id={sliderId} className="xeno-category-slider-rail" ref={setRail}>
          {products.map((product) => (
            <Link key={product._id} href={`/proizvodi/${product._id}`} className="xeno-slider-card" data-cosmic-tilt>
              <div className="xeno-slider-card-media">
                <Image
                  src={product.image || "/logo.png"}
                  alt={product.title}
                  width={640}
                  height={640}
                  sizes="(max-width: 760px) 66vw, (max-width: 1080px) 38vw, (max-width: 1280px) 28vw, 22vw"
                  loading="lazy"
                />
                {product.discount > 0 ? <span className="home-product-discount">-{product.discount}%</span> : null}
                {product.recommended ? <span className="xeno-slider-recommend-pill">Preporuka</span> : null}
              </div>

              <div className="xeno-slider-card-body">
                <p className="home-product-category">{product.categoryName}</p>
                <h4>{product.title}</h4>
                <p>{product.subtitle}</p>
                <div className="home-product-price">
                  <strong>{formatRsd(product.finalPrice)}</strong>
                  {product.discount > 0 ? <span>{formatRsd(product.price)}</span> : null}
                </div>
                <div className="home-product-footer">
                  <span className={`home-stock-pill ${product.stock <= 0 ? "out" : product.stock <= 5 ? "low" : ""}`}>
                    {product.stock > 0 ? `${product.stock} kom na stanju` : "Rasprodato"}
                  </span>
                  <span className="home-product-link">Pogledaj</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="xeno-category-slider-arrow xeno-category-slider-arrow-side"
          aria-label={`Sledeći proizvodi za kategoriju ${categoryName}`}
          aria-controls={sliderId}
          disabled={!canScrollNext}
          onClick={() => scrollRail(1)}
        >
          <ChevronRight />
        </button>
      </div>
          </section>
  );
}

function formatRsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 RSD";
  return `${value.toLocaleString("sr-RS")} RSD`;
}


