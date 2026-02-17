"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";

type Category = { _id: string; name: string };
type StorageImage = { storageId: string; url: string };
type Product = {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  stock: number;
  discount?: number;
  recommended?: boolean;
  categoryId: string;
  images: string[];
  storageImages?: StorageImage[];
  primaryImageStorageId?: string;
  primaryImageUrl?: string;
};

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const productId = typeof params?.productId === "string" ? params.productId : "";

  const { session } = useAuth();
  const { addItem, itemCount } = useCart();

  const setPrimaryImage = useMutation(api.products.setPrimaryImage) as unknown as (args: {
    productId: string;
    storageId?: string;
    imageUrl?: string;
  }) => Promise<unknown>;

  const setRecommended = useMutation(api.products.setRecommended) as unknown as (args: {
    productId: string;
    recommended: boolean;
  }) => Promise<unknown>;

  const rawProducts = useQuery(api.products.list, {}) as Product[] | undefined;
  const rawCategories = useQuery(api.products.listCategories, {}) as Category[] | undefined;
  const products = rawProducts ?? EMPTY_PRODUCTS;
  const categories = rawCategories ?? EMPTY_CATEGORIES;

  const product = useMemo(() => products.find((item) => item._id === productId) ?? null, [products, productId]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter((item) => item._id !== product._id && item.categoryId === product.categoryId).slice(0, 4);
  }, [products, product]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState(false);
  const [isUpdatingRecommended, setIsUpdatingRecommended] = useState(false);

  useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setFeedback(null);
  }, [product?._id]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  if (rawProducts === undefined || rawCategories === undefined) {
    return (
      <section className="page-grid product-detail-page">
        <section className="loading-card">Učitavanje proizvoda...</section>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="page-grid product-detail-page">
        <section className="empty-state toolbar-card">
          <h3>Proizvod nije pronadjen.</h3>
          <p>Proverite da li je proizvod obrisan ili izaberite drugi iz kataloga.</p>
          <Link href="/proizvodi" className="primary-btn">
            Nazad na proizvode
          </Link>
        </section>
      </section>
    );
  }

  const images = product.images.length > 0 ? product.images : ["/logo.png"];
  const totalImages = images.length;
  const discount = product.discount ?? 0;
  const resolvedPrice = getFinalPrice(product);
  const categoryName = categories.find((category) => category._id === product.categoryId)?.name ?? "Bez kategorije";
  const stockMeta = getStockMeta(product.stock);
  const maxQuantity = Math.max(1, product.stock);

  const moveImage = (direction: 1 | -1) => {
    setActiveImageIndex((current) => {
      const next = current + direction;
      if (next < 0) return totalImages - 1;
      if (next >= totalImages) return 0;
      return next;
    });
  };

  const changeQuantity = (delta: 1 | -1) => {
    setQuantity((current) => {
      const next = current + delta;
      return Math.min(maxQuantity, Math.max(1, next));
    });
  };

  const onAddToCart = () => {
    if (product.stock <= 0) {
      setFeedback({ type: "error", message: "Proizvod trenutno nije na stanju." });
      return;
    }

    addItem(
      {
        productId: product._id,
        title: product.title,
        subtitle: product.subtitle,
        image: images[0],
        unitPrice: product.price,
        discount,
        stock: product.stock,
      },
      quantity,
    );

    setFeedback({ type: "success", message: `${product.title} je dodat u korpu.` });
  };

  const onSetPrimaryImage = async () => {
    const selectedUrl = images[activeImageIndex];
    const storageId = product.storageImages?.find((image) => image.url === selectedUrl)?.storageId;
    setIsSettingPrimary(true);
    try {
      await setPrimaryImage({
        productId: product._id,
        storageId: storageId ?? undefined,
        imageUrl: storageId ? undefined : selectedUrl,
      });
      setActiveImageIndex(0);
      setFeedback({ type: "success", message: "Glavna slika je postavljena." });
    } catch {
      setFeedback({ type: "error", message: "Izmena glavne slike nije uspela." });
    } finally {
      setIsSettingPrimary(false);
    }
  };

  const onToggleRecommended = async (recommended: boolean) => {
    if (!session?.isAdmin) return;
    setIsUpdatingRecommended(true);
    try {
      await setRecommended({ productId: product._id, recommended });
      setFeedback({
        type: "success",
        message: recommended ? "Proizvod je označen kao preporučen." : "Proizvod je uklonjen iz preporučenih.",
      });
    } catch {
      setFeedback({ type: "error", message: "Izmena preporučenog statusa nije uspela." });
    } finally {
      setIsUpdatingRecommended(false);
    }
  };

  return (
    <section className="page-grid product-detail-page">
      <Link href="/proizvodi" className="ghost-btn product-detail-back">
        Nazad na proizvode
      </Link>

      <article className="toolbar-card product-detail-shell">
        <div className="product-detail-media-column">
          <div className="product-detail-stage">
            <Image
              src={images[activeImageIndex]}
              alt={product.title}
              width={1200}
              height={1200}
              sizes="(max-width: 960px) 100vw, 56vw"
              priority
              className="product-detail-stage-image"
            />
            <span className={`product-detail-stock-chip ${stockMeta.tone}`}>{stockMeta.badgeText}</span>

            {totalImages > 1 ? (
              <div className="product-detail-stage-controls">
                <button type="button" className="product-detail-stage-arrow" onClick={() => moveImage(-1)} aria-label="Prethodna slika">
                  <ArrowLeft />
                </button>
                <span className="product-detail-stage-counter">
                  {activeImageIndex + 1}/{totalImages}
                </span>
                <button type="button" className="product-detail-stage-arrow" onClick={() => moveImage(1)} aria-label="Sledeća slika">
                  <ArrowRight />
                </button>
              </div>
            ) : null}
          </div>

          {totalImages > 1 ? (
            <div className="product-detail-thumbs" role="tablist" aria-label="Galerija slika proizvoda">
              {images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`product-detail-thumb ${index === activeImageIndex ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(index)}
                  aria-label={`Prikazi sliku ${index + 1}`}
                  aria-selected={index === activeImageIndex}
                  role="tab"
                >
                  <Image src={image} alt={`${product.title} ${index + 1}`} width={240} height={240} sizes="96px" />
                </button>
              ))}
            </div>
          ) : null}

          {session?.isAdmin && totalImages > 1 ? (
            <div className="product-detail-primary-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={onSetPrimaryImage}
                disabled={isSettingPrimary || activeImageIndex === 0}
              >
                {activeImageIndex === 0 ? "Glavna slika" : isSettingPrimary ? "Čuvanje..." : "Postavi kao glavnu"}
              </button>
              <span className="product-detail-primary-note">Glavna slika se prikazuje na karticama proizvoda.</span>
            </div>
          ) : null}
        </div>

        <div className="product-detail-info-column">
          <div className="product-detail-info-head">
            <p className="product-detail-category">{categoryName}</p>
            {product.recommended ? <span className="product-detail-recommended-pill">Preporučen</span> : null}
            <span className={`product-detail-stock-pill ${stockMeta.tone}`}>{stockMeta.badgeText}</span>
          </div>
          <h1>{product.title}</h1>
          <p className="product-detail-subtitle">{product.subtitle}</p>
          <p className="product-detail-description">{product.description}</p>

          <div className="product-detail-price-panel">
            <p className="product-detail-price-caption">Cena</p>
            <div className="product-detail-price-row">
              <strong>{formatRsd(resolvedPrice)}</strong>
              {discount > 0 ? <span className="product-detail-old-price">{formatRsd(product.price)}</span> : null}
            </div>
            {discount > 0 ? <p className="product-detail-price-save">Ušteda {formatRsd(product.price - resolvedPrice)}</p> : null}
          </div>

          <div className="product-detail-meta-grid">
            <article>
              <span>Stanje</span>
              <strong>{Math.max(0, product.stock)}</strong>
            </article>
            <article>
              <span>Popust</span>
              <strong>{discount > 0 ? `${discount}%` : "Bez akcije"}</strong>
            </article>
            <article>
              <span>Kategorija</span>
              <strong>{categoryName}</strong>
            </article>
          </div>

          <div className="product-detail-actions">
            <div className="product-detail-quantity" aria-label="Količina proizvoda">
              <button type="button" onClick={() => changeQuantity(-1)} disabled={quantity <= 1}>
                -
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => changeQuantity(1)} disabled={quantity >= maxQuantity || product.stock <= 0}>
                +
              </button>
            </div>

            <button type="button" className="primary-btn" onClick={onAddToCart} disabled={product.stock <= 0}>
              {product.stock > 0 ? "Dodaj u korpu" : "Rasprodato"}
            </button>

            <Link href="/korpa" className="ghost-btn">
              Korpa ({itemCount})
            </Link>
          </div>

          {feedback ? (
            <p className={`status-msg ${feedback.type === "error" ? "admin-status-error" : "admin-status-success"}`}>{feedback.message}</p>
          ) : null}

          {session?.isAdmin ? (
            <div className="product-detail-admin-note">
              <p>Prijavljeni ste kao admin. Glavnu sliku birate ovde, a ostale izmene i brisanje radite na katalog stranici.</p>
              <label className={`admin-check admin-check-recommended ${product.recommended ? "is-on" : ""}`}>
                <input
                  type="checkbox"
                  checked={Boolean(product.recommended)}
                  onChange={(event) => {
                    void onToggleRecommended(event.target.checked);
                  }}
                  disabled={isUpdatingRecommended}
                />
                <span>Preporučen proizvod</span>
              </label>
              <Link href="/proizvodi" className="ghost-btn">
                Idi na upravljanje katalogom
              </Link>
            </div>
          ) : null}
        </div>
      </article>

      {relatedProducts.length > 0 ? (
        <section className="toolbar-card product-detail-related">
          <div className="product-detail-related-head">
            <h2>Povezani proizvodi</h2>
            <span>Još iz iste kategorije</span>
          </div>
          <div className="product-detail-related-grid">
            {relatedProducts.map((item) => (
              <Link key={item._id} href={`/proizvodi/${item._id}`} className="product-detail-related-card">
                <Image src={item.images[0] ?? "/logo.png"} alt={item.title} width={420} height={420} sizes="(max-width: 768px) 100vw, 25vw" />
                <div className="product-detail-related-body">
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                  <strong>{formatRsd(getFinalPrice(item))}</strong>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

type StockTone = "ready" | "low" | "critical" | "out";

function getStockMeta(stock: number): { tone: StockTone; badgeText: string } {
  const safeStock = Math.max(0, Math.floor(stock));
  if (safeStock === 0) {
    return { tone: "out", badgeText: "Rasprodato" };
  }
  if (safeStock <= 3) {
    return { tone: "critical", badgeText: `Samo ${safeStock}` };
  }
  if (safeStock <= 10) {
    return { tone: "low", badgeText: `Stanje ${safeStock}` };
  }
  return { tone: "ready", badgeText: `Stanje ${safeStock}` };
}

function getFinalPrice(product: Pick<Product, "price" | "discount">) {
  const discount = product.discount ?? 0;
  if (discount <= 0) return product.price;
  return Math.max(0, Math.round(product.price * (1 - discount / 100)));
}

const rsdFormatter = new Intl.NumberFormat("sr-Latn-RS");

function formatRsd(value: number) {
  return `${rsdFormatter.format(Math.max(0, Math.round(value)))} RSD`;
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
