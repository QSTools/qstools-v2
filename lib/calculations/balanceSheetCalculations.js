// Balance Sheet calculations - working capital and liquidity ratios.
// Follows the to_number()/safe_divide() pattern from revenueCogsCalculations.js
// and the available/status-flagged return shape from
// businessModellingIndependentCalculations.js's calculateGaugeInput -
// callers can distinguish "not enough data" from "genuinely zero".

function to_number(value) {
  // FIX (found 2026-09-12 via the Fixed Assets reconciliation): Number(null)
  // evaluates to 0 (a valid finite number), while Number(undefined) is NaN -
  // so this helper previously returned 0 for null but null for undefined,
  // silently treating "no value provided" as "genuinely zero" whenever the
  // caller happened to pass null. That's exactly the false-positive class
  // this whole reconciliation exists to avoid - explicit null/undefined
  // check first, so both consistently mean "not available", never a silent
  // zero.
  if (value === null || value === undefined) return null;
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
/**
 * calculateFixedAssetsReconciliation
 *
 * Compares the Balance Sheet's Fixed Assets total against Assets
 * module's total purchase price - see CFO_REQUIREMENTS_GAP_2026-09-12.txt
 * Part 1B item 2 for full background.
 *
 * DELIBERATELY does NOT compare against Balance Sheet's total_fixed_assets
 * directly, because that figure is net of depreciation while Assets'
 * purchase_price is gross - comparing them would always disagree by
 * roughly the depreciation amount, producing a misleading false-positive
 * "mismatch" that isn't a real data problem.
 *
 * Instead, detects whether the Balance Sheet separates gross value from
 * depreciation as separate account lines (confirmed present in a real
 * 2026-09-12 test export, as "X - Asset" / "X - Depreciation" pairs) and,
 * if so, sums only the non-depreciation lines to get a genuinely
 * comparable gross figure. If NO depreciation-labelled lines are found
 * at all under Fixed Assets, this safely returns
 * comparison_status: "net_only_cannot_compare" rather than guessing -
 * a different business's Xero setup might show only net values with no
 * separate depreciation line, and forcing a comparison in that case
 * would silently produce a wrong answer.
 */
export function calculateFixedAssetsReconciliation({ accounts = [], total_purchase_price = null } = {}) {
  const fixed_asset_accounts = (accounts || []).filter(
    (a) => a.section === "assets" && String(a.subsection || "").toLowerCase() === "fixed assets"
  );

  if (fixed_asset_accounts.length === 0) {
    return { comparison_status: "no_fixed_assets_in_balance_sheet" };
  }

  const depreciation_accounts = fixed_asset_accounts.filter((a) =>
    String(a.account_name || "").toLowerCase().includes("depreciation")
  );
  const gross_accounts = fixed_asset_accounts.filter((a) =>
    !String(a.account_name || "").toLowerCase().includes("depreciation")
  );

  if (depreciation_accounts.length === 0) {
    return {
      comparison_status: "net_only_cannot_compare",
      balance_sheet_gross_total: null,
    };
  }

  const balance_sheet_gross_total = gross_accounts.reduce(
    (sum, a) => sum + to_number(a.amount),
    0
  );

  const purchase_price = to_number(total_purchase_price);

  if (purchase_price === null) {
    return {
      comparison_status: "assets_total_not_available",
      balance_sheet_gross_total,
    };
  }

  const dollar_diff = balance_sheet_gross_total - purchase_price;
  const has_meaningful_diff = Math.abs(dollar_diff) > 1;

  return {
    comparison_status: "compared",
    balance_sheet_gross_total,
    assets_total_purchase_price: purchase_price,
    dollar_diff,
    has_meaningful_diff,
    partial_match: gross_accounts.length !== fixed_asset_accounts.length - depreciation_accounts.length,
  };
}

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