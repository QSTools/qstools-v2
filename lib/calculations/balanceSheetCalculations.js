// Balance Sheet calculations - working capital and liquidity ratios.
// Follows the to_number()/safe_divide() pattern from revenueCogsCalculations.js
// and the available/status-flagged return shape from
// businessModellingIndependentCalculations.js's calculateGaugeInput -
// callers can distinguish "not enough data" from "genuinely zero".

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safe_divide(numerator, denominator) {
  const top = to_number(numerator);
  const bottom = to_number(denominator);

  if (top === null || bottom === null || bottom === 0) return null;
  return top / bottom;
}

function find_account_amount(accounts, predicate) {
  const match = (accounts || []).find(predicate);
  return match ? to_number(match.amount) : null;
}

/**
 * calculateWorkingCapitalRatios
 *
 * Takes { totals, accounts } - the exact shape returned by
 * parseXeroBalanceSheetWorkbook (lib/imports/xeroBalanceSheetImporter.js)
 * or loaded back out of balanceSheetStorage.js.
 *
 * Returns the standard CFO liquidity toolkit (see
 * CFO_REQUIREMENTS_GAP_2026-09-12.txt, Part 3 - this is what that
 * document flagged as blocked pending balance sheet import, now
 * unblocked):
 *
 * - working_capital = current assets - current liabilities (a dollar
 *   figure, not a ratio - positive means a cushion, negative means
 *   current liabilities exceed current assets).
 * - current_ratio = current assets / current liabilities. Standard
 *   read: below 1.0 is a genuine liquidity flag (can't cover short-term
 *   obligations from short-term assets alone); 1.5-3.0 is often cited
 *   as a healthy range, though this varies by industry.
 * - quick_ratio (acid-test) = (current assets - prepayments) / current
 *   liabilities. Prepayments are excluded because they can't be
 *   converted to cash to cover a liability - they're already spent.
 *   NOTE: standard quick ratio definitions usually also exclude
 *   inventory, but this business's real Balance Sheet (verified
 *   2026-09-12) has no inventory line item under Current Assets - only
 *   Accounts Receivable, Accounts Receivable - Other, and Prepayments.
 *   If a future import DOES include an inventory-type account, this
 *   function will not automatically exclude it - flagged as a known
 *   limitation, not silently wrong, since inventory account naming
 *   varies too much to safely pattern-match without a real example to
 *   verify against.
 * - debt_to_equity = total liabilities / total equity. Standard
 *   leverage measure - higher means more of the business is financed
 *   by debt relative to owner equity.
 *
 * Each figure has a matching _available boolean - false when the
 * underlying totals weren't present (e.g. an incomplete import), so a
 * consumer can show "not available" rather than a misleading $0 or
 * Infinity.
 */
export function calculateWorkingCapitalRatios({ totals = {}, accounts = [] } = {}) {
  const current_assets = to_number(totals.total_current_assets);
  const current_liabilities = to_number(totals.total_current_liabilities);
  const total_liabilities = to_number(totals.total_liabilities);
  const total_equity = to_number(totals.total_equity);

  const prepayments = find_account_amount(
    accounts,
    (a) => String(a.account_name || "").trim().toLowerCase() === "prepayments"
  );

  const has_current_figures = current_assets !== null && current_liabilities !== null;

  const working_capital = has_current_figures
    ? current_assets - current_liabilities
    : null;

  const current_ratio = safe_divide(current_assets, current_liabilities);

  const quick_assets =
    has_current_figures ? current_assets - (prepayments ?? 0) : null;
  const quick_ratio = safe_divide(quick_assets, current_liabilities);

  const debt_to_equity = safe_divide(total_liabilities, total_equity);

  return {
    available: has_current_figures,
    working_capital,
    working_capital_available: working_capital !== null,
    current_ratio,
    current_ratio_available: current_ratio !== null,
    quick_ratio,
    quick_ratio_available: quick_ratio !== null,
    quick_ratio_excludes_inventory: false, // see docstring note above
    debt_to_equity,
    debt_to_equity_available: debt_to_equity !== null,
    inputs: {
      current_assets,
      current_liabilities,
      prepayments,
      total_liabilities,
      total_equity,
    },
  };
}