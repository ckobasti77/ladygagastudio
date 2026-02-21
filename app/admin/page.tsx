"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";

type Category = { _id: string; name: string; featuredOnHome?: boolean };
type StorageImage = { storageId: string; url: string };
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
  storageImages?: StorageImage[];
};

type ProductForm = {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  stock: string;
  discount: string;
  categoryId: string;
  storageImageIds: string[];
};

type StockFilter = "all" | "inStock" | "lowStock" | "outOfStock";
type SortBy = "titleAsc" | "priceAsc" | "priceDesc" | "stockDesc" | "discountDesc" | "valueDesc";
type SalesSortBy = "soldDesc" | "soldAsc" | "revenueDesc" | "ordersDesc" | "lastSoldDesc";
type MutationReference = Parameters<typeof useMutation>[0];

type SalesAnalytics = {
  summary: {
    ordersCount: number;
    totalItems: number;
    totalAmount: number;
    uniqueProducts: number;
  };
  products: Array<{
    productId: string;
    title: string;
    soldQuantity: number;
    revenue: number;
    ordersCount: number;
    lastSoldAt: number;
    currentStock: number;
    categoryName: string;
  }>;
};

const LOW_STOCK_LIMIT = 5;

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

const emptyForm: ProductForm = {
  title: "",
  subtitle: "",
  description: "",
  price: "",
  stock: "",
  discount: "0",
  categoryId: "",
  storageImageIds: [],
};

function finalPrice(product: Pick<Product, "price" | "discount">) {
  const discount = product.discount ?? 0;
  if (discount <= 0) return product.price;
  return Math.max(0, Math.round(product.price * (1 - discount / 100)));
}

function formatRsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 RSD";
  return `${Math.round(value).toLocaleString("sr-Latn-RS")} RSD`;
}

type StockTone = "ready" | "low" | "critical" | "out";

