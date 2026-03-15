"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { founderStory, milkShakeTreatments, qualityPillars, studioGallery } from "@/lib/studio-content";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Images,
  MessageCircle,
  PackageSearch,
  Palette,
  Scissors,
  SendHorizontal,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Video,
} from "lucide-react";
import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useId, useMemo, useState } from "react";

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

type GalleryMedia = {
  _id: string;
  url: string;
  originalName: string;
  contentType?: string;
  createdAt: number;
  kind: "image" | "video";
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

const EMPTY_MEDIA: GalleryMedia[] = [];

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
    title: "Oštecena i blajhana kosa",
    text: "Intenzivna obnova uz pažljivo ocuvanje kvaliteta vlasi.",
  },
  {
    label: "Shop proizvodi",
    heroTitle: ["Proizvodi", "za negu", "i održavanje"],
    description:
      "Šamponi, maske, tretmani i profesionalna nega za kućnu upotrebu i dugotrajan rezultat.",
    cta: "Pogledaj proizvode",
    href: "/proizvodi",
    image: "/slike/gaga/2.avif",
    alt: "Premium proizvodi za negu i odrzavanje kose",
    variant: "shop",
    title: "Koloracije i korekcije boje",
    text: "Precizno birane nijanse bez neželjenih tonova.",
  },
  {
    Icon: Sparkles,
    title: "Keratin tretmani",
    text: "Glatkoca, sjaj i lakše održavanje tokom svakog dana.",
  },
  {
    Icon: Droplets,
    title: "Dubinska nega i oporavak",
    text: "Plan nege koji odgovara realnom stanju vaše kose.",
  },
  {
    Icon: Scissors,
    title: "Svecane i dnevne frizure",
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
    title: "Oštecena i blajhana kosa",
    text: "Intenzivna obnova uz pažljivo ocuvanje kvaliteta vlasi.",
  },
  {
    Icon: Palette,
    title: "Koloracije i korekcije boje",
    text: "Precizno birane nijanse bez neželjenih tonova.",
  },
  {
    Icon: Sparkles,
    title: "Keratin tretmani",
    text: "Glatkoca, sjaj i lakše održavanje tokom svakog dana.",
  },
  {
    Icon: Droplets,
    title: "Dubinska nega i oporavak",
    text: "Plan nege koji odgovara realnom stanju vaše kose.",
  },
  {
    Icon: Scissors,
    title: "Svecane i dnevne frizure",
    text: "Glam završnica i postojan oblik za svaku priliku.",
  },
  {
    Icon: MessageCircle,
    title: "Konsultacija i rutina",
    text: "Jasan plan održavanja rezultata i nakon tretmana.",
  },
] as const;

