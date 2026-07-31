"use client";

import { Check, Sparkles, Truck } from "lucide-react";

import {
  BONUS_THRESHOLD,
  FREE_SHIPPING_THRESHOLD,
  formatRewardAmount,
  rewardProgressMessage,
  type CartRewards,
} from "@/lib/cart-rewards";

type Props = {
  rewards: CartRewards;
  /** "compact" izostavlja legendu — za toast i navbar popover. */
  variant?: "default" | "compact";
  className?: string;
};

export function CartRewardMeter({ rewards, variant = "default", className = "" }: Props) {
  const progress = Math.min(100, (rewards.goodsTotal / FREE_SHIPPING_THRESHOLD) * 100);
  const bonusMark = (BONUS_THRESHOLD / FREE_SHIPPING_THRESHOLD) * 100;

  return (
    <div className={`reward-meter reward-meter-${variant} ${className}`.trim()}>
      <div
        className="reward-meter-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_THRESHOLD}
        aria-valuenow={Math.min(rewards.goodsTotal, FREE_SHIPPING_THRESHOLD)}
        aria-valuetext={rewardProgressMessage(rewards)}
      >
        <span className="reward-meter-fill" style={{ width: `${progress}%` }} />
        <span
          className={`reward-meter-node ${rewards.bonusActive ? "is-reached" : ""}`}
          style={{ left: `${bonusMark}%` }}
          aria-hidden
        >
          {rewards.bonusActive ? <Check /> : <Sparkles />}
        </span>
        <span
          className={`reward-meter-node reward-meter-node-end ${rewards.freeShipping ? "is-reached" : ""}`}
          style={{ left: "100%" }}
          aria-hidden
        >
          {rewards.freeShipping ? <Check /> : <Truck />}
        </span>
      </div>

      <p className="reward-meter-message">{rewardProgressMessage(rewards)}</p>

      {variant === "default" ? (
        <ul className="reward-meter-legend">
          <li className={rewards.bonusActive ? "is-reached" : ""}>
            <strong>{formatRewardAmount(BONUS_THRESHOLD)}</strong>
            <span>sledeći proizvod −15%</span>
          </li>
          <li className={rewards.freeShipping ? "is-reached" : ""}>
            <strong>{formatRewardAmount(FREE_SHIPPING_THRESHOLD)}</strong>
            <span>besplatna dostava</span>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export default CartRewardMeter;
