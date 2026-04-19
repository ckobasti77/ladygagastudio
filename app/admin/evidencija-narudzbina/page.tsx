"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { markAdminOrdersSeen } from "@/lib/admin-orders-badge";
import { sendOrderTrackingEmail } from "./actions";
import styles from "./page.module.css";

type OrderStatus = "pending" | "processed" | "completed";
type OrderStatusFilter = "all" | OrderStatus;
type SortBy = "newest" | "oldest" | "amountDesc" | "amountAsc" | "customerAsc";

type AdminOrder = {
  _id: string;
  orderNumber: string;
  createdAt: number;
  status: OrderStatus;
  trackingNumber?: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    street: string;
    number: string;
    postalCode: string;
    city: string;
    phone: string;
    note?: string;
  };
  totals: {
    totalItems: number;
    totalAmount: number;
  };
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    finalUnitPrice: number;
    lineTotal: number;
    imageUrl: string | null;
  }>;
};

const EMPTY_ORDERS: AdminOrder[] = [];
const PAGE_SIZE_OPTIONS = [10, 20, 40] as const;

function formatRsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 RSD";
  return `${Math.round(value).toLocaleString("sr-Latn-RS")} RSD`;
}

function formatDateTime(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
  return new Date(timestamp).toLocaleString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: OrderStatus) {
  if (status === "processed") return "U obradi";
  if (status === "completed") return "Završeno";
  return "Novo";
}

function normalizeText(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getCustomerFullName(order: AdminOrder) {
  return `${order.customer.firstName} ${order.customer.lastName}`.trim();
}

async function copyTextToClipboard(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard API nije dostupna.");
  }
}

