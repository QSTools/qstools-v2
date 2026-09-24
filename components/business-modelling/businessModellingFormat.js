// components/business-modelling/businessModellingFormat.js
// Display formatting for the v6.0 Business Modelling lever panel only.

function finite(v) {
  const n = Number(v);
  return v !== null && v !== undefined && Number.isFinite(n) ? n : null;
}

export function formatMoney(v) {
  const n = finite(v);
  if (n === null) return "-";
  const text = Math.abs(n).toLocaleString("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });
  return n < 0 ? "-" + text : text;
}

export function formatSignedMoney(v) {
  const n = finite(v);
  if (n === null) return "-";
  return (n > 0 ? "+" : "") + formatMoney(n);
}

export function formatRate(v, unit) {
  const n = finite(v);
  if (n === null) return "-";
  if (unit === "percent") return n.toFixed(2) + "%";
  const text = "$" + Math.abs(n).toFixed(2) + "/hr";
  return n < 0 ? "-" + text : text;
}