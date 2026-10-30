// R3 slice 1 (Business Modelling brief, Addendum 12 and Addendum 13). Registry for the model storage helper.
// Maps each modelled source key to a short code (used to name its baseline entry) and lists keys the helper must
// treat as unmodelled. Codes are NEVER reused or renumbered; add new keys at the end.
// volatile: field names ignored when comparing a page's write-back with the baseline (timestamps, generated ids).
//   null = not yet reviewed (batch 6 tap run fills these in); an array = reviewed.
// No new key or code below may contain: cost, allocation, operational, group, business, opening, hours, setup
// (hooks/scheduling/schedulingSuggestions.ts scans every key containing those words; Addendum 9 item 1).

export const REGISTRY_VERSION = 1;

export const MODELLED_KEYS = [
  { code: "m01", key: "qs_tools_asset_state", volatile: ["updated_at", "created_at", "asset_id"] },
  { code: "m02", key: "qs_tools_saved_assets", volatile: ["updated_at", "created_at", "asset_id"] },
  { code: "m03", key: "qs_tools_balance_sheet_state_v1", volatile: null },
  { code: "m04", key: "qs_tools_business_modelling_levers_v1", volatile: null },
  { code: "m05", key: "qs_tools_business_modelling_scenario_state_v1", volatile: null },
  { code: "m06", key: "qs_tools_business_modelling_state_v1", volatile: null },
  { code: "m07", key: "qstools_business_outcome_non_productive_policy_v1", volatile: null },
  { code: "m08", key: "qs_tools_business_setup_v1", volatile: null },
  { code: "m09", key: "qs_tools_cost_allocation_profiles_v2_2", volatile: null },
  { code: "m10", key: "qs_tools_cost_allocation_v2_1", volatile: ["updated_at", "created_at", "active_allocation_profile_id"] },
  { code: "m11", key: "qs_employee_overhead_library_v1", volatile: null },
  { code: "m12", key: "qs_employee_overhead_profiles_v1", volatile: null },
  { code: "m13", key: "qs_tools_fixed_asset_register_state_v1", volatile: null },
  { code: "m14", key: "qs_tools_saved_overheads", volatile: null },
  { code: "m15", key: "qs_tools_general_overhead_state", volatile: ["updated_at", "created_at", "overhead_profile_id"] },
  { code: "m16", key: "qs_tools_labour_profiles_v1", volatile: ["updated_at", "created_at", "staff_id", "profile_id"] },
  { code: "m17", key: "qs_tools_labour_staff_types_v1", volatile: null },
  { code: "m18", key: "qs_tools_module_reconciliation_acceptance_v1", volatile: null },
  { code: "m19", key: "mirra_opening_hours_state_v4", volatile: null },
  { code: "m20", key: "pnl_profiles_v3", volatile: ["updated_at", "created_at", "id", "pnl_line_id"] },
  { code: "m21", key: "qs_tools_profit_and_loss_state", volatile: ["updated_at", "created_at", "pnl_line_id"] },
  { code: "m22", key: "qs_tools_rate_builder_labour_rates_v1", volatile: ["updated_at", "created_at", "labour_rate_model_id"] },
  { code: "m23", key: "qstools_rate_builder_labour_source_rates_v1", volatile: null },
  { code: "m24", key: "qstools_rate_builder_materials_markup_v1", volatile: null },
  { code: "m25", key: "qs_tools_rate_builder_calculators_v1", volatile: null },
  { code: "m26", key: "qs_tools_recovery_summary_profiles", volatile: null },
  { code: "m27", key: "qs_tools_recovery_summary_state", volatile: null },
  { code: "m28", key: "qs_tools_revenue_cogs_state_v2", volatile: null },
];

// Used by pages that Model mode does not cover (Addendum 12 owner answer E). In Model mode reads pass through, writes are blocked.
export const UNMODELLED_KEYS = [
  "qs_tools_quick_start_state_v6",
  "qs_tools_quick_start_profiles_v1",
  "qs_tools_quote_engine_store_v4",
  "qs_tools_labour_rate_reality_check_v1",
];

// Storage modules that do NOT go through the helper at all (Addendum 12 item 2).
export const EXCLUDED_KEYS = ["qs_tools_scheduling_v4_tasks"];

// The four new keys (Addendum 12 items 3 and owner answer C). Baseline entries are mirra_baseline_v1_<code>.
export const NEW_KEYS = {
  mode: "mirra_mode_v1",
  baseline_meta: "mirra_baseline_v1",
  diffs: "mirra_diffs_v1",
  scenarios: "mirra_scenarios_v1",
};

export const FORBIDDEN_KEY_WORDS = [
  "cost", "allocation", "operational", "group", "business", "opening", "hours", "setup",
];

export function baseline_entry_key(code) {
  return NEW_KEYS.baseline_meta + "_" + code;
}

export function find_modelled_entry(key) {
  return MODELLED_KEYS.find((entry) => entry.key === key) || null;
}

export function is_unmodelled_key(key) {
  return UNMODELLED_KEYS.includes(key);
}