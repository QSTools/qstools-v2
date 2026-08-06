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
  const { status } = useModuleReconciliation();

  const reconciliation_checks = status.reconciliation_checks || [];

  const comparison_checks = reconciliation_checks
    .filter((check) => VARIANCE_CHECK_IDS.includes(check.id))
    .map(normalise_check_for_display);

  const readiness_checks = reconciliation_checks.filter(
    (check) => !VARIANCE_CHECK_IDS.includes(check.id),
  );

  return (
    <div className="ui-stack">
      <ModuleReconciliationStatusStrip
        reconciliation_ready={status.reconciliation_ready}
        blocking_count={(status.blocking_checks || []).length}
        warning_count={(status.warning_checks || []).length}
      />

      <ModuleReconciliationComparisonCard checks={comparison_checks} />

      <ModuleReconciliationReadinessChecklist checks={readiness_checks} />

      <ModuleReconciliationHelpPanel />
    </div>
  );
}