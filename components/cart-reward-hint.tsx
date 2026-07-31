"use client";

import Link from "next/link";
import { Gift, Sparkles, Truck } from "lucide-react";

import { useCart } from "@/contexts/cart-context";
import {
  BONUS_PERCENT,
  BONUS_THRESHOLD,
  FREE_SHIPPING_THRESHOLD,
  formatRewardAmount,
  rewardProgressMessage,
} from "@/lib/cart-rewards";

type Props = {
  /** Kad je korpa prazna prikazuje se opšta ponuda umesto napretka. */
  showWhenEmpty?: boolean;
  className?: string;
};

export function CartRewardHint({ showWhenEmpty = false, className = "" }: Props) {
  const { itemCount, rewards } = useCart();

  if (itemCount === 0 && !showWhenEmpty) return null;

  const progress = Math.min(100, (rewards.goodsTotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (itemCount === 0) {
    return (
      <div className={`reward-hint ${className}`.trim()}>
        <Gift className="reward-hint-glyph" aria-hidden />
        <p>
          Preko <strong>{formatRewardAmount(BONUS_THRESHOLD)}</strong> svaki sledeći proizvod je −{BONUS_PERCENT}%, a
          preko <strong>{formatRewardAmount(FREE_SHIPPING_THRESHOLD)}</strong> dostava je besplatna.
        </p>
      </div>
    );
  }

  return (
    <div className={`reward-hint is-active ${rewards.freeShipping ? "is-complete" : ""} ${className}`.trim()}>
      {rewards.freeShipping ? (
        <Truck className="reward-hint-glyph" aria-hidden />
      ) : (
        <Sparkles className="reward-hint-glyph" aria-hidden />
      )}
      <p>{rewardProgressMessage(rewards)}</p>
      <span className="reward-hint-bar" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </span>
      <Link href="/korpa" className="reward-hint-link">
        Korpa
      </Link>
    </div>
  );
}

export default CartRewardHint;
