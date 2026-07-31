"use client";

import { useEffect } from "react";

type ProductsErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

export default function ProductsError({ error, reset, unstable_retry }: ProductsErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = unstable_retry ?? reset;

  return (
    <section className="boutique-shop-page boutique-route-error">
      <div className="boutique-empty">
        <h2>Doslo je do problema pri ucitavanju proizvoda.</h2>
        <p>Osvezite prikaz i pokusajte ponovo.</p>
        <button className="primary-btn" type="button" onClick={() => retry?.()}>
          Pokusaj ponovo
        </button>
      </div>
    </section>
  );
}
