"use client";

import { useLabour } from "@/hooks/useLabour";
import useCostSummary from "@/hooks/useCostSummary";

import CostSummaryStatusStrip from "@/components/cost-summary/CostSummaryStatusStrip";
import CostSummaryCard from "@/components/cost-summary/CostSummaryCard";
import CostSummaryHelpPanel from "@/components/cost-summary/CostSummaryHelpPanel";

export default function CostSummaryPage() {
  const labour = useLabour();

  const { status, card } = useCostSummary({
    labour,
  });

  return (
    <main className="space-y-6">
      <CostSummaryStatusStrip
        recovery_model_label={status.recovery_model_label}
        linked_staff_count={status.linked_staff_count}
        linked_asset_count={status.linked_asset_count}
        unlinked_active_staff_count={status.unlinked_active_staff_count}
        missing_modules={status.missing_modules}
        warnings={status.warnings}
        is_structure_complete={status.is_structure_complete}
      />

      <CostSummaryCard
        recovery_model_label={card.recovery_model_label}
        linked_staff_count={card.recovery_model_block.linked_staff_count}
        linked_asset_count={card.recovery_model_block.linked_asset_count}
        warnings={card.recovery_model_block.warnings}
        people_cost_total={card.people_cost.total_people_cost}
        labour_cost_total={card.people_cost.labour}
        employee_overheads_total={card.people_cost.employee_overheads}
        people_drilldown={card.people_cost.rows.map((row) => ({
          key: row.staff_id,
          label: row.staff_name || "Unnamed",
          meta: row.staff_role || row.labour_class || "",
          value: row.total_people_cost_annual,
        }))}
        business_cost_total={card.business_cost.total_business_cost}
        asset_cost_total={card.business_cost.assets}
        general_overheads_total={card.business_cost.general_overheads}
        asset_drilldown={card.business_cost.asset_rows.map((row) => ({
          key: row.asset_id,
          label: row.asset_name || "Unnamed asset",
          meta: "",
          value: row.total_asset_cost_annual || 0,
        }))}
        overhead_drilldown={[]}
        total_cost_burden={card.totals.total_cost_burden}
        required_revenue={card.totals.required_revenue}
        required_recovery_rate={card.totals.required_recovery_rate}
        insight_text={card.insight.message}
      />

      <CostSummaryHelpPanel />
    </main>
  );
}