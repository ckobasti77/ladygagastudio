"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getOfferRecipientsPreview, sendOfferCampaign } from "./actions";

type SendState = "idle" | "sending" | "success" | "error";

type OfferTemplate = {
  id: string;
  name: string;
  subject: string;
  message: string;
};

type OfferRecipient = {
  email: string;
  firstName: string;
  lastName: string;
};

type RecipientLoadState = "idle" | "loading" | "success" | "error";

const OFFER_TEMPLATES: OfferTemplate[] = [
  {
    id: "blonde-refresh",
    name: "Blonde Refresh",
    subject: "Blonde refresh termin + mini plan nege",
    message:
      "Rezervišite svoj Blonde Refresh termin i dobijte mini plan nege za kućno održavanje sjaja i zdravlja vlasi. Broj mesta je ograničen, odgovorite na ovaj email za prioritetan termin.",
  },
  {
    id: "keratin-week",
    name: "Keratin Week",
    subject: "Keratin Week: smooth finish + savet stručnjaka",
    message:
      "Keratin Week je aktivan. Zakažite tretman za glatkoću, disciplinu i sjaj bez težine. Uz tretman dobijate preporuku proizvoda koji čuva rezultat i nakon salona.",
  },
  {
    id: "vip-reactivation",
    name: "VIP Reactivation",
    subject: "Povratnički VIP paket za sledeću posetu",
    message:
      "Za naše postojeće klijentkinje aktivirali smo VIP paket pri sledećoj poseti: personalizovana konsultacija, osvežavanje izgleda i jasna preporuka nege za naredne nedelje.",
  },
];

export default function AdminOffersPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [recipientState, setRecipientState] = useState<RecipientLoadState>("idle");
  const [recipientStatusMessage, setRecipientStatusMessage] = useState("");
  const [monitorEmail, setMonitorEmail] = useState("");
  const [recipients, setRecipients] = useState<OfferRecipient[]>([]);

  const applyTemplate = (template: OfferTemplate) => {
    setSelectedTemplateId(template.id);
    setSubject(template.subject);
    setMessage(template.message);
    setStatusMessage("");
    if (state !== "idle") {
      setState("idle");
    }
  };

  useEffect(() => {
    if (!session?.isAdmin) {
      return;
    }

    let cancelled = false;

    const loadRecipients = async () => {
      setRecipientState("loading");
      setRecipientStatusMessage("");

      const result = await getOfferRecipientsPreview();
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setRecipientState("error");
        setRecipientStatusMessage(result.error);
        return;
      }

      setRecipientState("success");
      setMonitorEmail(result.monitorEmail);
      setRecipients(result.recipients);
    };

    void loadRecipients();

    return () => {
      cancelled = true;
    };
  }, [session?.isAdmin]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    setStatusMessage("");

    const result = await sendOfferCampaign({ subject, message });
    if (!result.ok) {
      setState("error");
      setStatusMessage(result.error);
      return;
    }

    setState("success");
    setStatusMessage(
      result.recipients > 0
        ? `Ponuda je poslata na ${result.recipients} registrovanih korisnika.`
        : "Nema registrovanih korisnika za slanje ponude.",
    );
    setSubject("");
    setMessage("");
  };

  if (!session) {
    return (
      <section className="page-grid admin-page">
        <section className="empty-state">
          <h3>Morate biti prijavljeni kao admin.</h3>
          <p>Prijavite se pa otvorite stranicu za ponude ponovo.</p>
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
    <section className="page-grid admin-page">
      <section className="hero admin-hero">
        <div>
          <p className="eyebrow">Mejl kampanje</p>
          <h1>Kampanje koje vraćaju klijentkinje u salon</h1>
          <p className="subtitle">
            Kreirajte ponudu, izaberite ton komunikacije i pošaljite kampanju svim registrovanim korisnicima.
          </p>
        </div>
        <div className="admin-hero-actions">
          <Link href="/admin" className="ghost-btn">
            Nazad na admin
          </Link>
        </div>
      </section>

      {state !== "idle" ? (
        <p className={`status-msg ${state === "error" ? "admin-status-error" : "admin-status-success"}`}>{statusMessage}</p>
      ) : null}

      <section className="toolbar-card admin-offer-template-panel">
        <h2>Brzi šabloni kampanje</h2>
        <p className="order-summary">Izaberite šablon i prilagodite poruku pre slanja.</p>
        <div className="admin-offer-template-grid">
          {OFFER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`ghost-btn admin-offer-template-btn ${selectedTemplateId === template.id ? "active" : ""}`}
              onClick={() => applyTemplate(template)}
            >
              <strong>{template.name}</strong>
              <span>{template.subject}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="toolbar-card admin-offer-recipient-panel">
        <div className="admin-offer-recipient-head">
          <div>
            <h2>Spisak primalaca</h2>
            <p className="order-summary">Ponuda se salje na nadzorni mejl i svim prijavljenim marketing kontaktima iz baze.</p>
          </div>
          <span className="admin-offer-recipient-count">{recipients.length} emailova</span>
        </div>

        <div className="admin-offer-live-meta">
          <span>Nadzorni mejl (To): {monitorEmail || "hello@ladygagastudio.rs"}</span>
          <span>BCC primaoci: {recipients.length}</span>
        </div>

        {recipientState === "loading" ? <p className="order-summary">Ucitavanje spiska primalaca...</p> : null}
        {recipientState === "error" ? <p className="status-msg admin-status-error">{recipientStatusMessage}</p> : null}
        {recipientState === "success" && recipients.length === 0 ? (
          <p className="order-summary">Trenutno nema prijavljenih mejlova za slanje ponuda.</p>
        ) : null}
        {recipientState === "success" && recipients.length > 0 ? (
          <>
            <textarea
              className="admin-offer-recipient-export"
              readOnly
              value={recipients.map((recipient) => recipient.email).join("\n")}
              rows={Math.min(Math.max(recipients.length + 1, 4), 12)}
            />
            <ul className="admin-offer-recipient-list">
              {recipients.map((recipient) => (
                <li key={recipient.email} className="admin-offer-recipient-item">
                  <strong>{recipient.email}</strong>
                  <span>{[recipient.firstName, recipient.lastName].filter(Boolean).join(" ").trim() || "Bez imena"}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <form className="toolbar-card modal-form" onSubmit={submit}>
        <h2>Nova ponuda</h2>
        <p className="order-summary">Primalac: nadzorni mejl + svi marketing kontakti iz baze.</p>

        <input
          required
          minLength={3}
          value={subject}
          placeholder="Naslov ponude"
          onChange={(event) => setSubject(event.target.value)}
        />
        <textarea
          required
          minLength={10}
          value={message}
          placeholder="Tekst ponude"
          onChange={(event) => setMessage(event.target.value)}
          rows={9}
        />
        <div className="admin-offer-live-meta">
          <span>Naslov: {subject.trim().length} karaktera</span>
          <span>Poruka: {message.trim().length} karaktera</span>
        </div>
        <div className="admin-offer-preview">
          <p className="admin-offer-preview-label">Pregled</p>
          <h3>{subject.trim().length > 0 ? subject : "Naslov kampanje će se prikazati ovde"}</h3>
          <p>{message.trim().length > 0 ? message : "Tekst kampanje će se prikazati ovde."}</p>
        </div>
        <div className="modal-actions">
          <button type="submit" className="primary-btn" disabled={state === "sending"}>
            {state === "sending" ? "Slanje..." : "Pošalji ponudu"}
          </button>
        </div>
      </form>
    </section>
  );
}
