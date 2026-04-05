import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function selectCostSummaryLabour(labour) {
  const profiles = Array.isArray(labour?.profiles) ? labour.profiles : [];

  const stored_staff = profiles.map((profile) => {
    const data = profile?.data ?? profile;
    const outputs = calculateLabourOutputs(data);

    const non_productive_paid_hours = toNumber(outputs?.non_productive_paid_hours);
    const loaded_labour_cost_rate = toNumber(outputs?.loaded_labour_cost_rate);
    const esct_amount = toNumber(outputs?.esct_amount);

    return {
      profile_id:
        profile?.profile_id ??
        profile?.id ??
        data?.profile_id ??
        data?.staff_id ??
        "",

      staff_id: data?.staff_id ?? null,
      staff_name: data?.staff_name ?? "Unnamed Staff",
      staff_role: data?.staff_role ?? "",
      labour_class: data?.labour_class ?? "",

      productive_hours: toNumber(outputs?.productive_hours),
      labour_cost_rate: toNumber(outputs?.labour_cost_rate),
      charge_out_rate: toNumber(outputs?.charge_out_rate ?? data?.charge_out_rate),

      total_labour_cost_annual:
        toNumber(outputs?.labour_cost_rate) * toNumber(outputs?.productive_hours),

      non_productive_paid_hours,
      loaded_labour_cost_rate,
      entitlement_cost_total: non_productive_paid_hours * loaded_labour_cost_rate,
      esct_total: esct_amount,

      is_stored: true,
    };
  });

  return {
    saved_profile_count: profiles.length,
    active_profile_count: stored_staff.length,
    active_staff: stored_staff,
    all_staff_rows: stored_staff,
  };
}

export function buildCostSummaryStatus({ labour_data, calculations }) {
  const warnings = [];
  const missing_modules = [];

  if (labour_data.saved_profile_count === 0) {
    warnings.push("No saved Labour profiles");
    missing_modules.push("Labour");
  }

  if (labour_data.active_profile_count === 0) {
    warnings.push("No Labour profiles available for aggregation");
  }

  return {
    recovery_model_label: "Labour Only",
    linked_staff_count: labour_data.active_profile_count,
    linked_asset_count: 0,
    unlinked_active_staff_count: 0,
    missing_modules,
    warnings,
    is_structure_complete:
      labour_data.saved_profile_count > 0 &&
      labour_data.active_profile_count > 0 &&
      calculations.total_productive_output > 0,
  };
}

export function buildCostSummaryCard({ labour_data, calculations }) {
  const people_rows = [...labour_data.active_staff]
    .map((staff) => ({
      staff_id: staff.staff_id,
      staff_name: staff.staff_name,
      staff_role: staff.staff_role,
      labour_class: staff.labour_class,
      productive_hours: staff.productive_hours,
      labour_cost_rate: staff.labour_cost_rate,
      labour_cost_total: staff.total_labour_cost_annual,
      entitlement_cost_total: staff.entitlement_cost_total,
      esct_total: staff.esct_total,
      employee_overheads_total: 0,
      total_people_cost: staff.total_labour_cost_annual,
      charge_out_rate: staff.charge_out_rate,
    }))
    .sort((a, b) => b.total_people_cost - a.total_people_cost);

  const entitlements_total = people_rows.reduce(
    (sum, row) => sum + toNumber(row.entitlement_cost_total),
    0
  );

  const esct_total = people_rows.reduce(
    (sum, row) => sum + toNumber(row.esct_total),
    0
  );

  const labour_share =
    calculations.total_cost_burden > 0
      ? (calculations.total_labour_cost_annual / calculations.total_cost_burden) * 100
      : 0;

  let highlight_insight = "Stored Labour profiles are aggregated into Cost Summary.";

  if (labour_data.active_profile_count === 0) {
    highlight_insight = "No stored Labour profiles are available for aggregation.";
  } else if (calculations.total_productive_output <= 0) {
    highlight_insight = "Productive output is zero, so recovery cannot be calculated.";
  } else {
    highlight_insight = `Labour represents ${labour_share.toFixed(
      1
    )}% of the current cost burden baseline.`;
  }

  return {
    recovery_model_block: {
      recovery_model_label: "Labour Only",
      linked_staff_count: labour_data.active_profile_count,
      linked_asset_count: 0,
      warnings:
        labour_data.active_profile_count === 0
          ? ["No stored Labour profiles available"]
          : [],
    },

    people_cost_total: calculations.total_labour_cost_annual,
    labour_cost_total: calculations.total_labour_cost_annual,
    entitlements_total,
    esct_total,
    employee_overheads_total: 0,
    people_rows,

    business_cost_total: 0,
    asset_cost_total: 0,
    general_overheads_total: 0,
    asset_rows: [],
    general_overhead_rows: [],

    total_cost_burden: calculations.total_cost_burden,
    required_revenue: calculations.required_revenue,
    required_recovery_rate: calculations.required_recovery_rate,

    highlight_insight,
  };
}