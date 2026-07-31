"use client";

import gsap from "gsap";
import Image from "next/image";
import Link from "next/link";
import { Check, ShoppingBag, Truck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import CartRewardMeter from "@/components/cart-reward-meter";
import { useCart } from "@/contexts/cart-context";
import { CART_ITEM_ADDED_EVENT, type CartItemAddedDetail } from "@/lib/cart-events";

const VISIBLE_MS = 5600;

type Unlocked = "bonus" | "shipping" | null;

export function CartRewardToast() {
  const { rewards } = useCart();
  const [detail, setDetail] = useState<CartItemAddedDetail | null>(null);
  const [unlocked, setUnlocked] = useState<Unlocked>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const previousRef = useRef({ bonusActive: false, freeShipping: false });
  const pendingUnlockRef = useRef<Unlocked>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setDetail(null);
      setUnlocked(null);
    }, VISIBLE_MS);
  }, [clearTimer]);

  // Prati prelaske pragova da bi toast mogao da ih proslavi.
  useEffect(() => {
    const previous = previousRef.current;
    if (rewards.freeShipping && !previous.freeShipping) {
      pendingUnlockRef.current = "shipping";
    } else if (rewards.bonusActive && !previous.bonusActive) {
      pendingUnlockRef.current = "bonus";
    }
    previousRef.current = { bonusActive: rewards.bonusActive, freeShipping: rewards.freeShipping };
  }, [rewards.bonusActive, rewards.freeShipping]);

  useEffect(() => {
    const onAdded = (event: Event) => {
      const custom = event as CustomEvent<CartItemAddedDetail>;
      if (!custom.detail) return;
      setDetail(custom.detail);
      // Prelaz praga se registruje u istom React prolazu kao i sam event.
      window.setTimeout(() => {
        setUnlocked(pendingUnlockRef.current);
        pendingUnlockRef.current = null;
      }, 0);
      startTimer();
    };

    window.addEventListener(CART_ITEM_ADDED_EVENT, onAdded);
    return () => {
      window.removeEventListener(CART_ITEM_ADDED_EVENT, onAdded);
      clearTimer();
    };
  }, [startTimer, clearTimer]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !detail) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24, ease: "none" });
      return;
    }

    const tween = gsap.fromTo(
      card,
      { autoAlpha: 0, y: -18, scale: 0.965, filter: "blur(10px)" },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.52,
        ease: "power3.out",
        clearProps: "filter",
      },
    );

    return () => {
      tween.kill();
    };
  }, [detail]);

  const dismiss = () => {
    clearTimer();
    setDetail(null);
    setUnlocked(null);
  };

  if (!detail) return null;

  const unlockedCopy =
    unlocked === "shipping"
      ? "Otključali ste besplatnu dostavu."
      : unlocked === "bonus"
        ? "Bonus je aktivan — sledeći proizvod je −15%."
        : null;

  return (
    <div className="reward-toast-viewport" role="status" aria-live="polite">
      <div
        ref={cardRef}
        className={`reward-toast ${unlocked ? "is-unlocked" : ""}`}
        onPointerEnter={clearTimer}
        onPointerLeave={startTimer}
      >
        <button type="button" className="reward-toast-close" onClick={dismiss} aria-label="Zatvori obaveštenje">
          <X aria-hidden />
        </button>

        <div className="reward-toast-head">
          <span className="reward-toast-thumb">
            <Image
              src={detail.image || "/logo.png"}
              alt=""
              width={112}
              height={112}
              sizes="56px"
              aria-hidden
            />
          </span>
          <div className="reward-toast-heading">
            <p className="reward-toast-kicker">
              <ShoppingBag aria-hidden />
              <span>Dodato u korpu</span>
            </p>
            <strong>{detail.title}</strong>
          </div>
        </div>

        {unlockedCopy ? (
          <p className="reward-toast-unlocked">
            {unlocked === "shipping" ? <Truck aria-hidden /> : <Check aria-hidden />}
            <span>{unlockedCopy}</span>
          </p>
        ) : null}

        <CartRewardMeter rewards={rewards} variant="compact" />

        <div className="reward-toast-actions">
          <Link href="/korpa" className="reward-toast-cta" onClick={dismiss}>
            Idi u korpu
          </Link>
          <button type="button" className="reward-toast-ghost" onClick={dismiss}>
            Nastavi kupovinu
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartRewardToast;
