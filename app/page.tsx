"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { founderStory, milkShakeTreatments, qualityPillars, studioGallery, studioServices, studioVideos } from "@/lib/studio-content";
import { Droplets, Gem, Images, PackageSearch, SendHorizontal, ShieldCheck, ShoppingBag, Sparkles, Video } from "lucide-react";
import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";

type HomeSnapshot = {
  catalogCount: number;
  inStockCount: number;
  topCategories: Array<{
    categoryId: string;
    name: string;
    count: number;
  }>;
  featuredProducts: Array<{
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
  }>;
  sidebarProducts: Array<{
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
  }>;
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
};

const EMPTY_MEDIA: GalleryMedia[] = [];

export default function HomePage() {
  const snapshot = (useQuery(api.products.homeSnapshot, {}) as HomeSnapshot | undefined) ?? EMPTY_SNAPSHOT;
  const rawGalleryMedia = useQuery(api.gallery.list, {}) as GalleryMedia[] | undefined;
  const galleryMedia = rawGalleryMedia ?? EMPTY_MEDIA;

  const { inStockCount, topCategories, featuredProducts, sidebarProducts } = snapshot;

  const galleryImages = useMemo(() => galleryMedia.filter((item) => item.kind === "image"), [galleryMedia]);
  const galleryVideos = useMemo(() => galleryMedia.filter((item) => item.kind === "video"), [galleryMedia]);

  const heroPoster = galleryImages[0]?.url ?? studioGallery[0].src;
  const heroVideo = galleryVideos[0]?.url ?? studioVideos[0].src;
  const heroVideoType = galleryVideos[0]?.contentType || "video/webm";

  const featuredImages = useMemo(() => galleryImages.slice(0, 8), [galleryImages]);
  const featuredVideos = useMemo(() => galleryVideos.slice(0, 3), [galleryVideos]);
  const sidebarDisplayProducts = sidebarProducts;

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
            <p className="home-lead">{founderStory[0]}</p>
            <p className="home-lead">{founderStory[1]}</p>

            <div className="home-hero-actions">
              <Link href="/kontakt" className="primary-btn home-main-action">
                Zakaži termin
              </Link>
              <Link href="/proizvodi" className="ghost-btn home-second-action">
                Pogledaj proizvode
              </Link>
            </div>

            <div className="xeno-service-cloud">
              {studioServices.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </div>

          <div className="xeno-hero-metrics">
            <article>
              <strong>{inStockCount}</strong>
              <p className="home-card-label">Dostupnih proizvoda</p>
            </article>
            <article className="xeno-hero-focus-metric">
              <p className="home-card-label">Studio fokus</p>
              <strong>Oštećena i blajhana kosa</strong>
              <span>koloracije, keratin, šminka i frizure</span>
            </article>
          </div>
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
                  <span>Izdvojeni proizvodi</span>
                </p>
                <h2>Nakon tretmana preporučujemo proizvode za održavanje rezultata kod kuće.</h2>
              </div>
              <Link href="/proizvodi" className="ghost-btn home-second-action">
                Kompletna ponuda
              </Link>
            </div>

            {featuredProducts.length === 0 ? (
              <p className="home-empty">Učitavanje proizvoda...</p>
            ) : (
              <div className="xeno-product-grid">
                {featuredProducts.map((product) => (
                  <article key={product._id} className="xeno-product-card">
                    <div className="xeno-product-media">
                      <Image
                        src={product.image || "/logo.png"}
                        alt={product.title}
                        width={560}
                        height={560}
                        sizes="(max-width: 760px) 100vw, (max-width: 1080px) 50vw, 25vw"
                        loading="lazy"
                      />
                      {product.discount > 0 ? <span className="home-product-discount">-{product.discount}%</span> : null}
                    </div>

                    <div className="xeno-product-body">
                      <p className="home-product-category">{product.categoryName}</p>
                      <h3>{product.title}</h3>
                      <p>{product.subtitle}</p>
                      <div className="home-product-price">
                        <strong>{formatRsd(product.finalPrice)}</strong>
                        {product.discount > 0 ? <span>{formatRsd(product.price)}</span> : null}
                      </div>
                      <div className="home-product-footer">
                        <span className={`home-stock-pill ${product.stock <= 0 ? "out" : product.stock <= 5 ? "low" : ""}`}>
                          {product.stock > 0 ? `${product.stock} kom na stanju` : "Rasprodato"}
                        </span>
                        <Link href="/proizvodi" className="home-product-link">
                          Poruči
                        </Link>
                      </div>
                    </div>
                  </article>
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
