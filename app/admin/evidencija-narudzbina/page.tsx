"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import styles from "./page.module.css";

type OrderStatus = "pending" | "processed" | "completed";
type OrderStatusFilter = "all" | OrderStatus;
type SortBy = "newest" | "oldest" | "amountDesc" | "amountAsc" | "customerAsc";

type AdminOrder = {
  _id: string;
  orderNumber: string;
  createdAt: number;
  status: OrderStatus;
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
  if (status === "completed") return "Zavrseno";
  return "Novo";
}

function normalizeText(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export default function AdminOrdersLedgerPage() {
  const router = useRouter();
  const { session } = useAuth();

  const rawOrders = useQuery(api.orders.listOrdersForAdmin, {}) as AdminOrder[] | undefined;
  const setOrderStatus = useMutation(api.orders.setOrderStatus) as unknown as (args: {
    orderId: string;
    status: OrderStatus;
  }) => Promise<unknown>;

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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const updateStatus = async (order: AdminOrder, nextStatus: OrderStatus) => {
    if (order.status === nextStatus) return;
    setBusyOrderId(order._id);
    try {
      await setOrderStatus({ orderId: order._id, status: nextStatus });
      setFeedback({
        type: "success",
        message: `Narudzbina ${order.orderNumber} je sada u statusu: ${statusLabel(nextStatus)}.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error && error.message ? error.message : "Promena statusa nije uspela.";
      setFeedback({ type: "error", message });
    } finally {
      setBusyOrderId((current) => (current === order._id ? null : current));
    }
  };

  if (!session) {
    return (
      <section className={`page-grid admin-page ${styles.ordersPage}`}>
        <section className="empty-state">
          <h3>Morate biti prijavljeni kao admin.</h3>
          <p>Prijavite se pa otvorite evidenciju narudzbina.</p>
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
          <p className="eyebrow">Evidencija narudzbina</p>
          <h1>Kontrolna tabla za porudzbine bez konfuzije</h1>
          <p className="subtitle">
            Jedan ekran za kompletan pregled kupaca, iznosa i statusa. Pretraga, filteri i akcije su optimizovani da
            admin moze da radi brzo i bez gresaka.
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
          <span>Ukupno porudzbina</span>
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
          <span>Zavrsene</span>
          <strong>{summary.completed}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>Promet</span>
          <strong>{formatRsd(summary.totalRevenue)}</strong>
        </article>
        <article className={styles.kpiCard}>
          <span>Prosek porudzbine</span>
          <strong>{formatRsd(summary.averageOrderAmount)}</strong>
        </article>
      </section>

      <section className={`toolbar-card ${styles.filterPanel}`}>
        <div className={styles.filterHead}>
          <div>
            <h2>Filteri i pretraga</h2>
            <p>Prikazano {filteredOrders.length} / {orders.length} narudzbina.</p>
          </div>
          <div className={styles.filterMeta}>
            <span>Aktivnih filtera: {filtersApplied}</span>
            <span>Danas porudzbina: {summary.todayCount}</span>
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
            Zavrseno ({summary.completed})
          </button>
        </div>

        <div className={styles.filterGrid}>
          <label className={styles.field}>
            <span>Brza pretraga</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Broj narudzbine, ime, telefon, email, adresa, proizvod..."
            />
          </label>

          <label className={styles.field}>
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OrderStatusFilter)}>
              <option value="all">Svi statusi</option>
              <option value="pending">Novo</option>
              <option value="processed">U obradi</option>
              <option value="completed">Zavrseno</option>
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
              <option value="amountDesc">Najveci iznos</option>
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
            Samo narudzbine sa napomenom kupca
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
          <h3>Ucitavanje evidencije narudzbina...</h3>
          <p>Sistem priprema tabelu i filtere.</p>
        </section>
      ) : filteredOrders.length === 0 ? (
        <section className={`toolbar-card ${styles.emptyState}`}>
          <h3>Nema narudzbina za izabrane filtere.</h3>
          <p>Promenite filtere ili resetujte prikaz da biste videli rezultate.</p>
        </section>
      ) : (
        <section className={`toolbar-card ${styles.tablePanel}`}>
          <div className={styles.tableInfo}>
            <p>
              Prikaz <strong>{pageStart + 1}</strong> - <strong>{Math.min(pageStart + rowsPerPage, filteredOrders.length)}</strong> od{" "}
              <strong>{filteredOrders.length}</strong> narudzbina
            </p>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Narudzbina</th>
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
                  const fullName = `${order.customer.firstName} ${order.customer.lastName}`.trim();
                  const isBusy = busyOrderId === order._id;

                  return (
                    <Fragment key={order._id}>
                      <tr className={styles.orderRow}>
                        <td>
                          <div className={styles.orderCellMain}>
                            <strong>{order.orderNumber}</strong>
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.customerCell}>
                            <strong>{fullName}</strong>
                            <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
                            {order.customer.email ? <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a> : <span>-</span>}
                          </div>
                        </td>
                        <td>
                          <div className={styles.addressCell}>
                            <strong>{order.customer.city}</strong>
                            <span>
                              {order.customer.street} {order.customer.number}
                            </span>
                            <span>{order.customer.postalCode}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.itemsCell}>
                            <strong>{order.totals.totalItems} kom.</strong>
                            <span>{order.items.slice(0, 2).map((item) => item.title).join(", ") || "Nema stavki"}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.amountCell}>
                            <strong>{formatRsd(order.totals.totalAmount)}</strong>
                            <span>{order.items.length} stavki u porudzbini</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={`${styles.statusPill} ${statusClassByValue[order.status]}`}>{statusLabel(order.status)}</span>
                            <select
                              value={order.status}
                              onChange={(event) => void updateStatus(order, event.target.value as OrderStatus)}
                              disabled={isBusy}
                              aria-label={`Status narudzbine ${order.orderNumber}`}
                            >
                              <option value="pending">Novo</option>
                              <option value="processed">U obradi</option>
                              <option value="completed">Zavrseno</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`ghost-btn ${styles.detailButton} ${isExpanded ? styles.detailButtonActive : ""}`}
                            onClick={() => toggleRow(order._id)}
                          >
                            {isExpanded ? "Sakrij" : "Detalji"}
                          </button>
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
                                <h4>Stavke narudzbine</h4>
                                <ul className={styles.itemList}>
                                  {order.items.map((item, index) => (
                                    <li key={`${order._id}-${item.productId}-${index}`}>
                                      <div>
                                        <strong>{item.title}</strong>
                                        <span>
                                          {item.quantity} x {formatRsd(item.finalUnitPrice)}
                                          {item.discount > 0 ? ` (popust ${item.discount}%)` : ""}
                                        </span>
                                      </div>
                                      <strong>{formatRsd(item.lineTotal)}</strong>
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
              Sledeca
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
