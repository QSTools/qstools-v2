import { calculateLabourOutputs } from "@/lib/calculations/labourCalculations";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function selectCostSummaryLabour(labour) {
  const profiles = Array.isArray(labour?.profiles) ? labour.profiles : [];

  const active_staff = profiles
    .map((profile) => {
      const data = profile?.data ?? {};
      const outputs = calculateLabourOutputs(data);

      return {
        staff_id: data?.staff_id ?? "",
        staff_name: data?.staff_name ?? "",
        staff_role: data?.staff_role ?? "",
        labour_class: data?.labour_class ?? "",
        productive_hours: toNumber(outputs?.productive_hours),
        labour_cost_rate: toNumber(outputs?.labour_cost_rate),
        charge_out_rate: toNumber(data?.charge_out_rate),
        is_active: true,
      };
    })
    .filter((row) => row.staff_id);

  return {
    has_labour_module: Boolean(labour),
    saved_profile_count: profiles.length,
    active_profile_count: active_staff.length,
    active_staff,
  };
}

export function buildCostSummaryStatus({ labour_data }) {
  const warnings = [];
  const missing_modules = [
    "Employee Overheads",
    "Assets",
    "General Overheads",
    "Cost Allocation",
  ];

  if (!labour_data?.has_labour_module) {
    missing_modules.unshift("Labour");
  }

  if (labour_data.saved_profile_count === 0) {
    warnings.push("No saved Labour profiles");
  }

  if (labour_data.active_profile_count === 0) {
    warnings.push("No active Labour profiles");
  }

  warnings.push("Labour-only interim wiring");

  return {
    active_revenue_model: "labour_only",
    recovery_model: "labour_only",
    recovery_model_label: "Labour Only",
    saved_profile_count: labour_data.saved_profile_count,
    active_profile_count: labour_data.active_profile_count,
    linked_staff_count: labour_data.active_profile_count,
    linked_asset_count: 0,
    unlinked_active_staff_count: labour_data.active_profile_count,
    warnings,
    missing_modules,
    is_structure_complete: labour_data.active_profile_count > 0,
  };
}

export function buildCostSummaryCard({ labour_data, calculations }) {
  const staff_rows = labour_data.active_staff
    .map((staff) => {
      const productive_hours = toNumber(staff.productive_hours);
      const labour_cost_rate = toNumber(staff.labour_cost_rate);
      const total_people_cost_annual = labour_cost_rate * productive_hours;

      return {
        staff_id: staff.staff_id,
        staff_name: staff.staff_name,
        staff_role: staff.staff_role,
        labour_class: staff.labour_class,
        productive_hours,
        labour_cost_rate,
        charge_out_rate: toNumber(staff.charge_out_rate),
        overhead_per_productive_hour: 0,
        labour_cost_per_productive_hour: labour_cost_rate,
        total_people_cost_annual,
      };
    })
    .sort((a, b) => b.total_people_cost_annual - a.total_people_cost_annual);

  return {
    active_revenue_model: "labour_only",
    recovery_model: "labour_only",
    recovery_model_label: "Labour Only",

    recovery_model_block: {
      active_revenue_model: "labour_only",
      recovery_model: "labour_only",
      recovery_model_label: "Labour Only",
      linked_staff_count: labour_data.active_profile_count,
      linked_asset_count: 0,
      unlinked_active_staff_count: labour_data.active_profile_count,
      active_asset_labour_links: [],
      warnings: ["Labour-only interim wiring"],
    },

    people_cost: {
      labour: calculations.total_labour_cost_annual,
      employee_overheads: 0,
      total_people_cost: calculations.total_labour_cost_annual,
      rows: staff_rows,
      staff_rows,
    },

    business_cost: {
      assets: 0,
      general_overheads: 0,
      total_business_cost: 0,
      asset_rows: [],
    },

    totals: {
      total_productive_output: calculations.total_productive_output,
      total_cost_burden: calculations.total_cost_burden,
      required_revenue: calculations.required_revenue,
      required_recovery_rate: calculations.required_recovery_rate,
    },

    insight: {
      labour_share_percent: calculations.total_cost_burden > 0 ? 1 : 0,
      message: "Cost Summary is currently aggregating all saved Labour profiles.",
    },
  };
}