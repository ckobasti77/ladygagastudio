"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { session, logout } = useAuth();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const menuId = "primary-navigation";
  const open = openForPath === pathname;
  const themeToggleLabel = theme === "light" ? "Prebaci na tamnu temu" : "Prebaci na svetlu temu";

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/about", label: t.nav.about },
    { href: "/products", label: t.nav.products },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header className="site-header">
      <nav className="container nav-wrap" aria-label="Glavna navigacija">
        <Link href="/" className="brand">
          <span className="brand-logo-shell">
            <Image src="/logo.png" alt="Studio Lady Gaga" width={52} height={52} className="logo" />
            <span className="brand-pulse" aria-hidden />
          </span>
          <span className="brand-copy">
            <span className="brand-title">Studio Lady Gaga</span>
            <span className="brand-subtitle">Frizerski studio</span>
          </span>
        </Link>

        <button
          className={`burger ${open ? "open" : ""}`}
          onClick={() => setOpenForPath((currentPath) => (currentPath === pathname ? null : pathname))}
          aria-label="Meni"
          aria-controls={menuId}
          aria-expanded={open}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-right ${open ? "open" : ""}`} id={menuId}>
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? "active" : ""}`}
                  onClick={() => setOpenForPath(null)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {session?.isAdmin ? (
              <li>
                <Link
                  href="/admin"
                  className={`nav-link ${pathname === "/admin" ? "active" : ""}`}
                  onClick={() => setOpenForPath(null)}
                >
                  {t.nav.admin}
                </Link>
              </li>
            ) : null}
          </ul>

          <div className="switches">
            <button
              type="button"
              onClick={toggleTheme}
              className="switch-btn nav-chip theme-switch-btn"
              aria-label={themeToggleLabel}
              title={themeToggleLabel}
            >
              {theme === "light" ? <Moon aria-hidden /> : <Sun aria-hidden />}
            </button>
            {session ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpenForPath(null);
                }}
                className="switch-btn nav-chip nav-chip-danger"
              >
                {t.nav.logout}
              </button>
            ) : (
              <Link href="/login" className="switch-btn nav-chip nav-chip-primary" onClick={() => setOpenForPath(null)}>
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
