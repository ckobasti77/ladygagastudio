"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { founderStory, milkShakeTreatments, qualityPillars, studioGallery, studioVideos } from "@/lib/studio-content";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Gem,
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

const EMPTY_SNAPSHOT: HomeSnapshot = {
  catalogCount: 0,
  inStockCount: 0,
  topCategories: [],
  featuredProducts: [],
  sidebarProducts: [],
  featuredCategorySliders: [],
};

const EMPTY_MEDIA: GalleryMedia[] = [];

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

export default function HomePage() {
  const snapshot = (useQuery(api.products.homeSnapshot, {}) as HomeSnapshot | undefined) ?? EMPTY_SNAPSHOT;
  const rawGalleryMedia = useQuery(api.gallery.list, {}) as GalleryMedia[] | undefined;
  const galleryMedia = rawGalleryMedia ?? EMPTY_MEDIA;

  const { topCategories, featuredProducts, featuredCategorySliders, sidebarProducts } = snapshot;

  const galleryImages = useMemo(() => galleryMedia.filter((item) => item.kind === "image"), [galleryMedia]);
  const galleryVideos = useMemo(() => galleryMedia.filter((item) => item.kind === "video"), [galleryMedia]);

  const heroPoster = galleryImages[0]?.url ?? studioGallery[0].src;
  const heroVideo = galleryVideos[0]?.url ?? studioVideos[0].src;
  const heroVideoType = galleryVideos[0]?.contentType || "video/webm";

  const featuredImages = useMemo(() => galleryImages.slice(0, 8), [galleryImages]);
  const featuredVideos = useMemo(() => galleryVideos.slice(0, 3), [galleryVideos]);
  const sidebarDisplayProducts = sidebarProducts;
  const sliderSections = featuredCategorySliders.length > 0
    ? featuredCategorySliders
    : featuredProducts.length > 0
      ? [{ categoryId: "featured-fallback", categoryName: "Preporučeni proizvodi", products: featuredProducts }]
      : [];

  const [homeLightboxIndex, setHomeLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (homeLightboxIndex === null) return;
    if (featuredImages.length === 0) {
      setHomeLightboxIndex(null);
      return;
    }
    if (homeLightboxIndex >= featuredImages.length) {
      setHomeLightboxIndex(0);
    }
  }, [featuredImages, homeLightboxIndex]);

  useEffect(() => {
    if (homeLightboxIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [homeLightboxIndex]);

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

  useEffect(() => {
    if (homeLightboxIndex === null) return;
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
  }, [closeHomeLightbox, homeLightboxIndex, nextHomeMedia, previousHomeMedia]);

  const activeHomeLightboxMedia = useMemo(() => {
    if (homeLightboxIndex === null) return null;
    return featuredImages[homeLightboxIndex] ?? null;
  }, [featuredImages, homeLightboxIndex]);

  const onHomeGalleryCardKeyDown = (event: ReactKeyboardEvent<HTMLElement>, index: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openHomeLightbox(index);
  };

  return (
    <div className="page-grid home-page xeno-home">
      <section className="home-panel home-reveal xeno-hero">
        <div className="xeno-hero-backdrop" aria-hidden>
          <video className="xeno-hero-video" autoPlay muted loop playsInline preload="metadata" poster={heroPoster}>
            <source src={heroVideo} type={heroVideoType} />
          </video>
          <div className="xeno-hero-overlay" />
        </div>

        <div className="xeno-hero-grid">
          <div className="xeno-hero-copy">
            <p className="home-kicker home-kicker-row">
              <Gem className="home-kicker-glyph" aria-hidden="true" />
              <span>Studio Lady Gaga</span>
            </p>
            <h1>Lepota, zdravlje i transformacija kose na jednom mestu.</h1>
            <p className="home-lead">Iza studija Lady Gaga stoji dugogodišnja posvećenost lepoti, detaljima i profesionalnoj nezi kose.</p>
            <p className="home-lead">{founderStory[1]}</p>

            <div className="home-hero-actions">
              <Link href="/kontakt" className="primary-btn home-main-action">
                Zakaži termin
              </Link>
              <Link href="/proizvodi" className="ghost-btn home-second-action">
                Pogledaj proizvode
              </Link>
            </div>

            <figure className="xeno-hero-owner-mobile">
              <Image
                src="/gaga.png"
                alt="Dragana, vlasnica studija Lady Gaga"
                className="xeno-hero-gaga-image"
                width={880}
                height={1100}
                sizes="(max-width: 760px) 76vw, 0px"
                priority
              />
            </figure>
          </div>

          <div className="xeno-hero-owner-desktop">
            <figure>
              <Image
                src="/gaga.png"
                alt="Dragana, vlasnica studija Lady Gaga"
                className="xeno-hero-gaga-image"
                width={1000}
                height={1250}
                sizes="(max-width: 1080px) 74vw, 34vw"
                priority
              />
            </figure>
          </div>
        </div>
      </section>

      <section className="home-reveal xeno-hero-services" aria-label="Studio fokus">
        <div className="xeno-hero-service-grid">
          {HERO_SERVICE_CARDS.map((card) => {
            const Icon = card.Icon;
            return (
              <article key={card.title} className="xeno-hero-service-card">
                <span className="xeno-hero-service-icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
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
                <h2>Svaki detalj tretmana je planiran da rezultat izgleda luksuzno odmah i ostane zdrav dugoročno.</h2>
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
                  <span className="home-chip">Kategorije će biti prikazane kada dodate proizvode.</span>
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
                <article key={pillar.title} className="xeno-pillar-card">
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
                <h2>Najnovije fotografije iz galerije automatski se prikazuju na početnoj.</h2>
              </div>
              <Link href="/galerija" className="ghost-btn home-second-action">
                Otvori celu galeriju
              </Link>
            </div>

            {rawGalleryMedia === undefined ? (
              <p className="home-empty">Učitavanje galerije...</p>
            ) : featuredImages.length === 0 ? (
              <div className="empty-state xeno-empty">
                <h3>Trenutno nema slika u galeriji.</h3>
                <p>Dodajte slike preko admin galerije i odmah će se pojaviti na početnoj.</p>
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
                <h2>Video materijal iz galerije se ovde prikazuje odvojeno od slika.</h2>
              </div>
              <Link href="/galerija" className="ghost-btn home-second-action">
                Pogledaj sve snimke
              </Link>
            </div>

            {rawGalleryMedia === undefined ? (
              <p className="home-empty">Učitavanje snimaka...</p>
            ) : featuredVideos.length === 0 ? (
              <div className="empty-state xeno-empty">
                <h3>Trenutno nema snimaka u galeriji.</h3>
                <p>Dodajte snimke u galeriju i odmah će biti prikazani i ovde.</p>
              </div>
            ) : (
              <div className="xeno-video-grid">
                {featuredVideos.map((video) => (
                  <article key={video._id} className="xeno-video-card">
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
            <div className="home-section-head">
              <p className="home-kicker home-kicker-row">
                <Droplets className="home-kicker-glyph" aria-hidden="true" />
                <span>Milk Shake tretmani</span>
              </p>
              <h2>Program nege biramo prema tipu i stanju kose za zdrav i premium rezultat.</h2>
            </div>

            <div className="xeno-treatment-grid">
              {milkShakeTreatments.map((treatment) => (
                <article key={treatment.name} className="xeno-treatment-card">
                  <p className="xeno-treatment-badge">{treatment.benefit}</p>
                  <h3>{treatment.name}</h3>
                  <p>{treatment.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="home-panel home-reveal xeno-products">
            <div className="xeno-section-head">
              <div className="home-section-head">
                <p className="home-kicker home-kicker-row">
                  <ShoppingBag className="home-kicker-glyph" aria-hidden="true" />
                  <span>Istaknute kategorije</span>
                </p>
                <h2>Admin bira kategorije, a svaka dobija poseban horizontalni slider proizvoda.</h2>
              </div>
              <Link href="/proizvodi" className="ghost-btn home-second-action">
                Kompletna ponuda
              </Link>
            </div>

            {sliderSections.length === 0 ? (
              <p className="home-empty">Izaberite istaknute kategorije u admin panelu da se ovde pojave slideri.</p>
            ) : (
              <div className="xeno-category-slider-stack">
                {sliderSections.map((slider) => (
                  <FeaturedCategorySlider key={slider.categoryId} categoryName={slider.categoryName} products={slider.products} />
                ))}
              </div>
            )}
          </section>

          <section className="home-panel home-reveal xeno-final-cta">
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

      {activeHomeLightboxMedia && homeLightboxIndex !== null ? (
        <GalleryLightbox
          key={`${activeHomeLightboxMedia._id}:${homeLightboxIndex}`}
          media={activeHomeLightboxMedia}
          index={homeLightboxIndex}
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
    updateScrollState();
    const onScroll = () => updateScrollState();
    const onResize = () => updateScrollState();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
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
            <Link key={product._id} href={`/proizvodi/${product._id}`} className="xeno-slider-card">
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

function formatShortDate(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
