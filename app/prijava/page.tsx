"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert, Sparkles } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/contexts/auth-context";
import { requestPasswordResetEmail, resetPassword } from "./actions";

type UserAuthMode = "signin" | "signup";

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Dogodila se greška. Pokušajte ponovo.";
}

function AuthPageContent() {
  const { loginUser, registerUser } = useAuth();
  const subscribeToMarketing = useMutation(api.users.subscribeToMarketing);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("reset")?.trim() ?? "";
  const isResetMode = resetToken.length > 0;
  const isResetTokenMalformed = isResetMode && resetToken.length < 16;

  const [mode, setMode] = useState<UserAuthMode>("signin");
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "",
  });
  const [authBusy, setAuthBusy] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStatus, setForgotStatus] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "",
  });
  const [forgotBusy, setForgotBusy] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: "idle" | "error" | "success"; message: string }>({
    type: "idle",
    message: "",
  });
  const [resetBusy, setResetBusy] = useState(false);

  const passwordRules = [
    { id: "length", label: "Najmanje 8 karaktera", ok: newPassword.length >= 8 },
    { id: "upper", label: "Bar jedno veliko slovo", ok: /[A-Z]/.test(newPassword) },
    { id: "number", label: "Bar jedan broj", ok: /\d/.test(newPassword) },
    { id: "symbol", label: "Bar jedan specijalni znak", ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const satisfiedPasswordRules = passwordRules.filter((rule) => rule.ok).length;
  const passwordStrengthPercent = Math.round((satisfiedPasswordRules / passwordRules.length) * 100);
  const passwordStrengthTone = satisfiedPasswordRules <= 1 ? "weak" : satisfiedPasswordRules <= 3 ? "medium" : "strong";
  const passwordStrengthLabel =
    satisfiedPasswordRules <= 1 ? "Slaba lozinka" : satisfiedPasswordRules <= 3 ? "Srednja lozinka" : "Jaka lozinka";
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const canSubmitReset = passwordRules.every((rule) => rule.ok) && passwordsMatch;

  const submitUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthStatus({ type: "idle", message: "" });
    setAuthBusy(true);
    try {
      if (mode === "signin") {
        const session = await loginUser(email, password);
        if (!session) {
          setAuthStatus({ type: "error", message: "Neispravan email ili šifra." });
          return;
        }
      setAuthStatus({ type: "success", message: "Uspešna prijava." });
        router.push(session.isAdmin ? "/admin" : "/");
        return;
      }

      await registerUser(firstName, lastName, email, password);
      if (marketingAccepted) {
        await subscribeToMarketing({ email, firstName, lastName, source: "registration" });
      }
      setAuthStatus({ type: "success", message: "Registracija uspešna. Prijavljeni ste." });
      router.push("/");
    } catch (error: unknown) {
      setAuthStatus({ type: "error", message: resolveErrorMessage(error) });
    } finally {
      setAuthBusy(false);
    }
  };

  const submitForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotStatus({ type: "idle", message: "" });
    setForgotBusy(true);
    try {
      const result = await requestPasswordResetEmail({ email: forgotEmail });
      if (!result.ok) {
        setForgotStatus({ type: "error", message: result.error });
        return;
      }
      setForgotStatus({ type: "success", message: result.message });
      setForgotEmail("");
    } finally {
      setForgotBusy(false);
    }
  };

  const submitResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResetStatus({ type: "idle", message: "" });

    if (newPassword.trim().length < 8) {
      setResetStatus({ type: "error", message: "Nova šifra mora imati najmanje 8 karaktera." });
      return;
    }
    if (!passwordRules.every((rule) => rule.ok)) {
      setResetStatus({
        type: "error",
        message: "Nova šifra mora imati veliko slovo, broj i specijalni znak.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetStatus({ type: "error", message: "Potvrda šifre se ne poklapa." });
      return;
    }

    setResetBusy(true);
    try {
      const result = await resetPassword({ token: resetToken, password: newPassword });
      if (!result.ok) {
        setResetStatus({ type: "error", message: result.error });
        return;
      }
      setResetStatus({ type: "success", message: result.message });
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => {
        router.replace("/prijava");
      }, 1400);
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <section className="auth-luxe">
      <div className="auth-luxe-ambience" aria-hidden="true" />
      <span className="auth-luxe-sparkle auth-luxe-sparkle-1" aria-hidden="true" />
      <span className="auth-luxe-sparkle auth-luxe-sparkle-2" aria-hidden="true" />
      <span className="auth-luxe-sparkle auth-luxe-sparkle-3" aria-hidden="true" />

      <div className="auth-luxe-grid">
        <article className="auth-luxe-info">
          <span className="auth-luxe-watermark" aria-hidden="true">PRISTUP</span>
          <div className="auth-luxe-info-inner">
            <p className="auth-luxe-kicker">
              <Sparkles size={13} aria-hidden="true" />
              <span>Pristup nalogu</span>
            </p>
            <h1 className="auth-luxe-title">Prijava i bezbednost naloga</h1>
            <p className="auth-luxe-lead">
              Prijavite se ili kreirajte nalog kroz jedinstven i bezbedan pristup.
              Sistem automatski primenjuje nivo ovlašćenja prema vašem nalogu.
            </p>
            <div className="auth-luxe-tags">
              <span className="auth-luxe-tag">Prijava</span>
              <span className="auth-luxe-tag">Registracija</span>
              <span className="auth-luxe-tag">Reset lozinke</span>
            </div>
          </div>
        </article>

        <article className="auth-luxe-card">
          {!isResetMode ? (
            <>
              <div className="auth-luxe-card-head">
                <h2>{mode === "signin" ? "Prijava naloga" : "Registracija naloga"}</h2>
                <div className="auth-luxe-tabs" role="tablist" aria-label="Korisnička autentikacija">
                  <button
                    type="button"
                    className={`auth-luxe-tab ${mode === "signin" ? "is-active" : ""}`}
                    onClick={() => setMode("signin")}
                  >
                    <span className="auth-luxe-tab-num" aria-hidden="true">01</span>
                    Prijava
                  </button>
                  <button
                    type="button"
                    className={`auth-luxe-tab ${mode === "signup" ? "is-active" : ""}`}
                    onClick={() => setMode("signup")}
                  >
                    <span className="auth-luxe-tab-num" aria-hidden="true">02</span>
                    Registracija
                  </button>
                </div>
              </div>

              <form className="auth-luxe-form" onSubmit={submitUser}>
                {mode === "signup" ? (
                  <div className="auth-luxe-row-2">
                    <div className="auth-luxe-field">
                      <input required value={firstName} placeholder="Ime" onChange={(event) => setFirstName(event.target.value)} />
                    </div>
                    <div className="auth-luxe-field">
                      <input required value={lastName} placeholder="Prezime" onChange={(event) => setLastName(event.target.value)} />
                    </div>
                  </div>
                ) : null}

                <div className="auth-luxe-field">
                  <input required type="email" value={email} placeholder="Email" onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="auth-luxe-field">
                  <input
                    required
                    type="password"
                    value={password}
                    placeholder="Šifra"
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                  />
                </div>

                {mode === "signup" ? (
                  <label className="legal-consent-checkbox" htmlFor="register-marketing-consent">
                    <input
                      id="register-marketing-consent"
                      type="checkbox"
                      checked={marketingAccepted}
                      onChange={(event) => setMarketingAccepted(event.target.checked)}
                    />
                    <span>Želim da primam promo ponude i novosti studija email-om.</span>
                  </label>
                ) : null}

                {authStatus.type !== "idle" ? (
                  <p className={authStatus.type === "error" ? "error-text" : "success-text"}>{authStatus.message}</p>
                ) : null}

                <div className="auth-luxe-actions">
                  <button type="submit" className="auth-luxe-submit" disabled={authBusy}>
                    <span className="auth-luxe-submit-shine" aria-hidden="true" />
                    {authBusy ? "Obrada..." : mode === "signin" ? "Prijavi se" : "Kreiraj nalog"}
                  </button>
                  <button
                    type="button"
                    className="auth-luxe-ghost"
                    onClick={() => {
                      setShowForgotPassword((current) => !current);
                      setForgotStatus({ type: "idle", message: "" });
                    }}
                  >
                    Zaboravljena šifra
                  </button>
                </div>
              </form>

              {showForgotPassword ? (
                <form className="auth-luxe-forgot" onSubmit={submitForgotPassword}>
                  <h3>Reset šifre</h3>
                  <p>Unesite email i poslaćemo vam link za postavljanje nove lozinke.</p>
                  <div className="auth-luxe-field">
                    <input
                      required
                      type="email"
                      value={forgotEmail}
                      placeholder="Email adresa"
                      onChange={(event) => setForgotEmail(event.target.value)}
                    />
                  </div>
                  {forgotStatus.type !== "idle" ? (
                    <p className={forgotStatus.type === "error" ? "error-text" : "success-text"}>{forgotStatus.message}</p>
                  ) : null}
                  <button type="submit" className="auth-luxe-submit" disabled={forgotBusy}>
                    <span className="auth-luxe-submit-shine" aria-hidden="true" />
                    {forgotBusy ? "Slanje..." : "Pošalji link za reset"}
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <div className="auth-luxe-reset-shell">
              <div className="auth-luxe-card-head">
                <h2>Bezbedno resetovanje šifre</h2>
                <p className="auth-luxe-reset-caption">
                  Link je jednokratan. Postavite jaču šifru kako biste zaštitili nalog i nastavili prijavu bez prekida.
                </p>
              </div>

              <div className="auth-luxe-steps" aria-hidden="true">
                <span className="auth-luxe-step is-done">Link otvoren</span>
                <span className="auth-luxe-step is-current">Nova šifra</span>
                <span className="auth-luxe-step">Potvrda</span>
              </div>

              {isResetTokenMalformed ? (
                <div className="auth-luxe-alert">
                  <ShieldAlert aria-hidden="true" />
                  <div>
                    <strong>Reset link nije validan.</strong>
                    <p>Otvorite prijavu i zatražite novi link za reset šifre.</p>
                  </div>
                </div>
              ) : (
                <form className="auth-luxe-form" onSubmit={submitResetPassword}>
                  <label className="auth-luxe-label" htmlFor="reset-new-password">
                    Nova šifra
                  </label>
                  <div className="auth-luxe-pw-wrap">
                    <input
                      id="reset-new-password"
                      required
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      placeholder="Unesite novu šifru"
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="auth-luxe-pw-toggle"
                      onClick={() => setShowNewPassword((value) => !value)}
                      aria-label={showNewPassword ? "Sakrij šifru" : "Prikaži šifru"}
                    >
                      {showNewPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>

                  <label className="auth-luxe-label" htmlFor="reset-confirm-password">
                    Potvrda nove šifre
                  </label>
                  <div className="auth-luxe-pw-wrap">
                    <input
                      id="reset-confirm-password"
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      placeholder="Ponovite novu šifru"
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="auth-luxe-pw-toggle"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={showConfirmPassword ? "Sakrij potvrdu šifre" : "Prikaži potvrdu šifre"}
                    >
                      {showConfirmPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>

                  <div className={`auth-luxe-strength is-${passwordStrengthTone}`}>
                    <div className="auth-luxe-strength-track" role="presentation">
                      <span style={{ width: `${passwordStrengthPercent}%` }} />
                    </div>
                    <p>{passwordStrengthLabel}</p>
                  </div>

                  <ul className="auth-luxe-rules" aria-label="Pravila za novu šifru">
                    {passwordRules.map((rule) => (
                      <li key={rule.id} className={rule.ok ? "is-ok" : ""}>
                        <CheckCircle2 aria-hidden="true" />
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>

                  {confirmPassword.length > 0 && !passwordsMatch ? (
                    <p className="error-text">Potvrda šifre se ne poklapa sa novom šifrom.</p>
                  ) : null}

                  {resetStatus.type !== "idle" ? (
                    <p className={resetStatus.type === "error" ? "error-text" : "success-text"}>{resetStatus.message}</p>
                  ) : null}

                  <div className="auth-luxe-actions">
                    <button type="submit" className="auth-luxe-submit" disabled={resetBusy || !canSubmitReset}>
                      <span className="auth-luxe-submit-shine" aria-hidden="true" />
                      {resetBusy ? "Resetovanje..." : "Sačuvaj novu šifru"}
                    </button>
                    <button type="button" className="auth-luxe-ghost" onClick={() => router.replace("/prijava")}>
                      Nazad na prijavu
                    </button>
                  </div>
                </form>
              )}

              <div className="auth-luxe-help">
                <KeyRound aria-hidden="true" />
                <p>
                  Ako je link istekao, vratite se na prijavu i izaberite opciju &quot;Zaboravljena šifra&quot;.
                </p>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<section className="auth-luxe" />}>
      <AuthPageContent />
    </Suspense>
  );
}
