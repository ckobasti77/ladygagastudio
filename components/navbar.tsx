"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Moon, ShoppingCart, Sun, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { useLanguage } from "@/contexts/language-context";
import { useTheme } from "@/contexts/theme-context";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { session, logout } = useAuth();
  const { itemCount } = useCart();
  const [openForPath, setOpenForPath] = useState<string | null>(null);
  const menuId = "primary-navigation";
  const open = openForPath === pathname;
  const themeToggleLabel = theme === "light" ? "Prebaci na tamnu temu" : "Prebaci na svetlu temu";
  const menuToggleLabel = open ? "Zatvori meni" : "Otvori meni";

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/o-nama", label: t.nav.about },
    { href: "/galerija", label: t.nav.gallery },
    { href: "/proizvodi", label: t.nav.products },
    { href: "/kontakt", label: t.nav.contact },
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
            <span className="brand-title">
              <span className="brand-title-line">Studio</span>
              <span className="brand-title-line">Lady Gaga</span>
            </span>
            <span className="brand-subtitle">Kosa + lepota</span>
          </span>
        </Link>

        <div className="nav-quick-actions">
          <Link
            href="/korpa"
            className={`cart-nav-link ${pathname === "/korpa" ? "active" : ""}`}
            onClick={() => setOpenForPath(null)}
            aria-label={t.nav.cart}
            title={t.nav.cart}
          >
            <ShoppingCart aria-hidden />
            {itemCount > 0 ? <span className="nav-count-badge cart-nav-badge">{itemCount}</span> : null}
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="switch-btn nav-chip theme-switch-btn"
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
          >
            {theme === "light" ? <Moon aria-hidden /> : <Sun aria-hidden />}
          </button>
        </div>

        <button
          className={`burger ${open ? "open" : ""}`}
          onClick={() => setOpenForPath((currentPath) => (currentPath === pathname ? null : pathname))}
          aria-label={menuToggleLabel}
          aria-controls={menuId}
          aria-expanded={open}
          type="button"
        >
          {open ? <X aria-hidden strokeWidth={2.4} /> : <Menu aria-hidden strokeWidth={2.4} />}
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

          <Link
            href="/korpa"
            className={`hidden md:visible cart-nav-link ${pathname === "/korpa" ? "active" : ""}`}
            onClick={() => setOpenForPath(null)}
            aria-label={t.nav.cart}
            title={t.nav.cart}
          >
            <ShoppingCart aria-hidden />
            {itemCount > 0 ? <span className="nav-count-badge cart-nav-badge">{itemCount}</span> : null}
          </Link>

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
              <Link href="/prijava" className="switch-btn nav-chip nav-chip-primary" onClick={() => setOpenForPath(null)}>
                {t.nav.login}
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
