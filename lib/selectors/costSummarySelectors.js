import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function selectCostSummaryLabour(labour) {
  const contract_active_staff = Array.isArray(
    labour?.output_contract?.active_staff
  )
    ? labour.output_contract.active_staff
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

      charge_out_rate: toNumber(
        data?.charge_out_rate ?? outputs?.charge_out_rate
      ),
      minimum_charge_out_rate: toNumber(outputs?.minimum_charge_out_rate),

      is_stored: true,
    };
  });

  const final_staff =
    contract_active_staff.length > 0 ? contract_active_staff : fallback_staff;

  return {
    saved_profile_count: profiles.length,
    active_profile_count: final_staff.length,
    active_staff: final_staff,
    all_staff_rows: final_staff,
  };
}

export function buildCostSummaryStatus({
  labour_data,
  employee_overhead_data,
  asset_data,
  general_overhead_data,
  calculations,
}) {
  const warnings = [];
  const missing_modules = [];

  const has_saved_labour = labour_data.saved_profile_count > 0;
  const has_active_labour = labour_data.active_profile_count > 0;

  if (!has_saved_labour) {
    warnings.push("No saved Labour profiles.");
    missing_modules.push("Labour");
  }

  if (!has_active_labour) {
    warnings.push("No Labour profiles available for aggregation.");
  }

  const linked_employee_overhead_count = Array.isArray(
    employee_overhead_data?.per_staff
  )
    ? employee_overhead_data.per_staff.length
    : 0;

  const has_employee_overheads =
    toNumber(employee_overhead_data?.total_employee_overheads_annual) > 0 ||
    linked_employee_overhead_count > 0;

  if (has_active_labour && !has_employee_overheads) {
    warnings.push("Employee Overheads are not flowing into People Cost yet.");
  }

  const has_asset_data = toNumber(asset_data?.total_asset_cost_annual) > 0;
  const has_general_overhead_data =
    toNumber(general_overhead_data?.total_general_overheads) > 0;
  const has_productive_output =
    toNumber(calculations?.total_productive_output) > 0;

  if (!has_asset_data) {
    warnings.push("Asset costs are not flowing into Business Cost yet.");
  }

  if (!has_general_overhead_data) {
    warnings.push("General Overheads are not flowing into Business Cost yet.");
  }

  if (!has_productive_output) {
    warnings.push(
      "Productive output is zero, so required recovery rate is set to 0."
    );
  }

  return {
    labour_profiles_label: `${labour_data.active_profile_count} active`,
    employee_overheads_label: has_employee_overheads ? "Connected" : "Missing",
    asset_costs_label: has_asset_data ? "Connected" : "Missing",
    general_overheads_label: has_general_overhead_data ? "Connected" : "Missing",
    productive_output_label: has_productive_output
      ? calculations.total_productive_output.toFixed(0)
      : "0",
    missing_modules,
    warnings,
    is_ready: has_saved_labour && has_active_labour && has_productive_output,
  };
}

export function buildCostSummaryCard({
  labour_data,
  employee_overhead_data,
  general_overhead_data,
  calculations,
}) {
  const people_rows = [...calculations.people_rows].sort(
    (a, b) => b.total_people_cost_annual - a.total_people_cost_annual
  );

  const labour_share =
    calculations.total_cost_burden > 0
      ? (calculations.total_people_cost_annual /
          calculations.total_cost_burden) *
        100
      : 0;

  const linked_employee_overhead_count = Array.isArray(
    employee_overhead_data?.per_staff
  )
    ? employee_overhead_data.per_staff.length
    : 0;

  let highlight_insight =
    "Stored Labour profiles are aggregated into Cost Summary.";

  if (labour_data.active_profile_count === 0) {
    highlight_insight =
      "No stored Labour profiles are available for aggregation.";
  } else if (calculations.total_productive_output <= 0) {
    highlight_insight =
      "Productive output is zero, so recovery cannot be calculated.";
  } else if (linked_employee_overhead_count === 0) {
    highlight_insight =
      "Labour is flowing into Cost Summary, but no active Employee Overheads are linked yet.";
  } else {
    highlight_insight = `Labour represents ${labour_share.toFixed(
      1
    )}% of the current cost burden baseline.`;
  }

  return {
    recovery_model_block: {
      recovery_model_label: "Cost Baseline",
      linked_staff_count: labour_data.active_profile_count,
      linked_asset_count: 0,
      warnings:
        labour_data.active_profile_count === 0
          ? ["No stored Labour profiles available"]
          : linked_employee_overhead_count === 0
            ? ["No employee overheads linked"]
            : [],
    },

    people_cost_total: calculations.total_people_cost_annual,
    gross_wages_total: calculations.total_gross_wages_annual,
    entitlements_total: calculations.total_entitlements_annual,
    employer_kiwisaver_total: calculations.total_employer_kiwisaver_annual,
    esct_total: calculations.total_esct_annual,
    employer_contribution_total:
      calculations.total_employer_contribution_annual,
    employee_overheads_total: calculations.total_employee_overheads_annual,
    people_rows,

    business_cost_total: calculations.total_business_cost_annual,
    asset_cost_total: calculations.total_asset_cost_annual,
    general_overheads_total: calculations.total_business_overheads,
    asset_rows: [],
    general_overhead_rows: general_overhead_data?.overhead_rows ?? [],

    total_cost_burden: calculations.total_cost_burden,
    required_revenue: calculations.required_revenue,
    required_recovery_rate: calculations.required_recovery_rate,
    total_productive_output: calculations.total_productive_output,

    highlight_insight,
  };
}