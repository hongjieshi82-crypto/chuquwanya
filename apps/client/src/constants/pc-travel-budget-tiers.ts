export type PcTravelPeriod = '当天' | '周末游' | '小长假';
export type PcBudgetTier = '划算出行' | '舒服躺玩' | '品质享受';

type BudgetRange = { min: number; max: number | null };

const defaultBudgetRanges: Record<PcTravelPeriod, Record<PcBudgetTier, BudgetRange>> = {
  当天: {
    划算出行: { min: 0, max: 200 },
    舒服躺玩: { min: 200, max: 400 },
    品质享受: { min: 400, max: null },
  },
  周末游: {
    划算出行: { min: 200, max: 700 },
    舒服躺玩: { min: 700, max: 1300 },
    品质享受: { min: 1300, max: null },
  },
  小长假: {
    划算出行: { min: 500, max: 1100 },
    舒服躺玩: { min: 1100, max: 2000 },
    品质享受: { min: 2000, max: null },
  },
};

// 运营可通过 EXPO_PUBLIC_PC_TRAVEL_BUDGET_TIERS_JSON 覆盖默认价格矩阵。
function readConfiguredBudgetRanges() {
  const raw = process.env.EXPO_PUBLIC_PC_TRAVEL_BUDGET_TIERS_JSON;
  if (!raw) return defaultBudgetRanges;

  try {
    return JSON.parse(raw) as typeof defaultBudgetRanges;
  } catch {
    return defaultBudgetRanges;
  }
}

export const pcTravelBudgetRanges = readConfiguredBudgetRanges();

export function getPcTravelBudgetRange(period: string, tier: string): BudgetRange {
  const safePeriod = period in pcTravelBudgetRanges ? period as PcTravelPeriod : '当天';
  const ranges = pcTravelBudgetRanges[safePeriod];
  return tier in ranges ? ranges[tier as PcBudgetTier] : ranges.划算出行;
}
