"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  founderStory,
  milkShakeTreatments,
  qualityPillars,
  studioGallery,
  studioServices,
  studioVideos,
} from "@/lib/studio-content";

type Product = {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  stock: number;
  discount?: number;
  categoryId: string;
  images?: string[];
};

type Category = {
  _id: string;
  name: string;
};

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

export default function HomePage() {
  const rawProducts = useQuery(api.products.list, {}) as Product[] | undefined;
  const rawCategories = useQuery(api.products.listCategories, {}) as Category[] | undefined;
  const products = rawProducts ?? EMPTY_PRODUCTS;
  const categories = rawCategories ?? EMPTY_CATEGORIES;

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category._id, category.name]));
  }, [categories]);

  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const discountDelta = (b.discount ?? 0) - (a.discount ?? 0);
        if (discountDelta !== 0) return discountDelta;
        return b.stock - a.stock;
      })
      .slice(0, 8);
  }, [products]);

  const sidebarProducts = useMemo(() => featuredProducts.slice(0, 4), [featuredProducts]);
  const catalogCount = products.length;
  const inStockCount = useMemo(() => products.filter((product) => product.stock > 0).length, [products]);
  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([categoryId, count]) => ({
        categoryId,
        name: categoryById.get(categoryId) ?? "Bez kategorije",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [products, categoryById]);

  return (
    <div className="page-grid home-page stellar-home">
      <section className="home-panel home-reveal stellar-hero">
        <div className="stellar-hero-media" aria-hidden>
          <video
            className="stellar-hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={studioGallery[0].src}
          >
            <source src={studioVideos[0].src} type="video/webm" />
          </video>
          <div className="stellar-hero-scrim" />
        </div>

        <div className="stellar-hero-copy">
          <p className="home-kicker">Studio Lady Gaga no 1</p>
          <h1>Lepota, zdravlje i transformacija kose na jednom mestu.</h1>
          <p className="home-lead">{founderStory[0]}</p>
          <p className="home-lead">{founderStory[1]}</p>

          <div className="home-hero-actions">
            <Link href="/contact" className="primary-btn home-main-action">
              Zakazi termin
            </Link>
            <Link href="/products" className="ghost-btn home-second-action">
              Pogledaj proizvode
            </Link>
          </div>

          <ul className="stellar-service-list">
            {studioServices.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

        <div className="stellar-hero-metrics">
          <article>
            <p className="home-card-label">Katalog</p>
            <strong>{catalogCount}</strong>
            <span>proizvoda u online ponudi</span>
          </article>
          <article>
            <p className="home-card-label">Dostupno odmah</p>
            <strong>{inStockCount}</strong>
            <span>artikala trenutno na stanju</span>
          </article>
          <article>
            <p className="home-card-label">Studio fokus</p>
            <strong>Ostecena i blajhana kosa</strong>
            <span>koloracije, keratin, sminka i frizure</span>
          </article>
        </div>
      </section>

      <section className="stellar-layout home-reveal">
        <div className="stellar-main-column">
          <article className="home-panel stellar-story-panel">
            <div className="home-section-head">
              <p className="home-kicker">O Dragani</p>
              <h2>Posvecenost detaljima i profesionalnoj nezi je osnova svakog rezultata.</h2>
            </div>
            <div className="stellar-story-grid">
              <div className="stellar-story-copy">
                {founderStory.slice(2).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <div className="stellar-story-media">
                <Image
                  src={studioGallery[1].src}
                  alt={studioGallery[1].alt}
                  width={860}
                  height={860}
                  sizes="(max-width: 960px) 100vw, 35vw"
                />
              </div>
            </div>
          </article>

          <section className="home-panel stellar-pillars">
            <div className="home-section-head">
              <p className="home-kicker">Studio standard</p>
              <h2>Prostor gde se neguju kvalitet, sigurnost i dugotrajna promena.</h2>
            </div>
            <div className="stellar-pillar-grid">
              {qualityPillars.map((pillar) => (
                <article key={pillar.title} className="stellar-pillar-card">
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="home-panel stellar-treatments">
            <div className="home-section-head">
              <p className="home-kicker">Milk Shake tretmani</p>
              <h2>Programi koje biramo prema tipu i stanju kose za zdrav i luksuzan rezultat.</h2>
            </div>
            <div className="stellar-treatment-grid">
              {milkShakeTreatments.map((treatment) => (
                <article key={treatment.name} className="stellar-treatment-card">
                  <p className="stellar-treatment-benefit">{treatment.benefit}</p>
                  <h3>{treatment.name}</h3>
                  <p>{treatment.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="home-panel stellar-gallery">
            <div className="home-section-head">
              <p className="home-kicker">Galerija radova</p>
              <h2>Realni rezultati iz studija kroz fotografije i atmosferu rada.</h2>
            </div>
            <div className="stellar-gallery-grid">
              {studioGallery.slice(0, 8).map((image) => (
                <article key={image.src} className="stellar-gallery-card">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={900}
                    height={900}
                    sizes="(max-width: 760px) 50vw, (max-width: 1080px) 33vw, 25vw"
                  />
                </article>
              ))}
            </div>
          </section>

          <section className="home-panel stellar-video-rail">
            <div className="home-section-head">
              <p className="home-kicker">Snimci iz salona</p>
              <h2>Proces, finishing i trenutak kada klijentkinja vidi finalni look.</h2>
            </div>
            <div className="stellar-video-grid">
              {studioVideos.map((video) => (
                <article key={video.src} className="stellar-video-card">
                  <video controls preload="metadata" playsInline muted>
                    <source src={video.src} type="video/webm" />
                  </video>
                  <div>
                    <h3>{video.title}</h3>
                    <p>{video.caption}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="home-panel stellar-products">
            <div className="stellar-products-head">
              <div className="home-section-head">
                <p className="home-kicker">Proizvodi na pocetnoj</p>
                <h2>Odmah uz tretman preporucujemo i proizvode za odrzavanje rezultata kod kuce.</h2>
              </div>
              <Link href="/products" className="ghost-btn home-second-action">
                Kompletna ponuda
              </Link>
            </div>

            {featuredProducts.length === 0 ? (
              <p className="home-empty">Ucitavanje proizvoda...</p>
            ) : (
              <div className="stellar-product-grid">
                {featuredProducts.map((product) => {
                  const discount = product.discount ?? 0;
                  const finalPrice = getFinalPrice(product);
                  const categoryName = categoryById.get(product.categoryId) ?? "Kategorija";
                  return (
                    <article key={product._id} className="stellar-product-card">
                      <div className="stellar-product-media">
                        <Image
                          src={product.images?.[0] ?? "/logo.png"}
                          alt={product.title}
                          width={560}
                          height={560}
                          sizes="(max-width: 760px) 100vw, (max-width: 1080px) 50vw, 25vw"
                        />
                        {discount > 0 ? <span className="home-product-discount">-{discount}%</span> : null}
                      </div>
                      <div className="stellar-product-body">
                        <p className="home-product-category">{categoryName}</p>
                        <h3>{product.title}</h3>
                        <p>{product.subtitle}</p>
                        <div className="home-product-price">
                          <strong>{formatRsd(finalPrice)}</strong>
                          {discount > 0 ? <span>{formatRsd(product.price)}</span> : null}
                        </div>
                        <div className="home-product-footer">
                          <span
                            className={`home-stock-pill ${
                              product.stock <= 0 ? "out" : product.stock <= 5 ? "low" : ""
                            }`}
                          >
                            {product.stock > 0 ? `${product.stock} kom na stanju` : "Rasprodato"}
                          </span>
                          <Link href="/products" className="home-product-link">
                            Poruci
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className="stellar-sidebar">
          <article className="home-panel stellar-sidebar-card stellar-sticky-card">
            <p className="home-kicker">Sidebar proizvodi</p>
            <h2>Preporuka za kucnu negu odmah na pocetnoj.</h2>
            <p>
              Posle tretmana dobijas jasan plan. Ovi proizvodi su izdvojeni za laksi izbor i dugotrajan rezultat.
            </p>

            {sidebarProducts.length === 0 ? (
              <p className="home-empty">Proizvodi se ucitavaju.</p>
            ) : (
              <div className="stellar-sidebar-products">
                {sidebarProducts.map((product) => (
                  <article key={product._id} className="stellar-sidebar-product">
                    <Image src={product.images?.[0] ?? "/logo.png"} alt={product.title} width={140} height={140} />
                    <div>
                      <h3>{product.title}</h3>
                      <p>{formatRsd(getFinalPrice(product))}</p>
                      <span>{product.stock > 0 ? `${product.stock} kom` : "Rasprodato"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <Link href="/products" className="primary-btn">
              Idi na proizvode
            </Link>
          </article>

          <article className="home-panel stellar-sidebar-card">
            <p className="home-card-label">Najtrazenije kategorije</p>
            <div className="home-chip-cloud">
              {topCategories.length > 0 ? (
                topCategories.map((category) => (
                  <span key={category.categoryId} className="home-chip">
                    {category.name} ({category.count})
                  </span>
                ))
              ) : (
                <span className="home-chip">Kategorije ce biti prikazane kada dodate proizvode</span>
              )}
            </div>
          </article>
        </aside>
      </section>

      <section className="home-panel home-reveal stellar-final-cta">
        <div>
          <p className="home-kicker">Sledeci korak</p>
          <h2>Dobrodosli u prostor gde lepota znaci kvalitet, sigurnost i samopouzdanje.</h2>
          <p>
            Posaljite fotografiju inspiracije ili opis zelje, a mi vracamo predlog tretmana i proizvoda koji su pravi
            za vasu kosu.
          </p>
        </div>
        <div className="home-hero-actions">
          <Link href="/contact" className="primary-btn home-main-action">
            Kontakt i rezervacija
          </Link>
          <Link href="/about" className="ghost-btn home-second-action">
            Upoznaj studio
          </Link>
        </div>
      </section>
    </div>
  );
}

function getFinalPrice(product: Pick<Product, "price" | "discount">) {
  const discount = product.discount ?? 0;
  if (discount <= 0) return product.price;
  return Math.round(product.price * (1 - discount / 100));
}

function formatRsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 RSD";
  return `${value.toLocaleString("sr-RS")} RSD`;
}
