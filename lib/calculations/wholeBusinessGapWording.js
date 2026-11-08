// lib/calculations/wholeBusinessGapWording.js
// R3 slice 5 batch C (Business Modelling brief Addendum 42 item 6). Pure, no imports.
// Builds the whole-business sentences from the result of calculateWholeBusinessRateGap. Arithmetic only: it states how far revenue per hour
// sits above or below each rate and names what was left out. It gives no advice and holds no calculation of its own.
// The amounts are the gaps the helper already returned (subtraction of the displayed, rounded rates), so the sentence matches the table to the cent.
//
// Returns { two_rate_sentence, left_out_sentence, no_earning_sentence }; each is a string or null.
//   two_rate_sentence  one template for every included case, naming BOTH rates, and the break-even rate when its gap is present (above, below or equal to). Null when the row is not available.
//   left_out_sentence  separate sentence naming each earning group left out and why. Null when none were left out.
//   no_earning_sentence shown when no earning group has a complete set of figures. Null otherwise.

// A missing figure is never 0: null, undefined and "" are not numbers here.
function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function amount(value) {
  return "$" + Math.abs(value).toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function part(gap, rate_label) {
  if (gap === 0) {
    return `equal to the ${rate_label}`;
  }
  return `${amount(gap)} ${gap > 0 ? "above" : "below"} the ${rate_label}`;
}

export function buildWholeBusinessGapWording(whole) {
  const available = Boolean(whole && whole.available === true);
  const gap_min = numberOrNull(whole?.gap_to_min_rate);
  const gap_full = numberOrNull(whole?.gap_to_full_cost_rate);
  const gaps_ok = available && gap_min !== null && gap_full !== null;
  const excluded = Array.isArray(whole?.excluded_groups) ? whole.excluded_groups : [];

  // Item 18 (BM Addendum 50): when the helper returned the break-even gap the same sentence names a third rate; without it the sentence is unchanged.
  const gap_floor = numberOrNull(whole?.gap_to_breakeven_rate);
  const two_rate_sentence = !gaps_ok
    ? null
    : gap_floor === null
      ? `Revenue per hour is ${part(gap_min, "group minimum rate")} and ${part(gap_full, "full cost rate")}.`
      : `Revenue per hour is ${part(gap_min, "group minimum rate")}, ${part(gap_full, "full cost rate")} and ${part(gap_floor, "break-even rate")}.`;

  const left_out_sentence = excluded.length > 0
    ? `Left out of the whole business row: ${excluded.map((g) => `${g.group_name || g.group_id} (${g.reason})`).join("; ")}.`
    : null;

  const no_earning_sentence = gaps_ok
    ? null
    : "No earning group has a complete set of figures, so the whole business row and its gaps are not shown.";

  return { two_rate_sentence, left_out_sentence, no_earning_sentence };
}
