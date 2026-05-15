function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function sumRows(rows = [], field = "") {
  return rows.reduce((total, row) => total + toNumber(row?.[field]), 0);
}

export function formatCostSummaryPercent(value) {
  const percent = toNumber(value);

  if (percent === 0) return "0%";
  if (percent > 0 && percent < 0.1) return "<0.1%";

  return `${percent.toFixed(1)}%`;
}

function buildLabourGroupDetail(active_staff = [], contributes_to_recovery_hours) {
  const staff = active_staff.filter(
    (row) =>
      (row?.contributes_to_recovery_hours !== false) ===
      contributes_to_recovery_hours
  );
  const gross_wages_annual = sumRows(staff, "gross_wages_annual");
  const entitlements_annual = sumRows(staff, "entitlements_annual");
  const annual_leave_cost_annual = sumRows(
    staff,
    "annual_leave_cost_annual"
  );
  const public_holiday_cost_annual = sumRows(
    staff,
    "public_holiday_cost_annual"
  );
  const sick_leave_cost_annual = sumRows(staff, "sick_leave_cost_annual");
  const bereavement_leave_cost_annual = sumRows(
    staff,
    "bereavement_leave_cost_annual"
  );
  const family_violence_leave_cost_annual = sumRows(
    staff,
    "family_violence_leave_cost_annual"
  );
  const employer_kiwisaver_annual = sumRows(staff, "employer_kiwisaver_gross");
  const esct_annual = sumRows(staff, "esct_amount");
  const acc_levy_annual = staff.reduce((total, row) => {
    return total + toNumber(row?.acc_levy_annual ?? row?.acc_work_levy_annual);
  }, 0);
  const employer_contribution_annual = sumRows(
    staff,
    "total_employer_contribution_cost"
  );
  const total_labour_cost_annual = sumRows(staff, "total_labour_cost_annual");

  return {
    staff_count: staff.length,
    total_labour_cost_annual,
    base_wages_annual: Math.max(gross_wages_annual - entitlements_annual, 0),
    entitlements_annual,
    annual_leave_cost_annual,
    public_holiday_cost_annual,
    sick_leave_cost_annual,
    bereavement_leave_cost_annual,
    family_violence_leave_cost_annual,
    employer_contribution_annual,
    employer_kiwisaver_annual,
    esct_annual,
    acc_levy_annual,
  };
}

export function selectCostSummaryLabour(labour) {
  const output_contract = labour?.output_contract ?? labour ?? {};
  const active_staff = Array.isArray(output_contract.active_staff)
    ? output_contract.active_staff
    : [];

  return {
    total_labour_cost_annual: toNumber(
      output_contract.total_labour_cost_annual
    ),
    total_productive_output: toNumber(
      output_contract.total_productive_output
    ),
    total_recovery_hours: toNumber(output_contract.total_recovery_hours),
    total_available_hours_before_productivity: toNumber(
      output_contract.total_available_hours_before_productivity
    ),
    weighted_productivity_percent: toNumber(
      output_contract.weighted_productivity_percent
    ),
    labour_detail: {
      productive: buildLabourGroupDetail(active_staff, true),
      non_productive: buildLabourGroupDetail(active_staff, false),
    },
  };
}

export function buildCostSummaryStatus({
  labour_data,
  asset_data,
  general_overhead_data,
  calculations,
  model_readiness = {},
}) {
  const warnings = [];
  const missing_modules = [];
  const has_labour_data = Object.prototype.hasOwnProperty.call(
    labour_data ?? {},
    "total_labour_cost_annual"
  );

  const has_asset_data = Object.prototype.hasOwnProperty.call(
    asset_data ?? {},
    "total_asset_cost_annual"
  );
  const has_general_overhead_data = Object.prototype.hasOwnProperty.call(
    general_overhead_data ?? {},
    "total_general_overheads"
  );
  const has_recovery_hours =
    toNumber(calculations?.total_recovery_hours) > 0;

  if (!has_labour_data) {
    warnings.push("Labour output is missing. Fix Labour before trusting Cost Summary.");
    missing_modules.push("Labour");
  }

  if (!has_asset_data) {
    warnings.push("Assets output is missing. Fix Assets before trusting Cost Summary.");
    missing_modules.push("Assets");
  }

  if (!has_general_overhead_data) {
    warnings.push(
      "General Overheads output is missing. Fix General Overheads before trusting Cost Summary."
    );
    missing_modules.push("General Overheads");
  }

  if (!has_recovery_hours) {
    warnings.push(
      "Recovery hours are zero. Mark at least one Labour profile as productive before trusting the required recovery rate."
    );
  }

  const model_ready = model_readiness.model_ready === true;
  const model_readiness_status =
    model_readiness.model_readiness_status ?? "blocked";
  const blocking_checks = Array.isArray(model_readiness.blocking_checks)
    ? model_readiness.blocking_checks
    : [];
  const warning_checks = Array.isArray(model_readiness.warning_checks)
    ? model_readiness.warning_checks
    : [];

  return {
    labour_profiles_label: has_labour_data ? "Connected" : "Missing",
    asset_costs_label: has_asset_data ? "Connected" : "Missing",
    general_overheads_label: has_general_overhead_data ? "Connected" : "Missing",
    recovery_hours_label: has_recovery_hours
      ? calculations.total_recovery_hours.toFixed(0)
      : "0",
    productive_output_label:
      toNumber(calculations?.total_productive_output) > 0
        ? calculations.total_productive_output.toFixed(0)
        : "0",
    missing_modules,
    warnings: [...warnings, ...warning_checks],
    is_ready: model_ready && has_recovery_hours,
    model_ready,
    model_readiness_status,
    blocking_modules: model_readiness.blocking_modules ?? [],
    warning_modules: model_readiness.warning_modules ?? [],
    blocking_checks,
    warning_checks,
  };
}

export function buildCostSummaryCard({
  labour_data,
  asset_data,
  general_overhead_data,
  calculations,
  model_readiness = {},
}) {
  const labour_share =
    calculations.total_cost_burden > 0
      ? (calculations.total_people_cost_annual /
          calculations.total_cost_burden) *
        100
      : 0;

  let highlight_insight =
    "Cost Summary is using Labour, Assets, and General Overheads outputs only.";

  if (calculations.total_recovery_hours <= 0) {
    highlight_insight =
      "Recovery hours are zero, so the required recovery rate is held at 0.";
  } else {
    highlight_insight = `Labour represents ${formatCostSummaryPercent(
      labour_share
    )} of the current cost burden baseline.`;
  }

  return {
    people_cost_total: calculations.total_people_cost_annual,

    business_cost_total: calculations.total_business_cost_annual,
    asset_cost_total: calculations.total_asset_cost_annual,
    total_asset_interest_annual: calculations.total_asset_interest_annual,
    general_overheads_total: calculations.total_business_overheads,

    total_cost_burden: calculations.total_cost_burden,
    required_revenue: calculations.required_revenue,
    required_recovery_rate: calculations.required_recovery_rate,
    total_recovery_hours: calculations.total_recovery_hours,
    total_productive_output: calculations.total_productive_output,
    labour_detail: labour_data.labour_detail ?? {},
    asset_detail: asset_data.asset_detail ?? {},
    overhead_detail: general_overhead_data.overhead_detail ?? {},
    model_ready: model_readiness.model_ready === true,
    model_readiness_status:
      model_readiness.model_readiness_status ?? "blocked",

    highlight_insight,
  };
}
