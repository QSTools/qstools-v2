"use client";

import useModuleReconciliation from "@/hooks/useModuleReconciliation";
import ModuleReconciliationStatusStrip from "@/components/module-reconciliation/ModuleReconciliationStatusStrip";
import ModuleReconciliationComparisonCard from "@/components/module-reconciliation/ModuleReconciliationComparisonCard";
import ModuleReconciliationReadinessChecklist from "@/components/module-reconciliation/ModuleReconciliationReadinessChecklist";
import ModuleReconciliationHelpPanel from "@/components/module-reconciliation/ModuleReconciliationHelpPanel";

const VARIANCE_CHECK_IDS = [
  "business_cost_variance",
  "labour_variance",
  "asset_finance_variance",
  "general_overheads_variance",
];

// The stable seeded staff_type_id for "Owner / Director" from
// lib/storage/labourStorage.js. Matching on this ID rather than the
// editable staff_type_name label, so a rename does not break this.
const OWNER_DIRECTOR_STAFF_TYPE_ID = "owner_director";

// The older business_cost_variance check uses legacy field names
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
  const { status, modules } = useModuleReconciliation();

  const reconciliation_checks = status.reconciliation_checks || [];

  const comparison_checks = reconciliation_checks
    .filter((check) => VARIANCE_CHECK_IDS.includes(check.id))
    .map(normalise_check_for_display);

  const readiness_checks = reconciliation_checks.filter(
    (check) => !VARIANCE_CHECK_IDS.includes(check.id),
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

  return (
    <div className="ui-stack">
      <ModuleReconciliationStatusStrip
        reconciliation_ready={status.reconciliation_ready}
        blocking_count={(status.blocking_checks || []).length}
        warning_count={(status.warning_checks || []).length}
      />

      <ModuleReconciliationComparisonCard
        checks={comparison_checks}
        asset_finance_breakdown={asset_finance_breakdown}
        owner_director_breakdown={owner_director_breakdown}
      />

      <ModuleReconciliationReadinessChecklist checks={readiness_checks} />

      <ModuleReconciliationHelpPanel />
    </div>
  );
}