"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function formatCurrency(value) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProfitAndLossReconciliationPanel({
  reconciliation = {},
}) {
  const {
    pnl_total_costs = 0,
    model_total_costs = 0,
    variance = 0,
    is_balanced = false,
  } = reconciliation;

  return (
    <CollapsibleSection
      title="Reconciliation"
      summary="Compare P&L total costs to QS model total costs."
      defaultOpen={false}
    >
      <div className="ui-panel ui-stack-sm">
        <div className="ui-data-row">
          <span className="ui-label">P&amp;L Total Costs</span>
          <span className="ui-value">{formatCurrency(pnl_total_costs)}</span>
        </div>

        <div className="ui-data-row">
          <span className="ui-label">QS Model Total Costs</span>
          <span className="ui-value">{formatCurrency(model_total_costs)}</span>
        </div>

        <div className="ui-data-row">
          <span className="ui-label">Variance</span>
          <span className="ui-value">{formatCurrency(variance)}</span>
        </div>

        <div className="ui-data-row">
          <span className="ui-label">Status</span>
          <span className={is_balanced ? "ui-pill-success" : "ui-pill-warning"}>
            {is_balanced ? "Balanced" : "Needs Review"}
          </span>
        </div>
      </div>
    </CollapsibleSection>
  );
}