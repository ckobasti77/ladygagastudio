"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { sendOfferCampaign } from "./actions";

type SendState = "idle" | "sending" | "success" | "error";

export default function AdminOffersPage() {
  const router = useRouter();
  const { session } = useAuth();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [statusMessage, setStatusMessage] = useState("");

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
          <h1>Ponuda korisnicima</h1>
          <p className="subtitle">
            Posaljite akcijsku poruku svim registrovanim korisnicima preko SMTP servisa i nodemailer-a.
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
        <div className="modal-actions">
          <button type="submit" className="primary-btn" disabled={state === "sending"}>
            {state === "sending" ? "Slanje..." : "Posalji ponudu"}
          </button>
        </div>
      </form>
    </section>
  );
}