function getStockMeta(stock: number): {
  tone: StockTone;
  badgeText: string;
} {
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

export default function AdminPage() {
  const router = useRouter();
  const { session } = useAuth();

  const rawProducts = useQuery(api.products.list, {}) as Product[] | undefined;
  const rawCategories = useQuery(api.products.listCategories, {}) as Category[] | undefined;
  const rawSales = useQuery(api.orders.salesAnalytics, {}) as SalesAnalytics | undefined;
  const products = rawProducts ?? EMPTY_PRODUCTS;
  const categories = rawCategories ?? EMPTY_CATEGORIES;
  const sales = rawSales?.products ?? [];
  const salesSummary = rawSales?.summary ?? { ordersCount: 0, totalItems: 0, totalAmount: 0, uniqueProducts: 0 };

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

  const removeProduct = useMutation(api.products.deleteProduct) as unknown as (args: { productId: string }) => Promise<unknown>;
  const saveCategory = useMutation(api.products.upsertCategory) as unknown as (args: {
    name: string;
    categoryId?: string;
  }) => Promise<unknown>;
  const removeCategory = useMutation(api.products.deleteCategory) as unknown as (args: {
    categoryId: string;
  }) => Promise<unknown>;
  const setCategoryFeaturedOnHome = useMutation(
    (
      api as unknown as {
        products: { setCategoryFeaturedOnHome: MutationReference };
      }
    ).products.setCategoryFeaturedOnHome,
  ) as (args: { categoryId: string; featuredOnHome: boolean }) => Promise<unknown>;
  const generateUploadUrl = useMutation(
    (
      api as unknown as {
        products: { generateUploadUrl: MutationReference };
      }
    ).products.generateUploadUrl,
  ) as () => Promise<string>;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("valueDesc");
  const [salesSortBy, setSalesSortBy] = useState<SalesSortBy>("soldDesc");
  const [salesSearch, setSalesSearch] = useState("");

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [localPreviewByStorageId, setLocalPreviewByStorageId] = useState<Record<string, string>>({});

  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryEditInput, setCategoryEditInput] = useState("");
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null);
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<Category | null>(null);
  const categoryEditInputRef = useRef<HTMLInputElement | null>(null);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManagingCategory, setIsManagingCategory] = useState(false);
  const [featuredCategoryBusyId, setFeaturedCategoryBusyId] = useState<string | null>(null);
  const [isGlobalFileDrag, setIsGlobalFileDrag] = useState(false);
  const dragDepthRef = useRef(0);
  const uploadFromDropRef = useRef<(files: FileList | null) => void>(() => {});

  useEffect(() => {
    if (session && !session.isAdmin) {
      router.replace("/");
    }
  }, [router, session]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!categoryEditId || !categoryEditInputRef.current) return;
    const input = categoryEditInputRef.current;
    input.focus();
    input.setSelectionRange(0, input.value.length);
  }, [categoryEditId]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category._id, category.name])),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const min = priceMin.trim() === "" ? null : Number(priceMin);
    const max = priceMax.trim() === "" ? null : Number(priceMax);
    const hasMin = min !== null && Number.isFinite(min);
    const hasMax = max !== null && Number.isFinite(max);

    const filtered = products.filter((product) => {
      if (activeCategory !== "all" && product.categoryId !== activeCategory) return false;
      if (stockFilter === "inStock" && product.stock <= 0) return false;
      if (stockFilter === "lowStock" && !(product.stock > 0 && product.stock <= LOW_STOCK_LIMIT)) return false;
      if (stockFilter === "outOfStock" && product.stock !== 0) return false;
      if (discountOnly && (product.discount ?? 0) <= 0) return false;

      const price = finalPrice(product);
      if (hasMin && min !== null && price < min) return false;
      if (hasMax && max !== null && price > max) return false;

      if (!query) return true;
      return [product.title, product.subtitle, product.description].join(" ").toLowerCase().includes(query);
    });

    if (sortBy === "titleAsc") {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title, "sr-Latn-RS"));
    }
    if (sortBy === "priceAsc") {
      return [...filtered].sort((a, b) => finalPrice(a) - finalPrice(b));
    }
    if (sortBy === "priceDesc") {
      return [...filtered].sort((a, b) => finalPrice(b) - finalPrice(a));
    }
    if (sortBy === "stockDesc") {
      return [...filtered].sort((a, b) => b.stock - a.stock);
    }
    if (sortBy === "discountDesc") {
      return [...filtered].sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0));
    }
    return [...filtered].sort((a, b) => finalPrice(b) * b.stock - finalPrice(a) * a.stock);
  }, [activeCategory, discountOnly, priceMax, priceMin, products, searchTerm, sortBy, stockFilter]);

  const stats = useMemo(() => {
    const totalCount = products.length;
    const totalStock = products.reduce((sum, item) => sum + item.stock, 0);
    const lowStock = products.filter((item) => item.stock > 0 && item.stock <= LOW_STOCK_LIMIT).length;
    const outOfStock = products.filter((item) => item.stock === 0).length;
    const discounted = products.filter((item) => (item.discount ?? 0) > 0).length;
    const inventoryValue = products.reduce((sum, item) => sum + finalPrice(item) * item.stock, 0);
    return { totalCount, totalStock, lowStock, outOfStock, discounted, inventoryValue };
  }, [products]);

  const filteredSales = useMemo(() => {
    const query = salesSearch.trim().toLowerCase();
    const filtered = sales.filter((row) => {
      if (!query) return true;
      return `${row.title} ${row.categoryName}`.toLowerCase().includes(query);
    });

    if (salesSortBy === "soldAsc") {
      return [...filtered].sort((a, b) => a.soldQuantity - b.soldQuantity);
    }
    if (salesSortBy === "revenueDesc") {
      return [...filtered].sort((a, b) => b.revenue - a.revenue);
    }
    if (salesSortBy === "ordersDesc") {
      return [...filtered].sort((a, b) => b.ordersCount - a.ordersCount);
    }
    if (salesSortBy === "lastSoldDesc") {
      return [...filtered].sort((a, b) => b.lastSoldAt - a.lastSoldAt);
    }
    return [...filtered].sort((a, b) => b.soldQuantity - a.soldQuantity);
  }, [sales, salesSearch, salesSortBy]);

  const filtersApplied = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count += 1;
    if (activeCategory !== "all") count += 1;
    if (stockFilter !== "all") count += 1;
    if (discountOnly) count += 1;
    if (priceMin.trim()) count += 1;
    if (priceMax.trim()) count += 1;
    if (sortBy !== "valueDesc") count += 1;
    return count;
  }, [activeCategory, discountOnly, priceMax, priceMin, searchTerm, sortBy, stockFilter]);

  const editingProduct = useMemo(
    () => products.find((product) => product._id === editProductId) ?? null,
    [editProductId, products],
  );

  const storagePreviewById = useMemo(() => {
    const map = new Map<string, string>();
    for (const image of editingProduct?.storageImages ?? []) {
      map.set(image.storageId, image.url);
    }
    return map;
  }, [editingProduct]);

  const preservedExternalImages = useMemo(() => {
    if (!editingProduct) return [];
    const storageUrls = new Set((editingProduct.storageImages ?? []).map((image) => image.url));
    return editingProduct.images.filter((url) => !storageUrls.has(url));
  }, [editingProduct]);

  const resetLocalPreviews = () => {
    setLocalPreviewByStorageId((current) => {
      for (const url of Object.values(current)) {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      }
      return {};
    });
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditProductId(null);
    setForm(emptyForm);
    dragDepthRef.current = 0;
    setIsGlobalFileDrag(false);
    resetLocalPreviews();
  };

  const openCreate = () => {
    resetLocalPreviews();
    setEditProductId(null);
    setForm(emptyForm);
    setShowProductModal(true);
  };

  const openEdit = (product: Product) => {
    resetLocalPreviews();
    setEditProductId(product._id);
    setForm({
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      discount: String(product.discount ?? 0),
      categoryId: product.categoryId,
      storageImageIds: [...(product.storageImageIds ?? [])],
    });
    setShowProductModal(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setActiveCategory("all");
    setStockFilter("all");
    setDiscountOnly(false);
    setPriceMin("");
    setPriceMax("");
    setSortBy("valueDesc");
  };

  const onUploadImages = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setFeedback({ type: "error", message: "Dozvoljeno je samo otpremanje slika." });
      return;
    }

    setIsUploading(true);
    try {
      const uploaded: { storageId: string; previewUrl: string }[] = [];
      let failed = 0;
      for (const file of imageFiles) {
        try {
          const uploadUrl = await generateUploadUrl();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });

          if (!response.ok) {
            failed += 1;
            continue;
          }

          const payload = (await response.json()) as { storageId?: string };
          if (!payload.storageId) {
            failed += 1;
            continue;
          }

          uploaded.push({ storageId: payload.storageId, previewUrl: URL.createObjectURL(file) });
        } catch {
          failed += 1;
        }
      }

      if (uploaded.length > 0) {
        setLocalPreviewByStorageId((current) => {
          const next = { ...current };
          for (const item of uploaded) {
            next[item.storageId] = item.previewUrl;
          }
          return next;
        });

        setForm((current) => {
          const ids = [...current.storageImageIds];
          for (const item of uploaded) {
            if (!ids.includes(item.storageId)) {
              ids.push(item.storageId);
            }
          }
          return { ...current, storageImageIds: ids };
        });
      }

      if (uploaded.length > 0 && failed === 0) {
        setFeedback({ type: "success", message: `Dodato slika: ${uploaded.length}.` });
      } else if (uploaded.length > 0 && failed > 0) {
        setFeedback({
          type: "error",
          message: `Dodato slika: ${uploaded.length}, neuspešnih otpremanja: ${failed}.`,
        });
      } else {
        setFeedback({ type: "error", message: "Otpremanje nije uspelo. Pokušajte ponovo." });
      }
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl]);

  useEffect(() => {
    uploadFromDropRef.current = (files) => {
      void onUploadImages(files);
    };
  }, [onUploadImages]);

  useEffect(() => {
    if (!showProductModal) {
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
      return;
    }

    const isFileDrag = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsGlobalFileDrag(true);
    };

    const onDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      setIsGlobalFileDrag(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsGlobalFileDrag(false);
      }
    };

    const onDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
      uploadFromDropRef.current(event.dataTransfer?.files ?? null);
    };

    const onDragEnd = () => {
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
    };

    window.addEventListener("dragenter", onDragEnter, true);
    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("dragleave", onDragLeave, true);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("dragend", onDragEnd, true);

    return () => {
      window.removeEventListener("dragenter", onDragEnter, true);
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("dragleave", onDragLeave, true);
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("dragend", onDragEnd, true);
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
    };
  }, [showProductModal]);

  const removeStorageImage = (storageId: string) => {
    const localUrl = localPreviewByStorageId[storageId];
    if (localUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(localUrl);
    }
    setLocalPreviewByStorageId((current) => {
      if (!current[storageId]) return current;
      const next = { ...current };
      delete next[storageId];
      return next;
    });
    setForm((current) => ({
      ...current,
      storageImageIds: current.storageImageIds.filter((id) => id !== storageId),
    }));
  };

  const onSaveProduct = async (event: FormEvent) => {
    event.preventDefault();
    const price = Number(form.price);
    const stock = Number(form.stock || 0);
    const discount = Number(form.discount || 0);
    if (!Number.isFinite(price) || price < 0) {
      setFeedback({ type: "error", message: "Cena mora biti validan broj veći ili jednak nuli." });
      return;
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setFeedback({ type: "error", message: "Stanje mora biti validan broj veći ili jednak nuli." });
      return;
    }
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      setFeedback({ type: "error", message: "Popust mora biti između 0 i 100." });
      return;
    }
    if (!form.categoryId) {
      setFeedback({ type: "error", message: "Kategorija je obavezna." });
      return;
    }

    setIsSaving(true);
    try {
      await saveProduct({
        productId: editProductId ?? undefined,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        price,
        stock,
        discount,
        categoryId: form.categoryId,
        images: preservedExternalImages,
        storageImageIds: form.storageImageIds,
      });
      setFeedback({ type: "success", message: editProductId ? "Proizvod je ažuriran." : "Novi proizvod je dodat." });
      closeProductModal();
    } catch {
      setFeedback({ type: "error", message: "Čuvanje proizvoda nije uspelo." });
    } finally {
      setIsSaving(false);
    }
  };

  const onDeleteProduct = async () => {
    if (!showDeleteModal) return;
    setIsDeleting(true);
    try {
      await removeProduct({ productId: showDeleteModal });
      setFeedback({ type: "success", message: "Proizvod je obrisan." });
      setShowDeleteModal(null);
    } catch {
      setFeedback({ type: "error", message: "Brisanje proizvoda nije uspelo." });
    } finally {
      setIsDeleting(false);
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
    setIsManagingCategory(true);
    try {
      await saveCategory({ name: trimmed });
      setFeedback({ type: "success", message: "Kategorija je dodata." });
      setNewCategoryInput("");
    } catch {
      setFeedback({ type: "error", message: "Sačuvavanje kategorije nije uspelo." });
    } finally {
      setIsManagingCategory(false);
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
    setIsManagingCategory(true);
    try {
      await saveCategory({ name: trimmed, categoryId });
      setFeedback({ type: "success", message: "Kategorija je izmenjena." });
      resetCategoryEditor();
    } catch {
      setFeedback({ type: "error", message: "Sačuvavanje kategorije nije uspelo." });
    } finally {
      setIsManagingCategory(false);
    }
  };

  const onDeleteCategory = async () => {
    if (!categoryDeleteTarget) return;
    setIsManagingCategory(true);
    try {
      await removeCategory({ categoryId: categoryDeleteTarget._id });
      if (activeCategory === categoryDeleteTarget._id) setActiveCategory("all");
      if (categoryEditId === categoryDeleteTarget._id) resetCategoryEditor();
      setCategoryDeleteTarget(null);
      setFeedback({ type: "success", message: "Kategorija je obrisana." });
    } catch {
      setFeedback({ type: "error", message: "Kategorija je povezana sa proizvodima i ne može da se obriše." });
    } finally {
      setIsManagingCategory(false);
    }
  };

  const onToggleCategoryFeatured = async (category: Category) => {
    const isFeaturedNow = category.featuredOnHome !== false;
    const nextValue = !isFeaturedNow;
    setFeaturedCategoryBusyId(category._id);
    try {
      await setCategoryFeaturedOnHome({ categoryId: category._id, featuredOnHome: nextValue });
      setFeedback({
        type: "success",
        message: nextValue
          ? `Kategorija "${category.name}" je istaknuta na početnoj.`
          : `Kategorija "${category.name}" je uklonjena sa istaknutih na početnoj.`,
      });
    } catch {
      setFeedback({ type: "error", message: "Izmena istaknute kategorije nije uspela." });
    } finally {
      setFeaturedCategoryBusyId((current) => (current === category._id ? null : current));
    }
  };

  if (!session) {
    return (
      <section className="page-grid admin-page">
        <section className="empty-state">
          <h3>Morate biti prijavljeni kao admin.</h3>
          <p>Prijavite se pa otvorite admin tab ponovo.</p>
          <button type="button" className="primary-btn" onClick={() => router.push("/prijava")}>
            Idi na prijavu
          </button>
        </section>
      </section>
    );
  }

  if (!session.isAdmin) {
    return null;
  }

  const loading = rawProducts === undefined || rawCategories === undefined;

  return (
    <section className="page-grid admin-page">
      <section className="hero admin-hero">
        <div>
          <p className="eyebrow">Kontrolni centar</p>
          <h1>Administracija studija</h1>
          <p className="subtitle">Moderni kontrolni panel za katalog, lager i Convex čuvanje slika.</p>
        </div>
        <div className="admin-hero-actions">
          <button type="button" className="primary-btn" onClick={openCreate}>
            Novi proizvod
          </button>
          <button type="button" className="ghost-btn" onClick={() => router.push("/admin/ponude")}>
            Ponude mejlom
          </button>
          <button type="button" className="ghost-btn" onClick={clearFilters}>
            Poništi filtere
          </button>
        </div>
      </section>

      <section className="dashboard-grid admin-kpi-grid">
        <article className="metric-card">
          <span>Proizvodi</span>
          <strong>{stats.totalCount}</strong>
        </article>
        <article className="metric-card">
          <span>Ukupno komada</span>
          <strong>{stats.totalStock}</strong>
        </article>
        <article className="metric-card">
          <span>Nizak lager</span>
          <strong>{stats.lowStock}</strong>
        </article>
        <article className="metric-card">
          <span>Rasprodato</span>
          <strong>{stats.outOfStock}</strong>
        </article>
        <article className="metric-card">
          <span>Na akciji</span>
          <strong>{stats.discounted}</strong>
        </article>
        <article className="metric-card">
          <span>Vrednost lagera</span>
          <strong>{stats.inventoryValue.toLocaleString("sr-Latn-RS")} RSD</strong>
        </article>
      </section>

      <section className="toolbar-card admin-sales-card">
        <div className="admin-sales-head">
          <div>
            <h2>Prodaja proizvoda</h2>
            <p>Tracking po proizvodu: prodato, broj porudzbina, prihod i poslednja prodaja.</p>
          </div>
          <div className="admin-sales-controls">
            <input
              value={salesSearch}
              onChange={(event) => setSalesSearch(event.target.value)}
              placeholder="Pretraga prodaje po proizvodu ili kategoriji"
              aria-label="Pretraga prodaje"
            />
            <select value={salesSortBy} onChange={(event) => setSalesSortBy(event.target.value as SalesSortBy)}>
              <option value="soldDesc">Sort: najprodavaniji</option>
              <option value="soldAsc">Sort: najmanje prodato</option>
              <option value="revenueDesc">Sort: najveci prihod</option>
              <option value="ordersDesc">Sort: najvise porudzbina</option>
              <option value="lastSoldDesc">Sort: najnovija prodaja</option>
            </select>
          </div>
        </div>

        <div className="dashboard-grid admin-sales-kpis">
          <article className="metric-card">
            <span>Ukupno porudzbina</span>
            <strong>{salesSummary.ordersCount}</strong>
          </article>
          <article className="metric-card">
            <span>Ukupno prodato komada</span>
            <strong>{salesSummary.totalItems}</strong>
          </article>
          <article className="metric-card">
            <span>Ukupan promet</span>
            <strong>{formatRsd(salesSummary.totalAmount)}</strong>
          </article>
          <article className="metric-card">
            <span>Proizvoda sa prodajom</span>
            <strong>{salesSummary.uniqueProducts}</strong>
          </article>
        </div>

        {rawSales === undefined ? (
          <p className="admin-sales-empty">Ucitavanje prodajne analitike...</p>
        ) : filteredSales.length === 0 ? (
          <p className="admin-sales-empty">Trenutno nema podataka o prodaji za zadati filter.</p>
        ) : (
          <div className="admin-sales-table">
            <div className="admin-sales-table-head">
              <span>Proizvod</span>
              <span>Prodato</span>
              <span>Porudzbine</span>
              <span>Prihod</span>
              <span>Lager</span>
              <span>Poslednja prodaja</span>
            </div>
            {filteredSales.map((row) => (
              <article key={row.productId} className="admin-sales-row">
                <div>
                  <strong>{row.title}</strong>
                  <p>{row.categoryName}</p>
                </div>
                <span>{row.soldQuantity}</span>
                <span>{row.ordersCount}</span>
                <span>{formatRsd(row.revenue)}</span>
                <span className={row.currentStock <= LOW_STOCK_LIMIT ? "sales-stock-low" : "sales-stock-ok"}>
                  {row.currentStock}
                </span>
                <span>
                  {row.lastSoldAt > 0
                    ? new Date(row.lastSoldAt).toLocaleString("sr-Latn-RS", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="toolbar-card admin-filter-card">
        <div className="admin-filter-grid">
          <input
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Brza pretraga po nazivu, opisu i podnaslovu"
            aria-label="Pretraga proizvoda"
          />

          <select className="sort-select" value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
            <option value="all">Sve kategorije</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <select className="sort-select" value={stockFilter} onChange={(event) => setStockFilter(event.target.value as StockFilter)}>
            <option value="all">Sve stanje lagera</option>
            <option value="inStock">Na stanju</option>
            <option value="lowStock">Nizak lager</option>
            <option value="outOfStock">Rasprodato</option>
          </select>

          <select className="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
            <option value="valueDesc">Sortiranje: vrednost lagera</option>
            <option value="titleAsc">Sortiranje: naziv A-Z</option>
            <option value="priceAsc">Sortiranje: cena rastuće</option>
            <option value="priceDesc">Sortiranje: cena opadajuće</option>
            <option value="stockDesc">Sortiranje: stanje lagera</option>
            <option value="discountDesc">Sortiranje: najveći popust</option>
          </select>

          <input
            type="number"
            value={priceMin}
            onChange={(event) => setPriceMin(event.target.value)}
            placeholder="Cena od (RSD)"
            aria-label="Minimalna cena"
          />
          <input
            type="number"
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            placeholder="Cena do (RSD)"
            aria-label="Maksimalna cena"
          />
        </div>

        <div className="admin-filter-row">
          <label className="admin-check">
            <input type="checkbox" checked={discountOnly} onChange={(event) => setDiscountOnly(event.target.checked)} />
            Samo proizvodi na akciji
          </label>
          <p className="admin-filter-summary">
            Prikazano: <strong>{filteredProducts.length}</strong> / {products.length}
            {filtersApplied > 0 ? `, aktivnih filtera: ${filtersApplied}` : ""}
          </p>
        </div>
      </section>

      <section className="toolbar-card admin-categories-card">
        <div className="admin-categories-head">
          <h2>Kategorije</h2>
          <span>Upravljanje i brza navigacija kroz katalog</span>
        </div>

        <form className="inline-form" onSubmit={onCreateCategory}>
          <input
            value={newCategoryInput}
            onChange={(event) => setNewCategoryInput(event.target.value)}
            placeholder="Dodaj novu kategoriju"
          />
          <button type="submit" className="primary-btn" disabled={isManagingCategory}>
            Dodaj kategoriju
          </button>
        </form>

        <div className="admin-category-list">
          {categories.map((category) => {
            const isEditing = categoryEditId === category._id;
            const isFeaturedForHome = category.featuredOnHome !== false;
            return (
              <article key={category._id} className={`admin-category-item ${isEditing ? "editing" : ""}`}>
                {isEditing ? (
                  <form className="admin-category-main admin-category-inline-edit" onSubmit={(event) => onSubmitCategoryEdit(event, category._id)}>
                    <input
                      ref={categoryEditInputRef}
                      value={categoryEditInput}
                      onChange={(event) => setCategoryEditInput(event.target.value)}
                      aria-label={`Izmeni kategoriju ${category.name}`}
                    />
                    <div className="admin-category-inline-actions">
                      <button type="submit" className="icon-btn icon-btn-circle" aria-label={`Sačuvaj kategoriju ${category.name}`} disabled={isManagingCategory}>
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
                      type="button"
                      className={`admin-category-main ${activeCategory === category._id ? "active" : ""}`}
                      onClick={() => setActiveCategory(category._id)}
                    >
                      <span>{category.name}</span>
                      <strong>{categoryCounts.get(category._id) ?? 0}</strong>
                    </button>
                    <div className="admin-category-corner-actions">
                      <label className={`admin-category-feature-check ${isFeaturedForHome ? "is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={isFeaturedForHome}
                          onChange={() => void onToggleCategoryFeatured(category)}
                          aria-label={`Prikaži kategoriju ${category.name} u home sliderima`}
                          disabled={featuredCategoryBusyId === category._id || isManagingCategory}
                        />
                        <span>Pocetni klizac</span>
                      </label>
                      <button
                        type="button"
                        className="icon-btn icon-btn-circle"
                        onClick={() => startCategoryEdit(category)}
                        aria-label={`Izmeni ${category.name}`}
                        disabled={isManagingCategory}
                      >
                        <IconEdit />
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger icon-btn-circle"
                        onClick={() => setCategoryDeleteTarget(category)}
                        aria-label={`Obriši ${category.name}`}
                        disabled={isManagingCategory}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {feedback ? (
        <p className={`status-msg ${feedback.type === "error" ? "admin-status-error" : "admin-status-success"}`}>{feedback.message}</p>
      ) : null}

      {loading ? (
        <section className="loading-card">Učitavanje podataka...</section>
      ) : filteredProducts.length === 0 ? (
        <section className="empty-state">
          <h3>Nema rezultata za izabrane filtere.</h3>
          <p>Promenite filtere ili resetujte prikaz.</p>
        </section>
      ) : (
        <section className="admin-product-grid">
          {filteredProducts.map((product) => {
            const discount = product.discount ?? 0;
            const resolvedPrice = finalPrice(product);
            const stockMeta = getStockMeta(product.stock);
            return (
              <article key={product._id} className="admin-product-card product-card cosmic-product-card">
                <div className="admin-card-media card-media-wrap">
                  <Image
                    src={product.images[0] ?? "/logo.png"}
                    alt={product.title}
                    width={640}
                    height={640}
                    sizes="(max-width: 768px) 100vw, 25vw"
                    loading="lazy"
                  />
                  <span className={`product-stock-chip ${stockMeta.tone}`}>
                    <span className="product-stock-dot" aria-hidden="true" />
                    {stockMeta.badgeText}
                  </span>
                  {discount > 0 ? (
                    <span className="discount-star-badge" aria-label={`Popust ${discount}%`}>
                      <strong>-{discount}%</strong>
                      <small>POPUST</small>
                    </span>
                  ) : null}
                </div>
                <div className="card-body admin-card-body">
                  <p className="category-tag">{categoriesById.get(product.categoryId) ?? "Bez kategorije"}</p>
                  <h3>{product.title}</h3>
                  <p>{product.subtitle}</p>
                  <p className="description-line">{product.description}</p>

                  <div className="price-focus-card">
                    <p className="price-caption">Cena</p>
                    <div className="price-row">
                      <strong>{formatRsd(resolvedPrice)}</strong>
                      {discount > 0 ? <span className="old-price">{formatRsd(product.price)}</span> : null}
                    </div>
                    {discount > 0 ? <p className="price-saved">Usteda {formatRsd(product.price - resolvedPrice)}</p> : null}
                  </div>
                </div>
                <div className="card-actions admin-card-actions">
                  <button type="button" className="ghost-btn" onClick={() => openEdit(product)}>
                    Izmeni
                  </button>
                  <button type="button" className="ghost-btn danger" onClick={() => setShowDeleteModal(product._id)}>
                    Obriši
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {showProductModal ? (
        <Modal onClose={closeProductModal}>
          <h2>{editProductId ? "Izmena proizvoda" : "Novi proizvod"}</h2>
          <form className="modal-form admin-product-form" onSubmit={onSaveProduct}>
            <div className="form-row-2">
              <input
                required
                placeholder="Naziv proizvoda"
                value={form.title}
                onChange={(event) => setForm((value) => ({ ...value, title: event.target.value }))}
              />
              <input
                required
                placeholder="Podnaslov"
                value={form.subtitle}
                onChange={(event) => setForm((value) => ({ ...value, subtitle: event.target.value }))}
              />
            </div>

            <textarea
              required
              placeholder="Opis proizvoda"
              value={form.description}
              onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))}
            />

            <div className="admin-form-grid-4">
              <input
                required
                type="number"
                min={0}
                placeholder="Cena"
                value={form.price}
                onChange={(event) => setForm((value) => ({ ...value, price: event.target.value }))}
              />
              <input
                type="number"
                min={0}
                placeholder="Stanje"
                value={form.stock}
                onChange={(event) => setForm((value) => ({ ...value, stock: event.target.value }))}
              />
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Popust %"
                value={form.discount}
                onChange={(event) => setForm((value) => ({ ...value, discount: event.target.value }))}
              />
              <select required value={form.categoryId} onChange={(event) => setForm((value) => ({ ...value, categoryId: event.target.value }))}>
                <option value="">Kategorija</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`admin-image-upload-wrap ${isGlobalFileDrag ? "drop-active" : ""}`}>
              <label className={`admin-image-upload ${isGlobalFileDrag ? "drop-active" : ""}`}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    void onUploadImages(event.target.files);
                    event.currentTarget.value = "";
                  }}
                  disabled={isUploading}
                />
                <span>{isUploading ? "Otpremanje u toku..." : "Dodaj slike sa uređaja (Convex skladište)"}</span>
              </label>
              <p className="admin-image-note">
                {isGlobalFileDrag
                  && "Spustite slike bilo gde na ekranu da se automatski otpreme."}
              </p>
            </div>

            <div className="admin-modal-images">
              {form.storageImageIds.map((storageId) => {
                const previewUrl = localPreviewByStorageId[storageId] ?? storagePreviewById.get(storageId) ?? null;
                if (!previewUrl) return null;
                return (
                  <figure key={storageId} className="admin-modal-image">
                    <Image src={previewUrl} alt="Pregled slike" width={480} height={480} unoptimized />
                    <figcaption>Convex slika</figcaption>
                    <button type="button" className="icon-btn danger" onClick={() => removeStorageImage(storageId)}>
                      Ukloni
                    </button>
                  </figure>
                );
              })}
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeProductModal}>
                Odustani
              </button>
              <button type="submit" className="primary-btn" disabled={isSaving || isUploading}>
                {isSaving ? "Čuvanje..." : "Sačuvaj proizvod"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showDeleteModal ? (
        <Modal onClose={() => setShowDeleteModal(null)}>
          <h3>Da li ste sigurni da želite da obrišete proizvod?</h3>
          <p>Brišu se i sve povezane Convex skladišne slike.</p>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={() => setShowDeleteModal(null)}>
              Odustani
            </button>
            <button type="button" className="primary-btn danger" disabled={isDeleting} onClick={onDeleteProduct}>
              {isDeleting ? "Brisanje..." : "Potvrdi brisanje"}
            </button>
          </div>
        </Modal>
      ) : null}

      {categoryDeleteTarget ? (
        <Modal onClose={() => setCategoryDeleteTarget(null)}>
          <h3>Da li ste sigurni da želite da obrišete kategoriju &quot;{categoryDeleteTarget.name}&quot;?</h3>
          <p>Ako je kategorija povezana sa proizvodima, brisanje neće uspeti.</p>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={() => setCategoryDeleteTarget(null)}>
              Odustani
            </button>
            <button type="button" className="primary-btn danger" disabled={isManagingCategory} onClick={onDeleteCategory}>
              {isManagingCategory ? "Brisanje..." : "Potvrdi brisanje"}
            </button>
          </div>
        </Modal>
      ) : null}

      {showProductModal && isGlobalFileDrag ? (
        <div className="admin-drop-overlay" aria-hidden="true">
          <div className="admin-drop-overlay-card">
            <strong>Spusti slike bilo gde</strong>
            <p>Otpustite fajlove i otpremanje će krenuti odmah.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
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
      <div className="modal-card admin-modal-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Zatvori">
          x
        </button>
        {children}
      </div>
    </div>
  );
}
