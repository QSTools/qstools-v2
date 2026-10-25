// Mirra v6.1 - Calculation Trace - EBIT and EBITDA Nodes
// R2 fix batch backfill (2026-10-26). EBIT and EBITDA shipped 2026-09-12,
// before the 2026-10-16 definition of done (a calculated figure is not done
// until it has a trace node). DISPLAY-ONLY figures: none of these feeds a net
// profit, revenue, cost or rate.
//
// Source: live.business_outcome_ebit = calculateEbitByUnit() called with the
// SAME inputs the Business Outcome page gives its EBIT summary card
// (per_source.real_capacity / materials / unassigned, and every active asset),
// so the trace and the screen use one calculation. Always View A.
//
// Nodes (totals only; the by-source rows have no stable id, so they are not
// traced one by one):
//   business_outcome.ebit.total_net_profit   groups + materials - unassigned
//   business_outcome.ebit.total_interest     asset finance interest added back
//   business_outcome.ebit.total_depreciation REAL depreciation, linked assets only
//   business_outcome.ebit.ebit               net profit + interest
//   business_outcome.ebit.ebitda             ebit + depreciation

function safeNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildBusinessOutcomeEbitNodes(live) {
  const ebit = live?.business_outcome_ebit;
  if (!ebit || ebit.available !== true) {
    return [];
  }

  const groups = Array.isArray(live?.business_outcome?.real_capacity?.group_real_capacity)
    ? live.business_outcome.real_capacity.group_real_capacity
    : [];
  const group_input_ids = groups
    .map((g) => g?.group_id)
    .filter(Boolean)
    .map((id) => `business_outcome.group.${id}.real_capacity_net_profit`);
  const materials_input_ids = Number.isFinite(Number(live?.business_outcome?.materials?.real_capacity_net_profit))
    ? ["business_outcome.materials.real_capacity_net_profit"]
    : [];

  const net_profit_id = "business_outcome.ebit.total_net_profit";
  const interest_id = "business_outcome.ebit.total_interest";
  const depreciation_id = "business_outcome.ebit.total_depreciation";
  const ebit_id = "business_outcome.ebit.ebit";

  const common = {
    module_name: "business-outcome",
    is_root_input: false,
    value_format: "currency",
    brief_reference: "BUSINESS_OUTCOME_BRIEF (EBIT and EBITDA); calc map s9",
    last_verified_against: "R2 fix batch, EBIT/EBITDA trace backfill (2026-10-26)",
    source_file: "lib/calculations/businessOutcomeEbitCalculations.js",
    implementation_status: "live_verified_field",
  };

  return [
    {
      ...common,
      node_id: net_profit_id,
      display_label: "EBIT Table - Total Net Profit (View A)",
      formula_text:
        "total_net_profit = sum of every group's final (real capacity) net profit + Materials/COGS real capacity net profit - unassigned cost total (calculateEbitByUnit). Always View A. Equals the page's headline net profit. The unassigned total has no trace node of its own.",
      inputs: [...group_input_ids, ...materials_input_ids],
      resolve: () => safeNumber(ebit.total_net_profit),
    },
    {
      ...common,
      node_id: interest_id,
      display_label: "EBIT Table - Total Interest Added Back",
      formula_text:
        "total_interest = sum over groups of asset_interest_annual (each asset's interest x its assignment share) + one remainder row for interest on assets that sit on no source (support or unassigned assets), so total = every active asset's interest. Uses assets' asset_interest_annual.",
      inputs: [],
      resolve: () => safeNumber(ebit.total_interest),
    },
    {
      ...common,
      node_id: depreciation_id,
      display_label: "EBIT Table - Total Depreciation Added Back",
      formula_text:
        "total_depreciation = sum over groups of asset_depreciation_annual (each asset's estimated_annual_depreciation x its assignment share). REAL depreciation regardless of any asset's include_depreciation_in_cost toggle. 0 for assets with no stored figure (unlinked, or not Diminishing Value).",
      inputs: [],
      resolve: () => safeNumber(ebit.total_depreciation),
    },
    {
      ...common,
      node_id: ebit_id,
      display_label: "EBIT (Earnings Before Interest and Tax)",
      formula_text: "total_ebit = total_net_profit + total_interest.",
      inputs: [net_profit_id, interest_id],
      resolve: () => safeNumber(ebit.total_ebit),
    },
    {
      ...common,
      node_id: "business_outcome.ebit.ebitda",
      display_label: "EBITDA (Earnings Before Interest, Tax, Depreciation and Amortisation)",
      formula_text: "total_ebitda = total_ebit + total_depreciation.",
      inputs: [ebit_id, depreciation_id],
      resolve: () => safeNumber(ebit.total_ebitda),
    },
  ];
}
