import { BillShare, Friend, SplitBill } from '../types';

export interface DebtLine {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amountPkr: number;
}

export interface SplitNetSummary {
  owedToYouPkr: number;
  youOwePkr: number;
  netBalancePkr: number; // positive = friends owe you, negative = you owe friends
  debtLines: DebtLine[];
}

export function calculateEqualShares(
  totalWithTipPkr: number,
  participantIds: string[],
  payerId: string
): BillShare[] {
  const count = participantIds.length;
  if (count === 0) return [];

  const base = Math.floor(totalWithTipPkr / count);
  let remainder = totalWithTipPkr - base * count;

  return participantIds.map((friendId) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return {
      friendId,
      amountPkr: base + extra,
      settled: friendId === payerId,
    };
  });
}

export function calculatePercentageShares(
  totalWithTipPkr: number,
  percentages: Record<string, number>,
  participantIds: string[],
  payerId: string
): BillShare[] {
  if (participantIds.length === 0) return [];

  const raw = participantIds.map((friendId) => {
    const pct = percentages[friendId] ?? 0;
    return {
      friendId,
      pct,
      amountPkr: Math.round((totalWithTipPkr * pct) / 100),
    };
  });

  const sum = raw.reduce((acc, item) => acc + item.amountPkr, 0);
  const diff = totalWithTipPkr - sum;
  if (diff !== 0 && raw.length > 0) {
    raw[0].amountPkr = Math.max(0, raw[0].amountPkr + diff);
  }

  return raw.map((item) => ({
    friendId: item.friendId,
    amountPkr: item.amountPkr,
    percentage: item.pct,
    settled: item.friendId === payerId,
  }));
}

export function calculateExactSharesWithTip(
  exactBasePkr: Record<string, number>,
  tipOrTaxPkr: number,
  participantIds: string[],
  payerId: string
): BillShare[] {
  if (participantIds.length === 0) return [];

  const baseTotal = participantIds.reduce(
    (sum, id) => sum + (exactBasePkr[id] ?? 0),
    0
  );

  const raw = participantIds.map((friendId) => {
    const base = exactBasePkr[friendId] ?? 0;
    const tipShare =
      baseTotal > 0
        ? Math.round((base / baseTotal) * tipOrTaxPkr)
        : Math.round(tipOrTaxPkr / participantIds.length);
    return {
      friendId,
      amountPkr: base + tipShare,
    };
  });

  const targetTotal = baseTotal + tipOrTaxPkr;
  const currentTotal = raw.reduce((acc, item) => acc + item.amountPkr, 0);
  const diff = targetTotal - currentTotal;
  if (diff !== 0 && raw.length > 0) {
    raw[0].amountPkr = Math.max(0, raw[0].amountPkr + diff);
  }

  return raw.map((item) => ({
    friendId: item.friendId,
    amountPkr: item.amountPkr,
    settled: item.friendId === payerId,
  }));
}

export function computeSplitNetSummary(
  bills: SplitBill[],
  friends: Friend[],
  selfId = 'you'
): SplitNetSummary {
  const nameMap = new Map(friends.map((f) => [f.id, f.name]));
  const pairNet = new Map<string, number>();

  for (const bill of bills) {
    for (const share of bill.shares) {
      if (share.settled || share.friendId === bill.payerId || share.amountPkr <= 0) {
        continue;
      }
      const from = share.friendId;
      const to = bill.payerId;
      // Canonical pair key sorted alphabetically
      const [a, b] = from < to ? [from, to] : [to, from];
      const key = `${a}::${b}`;
      const delta = from === a ? share.amountPkr : -share.amountPkr;
      pairNet.set(key, (pairNet.get(key) ?? 0) + delta);
    }
  }

  const debtLines: DebtLine[] = [];
  let owedToYouPkr = 0;
  let youOwePkr = 0;

  for (const [key, net] of pairNet.entries()) {
    if (Math.abs(net) < 1) continue;
    const [a, b] = key.split('::');
    const fromId = net > 0 ? a : b;
    const toId = net > 0 ? b : a;
    const amountPkr = Math.round(Math.abs(net));

    if (toId === selfId) {
      owedToYouPkr += amountPkr;
    } else if (fromId === selfId) {
      youOwePkr += amountPkr;
    }

    debtLines.push({
      fromId,
      fromName: nameMap.get(fromId) ?? 'Friend',
      toId,
      toName: nameMap.get(toId) ?? 'Friend',
      amountPkr,
    });
  }

  // Sort lines involving You first, largest amounts on top
  debtLines.sort((x, y) => {
    const xSelf = x.fromId === selfId || x.toId === selfId ? 1 : 0;
    const ySelf = y.fromId === selfId || y.toId === selfId ? 1 : 0;
    if (xSelf !== ySelf) return ySelf - xSelf;
    return y.amountPkr - x.amountPkr;
  });

  return {
    owedToYouPkr,
    youOwePkr,
    netBalancePkr: owedToYouPkr - youOwePkr,
    debtLines,
  };
}
