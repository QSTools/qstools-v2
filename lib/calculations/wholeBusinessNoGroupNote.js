// lib/calculations/wholeBusinessNoGroupNote.js
// R3 slice 5 close-out follow-up (Business Modelling brief Addendum 64 finding 6a, Addendum 66 item 8). Pure, no imports.
// The Whole business line on the Business Modelling page adds up the cost that sits IN working groups. Cost that sits in NO group (for example a
// scenario hire placed in a group that is missing, or real cost not yet assigned) is outside that line. This module turns Cost Allocation's own
// total_unassigned_cost into one plain sentence so the page says so. It holds no calculation: the amount is read as published and only
// rounded to the cent. Arithmetic wording only, no advice words.
//
//   noGroupCostAmount(value)        the amount rounded to the cent, or null when missing, not a number, or not above 0 cents
//   buildNoGroupCostSentence(value) the sentence, or null when there is nothing to say
// The page and the trace node both use noGroupCostAmount, so the sentence and the node always agree.

export function noGroupCostAmount(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const cents = Math.round(n * 100);
  return cents > 0 ? cents / 100 : null;
}

export function buildNoGroupCostSentence(value) {
  const amount = noGroupCostAmount(value);
  if (amount === null) return null;
  const text = "$" + amount.toLocaleString("en-NZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Cost in no working group: ${text}. It is not in the group cost above.`;
}
