"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { sendOfferCampaign } from "./actions";

type SendState = "idle" | "sending" | "success" | "error";

type OfferTemplate = {
  id: string;
  name: string;
  subject: string;
  message: string;
};

const OFFER_TEMPLATES: OfferTemplate[] = [
  {
    id: "blonde-refresh",
    name: "Blonde Refresh",
    subject: "Blonde refresh termin + mini plan nege",
    message:
      "Rezervisite svoj blonde refresh termin i dobijte mini plan nege za kucno odrzavanje sjaja i zdravlja vlasi. Broj mesta je ogranicen, odgovorite na ovaj email za prioritetan termin.",
  },
  {
    id: "keratin-week",
    name: "Keratin Week",
    subject: "Keratin Week: smooth finish + savet strucnjaka",
    message:
      "Keratin Week je aktivan. Zakazite tretman za glatkocu, disciplinu i sjaj bez tezine. Uz tretman dobijate preporuku proizvoda koji cuva rezultat i nakon salona.",
  },
  {
    id: "vip-reactivation",
    name: "VIP Reactivation",
    subject: "Povratnicki VIP paket za sledecu posetu",
    message:
      "Za nase postojece klijentkinje aktivirali smo VIP paket pri sledecoj poseti: personalizovana konsultacija, osvezavanje look-a i jasna preporuka nege za naredne nedelje.",
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

  const applyTemplate = (template: OfferTemplate) => {
    setSelectedTemplateId(template.id);
    setSubject(template.subject);
    setMessage(template.message);
    setStatusMessage("");
    if (state !== "idle") {
      setState("idle");
    }
  };

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
          <h1>Kampanje koje vracaju klijentkinje u salon</h1>
          <p className="subtitle">
            Kreirajte ponudu, izaberite ton komunikacije i posaljite kampanju svim registrovanim korisnicima.
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
        <h2>Brzi sabloni kampanje</h2>
        <p className="order-summary">Izaberite sablon i prilagodite poruku pre slanja.</p>
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

      <form className="toolbar-card modal-form" onSubmit={submit}>
        <h2>Nova ponuda</h2>
        <p className="order-summary">Primalac: svi registrovani korisnici iz baze.</p>

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
          <p className="admin-offer-preview-label">Preview</p>
          <h3>{subject.trim().length > 0 ? subject : "Naslov kampanje ce se prikazati ovde"}</h3>
          <p>{message.trim().length > 0 ? message : "Tekst kampanje ce se prikazati ovde."}</p>
        </div>
        <div className="modal-actions">
          <button type="submit" className="primary-btn" disabled={state === "sending"}>
            {state === "sending" ? "Slanje..." : "Posalji ponudu"}
          </button>
        </div>
      </form>
    </section>
  );
}
