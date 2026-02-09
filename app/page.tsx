"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Product = {
  _id: string;
  title: string;
  subtitle: string;
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

const signatureServices = [
  {
    title: "Signature Cut + Styling",
    duration: "45-60 min",
    description: "Sisanje i finalni styling prema obliku lica, gustini i svakodnevnom ritmu.",
  },
  {
    title: "Color Architecture",
    duration: "90-150 min",
    description: "Balayage, toniranje i prelamanje boja uz maksimalnu zastitu vlakna.",
  },
  {
    title: "Repair Protocol",
    duration: "30-50 min",
    description: "Dubinska obnova i hidratacija za kosu izlozenu toploti, blajhu i bojenju.",
  },
  {
    title: "Scalp Reset",
    duration: "35-45 min",
    description: "Detoks temena i balans mascenja kako bi kosa dobila volumen i cistinu.",
  },
] as const;

const routineSteps = [
  {
    title: "Konsultacija",
    text: "Mapiramo stanje kose, zeljeni rezultat i koliko vremena imas za odrzavanje.",
  },
  {
    title: "Izvodjenje tretmana",
    text: "Primena tehnike i proizvoda u salonu koja daje cist, moderan i nosiv rezultat.",
  },
  {
    title: "Home nega",
    text: "Dobijas personalizovan set iz shopa za odrzavanje boje, sjaja i forme izmedju termina.",
  },
] as const;

const salonPromises = [
  "Svaki termin pocinje konsultacijom i jasnim planom rada.",
  "Koristimo proverene protokole za zastitu kose tokom hemijskih procesa.",
  "Preporuke za kucnu negu dobijas uz konkretne proizvode iz shopa.",
] as const;

const testimonials = [
  {
    quote: "Najzad imam boju koja izgleda premium i posle vise pranja.",
    author: "Milica, Novi Beograd",
  },
  {
    quote: "Fen i volumen traju duze, a rutina kod kuce je sada jednostavna.",
    author: "Jelena, Vozdovac",
  },
  {
    quote: "Prvi salon gde mi odmah sloze i plan proizvoda za sledeci mesec.",
    author: "Ana, Zemun",
  },
] as const;

const faqItems = [
  {
    question: "Da li mogu da rezervisem termin i kupim proizvode istog dana?",
    answer: "Da. Mozes zakazati termin, a zatim online poruciti preporucene proizvode odmah nakon konsultacije.",
  },
  {
    question: "Kako biram prave proizvode ako nisam sigurna sta mi treba?",
    answer: "Posle tretmana dobijas tacnu preporuku po tipu kose i cilju, pa kupovina bude brza i bez pogadjanja.",
  },
  {
    question: "Da li su svi proizvodi na sajtu dostupni odmah?",
    answer: "Na kartici svakog proizvoda vidis stanje lagera, pa odmah znas sta je spremno za porudzbinu.",
  },
] as const;

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

