"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { milkShakeTreatments, studioGallery } from "@/lib/studio-content";

type Category = { _id: string; name: string };
type Product = {
  _id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  stock: number;
  discount?: number;
  categoryId: string;
  images: string[];
  storageImageIds?: string[];
  storageImages?: { storageId: string; url: string }[];
};

type ProductForm = {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  stock: string;
  discount: string;
  categoryId: string;
  images: string;
};

type OrderForm = {
  firstName: string;
  lastName: string;
  street: string;
  number: string;
  postalCode: string;
  city: string;
  phone: string;
};

const emptyForm: ProductForm = {
  title: "",
  subtitle: "",
  description: "",
  price: "",
  stock: "",
  discount: "0",
  categoryId: "",
  images: "",
};

const orderEmptyForm: OrderForm = {
  firstName: "",
  lastName: "",
  street: "",
  number: "",
  postalCode: "",
  city: "",
  phone: "",
};

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

export default function ProductsPage() {
  const { t } = useLanguage();
  const { session } = useAuth();

  const rawProducts = useQuery(api.products.list, {}) as Product[] | undefined;
  const rawCategories = useQuery(api.products.listCategories, {}) as Category[] | undefined;
  const products = rawProducts ?? EMPTY_PRODUCTS;
  const categories = rawCategories ?? EMPTY_CATEGORIES;

  const submitOrder = useMutation(api.orders.createOrder) as unknown as (args: {
    productId: string;
    customer: OrderForm;
  }) => Promise<void>;

  const saveProduct = useMutation(api.products.upsertProduct) as unknown as (args: {
    productId?: string;
    title: string;
    subtitle: string;
    description: string;
    price: number;
    stock: number;
    discount: number;
    categoryId: string;
    images: string[];
    storageImageIds?: string[];
  }) => Promise<unknown>;

  const removeProduct = useMutation(api.products.deleteProduct) as unknown as (args: {
    productId: string;
  }) => Promise<unknown>;

  const saveCategory = useMutation(api.products.upsertCategory) as unknown as (args: {
    name: string;
    categoryId?: string;
  }) => Promise<unknown>;

  const removeCategory = useMutation(api.products.deleteCategory) as unknown as (args: {
    categoryId: string;
  }) => Promise<unknown>;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "priceAsc" | "priceDesc" | "stockDesc">("featured");

  const [orderProductId, setOrderProductId] = useState<string | null>(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null);
  const [categoryEditInput, setCategoryEditInput] = useState("");
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<Category | null>(null);
  const categoryEditInputRef = useRef<HTMLInputElement | null>(null);

  const [feedback, setFeedback] = useState<string>("");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!categoryEditId || !categoryEditInputRef.current) return;
    const input = categoryEditInputRef.current;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, [categoryEditId]);

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category._id, category.name]));
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const lowered = searchTerm.trim().toLowerCase();
    const items = products.filter((product) => {
      const inCategory = activeCategory === "all" || product.categoryId === activeCategory;
      if (!inCategory) return false;
      if (!lowered) return true;
      return [product.title, product.subtitle, product.description]
        .join(" ")
        .toLowerCase()
        .includes(lowered);
    });

    if (sortBy === "priceAsc") {
      return [...items].sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
    }

    if (sortBy === "priceDesc") {
      return [...items].sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
    }

    if (sortBy === "stockDesc") {
      return [...items].sort((a, b) => b.stock - a.stock);
    }

    return items;
  }, [products, activeCategory, searchTerm, sortBy]);

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === orderProductId) ?? null,
    [products, orderProductId],
  );

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, item) => sum + item.stock, 0);
    const lowStock = products.filter((item) => item.stock <= 5).length;
    return { count: products.length, totalStock, lowStock };
  }, [products]);

  const sidebarProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const discountDelta = (b.discount ?? 0) - (a.discount ?? 0);
        if (discountDelta !== 0) return discountDelta;
        return b.stock - a.stock;
      })
      .slice(0, 4);
  }, [products]);

  const sidebarCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([categoryId, count]) => ({
        name: categoriesById.get(categoryId) ?? "Bez kategorije",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [products, categoriesById]);

  const openCreate = () => {
    setEditProductId(null);
    setForm(emptyForm);
    setShowProductModal(true);
  };

  const openEdit = (product: Product) => {
    const storageUrls = new Set((product.storageImages ?? []).map((image) => image.url));
    const externalImages = product.images.filter((url) => !storageUrls.has(url));
    setEditProductId(product._id);
    setForm({
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      discount: String(product.discount ?? 0),
      categoryId: product.categoryId,
      images: externalImages.join(", "),
    });
    setShowProductModal(true);
  };

  const onSaveProduct = async (event: FormEvent) => {
    event.preventDefault();
    setIsBusy(true);
    try {
      await saveProduct({
        productId: editProductId ?? undefined,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock || 0),
        discount: Number(form.discount || 0),
        categoryId: form.categoryId,
        images: form.images
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setFeedback(editProductId ? "Proizvod je uspešno ažuriran." : "Novi proizvod je dodat.");
      setShowProductModal(false);
    } catch {
      setFeedback("Čuvanje nije uspelo. Proverite polja i pokušajte ponovo.");
    } finally {
      setIsBusy(false);
    }
  };

  const resetCategoryEditor = () => {
    setCategoryEditId(null);
    setCategoryEditInput("");
  };

  const onCreateCategory = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    setIsBusy(true);
    try {
      await saveCategory({ name: trimmed });
      setFeedback("Kategorija je dodata.");
      setNewCategoryInput("");
    } catch {
      setFeedback("Dodavanje kategorije nije uspelo.");
    } finally {
      setIsBusy(false);
    }
  };

  const startCategoryEdit = (category: Category) => {
    setCategoryEditInput(category.name);
    setCategoryEditId(category._id);
  };

  const onSubmitCategoryEdit = async (event: FormEvent, categoryId: string) => {
    event.preventDefault();
    const trimmed = categoryEditInput.trim();
    if (!trimmed) return;
    setIsBusy(true);
    try {
      await saveCategory({ name: trimmed, categoryId });
      setFeedback("Kategorija je izmenjena.");
      resetCategoryEditor();
    } catch {
      setFeedback("Izmena kategorije nije uspela.");
    } finally {
      setIsBusy(false);
    }
  };

  const onDeleteCategory = async () => {
    if (!categoryDeleteTarget) return;
    setIsBusy(true);
    try {
      await removeCategory({ categoryId: categoryDeleteTarget._id });
      if (activeCategory === categoryDeleteTarget._id) setActiveCategory("all");
      if (categoryEditId === categoryDeleteTarget._id) resetCategoryEditor();
      setCategoryDeleteTarget(null);
      setFeedback("Kategorija je obrisana.");
    } catch {
      setFeedback("Kategorija je povezana sa proizvodima i ne može da se obriše.");
    } finally {
      setIsBusy(false);
    }
  };

  const onDeleteProduct = async () => {
    if (!showDeleteModal) return;
    setIsBusy(true);
    try {
      await removeProduct({ productId: showDeleteModal });
      setFeedback("Proizvod je obrisan.");
      setShowDeleteModal(null);
    } catch {
      setFeedback("Brisanje nije uspelo.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="page-grid products-page">
      <div className="hero products-hero">
        <p className="eyebrow">Onlajn kupovina</p>
        <h1>{t.products.title}</h1>
        <p className="subtitle">Brza kupovina za klijente i efikasan menadžment kataloga za admin tim.</p>
      </div>

      {session?.isAdmin ? (
        <section className="dashboard-grid">
          <article className="metric-card">
            <span>Ukupno proizvoda</span>
            <strong>{stats.count}</strong>
          </article>
          <article className="metric-card">
            <span>Ukupno na stanju</span>
            <strong>{stats.totalStock}</strong>
          </article>
          <article className="metric-card">
            <span>Nizak lager</span>
            <strong>{stats.lowStock}</strong>
          </article>
        </section>
      ) : null}

      <section className="products-spotlight-layout">
        <article className="toolbar-card products-spotlight-main">
          <p className="home-kicker">Studio preporuka</p>
          <h2>Proizvodi i tretmani koje klijentkinje najcesce biraju posle termina.</h2>
          <p>
            Nakon tretmana biramo odgovarajucu kucnu negu kako bi sjaj, forma i kvalitet kose trajali sto duze.
          </p>
          <div className="products-spotlight-grid">
            {milkShakeTreatments.map((treatment) => (
              <article key={treatment.name} className="products-spotlight-chip">
                <strong>{treatment.name}</strong>
                <span>{treatment.benefit}</span>
              </article>
            ))}
          </div>
        </article>

        <aside className="products-spotlight-sidebar">
          <article className="toolbar-card products-side-card">
            <p className="home-card-label">Sidebar proizvodi</p>
            {sidebarProducts.length === 0 ? (
              <p className="home-empty">Proizvodi se ucitavaju.</p>
            ) : (
              <div className="products-side-list">
                {sidebarProducts.map((product) => (
                  <article key={product._id} className="products-side-item">
                    <Image src={product.images?.[0] ?? "/logo.png"} alt={product.title} width={96} height={96} />
                    <div>
                      <h3>{product.title}</h3>
                      <p>{getFinalPrice(product)} RSD</p>
                      <span>{product.stock > 0 ? `${product.stock} kom` : "Rasprodato"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <Link href="/contact" className="primary-btn">
              Zakazi konsultaciju
            </Link>
          </article>

          <article className="toolbar-card products-side-card">
            <p className="home-card-label">Top kategorije</p>
            <div className="home-chip-cloud">
              {sidebarCategories.length > 0 ? (
                sidebarCategories.map((category) => (
                  <span key={category.name} className="home-chip">
                    {category.name} ({category.count})
                  </span>
                ))
              ) : (
                <span className="home-chip">Kategorije ce biti prikazane kada dodate proizvode</span>
              )}
            </div>
            <Image src={studioGallery[5].src} alt={studioGallery[5].alt} width={900} height={900} />
          </article>
        </aside>
      </section>

      <section className="toolbar-card">
        <div className="toolbar-main">
          <input
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Pretraga po nazivu, opisu ili podnaslovu"
            aria-label="Pretraga proizvoda"
          />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="sort-select">
            <option value="featured">Preporučeno</option>
            <option value="priceAsc">Cena: niža ka višoj</option>
            <option value="priceDesc">Cena: viša ka nižoj</option>
            <option value="stockDesc">Najveće stanje</option>
          </select>
          {session?.isAdmin ? (
            <button type="button" className="primary-btn" onClick={openCreate}>
              {t.products.createProduct}
            </button>
          ) : null}
        </div>

        <div className="category-row">
          <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")} type="button">
            {t.products.all}
          </button>
          {categories.map((category) => {
            const isEditing = categoryEditId === category._id;
            return (
              <div key={category._id} className={`category-pill-wrap ${isEditing ? "editing" : ""}`}>
                {isEditing ? (
                  <form className="category-pill-edit" onSubmit={(event) => onSubmitCategoryEdit(event, category._id)}>
                    <input
                      ref={categoryEditInputRef}
                      value={categoryEditInput}
                      onChange={(event) => setCategoryEditInput(event.target.value)}
                      aria-label={`Izmeni kategoriju ${category.name}`}
                    />
                    <div className="category-pill-inline-actions">
                      <button type="submit" className="icon-btn icon-btn-circle" aria-label={`Sačuvaj kategoriju ${category.name}`} disabled={isBusy}>
                        <IconCheck />
                      </button>
                      <button type="button" className="icon-btn icon-btn-circle" aria-label="Odustani od izmene" onClick={resetCategoryEditor}>
                        <IconClose />
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      className={activeCategory === category._id ? "active" : ""}
                      onClick={() => setActiveCategory(category._id)}
                      type="button"
                    >
                      {category.name}
                    </button>
                    {session?.isAdmin ? (
                      <div className="category-pill-corner-actions">
                        <button
                          type="button"
                          className="icon-btn icon-btn-circle"
                          onClick={() => startCategoryEdit(category)}
                          aria-label={`Izmeni ${category.name}`}
                          disabled={isBusy}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger icon-btn-circle"
                          onClick={() => setCategoryDeleteTarget(category)}
                          aria-label={`Obriši ${category.name}`}
                          disabled={isBusy}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {session?.isAdmin ? (
          <form className="inline-form" onSubmit={onCreateCategory}>
            <input
              value={newCategoryInput}
              onChange={(event) => setNewCategoryInput(event.target.value)}
              placeholder="Nova kategorija"
            />
            <button type="submit" className="primary-btn" disabled={isBusy}>
              Dodaj kategoriju
            </button>
          </form>
        ) : null}
      </section>

      {feedback ? <p className="status-msg">{feedback}</p> : null}

      {rawProducts === undefined || rawCategories === undefined ? (
        <section className="loading-card">Učitavanje proizvoda...</section>
      ) : filteredProducts.length === 0 ? (
        <section className="empty-state">
          <h3>{t.products.empty}</h3>
          <p>Probajte sa drugačijom pretragom ili kategorijom.</p>
        </section>
      ) : (
        <div className="product-grid enhanced-grid">
          {filteredProducts.map((product) => {
            const discount = product.discount ?? 0;
            const finalPrice = getFinalPrice(product);
            const categoryName = categoriesById.get(product.categoryId) ?? "Bez kategorije";
            return (
              <article key={product._id} className="product-card admin-hover-card">
                <div className="card-media-wrap">
                  <Image src={product.images?.[0] ?? "/logo.png"} alt={product.title} width={420} height={420} />
                  <span className={`stock-badge ${product.stock <= 5 ? "low" : "ok"}`}>
                    {t.products.stock}: {product.stock}
                  </span>
                  {discount > 0 ? <span className="discount-badge">-{discount}%</span> : null}
                </div>
                <div className="card-body">
                  <p className="category-tag">{categoryName}</p>
                  <h3>{product.title}</h3>
                  <p>{product.subtitle}</p>
                  <p className="description-line">{product.description}</p>
                  <div className="price-row">
                    <strong>{finalPrice} RSD</strong>
                    {discount > 0 ? <span className="old-price">{product.price} RSD</span> : null}
                  </div>
                </div>
                <div className="card-actions">
                  <button className="primary-btn" onClick={() => setOrderProductId(product._id)} type="button">
                    {t.products.addToOrder}
                  </button>
                  {session?.isAdmin ? (
                    <>
                      <button className="ghost-btn" onClick={() => openEdit(product)} type="button">
                        {t.products.edit}
                      </button>
                      <button className="ghost-btn danger" onClick={() => setShowDeleteModal(product._id)} type="button">
                        {t.products.delete}
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {orderProductId && selectedProduct ? (
        <OrderModal
          product={selectedProduct}
          onClose={() => setOrderProductId(null)}
          onSubmit={submitOrder}
        />
      ) : null}

      {showProductModal ? (
        <Modal onClose={() => setShowProductModal(false)}>
          <h2>{editProductId ? t.products.edit : t.products.createProduct}</h2>
          <form className="modal-form" onSubmit={onSaveProduct}>
            <input required placeholder="Naslov" value={form.title} onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))} />
            <input required placeholder="Podnaslov" value={form.subtitle} onChange={(event) => setForm((value) => ({ ...value, subtitle: event.target.value }))} />
            <textarea required placeholder="Opis" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
            <div className="form-row-2">
              <input required type="number" placeholder="Cena" value={form.price} onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))} />
              <input type="number" placeholder="Stanje" value={form.stock} onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))} />
            </div>
            <div className="form-row-2">
              <input type="number" placeholder="Popust (%)" value={form.discount} onChange={(event) => setForm((value) => ({ ...value, discount: event.target.value }))} />
              <select required value={form.categoryId} onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}>
                <option value="">Kategorija</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              required
              placeholder="URL slika (odvojiti zarezom)"
              value={form.images}
              onChange={(event) => setForm((value) => ({ ...value, images: event.target.value }))}
            />
            <button type="submit" className="primary-btn" disabled={isBusy}>
              Sačuvaj
            </button>
          </form>
        </Modal>
      ) : null}

      {showDeleteModal ? (
        <Modal onClose={() => setShowDeleteModal(null)}>
          <h3>Da li ste sigurni da želite da obrišete proizvod?</h3>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setShowDeleteModal(null)} type="button">
              Odustani
            </button>
            <button className="primary-btn danger" onClick={onDeleteProduct} type="button" disabled={isBusy}>
              Potvrdi brisanje
            </button>
          </div>
        </Modal>
      ) : null}

      {categoryDeleteTarget ? (
        <Modal onClose={() => setCategoryDeleteTarget(null)}>
          <h3>Da li ste sigurni da želite da obrišete kategoriju &quot;{categoryDeleteTarget.name}&quot;?</h3>
          <p>Ako je kategorija povezana sa proizvodima, brisanje neće uspeti.</p>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setCategoryDeleteTarget(null)} type="button">
              Odustani
            </button>
            <button className="primary-btn danger" onClick={onDeleteCategory} type="button" disabled={isBusy}>
              {isBusy ? "Brisanje..." : "Potvrdi brisanje"}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function getFinalPrice(product: Product) {
  const discount = product.discount ?? 0;
  if (discount <= 0) return product.price;
  return Math.round(product.price * (1 - discount / 100));
}

function IconEdit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m5 6 1 14h12l1-14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button" aria-label="Zatvori">
          x
        </button>
        {children}
      </div>
    </div>
  );
}

function OrderModal({
  product,
  onClose,
  onSubmit,
}: {
  product: Product;
  onClose: () => void;
  onSubmit: (args: { productId: string; customer: OrderForm }) => Promise<void>;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<OrderForm>(orderEmptyForm);
  const [busy, setBusy] = useState(false);

  return (
    <Modal onClose={onClose}>
      <h2>{t.order.title}</h2>
      <p className="order-summary">
        Poručujete: <strong>{product.title}</strong>
      </p>
      <form
        className="modal-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await onSubmit({ productId: product._id, customer: form });
            onClose();
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-row-2">
          <input required placeholder={t.order.firstName} value={form.firstName} onChange={(event) => setForm((value) => ({ ...value, firstName: event.target.value }))} />
          <input required placeholder={t.order.lastName} value={form.lastName} onChange={(event) => setForm((value) => ({ ...value, lastName: event.target.value }))} />
        </div>
        <div className="form-row-2">
          <input required placeholder={t.order.street} value={form.street} onChange={(event) => setForm((value) => ({ ...value, street: event.target.value }))} />
          <input required placeholder={t.order.number} value={form.number} onChange={(event) => setForm((value) => ({ ...value, number: event.target.value }))} />
        </div>
        <div className="form-row-2">
          <input required placeholder={t.order.postalCode} value={form.postalCode} onChange={(event) => setForm((value) => ({ ...value, postalCode: event.target.value }))} />
          <input required placeholder={t.order.city} value={form.city} onChange={(event) => setForm((value) => ({ ...value, city: event.target.value }))} />
        </div>
        <input required placeholder={t.order.phone} value={form.phone} onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} />
        <button type="submit" className="primary-btn" disabled={busy}>
          {t.order.submit}
        </button>
      </form>
    </Modal>
  );
}
