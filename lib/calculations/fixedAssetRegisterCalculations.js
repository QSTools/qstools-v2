// Fixed Asset Register calculations - shared between the /imports
// preview table and Assets-module linking, so both use exactly one
// formula, never two copies that could drift apart.
//
// Cross-validated 2026-09-12 against a real, full amortisation
// schedule for PC55 (within ~1.2% of Xero's own reported accumulated
// figure). Diminishing Value only: rate x current book value.
// Deliberately does NOT apply this to any other method (Straight
// Line, Full Depreciation at Purchase) - those need a genuinely
// different formula, and guessing wrong would be worse than N/A.

export function estimateAnnualDepreciation(asset) {
  if (!asset) return null;
  if (String(asset.depreciation_method || "").toLowerCase() !== "diminishing value") {
    return null;
  }
  const rate = Number(asset.depreciation_rate);
  const book_value = Number(asset.book_value);
  if (!Number.isFinite(rate) || !Number.isFinite(book_value)) return null;
  return book_value * (rate / 100);
}