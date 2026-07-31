/**
 * Pravila nagrada u korpi — jedini izvor istine.
 *
 * Ovaj modul je namerno bez React-a i bez browser API-ja da bi ga koristili
 * i klijent (contexts/cart-context.tsx) i Convex server (convex/orders.ts),
 * pa iznosi na sajtu, u mejlu i u bazi uvek moraju da se poklope.
 */

export const BONUS_THRESHOLD = 5000;
export const BONUS_PERCENT = 15;
export const FREE_SHIPPING_THRESHOLD = 10000;

export type RewardInput = {
  key: string;
  addedAt: number;
  unitPrice: number;
  quantity: number;
};

export type RewardLine = {
  key: string;
  bonusApplied: boolean;
  payableUnitPrice: number;
  lineTotal: number;
};

export type CartRewards = {
  lines: RewardLine[];
  lineByKey: Record<string, RewardLine>;
  goodsTotal: number;
  payableTotal: number;
  bonusSavings: number;
  bonusActive: boolean;
  freeShipping: boolean;
  remainingToBonus: number;
  remainingToFreeShipping: number;
};

function safeMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function safeQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function applyBonusPercent(unitPrice: number) {
  return Math.max(0, Math.round(safeMoney(unitPrice) * (1 - BONUS_PERCENT / 100)));
}

/**
 * Bonus se dodeljuje po redosledu dodavanja u korpu: svaki artikal dodat nakon
 * što je zbir prethodnih artikala dostigao BONUS_THRESHOLD dobija BONUS_PERCENT.
 *
 * Prag se uvek meri na cenama PRE bonusa (`goodsTotal`) — taj zbir raste monotono,
 * pa stečena besplatna dostava ne može da "nestane" zbog bonus popusta.
 */
export function computeCartRewards(items: RewardInput[]): CartRewards {
  const ordered = [...items].sort((a, b) => {
    if (a.addedAt !== b.addedAt) return a.addedAt - b.addedAt;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  const lines: RewardLine[] = [];
  const lineByKey: Record<string, RewardLine> = {};
  let running = 0;
  let goodsTotal = 0;
  let payableTotal = 0;

  for (const item of ordered) {
    const unitPrice = safeMoney(item.unitPrice);
    const quantity = safeQuantity(item.quantity);
    const baseLineTotal = unitPrice * quantity;

    const bonusApplied = running >= BONUS_THRESHOLD && quantity > 0;
    const payableUnitPrice = bonusApplied ? applyBonusPercent(unitPrice) : unitPrice;
    const lineTotal = payableUnitPrice * quantity;

    const line: RewardLine = { key: item.key, bonusApplied, payableUnitPrice, lineTotal };
    lines.push(line);
    lineByKey[item.key] = line;

    running += baseLineTotal;
    goodsTotal += baseLineTotal;
    payableTotal += lineTotal;
  }

  const freeShipping = goodsTotal >= FREE_SHIPPING_THRESHOLD;

  return {
    lines,
    lineByKey,
    goodsTotal,
    payableTotal,
    bonusSavings: Math.max(0, goodsTotal - payableTotal),
    bonusActive: goodsTotal >= BONUS_THRESHOLD,
    freeShipping,
    remainingToBonus: Math.max(0, BONUS_THRESHOLD - goodsTotal),
    remainingToFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - goodsTotal),
  };
}

export function emptyCartRewards(): CartRewards {
  return computeCartRewards([]);
}

export function formatRewardAmount(value: number) {
  return `${safeMoney(value).toLocaleString("sr-Latn-RS")} RSD`;
}

/** Tekst dostave — mora da bude identičan svuda (korpa, checkout, mejl, admin). */
export function shippingLabel(freeShipping: boolean) {
  return freeShipping ? "Besplatna dostava" : "Plaća se kuriru pri preuzimanju";
}

export function shippingNote(freeShipping: boolean) {
  return freeShipping
    ? "Poštarinu plaća studio."
    : "Poštarinu plaćate kuriru po njihovom cenovniku.";
}

/** Kratka poruka o napretku — koristi je meter, toast i navbar popover. */
export function rewardProgressMessage(rewards: CartRewards) {
  if (rewards.freeShipping) {
    return "Besplatna dostava je otključana, a svaki sledeći proizvod je 15% jeftiniji.";
  }
  if (rewards.bonusActive) {
    return `Svaki sledeći proizvod je −15%. Još ${formatRewardAmount(
      rewards.remainingToFreeShipping,
    )} do besplatne dostave.`;
  }
  return `Još ${formatRewardAmount(rewards.remainingToBonus)} i sledeći proizvod je 15% jeftiniji.`;
}
