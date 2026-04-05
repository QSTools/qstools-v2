import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function selectCostSummaryLabour(labour) {
  const active_staff = Array.isArray(labour?.active_staff)
    ? labour.active_staff
    : [];

  const profiles = Array.isArray(labour?.profiles) ? labour.profiles : [];

  const fallback_staff = profiles.map((profile) => {
    const data = profile?.data ?? profile;
    const outputs = calculateLabourOutputs(data);

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
      gross_wages_annual: toNumber(outputs?.gross_wages_annual),
      entitlements_annual: toNumber(outputs?.entitlements_annual),
      employer_kiwisaver_gross: toNumber(outputs?.employer_kiwisaver_gross),
      esct_amount: toNumber(outputs?.esct_amount),
      total_employer_contribution_cost: toNumber(
        outputs?.total_employer_contribution_cost
      ),

      is_stored: true,
    };
  });

  const final_staff = active_staff.length > 0 ? active_staff : fallback_staff;

  return {
    saved_profile_count: profiles.length,
    active_profile_count: final_staff.length,
    active_staff: final_staff,
    all_staff_rows: final_staff,
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
  const people_rows = [...calculations.people_rows].sort(
    (a, b) => b.total_people_cost_annual - a.total_people_cost_annual
  );

  const labour_share =
    calculations.total_cost_burden > 0
      ? (calculations.total_people_cost_annual / calculations.total_cost_burden) *
        100
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

    people_cost_total: calculations.total_people_cost_annual,
    gross_wages_total: calculations.total_gross_wages_annual,
    entitlements_total: calculations.total_entitlements_annual,
    employer_kiwisaver_total: calculations.total_employer_kiwisaver_annual,
    esct_total: calculations.total_esct_annual,
    employer_contribution_total:
      calculations.total_employer_contribution_annual,
    employee_overheads_total: 0,
    people_rows,

    business_cost_total: calculations.total_business_cost_annual,
    asset_cost_total: calculations.total_asset_cost_annual,
    general_overheads_total: calculations.total_business_overheads,
    asset_rows: [],
    general_overhead_rows: [],

    total_cost_burden: calculations.total_cost_burden,
    required_revenue: calculations.required_revenue,
    required_recovery_rate: calculations.required_recovery_rate,

    highlight_insight,
  };
}