export default function AdminOrdersLedgerPage() {
  const router = useRouter();
  const { session } = useAuth();

  const rawOrders = useQuery(api.orders.listOrdersForAdmin, {}) as AdminOrder[] | undefined;
  const setOrderStatus = useMutation(api.orders.setOrderStatus) as unknown as (args: {
    orderId: string;
    status: OrderStatus;
    trackingNumber?: string;
  }) => Promise<unknown>;
  const deleteOrder = useMutation(api.orders.deleteOrder) as unknown as (args: {
    orderId: string;
  }) => Promise<{ restockedQuantity: number; missingProductsCount: number }>;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [noteOnly, setNoteOnly] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trackingTarget, setTrackingTarget] = useState<AdminOrder | null>(null);
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTrackingSubmitting, setIsTrackingSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (session && !session.isAdmin) {
      router.replace("/");
    }
  }, [router, session]);

  useEffect(() => {
    if (!session?.isAdmin) {
      return;
    }

    markAdminOrdersSeen();
  }, [session]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const orders = rawOrders ?? EMPTY_ORDERS;
  const loading = rawOrders === undefined;

  const statusClassByValue: Record<OrderStatus, string> = {
    pending: styles.statusPending,
    processed: styles.statusProcessed,
    completed: styles.statusCompleted,
  };

  const cityOptions = useMemo(() => {
    const values = new Set<string>();
    for (const order of orders) {
      const city = order.customer.city.trim();
      if (city) values.add(city);
    }
    return [...values].sort((a, b) => a.localeCompare(b, "sr-Latn-RS"));
  }, [orders]);

  const summary = useMemo(() => {
    let pending = 0;
    let processed = 0;
    let completed = 0;
    let totalRevenue = 0;
    let totalItems = 0;
    let todayCount = 0;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayStartMs = startOfToday.getTime();

    for (const order of orders) {
      if (order.status === "pending") pending += 1;
      if (order.status === "processed") processed += 1;
      if (order.status === "completed") completed += 1;
      totalRevenue += order.totals.totalAmount;
      totalItems += order.totals.totalItems;
      if (order.createdAt >= todayStartMs) todayCount += 1;
    }

    return {
      totalOrders: orders.length,
      pending,
      processed,
      completed,
      totalRevenue,
      totalItems,
      todayCount,
      averageOrderAmount: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = normalizeText(search);
    const parsedMin = amountMin.trim() === "" ? null : Number(amountMin);
    const parsedMax = amountMax.trim() === "" ? null : Number(amountMax);
    const hasMin = parsedMin !== null && Number.isFinite(parsedMin);
    const hasMax = parsedMax !== null && Number.isFinite(parsedMax);
    const minAmountValue = hasMin && parsedMin !== null ? parsedMin : null;
    const maxAmountValue = hasMax && parsedMax !== null ? parsedMax : null;

    const fromMsRaw = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMsRaw = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;
    const fromMs = fromMsRaw !== null && Number.isFinite(fromMsRaw) ? fromMsRaw : null;
    const toMs = toMsRaw !== null && Number.isFinite(toMsRaw) ? toMsRaw : null;

    const list = orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (cityFilter !== "all" && order.customer.city !== cityFilter) return false;
      if (noteOnly && !order.customer.note?.trim()) return false;
      if (fromMs !== null && order.createdAt < fromMs) return false;
      if (toMs !== null && order.createdAt > toMs) return false;
      if (minAmountValue !== null && order.totals.totalAmount < minAmountValue) return false;
      if (maxAmountValue !== null && order.totals.totalAmount > maxAmountValue) return false;

      if (!q) return true;
      const fullName = `${order.customer.firstName} ${order.customer.lastName}`;
      const itemTitles = order.items.map((item) => item.title).join(" ");
      const candidate = [
        order.orderNumber,
        fullName,
        order.customer.email ?? "",
        order.customer.phone,
        order.customer.street,
        order.customer.number,
        order.customer.postalCode,
        order.customer.city,
        order.trackingNumber ?? "",
        order.customer.note ?? "",
        itemTitles,
      ]
        .join(" ")
        .toLowerCase();
      return candidate.includes(q);
    });

    if (sortBy === "oldest") {
      return [...list].sort((a, b) => a.createdAt - b.createdAt);
    }
    if (sortBy === "amountDesc") {
      return [...list].sort((a, b) => b.totals.totalAmount - a.totals.totalAmount);
    }
    if (sortBy === "amountAsc") {
      return [...list].sort((a, b) => a.totals.totalAmount - b.totals.totalAmount);
    }
    if (sortBy === "customerAsc") {
      return [...list].sort((a, b) => {
        const aName = `${a.customer.firstName} ${a.customer.lastName}`;
        const bName = `${b.customer.firstName} ${b.customer.lastName}`;
        return aName.localeCompare(bName, "sr-Latn-RS");
      });
    }
    return [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, search, statusFilter, cityFilter, noteOnly, dateFrom, dateTo, amountMin, amountMax, sortBy]);

  const filtersApplied = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (statusFilter !== "all") count += 1;
    if (cityFilter !== "all") count += 1;
    if (noteOnly) count += 1;
    if (dateFrom) count += 1;
    if (dateTo) count += 1;
    if (amountMin.trim()) count += 1;
    if (amountMax.trim()) count += 1;
    if (sortBy !== "newest") count += 1;
    return count;
  }, [search, statusFilter, cityFilter, noteOnly, dateFrom, dateTo, amountMin, amountMax, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, cityFilter, noteOnly, dateFrom, dateTo, amountMin, amountMax, sortBy, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const pagedOrders = filteredOrders.slice(pageStart, pageStart + rowsPerPage);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const toggleRow = (orderId: string) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCityFilter("all");
    setSortBy("newest");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setNoteOnly(false);
    setPage(1);
  };

  const resetTrackingModal = () => {
    setTrackingTarget(null);
    setTrackingNumberInput("");
    setTrackingError(null);
  };

  const closeTrackingModal = () => {
    if (isTrackingSubmitting) return;
    resetTrackingModal();
  };

  const updateStatus = async (order: AdminOrder, nextStatus: OrderStatus) => {
    if (order.status === nextStatus) return;

    if (order.status === "pending" && nextStatus === "processed") {
      setTrackingTarget(order);
      setTrackingNumberInput(order.trackingNumber ?? "");
      setTrackingError(null);
      return;
    }

    setBusyOrderId(order._id);
    try {
      await setOrderStatus({ orderId: order._id, status: nextStatus });
      setFeedback({
        type: "success",
        message: `Narudžbina ${order.orderNumber} je sada u statusu: ${statusLabel(nextStatus)}.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message ? error.message : "Promena statusa nije uspela.";
      setFeedback({ type: "error", message });
    } finally {
      setBusyOrderId((current) => (current === order._id ? null : current));
    }
  };

  const copyTrackingNumber = async (order: AdminOrder) => {
    const trackingNumber = order.trackingNumber?.trim();
    if (!trackingNumber) return;

    try {
      await copyTextToClipboard(trackingNumber);
      setFeedback({
        type: "success",
        message: `Broj pošiljke za narudžbinu ${order.orderNumber} je kopiran.`,
      });
    } catch {
      setFeedback({
        type: "error",
        message: `Kopiranje broja pošiljke za narudžbinu ${order.orderNumber} nije uspelo.`,
      });
    }
  };

  const onSubmitTrackingNumber = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trackingTarget) {
      return;
    }

    const order = trackingTarget;
    const trackingNumber = trackingNumberInput.trim();

    if (trackingNumber.length < 3) {
      setTrackingError("Unesite validan broj pošiljke.");
      return;
    }

    setTrackingError(null);
    setIsTrackingSubmitting(true);
    setBusyOrderId(order._id);

    try {
      await setOrderStatus({
        orderId: order._id,
        status: "processed",
        trackingNumber,
      });

      let feedbackType: "success" | "error" = "success";
      let feedbackMessage = `Narudžbina ${order.orderNumber} je prebačena u obradu. Broj pošiljke je sačuvan i email je poslat kupcu.`;
      const recipientEmail = order.customer.email?.trim();

      if (!recipientEmail) {
        feedbackType = "error";
        feedbackMessage = `Narudžbina ${order.orderNumber} je prebačena u obradu i broj pošiljke je sačuvan, ali email nije poslat jer kupac nema email adresu.`;
      } else {
        const emailResult = await sendOrderTrackingEmail({
          orderNumber: order.orderNumber,
          trackingNumber,
          recipientEmail,
          recipientName: getCustomerFullName(order) || "kupče",
        });

        if (!emailResult.ok) {
          feedbackType = "error";
          feedbackMessage = `Narudžbina ${order.orderNumber} je prebačena u obradu i broj pošiljke je sačuvan, ali email nije poslat. ${emailResult.error}`;
        }
      }

      resetTrackingModal();
      setFeedback({ type: feedbackType, message: feedbackMessage });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message ? error.message : "Čuvanje broja pošiljke nije uspelo.";
      setTrackingError(message);
    } finally {
      setIsTrackingSubmitting(false);
      setBusyOrderId((current) => (current === order._id ? null : current));
    }
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
  };

  const onDeleteOrder = async () => {
    if (!deleteTarget) return;
    const order = deleteTarget;
    setIsDeleting(true);
    setBusyOrderId(order._id);

    try {
      const result = await deleteOrder({ orderId: order._id });
      setExpandedRows((current) => {
        const next = new Set(current);
        next.delete(order._id);
        return next;
      });
      setDeleteTarget(null);
      setFeedback({
        type: "success",
        message:
          result.missingProductsCount > 0
            ? `Narudžbina ${order.orderNumber} je obrisana. Neki proizvodi više ne postoje, pa stanje nije potpuno vraćeno.`
            : result.restockedQuantity > 0
              ? `Narudžbina ${order.orderNumber} je obrisana i vraćeno je ${result.restockedQuantity} komada na stanje.`
              : `Narudžbina ${order.orderNumber} je obrisana.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message ? error.message : "Brisanje porudžbine nije uspelo.";
      setFeedback({ type: "error", message });
    } finally {
      setIsDeleting(false);
      setBusyOrderId((current) => (current === order._id ? null : current));
    }
  };

  if (!session) {
    return (
      <section className={`page-grid admin-page ${styles.ordersPage}`}>
        <section className="empty-state">
          <h3>Morate biti prijavljeni kao admin.</h3>
          <p>Prijavite se pa otvorite evidenciju narudžbina.</p>
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

  return (
    <section className={`page-grid admin-page ${styles.ordersPage}`}>
      <section className={`hero admin-hero ${styles.hero}`}>
        <div>
          <p className="eyebrow">Evidencija narudžbina</p>
          <h1>Kontrolna tabla za porudžbine bez konfuzije</h1>
          <p className="subtitle">
            Jedan ekran za kompletan pregled kupaca, iznosa i statusa. Pretraga, filteri i akcije su optimizovani da
            admin može da radi brzo i bez grešaka.
          </p>
        </div>
        <div className={`admin-hero-actions ${styles.heroActions}`}>
          <Link href="/admin" className={`ghost-btn ${styles.heroActionBtn}`}>
            Nazad na admin
          </Link>
          <button type="button" className={`ghost-btn ${styles.heroActionBtn}`} onClick={clearFilters}>
            Reset filtera
          </button>
        </div>
      </section>

      {feedback ? (
        <p className={`status-msg ${feedback.type === "error" ? "admin-status-error" : "admin-status-success"}`}>{feedback.message}</p>
      ) : null}

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <span>Ukupno porudžbina</span>
          <strong>{summary.totalOrders}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>Nove</span>
          <strong>{summary.pending}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>U obradi</span>
          <strong>{summary.processed}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>Završene</span>
          <strong>{summary.completed}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>Promet</span>
          <strong>{formatRsd(summary.totalRevenue)}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>Prosek porudžbine</span>
          <strong>{formatRsd(summary.averageOrderAmount)}</strong>
        </article>
      </section>

      <section className={`toolbar-card ${styles.filterPanel}`}>
        <div className={styles.filterHead}>
          <div>
            <h2>Filteri i pretraga</h2>
            <p>Prikazano {filteredOrders.length} / {orders.length} narudžbina.</p>
          </div>
          <div className={styles.filterMeta}>
            <span>Aktivnih filtera: {filtersApplied}</span>
            <span>Danas porudžbina: {summary.todayCount}</span>
            <span>Ukupno stavki: {summary.totalItems}</span>
          </div>
        </div>

        <div className={styles.quickStatusRow}>
          <button
            type="button"
            className={`${styles.quickStatusChip} ${statusFilter === "all" ? styles.activeChip : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            Sve ({summary.totalOrders})
          </button>
          <button
            type="button"
            className={`${styles.quickStatusChip} ${styles.pendingChip} ${statusFilter === "pending" ? styles.activeChip : ""}`}
            onClick={() => setStatusFilter("pending")}
          >
            Novo ({summary.pending})
          </button>
          <button
            type="button"
            className={`${styles.quickStatusChip} ${styles.processedChip} ${statusFilter === "processed" ? styles.activeChip : ""}`}
            onClick={() => setStatusFilter("processed")}
          >
            U obradi ({summary.processed})
          </button>
          <button
            type="button"
            className={`${styles.quickStatusChip} ${styles.completedChip} ${statusFilter === "completed" ? styles.activeChip : ""}`}
            onClick={() => setStatusFilter("completed")}
          >
            Završeno ({summary.completed})
          </button>
        </div>

        <div className={styles.filterGrid}>
          <label className={styles.field}>
            <span>Brza pretraga</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Broj narudžbine, ime, telefon, email, adresa, proizvod..."
            />
          </label>

          <label className={styles.field}>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OrderStatusFilter)}>
              <option value="all">Svi statusi</option>
              <option value="pending">Novo</option>
              <option value="processed">U obradi</option>
              <option value="completed">Završeno</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Grad</span>
            <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
              <option value="all">Svi gradovi</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Sortiranje</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
              <option value="newest">Najnovije</option>
              <option value="oldest">Najstarije</option>
              <option value="amountDesc">Najveći iznos</option>
              <option value="amountAsc">Najmanji iznos</option>
              <option value="customerAsc">Kupac A-Z</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Datum od</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Datum do</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>

          <label className={styles.field}>
            <span>Iznos od (RSD)</span>
            <input
              type="number"
              min={0}
              value={amountMin}
              onChange={(event) => setAmountMin(event.target.value)}
              placeholder="0"
            />
          </label>

          <label className={styles.field}>
            <span>Iznos do (RSD)</span>
            <input
              type="number"
              min={0}
              value={amountMax}
              onChange={(event) => setAmountMax(event.target.value)}
              placeholder="500000"
            />
          </label>
        </div>

        <div className={styles.filterFooter}>
          <label className={styles.noteCheck}>
            <input type="checkbox" checked={noteOnly} onChange={(event) => setNoteOnly(event.target.checked)} />
            Samo narudžbine sa napomenom kupca
          </label>
          <label className={styles.rowsPerPage}>
            Redova po strani
            <select value={rowsPerPage} onChange={(event) => setRowsPerPage(Number(event.target.value))}>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <section className={`toolbar-card ${styles.emptyState}`}>
          <h3>Učitavanje evidencije narudžbina...</h3>
          <p>Sistem priprema tabelu i filtere.</p>
        </section>
      ) : filteredOrders.length === 0 ? (
        <section className={`toolbar-card ${styles.emptyState}`}>
          <h3>Nema narudžbina za izabrane filtere.</h3>
          <p>Promenite filtere ili resetujte prikaz da biste videli rezultate.</p>
        </section>
      ) : (
        <section className={`toolbar-card ${styles.tablePanel}`}>
          <div className={styles.tableInfo}>
            <p>
              Prikaz <strong>{pageStart + 1}</strong> - <strong>{Math.min(pageStart + rowsPerPage, filteredOrders.length)}</strong> od{" "}
              <strong>{filteredOrders.length}</strong> narudžbina
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Narudžbina</th>
                  <th>Kupac</th>
                  <th>Adresa</th>
                  <th>Stavke</th>
                  <th>Iznos</th>
                  <th>Status</th>
                  <th>Akcija</th>
                </tr>
              </thead>
              <tbody>
                {pagedOrders.map((order) => {
                  const isExpanded = expandedRows.has(order._id);
                  const fullName = getCustomerFullName(order);
                  const isBusy = busyOrderId === order._id;

                  return (
                    <Fragment key={order._id}>
                      <tr className={styles.orderRow}>
                        <td>
                          <span className={styles.mobileLabel}>Narudžbina</span>
                          <div className={styles.orderCellMain}>
                            <strong>{order.orderNumber}</strong>
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.mobileLabel}>Kupac</span>
                          <div className={styles.customerCell}>
                            <strong>{fullName}</strong>
                            <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
                            {order.customer.email ? <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a> : null}
                          </div>
                        </td>
                        <td>
                          <span className={styles.mobileLabel}>Adresa</span>
                          <div className={styles.addressCell}>
                            <strong>{order.customer.city}</strong>
                            <span>
                              {order.customer.street} {order.customer.number}
                            </span>
                            <span>{order.customer.postalCode}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.mobileLabel}>Stavke</span>
                          <div className={styles.itemsCell}>
                            <div className={styles.itemThumbs}>
                              {order.items.slice(0, 3).map((item, idx) =>
                                item.imageUrl ? (
                                  <Image
                                    key={`${order._id}-thumb-${idx}`}
                                    src={item.imageUrl}
                                    alt={item.title}
                                    width={40}
                                    height={40}
                                    className={styles.itemThumb}
                                  />
                                ) : (
                                  <span key={`${order._id}-thumb-${idx}`} className={styles.itemThumbPlaceholder}>
                                    {item.title.charAt(0)}
                                  </span>
                                ),
                              )}
                              {order.items.length > 3 ? (
                                <span className={styles.itemThumbMore}>+{order.items.length - 3}</span>
                              ) : null}
                            </div>
                            <span>{order.totals.totalItems} kom. — {order.items.slice(0, 2).map((item) => item.title).join(", ") || "Nema stavki"}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.mobileLabel}>Iznos</span>
                          <div className={styles.amountCell}>
                            <strong>{formatRsd(order.totals.totalAmount)}</strong>
                            <span>{order.items.length} stavki</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.mobileLabel}>Status</span>
                          <div className={styles.statusCell}>
                            <span className={`${styles.statusPill} ${statusClassByValue[order.status]}`}>{statusLabel(order.status)}</span>
                            <select
                              value={order.status}
                              onChange={(event) => void updateStatus(order, event.target.value as OrderStatus)}
                              disabled={isBusy}
                              aria-label={`Status narudžbine ${order.orderNumber}`}
                            >
                              <option value="pending">Novo</option>
                              <option value="processed">U obradi</option>
                              <option value="completed">Završeno</option>
                            </select>
                          </div>
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.rowActions}>
                            {order.trackingNumber?.trim() ? (
                              <button
                                type="button"
                                className={`ghost-btn ${styles.copyButton}`}
                                onClick={() => void copyTrackingNumber(order)}
                                disabled={isBusy}
                                aria-label={`Kopiraj broj pošiljke za narudžbinu ${order.orderNumber}`}
                              >
                                Kopiraj pošiljku
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className={`ghost-btn ${styles.detailButton} ${isExpanded ? styles.detailButtonActive : ""}`}
                              onClick={() => toggleRow(order._id)}
                              disabled={isBusy}
                            >
                              {isExpanded ? "Sakrij detalje" : "Pogledaj detalje"}
                            </button>
                            <button
                              type="button"
                              className={`ghost-btn danger ${styles.deleteButton}`}
                              onClick={() => setDeleteTarget(order)}
                              disabled={isBusy}
                              aria-label={`Obriši narudžbinu ${order.orderNumber}`}
                            >
                              Obriši
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className={styles.detailRow}>
                          <td colSpan={7}>
                            <div className={styles.detailGrid}>
                              <article className={styles.detailCard}>
                                <h4>Podaci kupca</h4>
                                <p>
                                  <strong>{fullName}</strong>
                                </p>
                                <p>
                                  {order.customer.street} {order.customer.number}, {order.customer.postalCode} {order.customer.city}
                                </p>
                                <p>Telefon: {order.customer.phone}</p>
                                {order.customer.email ? <p>Email: {order.customer.email}</p> : null}
                                {order.customer.note?.trim() ? <p className={styles.noteBadge}>Napomena: {order.customer.note}</p> : null}
                              </article>

                              <article className={styles.detailCard}>
                                <h4>Stavke narudžbine</h4>
                                <ul className={styles.itemList}>
                                  {order.items.map((item, index) => (
                                    <li key={`${order._id}-${item.productId}-${index}`}>
                                      {item.imageUrl ? (
                                        <Image
                                          src={item.imageUrl}
                                          alt={item.title}
                                          width={50}
                                          height={50}
                                          className={styles.detailItemThumb}
                                        />
                                      ) : (
                                        <span className={styles.detailItemThumbPlaceholder}>
                                          {item.title.charAt(0)}
                                        </span>
                                      )}
                                      <div>
                                        <strong>{item.title}</strong>
                                        <span>
                                          {item.quantity} x {formatRsd(item.finalUnitPrice)}
                                          {item.discount > 0 ? ` (popust ${item.discount}%)` : ""}
                                        </span>
                                      </div>
                                      <strong className={styles.detailItemTotal}>{formatRsd(item.lineTotal)}</strong>
                                    </li>
                                  ))}
                                </ul>
                              </article>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <button type="button" className="ghost-btn" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}>
              Prethodna
            </button>
            <span>
              Strana <strong>{safePage}</strong> / {totalPages}
            </span>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={safePage >= totalPages}
            >
              Sledeća
            </button>
          </div>
        </section>
      )}

      {trackingTarget ? (
        <Modal onClose={closeTrackingModal}>
          <form className={`modal-form ${styles.trackingModalForm}`} onSubmit={onSubmitTrackingNumber}>
            <div className={styles.trackingMeta}>
              <p className="eyebrow">Obavezan unos</p>
              <h3>Unesite broj pošiljke za narudžbinu {trackingTarget.orderNumber}</h3>
              <p className={styles.trackingHint}>
                Kada narudžbina prelazi iz statusa novo u status u obradi, broj pošiljke mora biti sačuvan i poslat kupcu na email.
              </p>
            </div>

            <div className={styles.trackingTargetCard}>
              <strong>{getCustomerFullName(trackingTarget)}</strong>
              {trackingTarget.customer.email ? <span>{trackingTarget.customer.email}</span> : <span>Email nije dostupan.</span>}
            </div>

            <label className={styles.trackingField}>
              <span>Broj pošiljke</span>
              <input
                autoFocus
                value={trackingNumberInput}
                onChange={(event) => setTrackingNumberInput(event.target.value)}
                placeholder="Unesite broj pošiljke"
                disabled={isTrackingSubmitting}
                required
              />
            </label>

            {trackingError ? <p className={styles.trackingError}>{trackingError}</p> : null}

            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={closeTrackingModal} disabled={isTrackingSubmitting}>
                Odustani
              </button>
              <button type="submit" className="primary-btn" disabled={isTrackingSubmitting}>
                {isTrackingSubmitting ? "Čuvanje..." : "Sačuvaj i pošalji email"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal onClose={closeDeleteModal}>
          <h3>Da li ste sigurni da želite da obrišete narudžbinu {deleteTarget.orderNumber}?</h3>
          <p>Brisanjem će porudžbina biti uklonjena iz evidencije, a stanje proizvoda će biti vraćeno gde je to moguće.</p>
          <div className="modal-actions">
            <button type="button" className="ghost-btn" onClick={closeDeleteModal} disabled={isDeleting}>
              Odustani
            </button>
            <button type="button" className="primary-btn danger" onClick={onDeleteOrder} disabled={isDeleting}>
              {isDeleting ? "Brisanje..." : "Potvrdi brisanje"}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card admin-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Zatvori">
          x
        </button>
        {children}
      </div>
    </div>
  );
}
