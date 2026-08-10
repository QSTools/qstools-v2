function toNumber(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasNumberValue(source = {}, key = "") {
  if (!Object.prototype.hasOwnProperty.call(source, key)) return false;
  return Number.isFinite(Number(source[key]));
}

function getEmployeeOverheadsCheck(pnl_output_contract = {}) {
  const has_employee_overheads =
    toNumber(pnl_output_contract.employee_overheads_benchmark_total) > 0 ||
    (Array.isArray(pnl_output_contract.employee_overheads_lines) &&
      pnl_output_contract.employee_overheads_lines.length > 0);

  return {
    id: "employee_overheads",
    module: "Profit & Loss",
    label: "Employee overheads detected",
    message: has_employee_overheads
      ? "The P&L still contains employee overheads, which must be reconciled into general overheads for v3.6 readiness."
      : "No employee overheads are present in the P&L.",
    status: has_employee_overheads ? "fail" : "pass",
    is_blocking: has_employee_overheads,
    is_warning: false,
  };
}

function getLegacyAssetRunningCostCheck(asset_output_contract = {}) {
  const running_cost_annual = toNumber(asset_output_contract.running_cost_annual);
  const has_legacy_running_cost = running_cost_annual > 0;

  return {
    id: "running_cost_annual",
    module: "Assets",
    label: "Legacy asset running costs",
    message: has_legacy_running_cost
      ? "Assets still include legacy running_cost_annual values. Reconcile these into the v3.6 asset cost structure."
      : "No legacy running_cost_annual asset values detected.",
    status: has_legacy_running_cost ? "warn" : "pass",
    is_blocking: false,
    is_warning: has_legacy_running_cost,
  };
}

function getModuleReadyCheck(module_name, is_ready) {
  return {
    id: `${module_name.toLowerCase().replace(/\s+/g, "_")}_ready`,
    module: module_name,
    label: `${module_name} readiness`,
    message: is_ready
      ? `${module_name} is ready.`
      : `${module_name} is not ready and requires attention.`,
    status: is_ready ? "pass" : "fail",
    is_blocking: !is_ready,
    is_warning: false,
  };
}

function getAssetsReadinessCheck({
  asset_status = {},
  asset_output_contract = {},
}) {
  const active_assets = Array.isArray(asset_output_contract.active_assets)
    ? asset_output_contract.active_assets
    : Array.isArray(asset_output_contract.assets)
      ? asset_output_contract.assets
      : [];

  const total_asset_cost_annual = toNumber(
    asset_output_contract.total_asset_cost_annual,
  );

  const no_active_assets_confirmed =
    asset_output_contract.no_active_assets_confirmed === true;

  const assets_ready = Boolean(
    asset_output_contract.assets_ready ?? asset_status.is_ready,
  );

  const has_active_assets = active_assets.length > 0;

  const no_assets_confirmed_ready =
    !has_active_assets &&
    no_active_assets_confirmed &&
    total_asset_cost_annual === 0;

  const active_assets_ready = has_active_assets && assets_ready;
  const passed = active_assets_ready || no_assets_confirmed_ready;

  return {
    id: "assets_ready",
    check_id: "assets_ready",
    module: "Assets",
    label: "Assets readiness",
    severity: passed ? "info" : "blocker",
    passed,
    message: active_assets_ready
      ? "Assets are ready with active ownership-only asset records."
      : no_assets_confirmed_ready
        ? "No active assets have been explicitly confirmed for this business model."
        : has_active_assets
          ? "Assets have active records but are not ready under the existing asset readiness checks."
          : "No active assets are saved and no explicit no-active-assets confirmation exists.",
    detail: active_assets_ready
      ? "Active assets exist and the Assets module readiness flag is passing."
      : no_assets_confirmed_ready
        ? "no_active_assets_confirmed is true and total_asset_cost_annual is 0."
        : has_active_assets
          ? "Active asset setup must satisfy the existing valid readiness path."
          : "Missing asset data is not treated as confirmation that no assets are required.",
    recommended_action: passed
      ? "No action required for Assets readiness."
      : has_active_assets
        ? "Review the active asset setup and resolve the existing Assets warnings."
        : "Add an active asset or explicitly confirm that no active assets are required.",
    status: passed ? "pass" : "fail",
    is_blocking: !passed,
    is_warning: false,
    has_active_assets,
    no_active_assets_confirmed,
  };
}

function getBusinessCostVarianceCheck({
  pnl_business_cost,
  setup_module_benchmark_total,
  module_total_business_costs,
}) {
  const comparison_total =
    setup_module_benchmark_total > 0
      ? setup_module_benchmark_total
      : pnl_business_cost;

  const comparison_label =
    setup_module_benchmark_total > 0
      ? "P&L setup-module benchmark"
      : "P&L business cost benchmark";

  const variance_amount = module_total_business_costs - comparison_total;

  const variance_percent =
    comparison_total > 0
      ? (Math.abs(variance_amount) / comparison_total) * 100
      : 0;

  const full_pnl_variance_amount =
    module_total_business_costs - pnl_business_cost;

  const full_pnl_variance_percent =
    pnl_business_cost > 0
      ? (Math.abs(full_pnl_variance_amount) / pnl_business_cost) * 100
      : 0;

  const has_material_unexplained_variance =
    variance_percent > 1 || full_pnl_variance_percent > 1;

  return {
    id: "business_cost_variance",
    module: "Model Readiness",
    label: "Business cost benchmark reconciliation",
    severity: has_material_unexplained_variance ? "blocker" : "info",
    passed: !has_material_unexplained_variance,
    message: has_material_unexplained_variance
      ? `QS Tools calculated business cost does not reconcile to the ${comparison_label}.`
      : `QS Tools calculated business cost reconciles to the ${comparison_label}.`,
    detail: has_material_unexplained_variance
      ? "The source modules may be individually complete, but the model is not trusted until this variance is explained or corrected."
      : "No material unexplained variance detected.",
    recommended_action: has_material_unexplained_variance
      ? "Review Labour, Assets, General Overheads, and P&L classification before trusting downstream outputs."
      : "No action required for benchmark reconciliation.",
    status: has_material_unexplained_variance ? "fail" : "pass",
    is_blocking: has_material_unexplained_variance,
    is_warning: false,
    comparison_total,
    setup_module_benchmark_total,
    pnl_business_cost,
    variance_amount,
    variance_percent,
    full_pnl_variance_amount,
    full_pnl_variance_percent,
  };
}

// --- NEW: per-module variance checks (S19 brief, Part B) ---
// Threshold: 1%, matching the existing business_cost_variance_check.
// Variance is evidence, not an automatic error - never blocking.

const LABOUR_VARIANCE_POSSIBLE_REASONS = [
  "Timing difference between P&L period and module setup",
  "Payroll classification difference",
  "Owner/director pay treatment (e.g. drawings instead of PAYE wages)",
  "Employee overheads included elsewhere",
  "Missing staff in the Labour module",
  "P&L period mismatch",
  "Module uses forward/current cost while the P&L is historical",
];

const ASSET_FINANCE_VARIANCE_POSSIBLE_REASONS = [
  "End-of-year interest journal not yet posted by the accountant",
  "Loan interest timing difference",
  "Principal/interest split issue on the P&L",
  "Asset finance classified elsewhere on the P&L",
  "Asset not yet entered in the Assets module",
];

const GENERAL_OVERHEADS_VARIANCE_POSSIBLE_REASONS = [
  "Asset finance excluded from this overhead total",
  "Running costs transferred to Assets",
  "Staff overheads reclassified",
  "COGS accidentally included in overheads",
  "Manual overhead adjustment made in the module",
  "Operating expense classification difference on the P&L",
];

// S21: timing-aware variance classification.
//
// Some checks (Asset Finance interest, and later Labour on-costs) are
// expected to run ahead of the P&L because the accountant hasn't
// journaled them yet - that is not an error, it's a timing lag, and the
// module's number should be trusted over the P&L for that figure.
//
// Two things make this different from a plain variance check:
//
// 1. Direction matters. module_amount > source_amount (module capturing
//    a real cost the P&L hasn't recorded yet) is the expected shape of a
//    timing gap. module_amount < source_amount is NOT given the same
//    pass - the module may be missing something, which deserves the
//    normal warning treatment.
//
// 2. Percentage tolerance breaks down when source_amount (the P&L
//    benchmark) is small or zero - a fully-explained timing gap can read
//    as a 100%+ variance. When timing_aware is on and source_amount is
//    below low_denominator_threshold, materiality is judged against a
//    flat dollar_floor_tolerance instead of variance_percent.
//
// dollar_floor_tolerance / low_denominator_threshold are placeholders -
// not yet confirmed against real data, see S21 section 9. Safe to tune
// without touching the classification logic itself.
function buildVarianceCheck({
  id,
  module,
  label,
  source_amount,
  module_amount,
  possible_reasons,
  threshold_percent = 1,
  timing_aware = false,
  dollar_floor_tolerance = null,
  low_denominator_threshold = null,
}) {
  const variance_amount = module_amount - source_amount;
  const abs_variance = Math.abs(variance_amount);

  const variance_percent =
    source_amount > 0 ? (abs_variance / source_amount) * 100 : 0;

  const has_zero_benchmark_with_module_value =
    source_amount === 0 && Math.abs(module_amount) > 0;

  const use_dollar_floor =
    timing_aware &&
    dollar_floor_tolerance != null &&
    low_denominator_threshold != null &&
    source_amount < low_denominator_threshold;

  const has_material_variance = use_dollar_floor
    ? abs_variance > dollar_floor_tolerance
    : has_zero_benchmark_with_module_value || variance_percent > threshold_percent;

  const module_higher_than_source = variance_amount > 0;

  // Timing-expected: material, timing-aware check, and the module is
  // running ahead of the P&L - the expected shape of a journal lag.
  const is_timing_expected =
    timing_aware && has_material_variance && module_higher_than_source;

  const is_warning_variance = has_material_variance && !is_timing_expected;

  return {
    id,
    module,
    label,
    severity: is_warning_variance ? "warning" : "info",
    passed: !is_warning_variance,
    message: is_timing_expected
      ? `${module} is ahead of its P&L benchmark. This is expected if the accountant hasn't journaled it yet - trust ${module}, not the P&L, for this figure.`
      : is_warning_variance
        ? `${module} does not reconcile to its P&L benchmark.`
        : `${module} reconciles to its P&L benchmark.`,
    detail: is_timing_expected
      ? "Module amount is higher than the P&L benchmark, consistent with a timing lag rather than a data error."
      : is_warning_variance
        ? "This is evidence of a difference, not automatically an error. See possible reasons."
        : "No material unexplained variance detected.",
    possible_reasons:
      is_warning_variance || is_timing_expected ? possible_reasons : [],
    status: is_timing_expected ? "timing_expected" : has_material_variance ? "warn" : "pass",
    is_blocking: false,
    is_warning: is_warning_variance,
    is_timing_expected,
    tolerance_basis: use_dollar_floor ? "dollar_floor" : "percent",
    source_amount,
    module_amount,
    variance_amount,
    variance_percent,
  };
}

// S21 section 5.1: split P&L labour_lines into wages vs on-costs by
// line_name, the same technique already used by is_interest_line in
// profitAndLossCalculations.js. No P&L module change required - this
// works off the labour_lines array that already flows through
// pnl_output_contract.
const ON_COST_LINE_NAME_PATTERNS = [
  "acc",
  "kiwisaver",
  "kiwi saver",
  "esct",
  "levy",
  "on-cost",
  "on cost",
];

function is_on_cost_labour_line(line) {
  const name = String(line?.line_name || "").toLowerCase();
  return ON_COST_LINE_NAME_PATTERNS.some((pattern) => name.includes(pattern));
}

function splitLabourLinesByType(labour_lines = []) {
  const wages_lines = [];
  const on_cost_lines = [];

  for (const line of labour_lines) {
    if (is_on_cost_labour_line(line)) {
      on_cost_lines.push(line);
    } else {
      wages_lines.push(line);
    }
  }

  return { wages_lines, on_cost_lines };
}

function sumLineAmounts(lines = []) {
  return (lines ?? []).reduce((sum, line) => sum + toNumber(line?.amount), 0);
}

function getLabourVarianceCheck({ labour_benchmark_total, total_labour_cost_annual }) {
  return buildVarianceCheck({
    id: "labour_variance",
    module: "Labour",
    label: "Labour vs P&L labour benchmark",
    source_amount: labour_benchmark_total,
    module_amount: total_labour_cost_annual,
    possible_reasons: LABOUR_VARIANCE_POSSIBLE_REASONS,
  });
}

// S21 section 5.1.1 - Wages sub-check.
// Tight tolerance: payroll either has the right people and rates in it
// or it doesn't. Not timing-prone, so no timing_aware treatment - any
// material variance here is a genuine data error, not a lag.
const LABOUR_WAGES_VARIANCE_POSSIBLE_REASONS = [
  "Missing staff in the Labour module",
  "Incorrect pay rate entered for one or more staff",
  "Payroll classification difference",
  "P&L period mismatch",
];

function getLabourWagesVarianceCheck({
  labour_wages_benchmark_total,
  total_labour_wages_annual,
}) {
  return buildVarianceCheck({
    id: "labour_wages_variance",
    module: "Labour",
    label: "Wages vs P&L wages benchmark",
    source_amount: labour_wages_benchmark_total,
    module_amount: total_labour_wages_annual,
    possible_reasons: LABOUR_WAGES_VARIANCE_POSSIBLE_REASONS,
  });
}

// S21 section 5.1.2 - On-costs sub-check (ACC / KiwiSaver / ESCT).
// Loose, timing-aware tolerance: these are commonly journaled by the
// accountant after payroll itself, so the module running ahead of the
// P&L is the expected shape, not an error.
// Thresholds are placeholders, not yet confirmed against real data -
// see S21 section 9.
const LABOUR_ON_COSTS_LOW_DENOMINATOR_THRESHOLD = 300;
const LABOUR_ON_COSTS_DOLLAR_FLOOR_TOLERANCE = 150;

const LABOUR_ON_COSTS_VARIANCE_POSSIBLE_REASONS = [
  "Timing difference - ACC/KiwiSaver/ESCT not yet journaled by the accountant",
  "Employer on-costs included elsewhere on the P&L",
  "Owner/director pay treatment",
  "P&L period mismatch",
];

function getLabourOnCostsVarianceCheck({
  labour_on_costs_benchmark_total,
  total_employer_contribution_annual,
}) {
  return buildVarianceCheck({
    id: "labour_on_costs_variance",
    module: "Labour",
    label: "On-costs vs P&L on-costs benchmark",
    source_amount: labour_on_costs_benchmark_total,
    module_amount: total_employer_contribution_annual,
    possible_reasons: LABOUR_ON_COSTS_VARIANCE_POSSIBLE_REASONS,
    timing_aware: true,
    dollar_floor_tolerance: LABOUR_ON_COSTS_DOLLAR_FLOOR_TOLERANCE,
    low_denominator_threshold: LABOUR_ON_COSTS_LOW_DENOMINATOR_THRESHOLD,
  });
}

// S22 section 5: coverage check for Scenario 2 (at least one P&L
// interest line flagged "contains asset finance interest"). A flagged
// line can be blended with other interest types (overdraft, credit
// card, supplier interest) that a bookkeeper cannot always cleanly
// separate onto its own line - so once flagged, the comparison is no
// longer "does P&L equal Module" (Scenario 1 / S21's original logic
// below), it becomes "is the Assets module's real interest fully
// covered within the P&L's total interest figure."
//
// Covered (module <= pnl total interest, within the standard $1
// tolerance): status "covered" - a genuinely fine result, not a
// warning waiting for sign-off. The remainder is other interest
// correctly sitting in General Overheads.
//
// Not covered (module > pnl total interest): per explicit user
// direction, this is NOT timing_expected once a line has been
// actively flagged - flagging is the user telling the system "I've
// accounted for this," so a mismatch here deserves a real look.
// Status "warn", eligible for the S20 accept mechanism like any other
// residual case.
const ASSET_FINANCE_COVERAGE_TOLERANCE = 1;

const ASSET_FINANCE_COVERAGE_NOT_MET_POSSIBLE_REASONS = [
  "Bookkeeper has not yet posted the full asset finance interest journal",
  "Some asset finance interest may be sitting on a different P&L line not marked as asset finance interest",
  "An asset's finance term or rate may be entered incorrectly in the Assets module",
  "Timing difference between the P&L period and the Assets module setup",
];

function getAssetFinanceCoverageCheck({
  pnl_interest_total,
  total_asset_interest_annual,
}) {
  const source_amount = pnl_interest_total;
  const module_amount = total_asset_interest_annual;
  const variance_amount = module_amount - source_amount;
  const variance_percent =
    source_amount > 0 ? (Math.abs(variance_amount) / source_amount) * 100 : 0;

  const is_covered = variance_amount <= ASSET_FINANCE_COVERAGE_TOLERANCE;

  return {
    id: "asset_finance_variance",
    module: "Assets",
    label: "Asset finance vs P&L asset finance benchmark",
    severity: is_covered ? "info" : "warning",
    passed: is_covered,
    message: is_covered
      ? "Your Assets module's finance interest is covered within your P&L's total interest. The remainder is other interest (overdraft, credit card, supplier interest, etc) correctly sitting in General Overheads."
      : "Your Assets module shows more finance interest than your P&L's total interest currently accounts for.",
    detail: is_covered
      ? "This is a coverage check, not an equality check - the P&L and Assets figures are not expected to match once a line has been flagged as containing asset finance interest, only for the Assets figure to fit within the P&L total."
      : "Not automatically an error - see possible reasons - but this has been actively flagged as containing asset finance interest, so it's worth a look rather than assumed to be a timing lag.",
    possible_reasons: is_covered
      ? []
      : ASSET_FINANCE_COVERAGE_NOT_MET_POSSIBLE_REASONS,
    status: is_covered ? "covered" : "warn",
    is_blocking: false,
    is_warning: !is_covered,
    is_timing_expected: false,
    is_coverage_check: true,
    tolerance_basis: "dollar_floor",
    source_amount,
    module_amount,
    variance_amount,
    variance_percent,
  };
}

// S21 section 5.2: not yet confirmed against real data, tune as needed.
const ASSET_FINANCE_LOW_DENOMINATOR_THRESHOLD = 500;
const ASSET_FINANCE_DOLLAR_FLOOR_TOLERANCE = 250;

function getAssetFinanceVarianceCheck({
  asset_finance_benchmark_total,
  total_asset_interest_annual,
  pnl_interest_total,
  excluded_asset_finance_interest_total,
}) {
  // S22: once at least one P&L interest line has been flagged as
  // containing asset finance interest, switch to the coverage check
  // (section above). Scenario 1 (nothing flagged) is untouched below.
  const has_flagged_interest = excluded_asset_finance_interest_total > 0;

  if (has_flagged_interest) {
    return getAssetFinanceCoverageCheck({
      pnl_interest_total,
      total_asset_interest_annual,
    });
  }

  return buildVarianceCheck({
    id: "asset_finance_variance",
    module: "Assets",
    label: "Asset finance vs P&L asset finance benchmark",
    source_amount: asset_finance_benchmark_total,
    module_amount: total_asset_interest_annual,
    possible_reasons: ASSET_FINANCE_VARIANCE_POSSIBLE_REASONS,
    timing_aware: true,
    dollar_floor_tolerance: ASSET_FINANCE_DOLLAR_FLOOR_TOLERANCE,
    low_denominator_threshold: ASSET_FINANCE_LOW_DENOMINATOR_THRESHOLD,
  });
}

function getGeneralOverheadsVarianceCheck({
  general_overheads_benchmark_total,
  total_general_overheads,
}) {
  return buildVarianceCheck({
    id: "general_overheads_variance",
    module: "General Overheads",
    label: "General Overheads vs P&L overheads benchmark",
    source_amount: general_overheads_benchmark_total,
    module_amount: total_general_overheads,
    possible_reasons: GENERAL_OVERHEADS_VARIANCE_POSSIBLE_REASONS,
  });
}
// --- END NEW ---

// S20: manual accept overlay for residual "warn" checks S21 does not
// already explain automatically. Applied inside buildModuleReconciliationChecks
// below, BEFORE blocking_checks/warning_checks/blocking_modules/warning_modules
// are derived - so an accepted check stops counting as a warning everywhere
// that reads those aggregates (Sidebar status dot, Model Readiness, the
// Warnings pill), not just on its own card.
//
// Pure function: acceptance_map is passed in as plain data (read from
// browser storage by the hook layer - see hooks/useModuleReconciliation.js).
// No storage access happens here.
const ACCEPTANCE_TOLERANCE = 1;

function applyAcceptances(reconciliation_checks = [], acceptance_map = {}) {
  return reconciliation_checks.map((check) => {
    const acceptance = acceptance_map[check.id];

    if (!acceptance) return check;

    // Only plain "warn" checks are eligible (S20 section 3). Blocking
    // checks, pass, and timing_expected are left untouched even if a
    // stale acceptance record happens to exist for them.
    if (check.status !== "warn" || check.is_blocking) return check;

    const current_amount = Number(check.variance_amount) || 0;
    const accepted_amount = Number(acceptance.accepted_variance_amount) || 0;
    const has_moved =
      Math.abs(current_amount - accepted_amount) > ACCEPTANCE_TOLERANCE;

    if (has_moved) {
      // Reopened: the source data changed since this was accepted (S20
      // section 6), so the old acceptance no longer describes what's
      // actually here. Stays "warn", but carries the stale record so
      // the UI can show it was previously accepted (S20 section 9).
      return {
        ...check,
        stale_acceptance: acceptance,
      };
    }

    return {
      ...check,
      status: "accepted",
      is_warning: false,
      accepted_reason: acceptance.reason,
      accepted_at: acceptance.accepted_at,
      accepted_variance_amount: acceptance.accepted_variance_amount,
    };
  });
}

export function buildModuleReconciliationChecks({
  pnl_status = {},
  pnl_output_contract = {},
  labour_status = {},
  labour_output_contract = {},
  labour_outputs = {},
  asset_status = {},
  asset_output_contract = {},
  general_overheads_status = {},
  general_overheads_output_contract = {},
  acceptance_map = {},
}) {
  const total_business_costs = toNumber(pnl_output_contract.total_business_costs);
  const total_other_income = toNumber(pnl_output_contract.total_other_income);

  const labour_benchmark_total = toNumber(
    pnl_output_contract.labour_benchmark_total,
  );

  // S22: raw P&L category totals, before the asset-finance-interest
  // redistribution below.
  const assets_benchmark_total_raw = toNumber(
    pnl_output_contract.assets_benchmark_total,
  );
  const general_overheads_benchmark_total_raw = toNumber(
    pnl_output_contract.general_overheads_benchmark_total,
  );

  const asset_finance_benchmark_total = toNumber(
    pnl_output_contract.pnl_interest_marked_asset_finance_total ??
      pnl_output_contract.excluded_asset_finance_interest_total ??
      0,
  );

  // S22: needed for the Asset Finance coverage check AND for the
  // General Overheads / Assets benchmark redistribution below.
  const pnl_interest_total = toNumber(pnl_output_contract.pnl_interest_total);
  const excluded_asset_finance_interest_total = toNumber(
    pnl_output_contract.excluded_asset_finance_interest_total,
  );

  // Moved up from later in this function - needed here so the
  // redistribution below can be computed correctly. This is the
  // Assets module's own real finance interest figure; the P&L
  // calculation layer never sees this value, which is exactly why
  // this redistribution has to happen here and not there.
  const total_asset_interest_annual = toNumber(
    asset_output_contract.total_asset_interest_annual ??
      asset_output_contract.finance_cost_annual ??
      asset_output_contract.asset_interest_annual ??
      0,
  );

  // S22 (implements brief 03 section 14.3 - a contract that already
  // existed but was never built; corrected here from an initial
  // over-broad attempt): a P&L interest line flagged "contains asset
  // finance interest" must not double-count against General Overheads
  // once it's being compared separately against the Assets module's
  // real finance interest. Only the COVERED portion -
  // min(what was flagged, what the Assets module actually calculates)
  // - is redistributed into the Assets benchmark. Any remainder (a
  // flagged line can be blended with real other-interest types a
  // bookkeeper hasn't split out - overdraft, credit card, supplier
  // interest) correctly stays in General Overheads, where it
  // genuinely belongs, instead of being swept out along with the
  // asset-finance portion.
  const asset_finance_interest_covered_amount = Math.min(
    excluded_asset_finance_interest_total,
    total_asset_interest_annual,
  );

  const general_overheads_benchmark_total =
    general_overheads_benchmark_total_raw - asset_finance_interest_covered_amount;
  const assets_benchmark_total =
    assets_benchmark_total_raw + asset_finance_interest_covered_amount;

  const setup_module_benchmark_total =
    labour_benchmark_total +
    assets_benchmark_total +
    general_overheads_benchmark_total;

  const unassigned_balance = toNumber(pnl_output_contract.unassigned_balance);

  const total_labour_cost_annual = hasNumberValue(
    labour_output_contract,
    "total_labour_cost_annual",
  )
    ? toNumber(labour_output_contract.total_labour_cost_annual)
    : toNumber(labour_outputs.total_labour_cost_annual);

  // S21 section 5.1: wages vs on-costs split.
  // P&L side: split labour_lines by name pattern (no P&L change needed,
  // labour_lines already flows through pnl_output_contract untouched).
  const labour_lines = Array.isArray(pnl_output_contract.labour_lines)
    ? pnl_output_contract.labour_lines
    : [];
  const { wages_lines, on_cost_lines } = splitLabourLinesByType(labour_lines);
  const labour_wages_benchmark_total = sumLineAmounts(wages_lines);
  const labour_on_costs_benchmark_total = sumLineAmounts(on_cost_lines);

  // Module side: total_employer_contribution_annual is already exposed
  // by labourOutputContractSelectors.js. Wages is the remainder of the
  // existing blended total_labour_cost_annual.
  const total_employer_contribution_annual = toNumber(
    labour_output_contract.total_employer_contribution_annual,
  );
  const total_labour_wages_annual =
    total_labour_cost_annual - total_employer_contribution_annual;

  const total_general_overheads = toNumber(
    general_overheads_output_contract.total_general_overheads,
  );

  const total_asset_cost_annual = toNumber(
    asset_output_contract.total_asset_cost_annual,
  );

  // total_asset_interest_annual is now declared earlier in this
  // function (S22) - needed there for the benchmark redistribution.

  const total_productive_output = hasNumberValue(
    labour_output_contract,
    "total_productive_output",
  )
    ? toNumber(labour_output_contract.total_productive_output)
    : toNumber(labour_outputs.productive_hours);

  const general_overheads_ready = Boolean(general_overheads_status.is_ready);

  const labour_ready = Boolean(
    labour_output_contract.labour_ready ?? labour_status.labour_ready,
  );

  const active_assets = Array.isArray(asset_output_contract.active_assets)
    ? asset_output_contract.active_assets
    : Array.isArray(asset_output_contract.assets)
      ? asset_output_contract.assets
      : [];

  const no_active_assets_confirmed =
    asset_output_contract.no_active_assets_confirmed === true;

  const assets_ready = Boolean(
    asset_output_contract.assets_ready ?? asset_status.is_ready,
  );

  const module_total_business_costs =
    total_labour_cost_annual +
    total_asset_cost_annual +
    total_general_overheads;

  const profit_and_loss_ready = Boolean(pnl_output_contract.pnl_ready);

  const module_ready_checks = [
    getModuleReadyCheck("Profit & Loss", profit_and_loss_ready),
    getModuleReadyCheck("Labour", labour_ready),
    getModuleReadyCheck("General Overheads", general_overheads_status.is_ready),
  ];

  const employee_overheads_check = getEmployeeOverheadsCheck(pnl_output_contract);

  const legacy_running_cost_check =
    getLegacyAssetRunningCostCheck(asset_output_contract);

  const assets_readiness_check = getAssetsReadinessCheck({
    asset_status,
    asset_output_contract,
  });

  const business_cost_variance_check = getBusinessCostVarianceCheck({
    pnl_business_cost: total_business_costs,
    setup_module_benchmark_total,
    module_total_business_costs,
  });

  // NEW: per-module variance checks
  const labour_variance_check = getLabourVarianceCheck({
    labour_benchmark_total,
    total_labour_cost_annual,
  });

  // S21: Labour wages/on-costs split - additive, existing blended
  // labour_variance_check above is left untouched (consumed elsewhere:
  // LabourStatusStrip, LabourCompactWorkspaceCard, Revenue Summary).
  const labour_wages_variance_check = getLabourWagesVarianceCheck({
    labour_wages_benchmark_total,
    total_labour_wages_annual,
  });

  const labour_on_costs_variance_check = getLabourOnCostsVarianceCheck({
    labour_on_costs_benchmark_total,
    total_employer_contribution_annual,
  });

  const asset_finance_variance_check = getAssetFinanceVarianceCheck({
    asset_finance_benchmark_total,
    total_asset_interest_annual,
    pnl_interest_total,
    excluded_asset_finance_interest_total,
  });

  const general_overheads_variance_check = getGeneralOverheadsVarianceCheck({
    general_overheads_benchmark_total,
    total_general_overheads,
  });

  const reconciliation_checks = applyAcceptances(
    [
      ...module_ready_checks,
      assets_readiness_check,
      employee_overheads_check,
      legacy_running_cost_check,
      business_cost_variance_check,
      labour_variance_check,
      labour_wages_variance_check,
      labour_on_costs_variance_check,
      asset_finance_variance_check,
      general_overheads_variance_check,
    ],
    acceptance_map,
  );

  const blocking_checks = reconciliation_checks
    .filter((check) => check.is_blocking)
    .map((check) => check.message);

  const warning_checks = reconciliation_checks
    .filter((check) => check.is_warning && !check.is_blocking)
    .map((check) => check.message);

  const blocking_modules = [
    ...new Set(
      reconciliation_checks
        .filter((check) => check.is_blocking)
        .map((check) => check.module),
    ),
  ];

  const warning_modules = [
    ...new Set(
      reconciliation_checks
        .filter((check) => check.is_warning && !check.is_blocking)
        .map((check) => check.module),
    ),
  ];

  const normalised_reconciliation_inputs = {
    pnl_ready: profit_and_loss_ready,
    pnl_business_cost: total_business_costs,
    total_business_costs,
    total_other_income,
    setup_module_benchmark_total,
    unassigned_balance,

    labour_benchmark_total,
    assets_benchmark_total,
    asset_finance_benchmark_total,
    general_overheads_benchmark_total,

    // S22: how much of the flagged P&L interest was actually
    // redistributed from General Overheads into Assets - capped at
    // the Assets module's real interest, per the corrected design.
    asset_finance_interest_covered_amount,

    // S21: labour wages/on-costs split
    labour_wages_benchmark_total,
    labour_on_costs_benchmark_total,
    total_labour_wages_annual,
    total_employer_contribution_annual,

    total_labour_cost_annual,
    total_general_overheads,
    total_asset_cost_annual,
    total_asset_interest_annual,
    total_productive_output,

    general_overheads_ready,
    labour_ready,
    assets_ready,

    active_asset_count: active_assets.length,
    no_active_assets_confirmed,
    has_employee_overheads: employee_overheads_check.status !== "pass",
    has_legacy_running_costs: legacy_running_cost_check.status !== "pass",
  };

  return {
    reconciliation_checks,
    blocking_checks,
    warning_checks,
    blocking_modules,
    warning_modules,

    reconciliation_ready: blocking_checks.length === 0,

    labour_benchmark_total,
    assets_benchmark_total,
    asset_finance_benchmark_total,
    general_overheads_benchmark_total,

    total_labour_cost_annual,
    total_asset_cost_annual,
    total_asset_interest_annual,
    total_general_overheads,

    module_total_business_costs,

    pnl_business_cost_variance: business_cost_variance_check.variance_amount,
    pnl_business_cost_variance_percent:
      business_cost_variance_check.variance_percent,

    business_cost_variance_amount: business_cost_variance_check.variance_amount,
    business_cost_variance_percent:
      business_cost_variance_check.variance_percent,

    // NEW: individual per-module variance amounts, for convenience
    labour_variance_amount: labour_variance_check.variance_amount,
    labour_variance_percent: labour_variance_check.variance_percent,

    // S21: labour wages/on-costs split - additive, does not replace
    // labour_variance_amount/percent above.
    labour_wages_variance_amount: labour_wages_variance_check.variance_amount,
    labour_wages_variance_percent: labour_wages_variance_check.variance_percent,
    labour_on_costs_variance_amount:
      labour_on_costs_variance_check.variance_amount,
    labour_on_costs_variance_percent:
      labour_on_costs_variance_check.variance_percent,

    asset_finance_variance_amount: asset_finance_variance_check.variance_amount,
    asset_finance_variance_percent: asset_finance_variance_check.variance_percent,
    general_overheads_variance_amount:
      general_overheads_variance_check.variance_amount,
    general_overheads_variance_percent:
      general_overheads_variance_check.variance_percent,

    setup_module_benchmark_total,

    full_pnl_business_cost_variance:
      business_cost_variance_check.full_pnl_variance_amount,
    full_pnl_business_cost_variance_percent:
      business_cost_variance_check.full_pnl_variance_percent,

    pnl_business_cost: total_business_costs,
    total_business_costs,
    total_other_income,

    total_acc_levy_annual: hasNumberValue(
      labour_output_contract,
      "total_acc_levy_annual",
    )
      ? toNumber(labour_output_contract.total_acc_levy_annual)
      : toNumber(labour_outputs.acc_work_levy_annual),

    acc_rate_percent: toNumber(labour_outputs.acc_rate),

    general_overheads_ready,

    normalised_reconciliation_inputs,
  };
}
