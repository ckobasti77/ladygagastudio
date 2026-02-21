"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { requestPasswordResetEmail, resetPassword } from "./actions";

type UserAuthMode = "signin" | "signup";

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Dogodila se greska. Pokusajte ponovo.";
}

export default function AuthPage() {
  const { loginUser, registerUser } = useAuth();
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
          setAuthStatus({ type: "error", message: "Neispravan email ili sifra." });
          return;
        }
        setAuthStatus({ type: "success", message: "Uspesna prijava." });
        router.push(session.isAdmin ? "/admin" : "/");
        return;
      }

      await registerUser(firstName, lastName, email, password);
      setAuthStatus({ type: "success", message: "Registracija uspesna. Prijavljeni ste." });
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
      setResetStatus({ type: "error", message: "Nova sifra mora imati najmanje 8 karaktera." });
      return;
    }
    if (!passwordRules.every((rule) => rule.ok)) {
      setResetStatus({
        type: "error",
        message: "Nova sifra mora imati veliko slovo, broj i specijalni znak.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetStatus({ type: "error", message: "Potvrda sifre se ne poklapa." });
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
    <section className="auth-cosmos">
      <div className="auth-cosmos-grid">
        <article className="auth-orbit">
          <p className="auth-orbit-kicker">Pristup nalogu</p>
          <h1>Prijava i bezbednost naloga</h1>
          <p>
            Prijavite se ili kreirajte nalog kroz jedinstven i bezbedan pristup. Sistem automatski primenjuje nivo
            ovlascenja prema vasem nalogu.
          </p>

          <div className="auth-orbit-tags">
            <span>Prijava</span>
            <span>Registracija</span>
            <span>Reset lozinke</span>
          </div>
        </article>

        <article className="auth-holo-card">
          {!isResetMode ? (
            <>
              <div className="auth-holo-head">
                <h2>{mode === "signin" ? "Prijava naloga" : "Registracija naloga"}</h2>
                <div className="auth-mode-switch" role="tablist" aria-label="Korisnicka autentikacija">
                  <button
                    type="button"
                    className={`switch-btn nav-chip ${mode === "signin" ? "nav-chip-primary" : ""}`}
                    onClick={() => setMode("signin")}
                  >
                    Prijava
                  </button>
                  <button
                    type="button"
                    className={`switch-btn nav-chip ${mode === "signup" ? "nav-chip-primary" : ""}`}
                    onClick={() => setMode("signup")}
                  >
                    Registracija
                  </button>
                </div>
              </div>

              <form className="modal-form auth-form auth-holo-form" onSubmit={submitUser}>
                {mode === "signup" ? (
                  <div className="form-row-2">
                    <input required value={firstName} placeholder="Ime" onChange={(event) => setFirstName(event.target.value)} />
                    <input required value={lastName} placeholder="Prezime" onChange={(event) => setLastName(event.target.value)} />
                  </div>
                ) : null}

                <input required type="email" value={email} placeholder="Email" onChange={(event) => setEmail(event.target.value)} />
                <input
                  required
                  type="password"
                  value={password}
                  placeholder="Sifra"
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                />

                {authStatus.type !== "idle" ? (
                  <p className={authStatus.type === "error" ? "error-text" : "success-text"}>{authStatus.message}</p>
                ) : null}

                <div className="auth-form-actions">
                  <button type="submit" className="primary-btn" disabled={authBusy}>
                    {authBusy ? "Obrada..." : mode === "signin" ? "Prijavi se" : "Kreiraj nalog"}
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => {
                      setShowForgotPassword((current) => !current);
                      setForgotStatus({ type: "idle", message: "" });
                    }}
                  >
                    Zaboravljena sifra
                  </button>
                </div>
              </form>

              {showForgotPassword ? (
                <form className="auth-forgot-panel" onSubmit={submitForgotPassword}>
                  <h3>Reset sifre</h3>
                  <p>Unesite email i poslacemo vam link za postavljanje nove lozinke.</p>
                  <input
                    required
                    type="email"
                    value={forgotEmail}
                    placeholder="Email adresa"
                    onChange={(event) => setForgotEmail(event.target.value)}
                  />
                  {forgotStatus.type !== "idle" ? (
                    <p className={forgotStatus.type === "error" ? "error-text" : "success-text"}>{forgotStatus.message}</p>
                  ) : null}
                  <button type="submit" className="primary-btn" disabled={forgotBusy}>
                    {forgotBusy ? "Slanje..." : "Posalji link za reset"}
                  </button>
                </form>
              ) : null}
            </>
          ) : (
            <div className="auth-reset-shell">
              <div className="auth-holo-head">
                <h2>Bezbedno resetovanje sifre</h2>
                <p className="auth-reset-caption">
                  Link je jednokratan. Postavite jacu sifru kako biste zastitili nalog i nastavili prijavu bez prekida.
                </p>
              </div>

              <div className="auth-reset-steps" aria-hidden="true">
                <span className="auth-reset-step is-done">Link otvoren</span>
                <span className="auth-reset-step is-current">Nova sifra</span>
                <span className="auth-reset-step">Potvrda</span>
              </div>

              {isResetTokenMalformed ? (
                <div className="auth-reset-alert">
                  <ShieldAlert aria-hidden="true" />
                  <div>
                    <strong>Reset link nije validan.</strong>
                    <p>Otvorite prijavu i zatrazi novi link za reset sifre.</p>
                  </div>
                </div>
              ) : (
                <form className="modal-form auth-form auth-holo-form" onSubmit={submitResetPassword}>
                  <label className="auth-reset-label" htmlFor="reset-new-password">
                    Nova sifra
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      id="reset-new-password"
                      required
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      placeholder="Unesite novu sifru"
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowNewPassword((value) => !value)}
                      aria-label={showNewPassword ? "Sakrij sifru" : "Prikazi sifru"}
                    >
                      {showNewPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>

                  <label className="auth-reset-label" htmlFor="reset-confirm-password">
                    Potvrda nove sifre
                  </label>
                  <div className="auth-password-wrap">
                    <input
                      id="reset-confirm-password"
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      placeholder="Ponovite novu sifru"
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      aria-label={showConfirmPassword ? "Sakrij potvrdu sifre" : "Prikazi potvrdu sifre"}
                    >
                      {showConfirmPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </button>
                  </div>

                  <div className={`auth-strength-meter is-${passwordStrengthTone}`}>
                    <div className="auth-strength-track" role="presentation">
                      <span style={{ width: `${passwordStrengthPercent}%` }} />
                    </div>
                    <p>{passwordStrengthLabel}</p>
                  </div>

                  <ul className="auth-password-rules" aria-label="Pravila za novu sifru">
                    {passwordRules.map((rule) => (
                      <li key={rule.id} className={rule.ok ? "is-ok" : ""}>
                        <CheckCircle2 aria-hidden="true" />
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>

                  {confirmPassword.length > 0 && !passwordsMatch ? (
                    <p className="error-text">Potvrda sifre se ne poklapa sa novom sifrom.</p>
                  ) : null}

                  {resetStatus.type !== "idle" ? (
                    <p className={resetStatus.type === "error" ? "error-text" : "success-text"}>{resetStatus.message}</p>
                  ) : null}

                  <div className="auth-form-actions">
                    <button type="submit" className="primary-btn" disabled={resetBusy || !canSubmitReset}>
                      {resetBusy ? "Resetovanje..." : "Sacuvaj novu sifru"}
                    </button>
                    <button type="button" className="ghost-btn" onClick={() => router.replace("/prijava")}>
                      Nazad na prijavu
                    </button>
                  </div>
                </form>
              )}

              <div className="auth-reset-help">
                <KeyRound aria-hidden="true" />
                <p>
                  Ako je link istekao, vratite se na prijavu i izaberite opciju &quot;Zaboravljena sifra&quot;.
                </p>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
