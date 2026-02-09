"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";

export default function LoginPage() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const ok = await login(username, password);
    if (!ok) {
      setError(t.auth.invalid);
      return;
    }
    router.push("/admin");
  };

  return (
    <section className="auth-wrap">
      <form className="info-card modal-form" onSubmit={submit}>
        <h1>{t.auth.title}</h1>
        <input required value={username} placeholder={t.auth.username} onChange={(e) => setUsername(e.target.value)} />
        <input required type="password" value={password} placeholder={t.auth.password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit">{t.auth.submit}</button>
      </form>
    </section>
  );
}
