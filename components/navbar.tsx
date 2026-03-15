"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const isHeaderHiddenRef = useRef(false);
  const menuId = "primary-navigation";
  const open = openForPath === pathname;
  const themeToggleLabel = theme === "light" ? "Prebaci na tamnu temu" : "Prebaci na svetlu temu";
  const menuToggleLabel = open ? "Zatvori meni" : "Otvori meni";
  const headerTransform = isHeaderHidden
    ? "translateY(calc(-100% - var(--site-header-top-pad) - var(--site-header-bottom-pad)))"
    : "translateY(0)";
  const headerTransition = isHeaderHidden
    ? "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)"
    : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/o-nama", label: t.nav.about },
    { href: "/galerija", label: t.nav.gallery },
    { href: "/proizvodi", label: t.nav.products },
    { href: "/kontakt", label: t.nav.contact },
  ];

  useEffect(() => {
    isHeaderHiddenRef.current = isHeaderHidden;
  }, [isHeaderHidden]);

  useEffect(() => {
    const threshold = 1;
    lastScrollYRef.current = window.scrollY;

    const handleScroll = () => {
      if (tickingRef.current) {
        return;
      }

      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollYRef.current;
        const scrollingDown = delta > threshold;
        const scrollingUp = delta < -threshold;
        let nextHidden = isHeaderHiddenRef.current;

        if (open || currentY <= 4) {
          nextHidden = false;
        } else if (scrollingDown) {
          nextHidden = true;
        } else if (scrollingUp) {
          nextHidden = false;
        }

        if (nextHidden !== isHeaderHiddenRef.current) {
          setIsHeaderHidden(nextHidden);
        }

        lastScrollYRef.current = currentY;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [open]);

  return (
    <header
      className={[
        "site-header",
        isHeaderHidden ? "site-header-hidden" : "site-header-visible",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        transform: headerTransform,
        transition: headerTransition,
        willChange: "transform",
        pointerEvents: isHeaderHidden ? "none" : "auto",
      }}
    >
      <nav className="container nav-wrap" aria-label="Glavna navigacija">
        <Link href="/" className="brand">
          <span className="brand-logo-shell">
            <Image src="/logo.png" alt="Studio Lady Gaga" width={52} height={52} className="logo" />
          </span>
          <span className="brand-copy">
            <span className="brand-title">Studio Lady Gaga</span>
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
            className="theme-toggle-btn"
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

          <div className="nav-actions">
            {session ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setOpenForPath(null);
                }}
                className="nav-auth-btn"
              >
                {t.nav.logout}
              </button>
            ) : (
              <Link href="/prijava" className="nav-auth-btn" onClick={() => setOpenForPath(null)}>
                {t.nav.login}
              </Link>
            )}

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
              className="theme-toggle-btn"
              aria-label={themeToggleLabel}
              title={themeToggleLabel}
            >
              {theme === "light" ? <Moon aria-hidden /> : <Sun aria-hidden />}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
