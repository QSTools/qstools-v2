import { formatCostSummaryPercent } from "@/lib/selectors/costSummarySelectors";

export const TIME_SCALES = [
  { key: "hour", label: "Hour", suffix: "/ hr" },
  { key: "day", label: "Day", suffix: "/ day" },
  { key: "week", label: "Week", suffix: "/ week" },
  { key: "month", label: "Month", suffix: "/ month" },
  { key: "quarter", label: "Quarter", suffix: "/ quarter" },
  { key: "year", label: "Year", suffix: "/ year" },
];

export function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function formatMoney(value, maximumFractionDigits = 0) {
  const number = toNumber(value);

  return `$${number.toLocaleString(undefined, {
    maximumFractionDigits,
  })}`;
}

export function formatNumber(value) {
  return toNumber(value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

export function calculateShare(part, total) {
  const safePart = toNumber(part);
  const safeTotal = toNumber(total);

  if (safeTotal <= 0) return 0;
  return (safePart / safeTotal) * 100;
}

export function scaleAnnualValue(
  annualValue,
  timeScale,
  totalRecoveryHours,
  openHours = 0
) {
  const value = toNumber(annualValue);
  const recoveryHours = toNumber(totalRecoveryHours);
  const hours = toNumber(openHours);

  if (timeScale === "hour") {
    return hours > 0 ? value / hours : 0;
  }

  if (timeScale === "day") return value / 260;
  if (timeScale === "week") return value / 52;
  if (timeScale === "month") return value / 12;
  if (timeScale === "quarter") return value / 4;

  return value;
}

export function getTimeScaleSuffix(timeScale) {
  return TIME_SCALES.find((option) => option.key === timeScale)?.suffix ?? "";
}

export function getInsightForLevel(level, items, total_cost_burden) {
  const largestItem = [...items].sort((a, b) => b.amount - a.amount)[0];

  if (!largestItem || total_cost_burden <= 0) {
    return "Cost Summary shows the business cost that must be recovered.";
  }

  const shareOfTotal = calculateShare(largestItem.amount, total_cost_burden);

  if (level === "total") {
    return `${largestItem.label} is the largest part of your total cost at ${formatCostSummaryPercent(
      shareOfTotal
    )}.`;
  }

  return `${largestItem.label} is the largest item in this layer and represents ${formatCostSummaryPercent(
    shareOfTotal
  )} of your total cost.`;
}
