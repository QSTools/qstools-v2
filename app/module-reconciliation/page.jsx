"use client";

import useModuleReconciliation from "@/hooks/useModuleReconciliation";
import ModuleReconciliationSummaryCard from "@/components/module-reconciliation/ModuleReconciliationSummaryCard";
import ModuleReconciliationReadinessChecklist from "@/components/module-reconciliation/ModuleReconciliationReadinessChecklist";
import ModuleReconciliationHelpPanel from "@/components/module-reconciliation/ModuleReconciliationHelpPanel";
import NextStepFooter from "@/components/navigation/NextStepFooter";

// Top-level, macro checks shown as the main cards.
const TOP_LEVEL_CHECK_IDS = [
  "labour_variance",
  "asset_finance_variance",
  "general_overheads_variance",
];

// labour_variance is the blended macro figure; these two are its
// components (S21 wages/on-costs split) and are attached as
// sub_checks under it rather than shown as separate top-level cards.
const LABOUR_SUB_CHECK_IDS = [
  "labour_wages_variance",
  "labour_on_costs_variance",
];

const ALL_COMPONENT_CHECK_IDS = [
  ...TOP_LEVEL_CHECK_IDS,
  ...LABOUR_SUB_CHECK_IDS,
];

// The stable seeded staff_type_id for "Owner / Director" from
// lib/storage/labourStorage.js. Matching on this ID rather than the
// editable staff_type_name label, so a rename does not break this.
const OWNER_DIRECTOR_STAFF_TYPE_ID = "owner_director";

// The business_cost_variance check uses legacy field names
// (comparison_total / pnl_business_cost) instead of source_amount /
// module_amount. Normalise for display only. No change to the
// underlying calculation in reconciliationRules.js.
function normalise_check_for_display(check) {
  if (check.id !== "business_cost_variance") return check;

  const source_amount = check.comparison_total;
  const module_amount = check.comparison_total + check.variance_amount;

  return {
    ...check,
    source_amount,
    module_amount,
  };
}

export default function ModuleReconciliationPage() {
  const { status, modules, accept_check } = useModuleReconciliation();

  const reconciliation_checks = status.reconciliation_checks || [];

  const business_cost_check_raw = reconciliation_checks.find(
    (check) => check.id === "business_cost_variance",
  );
  const business_cost_check = business_cost_check_raw
    ? normalise_check_for_display(business_cost_check_raw)
    : null;

  const top_level_checks = reconciliation_checks.filter((check) =>
    TOP_LEVEL_CHECK_IDS.includes(check.id),
  );

  const labour_sub_checks = reconciliation_checks.filter((check) =>
    LABOUR_SUB_CHECK_IDS.includes(check.id),
  );

  // Attach wages/on-costs to the blended Labour check as sub_checks -
  // the macro layer stays a single card, its components become a
  // drill-down inside it instead of separate sibling cards. These
  // check objects already carry any S20 accepted/stale_acceptance
  // fields, since that overlay runs inside reconciliationRules.js
  // before this nesting step ever sees them.
  const component_checks = top_level_checks.map((check) =>
    check.id === "labour_variance"
      ? { ...check, sub_checks: labour_sub_checks }
      : check,
  );

  const readiness_checks = reconciliation_checks.filter(
    (check) =>
      check.id !== "business_cost_variance" &&
      !ALL_COMPONENT_CHECK_IDS.includes(check.id),
  );

  // Real per-asset finance breakdown, sourced directly from the Assets
  // module (modules.assets.active_assets). Read-only display only; no
  // Assets calculation is touched.
  const active_assets = modules?.assets?.active_assets || [];
  const asset_finance_breakdown = active_assets
    .filter((asset) => asset.finance_active === true)
    .map((asset) => ({
      asset_id: asset.asset_id,
      asset_name: asset.asset_name || "Unnamed Asset",
      asset_interest_annual: asset.asset_interest_annual || 0,
      finance_status: asset.finance_status,
    }));

  // Real Owner/Director staff breakdown, sourced directly from the
  // Labour module (modules.labour.active_staff). Matches on the stable
  // staff_type_id, not the editable display label. Read-only display
  // only; no Labour calculation is touched.
  const active_staff = modules?.labour?.active_staff || [];
  const owner_director_breakdown = active_staff
    .filter((staff) => staff.staff_type_id === OWNER_DIRECTOR_STAFF_TYPE_ID)
    .map((staff) => ({
      staff_id: staff.staff_id,
      staff_name: staff.staff_name || "Unnamed Staff",
      annual_labour_cost: staff.annual_labour_cost || 0,
    }));

  // "Show the maths" layer (this session): per-category P&L vs
  // General Overheads figures, and the asset-related cost pools
  // (fuel / insurance / repairs-maintenance / registration-compliance).
  // Both already exist inside general_overheads.output_contract - read
  // directly, no new calculation introduced here or anywhere else.
  const general_overheads_category_totals =
    modules?.generalOverheads?.output_contract?.category_totals || [];

  const asset_overhead_pools =
    modules?.generalOverheads?.output_contract?.asset_overhead_pools || {};

  return (
    <div className="ui-stack">
      <ModuleReconciliationSummaryCard
        reconciliation_ready={status.reconciliation_ready}
        business_cost_check={business_cost_check}
        component_checks={component_checks}
        asset_finance_breakdown={asset_finance_breakdown}
        owner_director_breakdown={owner_director_breakdown}
        general_overheads_category_totals={general_overheads_category_totals}
        asset_overhead_pools={asset_overhead_pools}
        accept_check={accept_check}
      />

      <ModuleReconciliationReadinessChecklist checks={readiness_checks} />

      <ModuleReconciliationHelpPanel />

      <NextStepFooter
        nextHref="/cost-summary"
        nextLabel="Next: Cost Summary"
      />
    </div>
  );
}
