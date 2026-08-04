import { to_number } from "./sharedRecoverySummaryHelpers.js";

export function build_overhead_absorption_diagnostics({
  overhead_absorbed_percent,
  labour_share_percent,
  asset_share_percent,
  material_share_percent,
  total_people_cost_annual,
  total_asset_cost_annual,
  total_business_overheads,
  total_direct_costs,
  recovery_hours_used,
}) {
  const diagnostics = [];
  const overhead_percent = to_number(overhead_absorbed_percent);

  let absorption_level = "low";

  if (overhead_percent >= 25) {
    absorption_level = "high";
  } else if (overhead_percent >= 10) {
    absorption_level = "medium";
  }

  if (overhead_percent <= 0) {
    return {
      overhead_absorption_level: "none",
      overhead_absorption_title: "Recovery model is fully assigned",
      overhead_absorption_message:
        "The recovery model is fully assigned to labour, assets, and materials / products.",
      overhead_absorption_diagnostics: [],
    };
  }

  if (total_people_cost_annual > 0 && labour_share_percent <= 0) {
    diagnostics.push({
      diagnostic_key: "labour_cost_not_assigned",
      title: "Labour cost exists but labour recovery is not selected",
      message:
        "People cost exists in the business, but none of the recovery burden is currently assigned to labour.",
      check_area: "Review labour recovery share and recovery hours.",
    });
  }

  if (labour_share_percent > 0 && recovery_hours_used <= 0) {
    diagnostics.push({
      diagnostic_key: "labour_recovery_base_missing",
      title: "Labour recovery is selected but recovery hours are missing",
      message:
        "Labour is expected to carry recovery, but there are no selected recovery hours available.",
      check_area: "Review Labour and Business Summary recovery hours.",
    });
  }

  if (total_asset_cost_annual > 0 && asset_share_percent <= 0) {
    diagnostics.push({
      diagnostic_key: "asset_cost_not_assigned",
      title: "Asset cost exists but asset recovery is not selected",
      message:
        "Asset costs exist in the business, but none of the recovery burden is currently assigned to assets.",
      check_area:
        "Review whether productive assets should carry recovery, or whether these are support assets only.",
    });
  }

  if (total_direct_costs > 0 && material_share_percent <= 0) {
    diagnostics.push({
      diagnostic_key: "material_contribution_not_assigned",
      title: "Materials / products contribution is not selected",
      message:
        "Direct costs exist, but no recovery contribution is currently assigned to materials / products.",
      check_area:
        "Review whether material margin, product margin, resale margin, or material/product contribution should carry part of recovery.",
    });
  }

  if (total_business_overheads > 0) {
    diagnostics.push({
      diagnostic_key: "unexplained_recovery_allowance",
      title: "Recovery allowance is not yet assigned to a driver",
      message:
        "Some recovery is being held outside labour, assets, and materials / products. This does not mean the cost is missing; it means the recovery method has not been clearly assigned yet.",
      check_area:
        "Review General Overheads, support labour, asset usage, and materials / products margin to decide whether this allowance should be assigned to a direct driver.",
    });
  }

  return {
    overhead_absorption_level: absorption_level,
    overhead_absorption_title:
      absorption_level === "high"
        ? "Significant unexplained recovery allowance"
        : absorption_level === "medium"
          ? "Some recovery is not yet assigned to a driver"
          : "Low unexplained recovery allowance",
    overhead_absorption_message:
      absorption_level === "high"
        ? "A large portion of the recovery model is not yet assigned to labour, assets, or materials / products. Review the recovery strategy before relying on this model."
        : absorption_level === "medium"
          ? "A meaningful portion of the recovery model is not yet assigned to a clear driver. This may be normal, but should be reviewed."
          : "A small portion of the recovery model is being held as unexplained recovery allowance. This is normally acceptable.",
    overhead_absorption_diagnostics: diagnostics,
  };
}