export default function HomePage() {
  const rawProducts = useQuery(api.products.list, {}) as Product[] | undefined;
  const rawCategories = useQuery(api.products.listCategories, {}) as Category[] | undefined;
  const products = rawProducts ?? EMPTY_PRODUCTS;
  const categories = rawCategories ?? EMPTY_CATEGORIES;

  const categoryById = useMemo(() => new Map(categories.map((category) => [category._id, category.name])), [categories]);

  const featuredProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const discountDelta = (b.discount ?? 0) - (a.discount ?? 0);
        if (discountDelta !== 0) return discountDelta;
        return b.stock - a.stock;
      })
      .slice(0, 8);
  }, [products]);

  const catalogCount = products.length;
  const inStockCount = useMemo(() => products.filter((product) => product.stock > 0).length, [products]);
  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock > 0 && product.stock <= 5).length,
    [products],
  );
  const discountedCount = useMemo(() => products.filter((product) => (product.discount ?? 0) > 0).length, [products]);
  const totalStockUnits = useMemo(
    () => products.reduce((sum, product) => sum + Math.max(0, product.stock), 0),
    [products],
  );
  const averagePrice = useMemo(() => {
    if (products.length === 0) return 0;
    const total = products.reduce((sum, product) => sum + getFinalPrice(product), 0);
    return Math.round(total / products.length);
  }, [products]);
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
      .slice(0, 4);
  }, [products, categoryById]);
  const routineCategoryNames = topCategories.length
    ? topCategories.slice(0, 3).map((category) => category.name)
    : ["Nega", "Styling", "Color care"];
  const heroVisualProducts = useMemo(() => {
    const picks: Array<Product | null> = [...featuredProducts.slice(0, 4)];
    while (picks.length < 4) picks.push(null);
    return picks;
  }, [featuredProducts]);
  const heroProductTicker = featuredProducts
    .slice(0, 3)
    .map((product) => product.title)
    .join(" | ");

  return (
    <div className="page-grid home-page">
      <section className="home-hero home-panel home-reveal">
        <div className="home-hero-copy">
          <p className="home-kicker">Studio Lady Gaga | Hair Salon + Shop</p>
          <h1>Ultra moderan frizerski salon i webshop koji rade kao jedan sistem.</h1>
          <p className="home-lead">
            Od prvog susreta pravimo jasan plan: salonski tretman + proizvodi za odrzavanje kod kuce.
            Rezultat je look koji izgleda profesionalno i posle vise dana.
          </p>
          <div className="home-hero-actions">
            <Link href="/contact" className="primary-btn home-main-action">
              Rezervisi termin
            </Link>
            <Link href="/products" className="ghost-btn home-second-action">
              Udji u shop
            </Link>
          </div>
          <ul className="home-hero-points">
            {salonPromises.map((item) => (
              <li key={item}>
                <strong>Studio standard</strong>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="home-hero-visual" aria-hidden>
          <div className="home-visual-collage">
            {heroVisualProducts.map((product, index) => (
              <article
                className={`home-visual-card ${index === 0 ? "home-visual-card-main" : ""}`}
                key={product?._id ?? `visual-${index}`}
              >
                <Image
                  src={product?.images?.[0] ?? "/logo.png"}
                  alt={product?.title ?? "Studio Lady Gaga"}
                  width={500}
                  height={500}
                  sizes="(max-width: 760px) 50vw, 260px"
                />
                <span>{product?.title ?? "Studio mood"}</span>
              </article>
            ))}
          </div>

          <article className="home-floating home-floating-top">
            <p>Katalog</p>
            <strong>{catalogCount}</strong>
            <span>proizvoda trenutno u katalogu</span>
          </article>

          <article className="home-floating home-floating-bottom">
            <p>Shop pulse</p>
            <strong>{totalStockUnits}</strong>
            <span>{heroProductTicker || "Novi proizvodi uskoro"}</span>
          </article>
        </div>
      </section>

      <section className="home-intel-grid home-reveal">
        <article className="home-intel-card home-intel-primary">
          <p className="home-card-label">Plan asortimana</p>
          <h2>Trenutno je dostupno {catalogCount} proizvoda.</h2>
          <p>Asortiman pokriva sisanje, bojenje, tretmane i kucnu negu uz redovno osvezavanje ponude.</p>
          <div className="home-inline-metrics">
            <article>
              <strong>{categories.length}</strong>
              <span>Kategorija</span>
            </article>
            <article>
              <strong>{discountedCount}</strong>
              <span>Sa popustom</span>
            </article>
            <article>
              <strong>{formatRsd(averagePrice)}</strong>
              <span>Prosecna cena</span>
            </article>
          </div>
        </article>

        <article className="home-intel-card">
          <p className="home-card-label">Salon usluge</p>
          <h3>Termini su organizovani tako da rezultat traje.</h3>
          <ul className="home-list">
            <li>Strucna procena stanja kose pre svakog tretmana.</li>
            <li>Rad sa fokusom na volumen, formu i otpornost boje.</li>
            <li>Jasan plan proizvoda koji prate salonski rezultat.</li>
          </ul>
          <Link href="/about" className="home-inline-link">
            Saznaj vise o studiju
          </Link>
        </article>

        <article className="home-intel-card">
          <p className="home-card-label">Shop stanje</p>
          <h3>Online kupovina sa jasnom dostupnoscu.</h3>
          <p className="home-stock-line">
            <strong>{inStockCount}</strong> proizvoda je trenutno na stanju.
          </p>
          <p className="home-stock-line">
            <strong>{lowStockCount}</strong> proizvoda je pri kraju lagera.
          </p>
          <Link href="/products" className="home-inline-link">
            Otvori kompletnu ponudu
          </Link>
        </article>
      </section>

      <section className="home-services home-panel home-reveal">
        <div className="home-section-head">
          <p className="home-kicker">Frizerski meni</p>
          <h2>Usluge koje direktno povezujemo sa shop rutinom.</h2>
        </div>
        <div className="home-services-grid">
          {signatureServices.map((service) => (
            <article key={service.title} className="home-service-card">
              <p className="home-service-time">{service.duration}</p>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
        <div className="home-service-actions">
          <Link href="/contact" className="primary-btn home-main-action">
            Zakazi konsultaciju
          </Link>
          <Link href="/products" className="ghost-btn home-second-action">
            Pogledaj proizvode za negu
          </Link>
        </div>
      </section>

      <section className="home-routine home-panel home-reveal">
        <div className="home-routine-main">
          <div className="home-section-head">
            <p className="home-kicker">Salon + Shop flow</p>
            <h2>Kako izgleda kompletan proces od ulaska u salon do nege kod kuce.</h2>
          </div>
          <div className="home-routine-steps">
            {routineSteps.map((step, index) => (
              <article key={step.title} className="home-routine-step">
                <span className="home-routine-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="home-routine-side">
          <p className="home-card-label">Najaktivnije kategorije</p>
          <div className="home-chip-cloud">
            {routineCategoryNames.map((name) => (
              <span key={name} className="home-chip">
                {name}
              </span>
            ))}
          </div>
          <p>
            Posle salona ne pretrazujes naslepo. Brzo biras ono sto ti je stvarno potrebno i odrzavas isti nivo
            kvaliteta do sledeceg termina.
          </p>
          <Link href="/products" className="home-inline-link">
            Idi na shop
          </Link>
        </aside>
      </section>

      <section className="home-catalog home-panel home-reveal">
        <div className="home-catalog-head">
          <div className="home-section-head">
            <p className="home-kicker">Shop spotlight</p>
            <h2>Izdvojeni proizvodi i struktura kategorija.</h2>
          </div>
          <Link href="/products" className="ghost-btn home-products-link">
            Kompletan katalog
          </Link>
        </div>

        <div className="home-category-grid">
          {topCategories.length === 0 ? (
            <article className="home-category-card">
              <strong>Kategorije se ucitavaju</strong>
              <p>Dodaj proizvode u admin panelu da se prikaze raspodela.</p>
            </article>
          ) : (
            topCategories.map((category) => (
              <article key={category.categoryId} className="home-category-card">
                <strong>{category.name}</strong>
                <p>{category.count} proizvoda</p>
              </article>
            ))
          )}
        </div>

        {featuredProducts.length === 0 ? (
          <p className="home-empty">Ucitavanje proizvoda...</p>
        ) : (
          <div className="home-product-grid">
            {featuredProducts.map((product) => {
              const finalPrice = getFinalPrice(product);
              const discount = product.discount ?? 0;
              const categoryName = categoryById.get(product.categoryId) ?? "Kategorija";
              return (
                <article key={product._id} className="home-product-card">
                  <div className="home-product-media">
                    <Image
                      src={product.images?.[0] ?? "/logo.png"}
                      alt={product.title}
                      width={420}
                      height={420}
                      sizes="(max-width: 760px) 100vw, (max-width: 1200px) 33vw, 260px"
                    />
                    {discount > 0 ? <span className="home-product-discount">-{discount}%</span> : null}
                  </div>

                  <div className="home-product-body">
                    <p className="home-product-category">{categoryName}</p>
                    <h3>{product.title}</h3>
                    <p className="home-product-subtitle">{product.subtitle}</p>
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
                        Kupi
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="home-proof-grid home-reveal">
        <article className="home-proof-card">
          <p className="home-card-label">Brojevi koji se prate svakog dana</p>
          <h2>Salon i shop su povezani kroz realne metrike.</h2>
          <div className="home-proof-metrics">
            <article>
              <strong>{catalogCount}</strong>
              <span>Ukupno proizvoda</span>
            </article>
            <article>
              <strong>{inStockCount}</strong>
              <span>Aktivno na stanju</span>
            </article>
            <article>
              <strong>{totalStockUnits}</strong>
              <span>Ukupno jedinica</span>
            </article>
            <article>
              <strong>{discountedCount}</strong>
              <span>Sa aktivnim popustom</span>
            </article>
          </div>
        </article>

        <article className="home-proof-card">
          <p className="home-card-label">Utisak klijenata</p>
          <h2>Iskustvo koje spaja rad u salonu i negu kod kuce.</h2>
          <div className="home-testimonial-list">
            {testimonials.map((testimonial) => (
              <article key={testimonial.author} className="home-testimonial-item">
                <p>{testimonial.quote}</p>
                <span>{testimonial.author}</span>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="home-faq home-panel home-reveal">
        <div className="home-section-head">
          <p className="home-kicker">Brza pitanja</p>
          <h2>Najcesce informacije o terminima i kupovini proizvoda.</h2>
        </div>
        <div className="home-faq-grid">
          {faqItems.map((item) => (
            <article key={item.question} className="home-faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-final-cta home-panel home-reveal">
        <div className="home-final-copy">
          <p className="home-kicker">Sledeci korak</p>
          <h2>Rezervisi termin, pa odaberi proizvode koji cuvaju rezultat narednih nedelja.</h2>
        </div>
        <div className="home-final-actions">
          <Link href="/contact" className="primary-btn home-main-action">
            Kontakt i termin
          </Link>
          <Link href="/products" className="ghost-btn home-second-action">
            Udji u shop
          </Link>
        </div>
      </section>
    </div>
  );
}

function getFinalPrice(product: Product) {
  const discount = product.discount ?? 0;
  if (discount <= 0) return product.price;
  return Math.round(product.price * (1 - discount / 100));
}

function formatRsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 RSD";
  return `${value.toLocaleString("sr-RS")} RSD`;
}
