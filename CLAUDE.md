# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Studio Lady Gaga — a Serbian hair salon e-commerce website with product catalog, shopping cart, gallery, admin dashboard, and order management. All UI text is in Serbian (Latin script, `sr-Latn`).

## Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Database/Backend**: Convex (real-time BaaS) — schema in `convex/schema.ts`
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`), global styles in `app/globals.css`
- **Email**: Nodemailer (used in server actions for order confirmations/contact)
- **Icons**: lucide-react
- **Language**: TypeScript throughout

## Commands

```bash
npm run dev      # Start Next.js dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npx convex dev   # Start Convex dev backend (required alongside Next.js dev)
```

Both `npm run dev` and `npx convex dev` must run simultaneously during development. Convex URL is configured via `NEXT_PUBLIC_CONVEX_URL` in `.env.local`.

## Architecture

### Data Flow

`ConvexProvider` → `ThemeProvider` → `LanguageProvider` → `AuthProvider` → `CartProvider` wraps the entire app (see `components/providers.tsx`). All Convex queries/mutations use the generated `api` object from `convex/_generated/api`.

### Authentication

Client-side auth via `contexts/auth-context.tsx`. Sessions are persisted to `localStorage` (no JWT/cookie auth). The `useAuth()` hook provides `session`, `loginUser`, `registerUser`, `logout`. Admin access is gated by `session.isAdmin`.

### Cart

Client-side cart stored in `localStorage` under key `studio_lady_gaga_cart_v1`. Managed by `contexts/cart-context.tsx` with `useCart()` hook. Discount is percentage-based.

### Convex Schema (Key Tables)

- `users` — admin users (username/password login)
- `customers` — customer accounts (email/password with hashed passwords)
- `products` — catalog items linked to `categories` via `categoryId`
- `orders` — orders with embedded `items[]` array and `customer` object
- `inquiries` — contact form submissions
- `galleryImages` — uploaded gallery images via Convex storage

### Server Actions

Next.js Server Actions live in `app/**/actions.ts` files (e.g., `app/prijava/actions.ts`, `app/placanje/actions.ts`, `app/kontakt/actions.ts`, `app/admin/ponude/actions.ts`). The `convex/actions.ts` file is intentionally empty.

### Pages (Serbian Routes)

- `/` — homepage
- `/proizvodi` — product catalog; `/proizvodi/[productId]` — product detail
- `/korpa` — cart
- `/placanje` — checkout
- `/galerija` — photo gallery
- `/o-nama` — about
- `/kontakt` — contact form
- `/prijava` — login/register
- `/admin` — admin dashboard (product/category/image management)
- `/admin/ponude` — order management
- Legal pages: `/politika-privatnosti`, `/politika-kolacica`, `/pravila-koriscenja`, `/pravno`

### Image Handling

Product images use Convex storage (`_storage` table). Remote image patterns for `next/image` are configured in `next.config.ts` for `*.convex.cloud` and `*.convex.site` domains.
