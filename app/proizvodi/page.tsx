"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductCardImageSlider } from "@/components/product-card-image-slider";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";

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
  storageImageIds?: string[];
  storageImages?: StorageImage[];
  primaryImageStorageId?: string;
  primaryImageUrl?: string;
};

type ProductForm = {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  stock: string;
  discount: string;
  recommended: boolean;
  categoryId: string;
  storageImageIds: string[];
  primaryImageStorageId: string | null;
};

type MutationReference = Parameters<typeof useMutation>[0];

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

const emptyForm: ProductForm = {
  title: "",
  subtitle: "",
  description: "",
  price: "",
  stock: "",
  discount: "",
  recommended: false,
  categoryId: "",
  storageImageIds: [],
  primaryImageStorageId: null,
};

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { session } = useAuth();
  const { addItem, itemCount } = useCart();

  const rawProducts = useQuery(api.products.list, {}) as Product[] | undefined;
  const rawCategories = useQuery(api.products.listCategories, {}) as Category[] | undefined;
  const products = rawProducts ?? EMPTY_PRODUCTS;
  const categories = rawCategories ?? EMPTY_CATEGORIES;

  const saveProduct = useMutation(api.products.upsertProduct) as unknown as (args: {
    productId?: string;
    title: string;
    subtitle: string;
    description: string;
    price: number;
    stock: number;
    discount: number;
    recommended?: boolean;
    categoryId: string;
    images: string[];
    storageImageIds?: string[];
    primaryImageStorageId?: string;
    primaryImageUrl?: string;
  }) => Promise<unknown>;

  const setRecommended = useMutation(api.products.setRecommended) as unknown as (args: {
    productId: string;
    recommended: boolean;
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

  const generateUploadUrl = useMutation(
    (
      api as unknown as {
        products: { generateUploadUrl: MutationReference };
      }
    ).products.generateUploadUrl,
  ) as () => Promise<string>;

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "priceAsc" | "priceDesc" | "stockDesc">("featured");

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDiscardCreateModal, setShowDiscardCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [localPreviewByStorageId, setLocalPreviewByStorageId] = useState<Record<string, string>>({});

  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null);
  const [categoryEditInput, setCategoryEditInput] = useState("");
  const [categoryDeleteTarget, setCategoryDeleteTarget] = useState<Category | null>(null);
  const categoryEditInputRef = useRef<HTMLInputElement | null>(null);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recommendedBusyProductId, setRecommendedBusyProductId] = useState<string | null>(null);
  const [isManagingCategory, setIsManagingCategory] = useState(false);
  const [isGlobalFileDrag, setIsGlobalFileDrag] = useState(false);
  const dragDepthRef = useRef(0);
  const uploadFromDropRef = useRef<(files: FileList | null) => void>(() => {});

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

  const categoriesById = useMemo(() => {
    return new Map(categories.map((category) => [category._id, category.name]));
  }, [categories]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
    }
    return counts;
  }, [products]);

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

    if (sortBy === "featured") {
      return [...items].sort((a, b) => {
        const recommendedDelta = Number(Boolean(b.recommended)) - Number(Boolean(a.recommended));
        if (recommendedDelta !== 0) return recommendedDelta;
        const discountDelta = (b.discount ?? 0) - (a.discount ?? 0);
        if (discountDelta !== 0) return discountDelta;
        return b.stock - a.stock;
      });
    }

    if (sortBy === "priceAsc") {
      return [...items].sort((a, b) => getFinalPrice(a) - getFinalPrice(b));
    }

    if (sortBy === "priceDesc") {
      return [...items].sort((a, b) => getFinalPrice(b) - getFinalPrice(a));
    }

    if (sortBy === "stockDesc") {
      return [...items].sort((a, b) => b.stock - a.stock);
    }

    return [...items];
  }, [products, activeCategory, searchTerm, sortBy]);

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

  const hasNewProductDraft = useMemo(() => {
    if (editProductId !== null) return false;
    return (
      form.title.trim().length > 0
      || form.subtitle.trim().length > 0
      || form.description.trim().length > 0
      || form.price.trim().length > 0
      || form.stock.trim().length > 0
      || form.discount.trim().length > 0
      || form.recommended
      || form.categoryId.trim().length > 0
      || form.storageImageIds.length > 0
      || form.primaryImageStorageId !== null
    );
  }, [editProductId, form]);

  const closeProductModal = () => {
    setShowDiscardCreateModal(false);
    setShowProductModal(false);
    setEditProductId(null);
    setForm(emptyForm);
    dragDepthRef.current = 0;
    setIsGlobalFileDrag(false);
    resetLocalPreviews();
  };

  const requestCloseProductModal = () => {
    if (hasNewProductDraft) {
      setShowDiscardCreateModal(true);
      return;
    }
    closeProductModal();
  };

  const openCreate = () => {
    resetLocalPreviews();
    setEditProductId(null);
    setForm(emptyForm);
    setShowDiscardCreateModal(false);
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
      discount: product.discount ? String(product.discount) : "",
      recommended: Boolean(product.recommended),
      categoryId: product.categoryId,
      storageImageIds: [...(product.storageImageIds ?? [])],
      primaryImageStorageId: product.primaryImageStorageId ?? null,
    });
    setShowDiscardCreateModal(false);
    setShowProductModal(true);
  };

  const openProductDetails = (productId: string) => {
    router.push(`/proizvodi/${productId}`);
  };

  const onProductCardKeyDown = (event: KeyboardEvent<HTMLElement>, productId: string) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openProductDetails(productId);
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
          const primaryImageStorageId = current.primaryImageStorageId ?? (ids[0] ?? null);
          return { ...current, storageImageIds: ids, primaryImageStorageId };
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
    setForm((current) => {
      const nextIds = current.storageImageIds.filter((id) => id !== storageId);
      const primaryImageStorageId =
        current.primaryImageStorageId === storageId ? (nextIds[0] ?? null) : current.primaryImageStorageId;
      return { ...current, storageImageIds: nextIds, primaryImageStorageId };
    });
  };

  const setPrimaryStorageImage = (storageId: string) => {
    setForm((current) => ({ ...current, primaryImageStorageId: storageId }));
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
        recommended: form.recommended,
        categoryId: form.categoryId,
        images: preservedExternalImages,
        storageImageIds: form.storageImageIds,
        primaryImageStorageId: form.primaryImageStorageId ?? undefined,
      });
      setFeedback({ type: "success", message: editProductId ? "Proizvod je azuriran." : "Novi proizvod je dodat." });
      closeProductModal();
    } catch {
      setFeedback({ type: "error", message: "Čuvanje proizvoda nije uspelo." });
    } finally {
      setIsSaving(false);
    }
  };

  const onToggleRecommended = async (productId: string, recommended: boolean) => {
    if (!session?.isAdmin) return;
    setRecommendedBusyProductId(productId);
    try {
      await setRecommended({ productId, recommended });
      setFeedback({
        type: "success",
        message: recommended ? "Proizvod je označen kao preporučen." : "Proizvod je uklonjen iz preporučenih.",
      });
    } catch {
      setFeedback({ type: "error", message: "Izmena preporučenog statusa nije uspela." });
    } finally {
      setRecommendedBusyProductId((current) => (current === productId ? null : current));
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
      setFeedback({ type: "error", message: "Dodavanje kategorije nije uspelo." });
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
      setFeedback({ type: "error", message: "Izmena kategorije nije uspela." });
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

  const onAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      setFeedback({ type: "error", message: "Proizvod trenutno nije dostupan." });
      return;
    }

    addItem({
      productId: product._id,
      title: product.title,
      subtitle: product.subtitle,
      image: product.images?.[0] ?? "/logo.png",
      unitPrice: product.price,
      discount: product.discount ?? 0,
      stock: product.stock,
    });
    setFeedback({ type: "success", message: `"${product.title}" je dodat u korpu.` });
  };

  return (
    <section className="page-grid products-page">
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
          {!session?.isAdmin ? (
            <Link href="/korpa" className="ghost-btn">
              Korpa ({itemCount})
            </Link>
          ) : null}
        </div>

        <div className="category-row">
          <button
            className={`category-pill-button ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
            type="button"
          >
            <span className="category-pill-count">{products.length}</span>
            <span className="category-pill-label">{t.products.all}</span>
          </button>
          {categories.map((category) => {
            const isEditing = categoryEditId === category._id;
            const isActive = activeCategory === category._id;
            const categoryCount = categoryCounts.get(category._id) ?? 0;
            return (
              <div key={category._id} className={`category-pill-wrap ${isEditing ? "editing" : ""} ${!isEditing && isActive ? "active" : ""}`}>
                {isEditing ? (
                  <form className="category-pill-edit" onSubmit={(event) => onSubmitCategoryEdit(event, category._id)}>
                    <input
                      ref={categoryEditInputRef}
                      value={categoryEditInput}
                      onChange={(event) => setCategoryEditInput(event.target.value)}
                      aria-label={`Izmeni kategoriju ${category.name}`}
                    />
                    <div className="category-pill-inline-actions">
                      <button
                        type="submit"
                        className="icon-btn icon-btn-circle"
                        aria-label={`Sačuvaj kategoriju ${category.name}`}
                        disabled={isManagingCategory}
                      >
                        <IconCheck />
                      </button>
                      <button type="button" className="icon-btn icon-btn-circle" aria-label="Odustani od izmene" onClick={resetCategoryEditor}>
                        <IconClose />
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button className="category-pill-button" onClick={() => setActiveCategory(category._id)} type="button">
                      <span className="category-pill-count">{categoryCount}</span>
                      <span className="category-pill-label">{category.name}</span>
                    </button>
                    {session?.isAdmin ? (
                      <div className="category-pill-corner-actions">
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
                    ) : null}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {session?.isAdmin ? (
          <form className="inline-form" onSubmit={onCreateCategory}>
            <input value={newCategoryInput} onChange={(event) => setNewCategoryInput(event.target.value)} placeholder="Nova kategorija" />
            <button type="submit" className="primary-btn" disabled={isManagingCategory}>
              Dodaj kategoriju
            </button>
          </form>
        ) : null}
      </section>

      {feedback ? (
        <p className={`status-msg ${feedback.type === "error" ? "admin-status-error" : "admin-status-success"}`}>{feedback.message}</p>
      ) : null}

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
            const stockMeta = getStockMeta(product.stock);
            return (
              <article
                key={product._id}
                className="product-card admin-hover-card cosmic-product-card clickable-product-card"
                role="link"
                tabIndex={0}
                onClick={() => openProductDetails(product._id)}
                onKeyDown={(event) => onProductCardKeyDown(event, product._id)}
              >
                <ProductCardImageSlider
                  images={product.images}
                  alt={product.title}
                  width={420}
                  height={420}
                  sizes="(max-width: 768px) 100vw, 25vw"
                >
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
                </ProductCardImageSlider>
                <div className="card-body">
                  <p className="category-tag">{categoryName}</p>
                  {product.recommended ? <p className="product-recommended-tag">Preporučen proizvod</p> : null}
                  <h3>{product.title}</h3>
                  <p>{product.subtitle}</p>
                  <p className="description-line">{product.description}</p>

                  <div className="price-focus-card">
                    <p className="price-caption">Cena</p>
                    <div className="price-row">
                      <strong>{formatRsd(finalPrice)}</strong>
                      {discount > 0 ? <span className="old-price">{formatRsd(product.price)}</span> : null}
                    </div>
                    {discount > 0 ? <p className="price-saved">Ušteda {formatRsd(product.price - finalPrice)}</p> : null}
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="primary-btn add-cart-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddToCart(product);
                    }}
                    type="button"
                    disabled={product.stock <= 0}
                  >
                    {stockMeta.buttonLabel}
                  </button>
                  {session?.isAdmin ? (
                    <>
                      <label
                        className={`admin-check admin-check-recommended ${product.recommended ? "is-on" : ""}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(product.recommended)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            void onToggleRecommended(product._id, event.target.checked);
                          }}
                          disabled={recommendedBusyProductId === product._id}
                        />
                        <span>Preporučen</span>
                      </label>
                      <button
                        className="ghost-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(product);
                        }}
                        type="button"
                      >
                        {t.products.edit}
                      </button>
                      <button
                        className="ghost-btn danger"
                        onClick={(event) => {
                          event.stopPropagation();
                          setShowDeleteModal(product._id);
                        }}
                        type="button"
                      >
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

      {showProductModal ? (
        <Modal onClose={requestCloseProductModal}>
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
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Popust (%)"
                value={form.discount}
                onChange={(event) => {
                  const digitsOnly = event.target.value.replace(/\D+/g, "");
                  const normalized = digitsOnly.replace(/^0+/, "");
                  setForm((value) => ({ ...value, discount: normalized }));
                }}
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

            <label className={`admin-check admin-check-recommended admin-check-recommended-modal ${form.recommended ? "is-on" : ""}`}>
              <input
                type="checkbox"
                checked={form.recommended}
                onChange={(event) => setForm((value) => ({ ...value, recommended: event.target.checked }))}
              />
              <span>Preporučen proizvod</span>
            </label>

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
                const primaryImageId = form.primaryImageStorageId ?? form.storageImageIds[0] ?? null;
                const isPrimary = storageId === primaryImageId;
                return (
                  <figure key={storageId} className="admin-modal-image">
                    <div className="admin-modal-image-frame">
                      <Image src={previewUrl} alt="Pregled slike" width={480} height={480} unoptimized />
                      {isPrimary ? <span className="admin-image-primary-badge">Glavna</span> : null}
                    </div>
                    <figcaption>Convex slika</figcaption>
                    <div className="admin-modal-image-actions">
                      <button
                        type="button"
                        className="ghost-btn admin-primary-btn"
                        onClick={() => setPrimaryStorageImage(storageId)}
                        disabled={isPrimary}
                      >
                        {isPrimary ? "Glavna slika" : "Postavi kao glavnu"}
                      </button>
                      <button type="button" className="icon-btn danger" onClick={() => removeStorageImage(storageId)}>
                        Ukloni
                      </button>
                    </div>
                  </figure>
                );
              })}
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={requestCloseProductModal}>
                Odustani
              </button>
              <button type="submit" className="primary-btn" disabled={isSaving || isUploading}>
                {isSaving ? "Čuvanje..." : "Sačuvaj proizvod"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {showDiscardCreateModal ? (
        <Modal onClose={() => setShowDiscardCreateModal(false)}>
          <h3>Napustiti unos novog proizvoda?</h3>
          <p>Uneti podaci nece biti sacuvani.</p>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={() => setShowDiscardCreateModal(false)}>
              Nazad
            </button>
            <button type="button" className="primary-btn danger" onClick={closeProductModal}>
              Napusti
            </button>
          </div>
        </Modal>
      ) : null}

      {showDeleteModal ? (
        <Modal onClose={() => setShowDeleteModal(null)}>
          <h3>Da li ste sigurni da želite da obrišete proizvod?</h3>
          <p>Brisu se i sve povezane Convex skladisne slike.</p>
          <div className="modal-actions">
            <button className="ghost-btn" onClick={() => setShowDeleteModal(null)} type="button">
              Odustani
            </button>
            <button className="primary-btn danger" onClick={onDeleteProduct} type="button" disabled={isDeleting}>
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
            <button className="ghost-btn" onClick={() => setCategoryDeleteTarget(null)} type="button">
              Odustani
            </button>
            <button className="primary-btn danger" onClick={onDeleteCategory} type="button" disabled={isManagingCategory}>
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

function getFinalPrice(product: Pick<Product, "price" | "discount">) {
  const discount = product.discount ?? 0;
  if (discount <= 0) return product.price;
  return Math.max(0, Math.round(product.price * (1 - discount / 100)));
}

type StockTone = "ready" | "low" | "critical" | "out";

function getStockMeta(stock: number): {
  tone: StockTone;
  badgeText: string;
  buttonLabel: string;
} {
  const safeStock = Math.max(0, Math.floor(stock));

  if (safeStock === 0) {
    return {
      tone: "out",
      badgeText: "Rasprodato",
      buttonLabel: "Rasprodato",
    };
  }

  if (safeStock <= 3) {
    return {
      tone: "critical",
      badgeText: `Samo ${safeStock}`,
      buttonLabel: "Dodaj odmah",
    };
  }

  if (safeStock <= 10) {
    return {
      tone: "low",
      badgeText: `Stanje ${safeStock}`,
      buttonLabel: "Dodaj u korpu",
    };
  }

  return {
    tone: "ready",
    badgeText: `Stanje ${safeStock}`,
    buttonLabel: "Dodaj u korpu",
  };
}

const rsdFormatter = new Intl.NumberFormat("sr-Latn-RS");

function formatRsd(value: number) {
  return `${rsdFormatter.format(Math.max(0, Math.round(value)))} RSD`;
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
        <button className="modal-close" onClick={onClose} type="button" aria-label="Zatvori">
          <IconClose />
        </button>
        {children}
      </div>
    </div>
  );
}