export default function HomePage() {
  const snapshot = (useQuery(api.products.homeSnapshot, {}) as HomeSnapshot | undefined) ?? EMPTY_SNAPSHOT;
  const rawGalleryMedia = useQuery(api.gallery.list, {}) as GalleryMedia[] | undefined;
  const galleryMedia = rawGalleryMedia ?? EMPTY_MEDIA;

  const { topCategories, featuredProducts, featuredCategorySliders, sidebarProducts } = snapshot;

  const galleryImages = useMemo(() => galleryMedia.filter((item) => item.kind === "image"), [galleryMedia]);
  const galleryVideos = useMemo(() => galleryMedia.filter((item) => item.kind === "video"), [galleryMedia]);

  const featuredImages = useMemo(() => galleryImages.slice(0, 8), [galleryImages]);
  const featuredVideos = useMemo(() => galleryVideos.slice(0, 3), [galleryVideos]);
  const sidebarDisplayProducts = sidebarProducts;
  const sliderSections = featuredCategorySliders.length > 0
    ? featuredCategorySliders
    : featuredProducts.length > 0
      ? [{ categoryId: "featured-fallback", categoryName: "Preporuceni proizvodi", products: featuredProducts }]
      : [];
  const heroFeatureCards = HERO_FEATURE_CARDS.slice(0, 2) as unknown as HeroFeatureCard[];

  const [homeLightboxIndex, setHomeLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (homeLightboxIndex === null || featuredImages.length === 0) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [featuredImages.length, homeLightboxIndex]);

  const openHomeLightbox = useCallback(
    (index: number) => {
      if (index < 0 || index >= featuredImages.length) return;
      setHomeLightboxIndex(index);
    },
    [featuredImages.length],
  );

  const closeHomeLightbox = useCallback(() => setHomeLightboxIndex(null), []);

  const nextHomeMedia = useCallback(() => {
    setHomeLightboxIndex((current) => {
      if (current === null || featuredImages.length === 0) return null;
      return (current + 1) % featuredImages.length;
    });
  }, [featuredImages.length]);

  const previousHomeMedia = useCallback(() => {
    setHomeLightboxIndex((current) => {
      if (current === null || featuredImages.length === 0) return null;
      return (current - 1 + featuredImages.length) % featuredImages.length;
    });
  }, [featuredImages.length]);

  const activeHomeLightboxIndex = useMemo(() => {
    if (homeLightboxIndex === null || featuredImages.length === 0) return null;
    return ((homeLightboxIndex % featuredImages.length) + featuredImages.length) % featuredImages.length;
  }, [featuredImages.length, homeLightboxIndex]);

  const activeHomeLightboxMedia = useMemo(() => {
    if (activeHomeLightboxIndex === null) return null;
    return featuredImages[activeHomeLightboxIndex] ?? null;
  }, [activeHomeLightboxIndex, featuredImages]);

  useEffect(() => {
    if (activeHomeLightboxMedia === null) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeHomeLightbox();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextHomeMedia();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousHomeMedia();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeHomeLightboxMedia, closeHomeLightbox, nextHomeMedia, previousHomeMedia]);

  const onHomeGalleryCardKeyDown = (event: ReactKeyboardEvent<HTMLElement>, index: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openHomeLightbox(index);
  };

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
            Lepota, zdravlje i transformacija kose na jednom mestu.
          </h1>
          <p className="xeno-hero-subtitle">
            Iza studija Lady Gaga stoji dugogodišnja posvećenost lepoti, detaljima i
            profesionalnoj nezi kose.
          </p>
          <p className="xeno-hero-subtitle xeno-hero-subtitle-secondary">
            Specijalizovana sam za tretmane oštećene i blajhane kose, zahtevne
            koloracije i glam stil frizura.
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

      <section className="xeno-after-hero home-reveal">
        <div className="xeno-main-column">
          <section className="home-panel home-reveal xeno-story">
            <div className="xeno-story-copy">
              <div className="home-section-head">
                <p className="home-kicker home-kicker-row">
                  <Sparkles className="home-kicker-glyph" aria-hidden="true" />
                  <span>Vizija studija</span>
                </p>
                <h2>Svaki detalj tretmana je planiran da rezultat izgleda luksuzno odmah i ostane zdrav dugorocno.</h2>
              </div>

              {founderStory.slice(2).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              <div className="xeno-chip-row">
                {topCategories.length > 0 ? (
                  topCategories.map((category) => (
                    <span key={category.categoryId} className="home-chip">
                      {category.name} ({category.count})
                    </span>
                  ))
                ) : (
                  <span className="home-chip">Uskoro stize nova selekcija proizvoda.</span>
                )}
              </div>
            </div>

            <div className="xeno-story-media">
              <Image
                src={galleryImages[1]?.url ?? studioGallery[1].src}
                alt={galleryImages[1]?.originalName || studioGallery[1].alt}
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
                <article key={pillar.title} className="xeno-pillar-card" data-cosmic-tilt>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="home-panel home-reveal xeno-gallery-section">
            <div className="xeno-section-head">
              <div className="home-section-head">
                <p className="home-kicker home-kicker-row">
                  <Images className="home-kicker-glyph" aria-hidden="true" />
                  <span>Galerija uživo</span>
                </p>
                <h2>Najnovije transformacije iz studija, direktno sa realnih termina.</h2>
              </div>
              <Link href="/galerija" className="ghost-btn home-second-action">
                Otvori celu galeriju
              </Link>
            </div>

            {rawGalleryMedia === undefined ? (
              <p className="home-empty">Ucitavanje galerije...</p>
            ) : featuredImages.length === 0 ? (
              <div className="empty-state xeno-empty">
                <h3>Trenutno nema slika u galeriji.</h3>
                <p>Nova inspiracija i sveze transformacije uskoro stizu.</p>
              </div>
            ) : (
              <div className="xeno-gallery-grid">
                {featuredImages.map((image, index) => (
                  <article
                    key={image._id}
                    className="xeno-gallery-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => openHomeLightbox(index)}
                    onKeyDown={(event) => onHomeGalleryCardKeyDown(event, index)}
                    aria-label={`Otvori sliku ${index + 1} od ${featuredImages.length}`}
                    data-cosmic-tilt
                  >
                    <Image
                      src={image.url}
                      alt={image.originalName || "Fotografija iz galerije"}
                      width={900}
                      height={900}
                      sizes="(max-width: 760px) 50vw, (max-width: 1080px) 33vw, 25vw"
                      loading="lazy"
                    />
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="home-panel home-reveal xeno-video-section">
            <div className="xeno-section-head">
              <div className="home-section-head">
                <p className="home-kicker home-kicker-row">
                  <Video className="home-kicker-glyph" aria-hidden="true" />
                  <span>Snimci iz galerije</span>
                </p>
                <h2>Snimci koji prikazuju teksturu, sjaj i finalni finish u pokretu.</h2>
              </div>
              <Link href="/galerija" className="ghost-btn home-second-action">
                Pogledaj sve snimke
              </Link>
            </div>

            {rawGalleryMedia === undefined ? (
              <p className="home-empty">Ucitavanje snimaka...</p>
            ) : featuredVideos.length === 0 ? (
              <div className="empty-state xeno-empty">
                <h3>Trenutno nema snimaka u galeriji.</h3>
                <p>Novi video materijal iz studija uskoro ce biti objavljen.</p>
              </div>
            ) : (
              <div className="xeno-video-grid">
                {featuredVideos.map((video) => (
                  <article key={video._id} className="xeno-video-card" data-cosmic-tilt>
                    <video controls preload="metadata" playsInline muted>
                      <source src={video.url} type={video.contentType || "video/mp4"} />
                    </video>
                    <div>
                      <h3>{video.originalName || "Snimak iz studija"}</h3>
                      <p>{formatShortDate(video.createdAt)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>


          <section className="home-panel home-reveal xeno-treatments">
            <div className="xeno-treatment-hero">
              <p className="home-kicker home-kicker-row">
                <Droplets className="home-kicker-glyph" aria-hidden="true" />
                <span>Milk Shake tretmani</span>
              </p>
              <h2 className="xeno-treatment-title">Brutalna nega. Luksuzan finish.</h2>
              <p className="xeno-treatment-lead">3 ciljana protokola za sjaj, snagu i kontrolu frizza.</p>
              <div className="xeno-treatment-meta" aria-hidden="true">
                <span>
                  <Sparkles size={13} />
                  Signature rituali
                </span>
                <span>03 protokola</span>
                <span>100% personalizovano</span>
              </div>
            </div>
            <div className="xeno-treatment-grid xeno-treatment-grid-brutal">
              {milkShakeTreatments.map((treatment, i) => {
                const compactDescription =
                  treatment.description.length > 84 ? `${treatment.description.slice(0, 81).trim()}...` : treatment.description;

                return (
                  <article
                    key={treatment.name}
                    className="xeno-treatment-card xeno-treatment-card-clean"
                    style={{ "--t-i": i } as React.CSSProperties}
                  >
                    <div className="xeno-treatment-body">
                      <div className="xeno-treatment-topline">
                        <span className="xeno-treatment-num" aria-hidden="true">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3>{treatment.name}</h3>
                      </div>
                      <p className="xeno-treatment-copy">{compactDescription}</p>
                      <p className="xeno-treatment-badge xeno-treatment-badge-clean">
                        <Sparkles size={12} aria-hidden="true" />
                        <span>{treatment.benefit}</span>
                      </p>
                    </div>
                    <span className="xeno-treatment-line" aria-hidden="true" />
                  </article>
                );
              })}
            </div>
          </section>

          <section className="home-panel home-reveal xeno-products">
            <div className="xeno-section-head">
              <div className="home-section-head">
                <p className="home-kicker home-kicker-row">
                  <ShoppingBag className="home-kicker-glyph" aria-hidden="true" />
                  <span>Istaknute kategorije</span>
                </p>
                <h2>Istaknute kategorije koje klijentkinje najvise biraju za kucnu negu.</h2>
              </div>
              <Link href="/proizvodi" className="ghost-btn home-second-action">
                Kompletna ponuda
              </Link>
            </div>

            {sliderSections.length === 0 ? (
              <p className="home-empty">Nova selekcija proizvoda ce biti aktivirana uskoro.</p>
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
                <span>Sledeci korak</span>
              </p>
              <h2>Pošaljite inspiraciju, a mi vracamo jasan plan tretmana i preporuku proizvoda.</h2>
              <p>
                Cilj je rezultat koji izgleda odlicno odmah, ali i ostaje stabilan tokom narednih nedelja.
              </p>
            </div>

            <div className="home-hero-actions">
              <Link href="/kontakt" className="primary-btn home-main-action">
                Kontakt i rezervacija
              </Link>
              <Link href="/galerija" className="ghost-btn home-second-action">
                Galerija radova
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
              <p className="home-empty">Trenutno nema preporucenih proizvoda.</p>
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

      {activeHomeLightboxMedia && activeHomeLightboxIndex !== null ? (
        <GalleryLightbox
          key={`${activeHomeLightboxMedia._id}:${activeHomeLightboxIndex}`}
          media={activeHomeLightboxMedia}
          index={activeHomeLightboxIndex}
          total={featuredImages.length}
          onClose={closeHomeLightbox}
          onNext={nextHomeMedia}
          onPrevious={previousHomeMedia}
        />
      ) : null}
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
          aria-label={`Sledeci proizvodi za kategoriju ${categoryName}`}
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

function formatShortDate(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

