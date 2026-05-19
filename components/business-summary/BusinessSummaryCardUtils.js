export const TIME_SCALES = [
  { key: "hour", label: "Hour", suffix: "/ hr" },
  { key: "day", label: "Day", suffix: "/ day" },
  { key: "week", label: "Week", suffix: "/ week" },
  { key: "month", label: "Month", suffix: "/ month" },
  { key: "quarter", label: "Quarter", suffix: "/ quarter" },
  { key: "year", label: "Year", suffix: "/ year" },
];

export function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatDisplayPercent(value) {
  const percent = Number(value) || 0;

  if (percent === 0) return "0%";
  if (percent > 0 && percent < 0.1) return "<0.1%";

  return `${percent.toFixed(1)}%`;
}

export function formatNumber(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 0,
  }).format(number);
}

export function scaleAnnualValue(annualValue, timeScale, hourlyValue = 0) {
  const value = Number(annualValue) || 0;

  if (timeScale === "hour") return Number(hourlyValue) || 0;
  if (timeScale === "day") return value / 260;
  if (timeScale === "week") return value / 52;
  if (timeScale === "month") return value / 12;
  if (timeScale === "quarter") return value / 4;

  return value;
}

export function scalePeriodValue(annualValue, timeScale, recoveryHoursUsed = 0) {
  const value = Number(annualValue) || 0;
  const recoveryHours = Number(recoveryHoursUsed) || 0;

  if (timeScale === "hour") {
    return recoveryHours > 0 ? value / recoveryHours : 0;
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

export function getTimeScaleName(timeScale) {
  return TIME_SCALES.find((option) => option.key === timeScale)?.label ?? "Hour";
}

export function calculateShare(part, total) {
  const safePart = Number(part) || 0;
  const safeTotal = Number(total) || 0;

  return safeTotal > 0 ? (safePart / safeTotal) * 100 : 0;
}

export function getNodeChildren(node = {}) {
  return Array.isArray(node.children) ? node.children : [];
}

export function hasAvailableChildren(node = {}) {
  return getNodeChildren(node).length > 0;
}

export function findNodeByPath(root, path = []) {
  return path.slice(1).reduce((currentNode, key) => {
    return getNodeChildren(currentNode).find((child) => child.key === key);
  }, root);
}

export function getBreadcrumbNodes(root, path = []) {
  const crumbs = [];
  let currentNode = root;

  path.forEach((key, index) => {
    if (index === 0) {
      crumbs.push(root);
      return;
    }

    currentNode = getNodeChildren(currentNode).find(
      (child) => child.key === key
    );

    if (currentNode) {
      crumbs.push(currentNode);
    }
  });

  return crumbs;
}
