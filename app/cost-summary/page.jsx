"use client";

import { useLabour } from "@/hooks/useLabour";
import useEmployeeOverheads from "@/hooks/useEmployeeOverheads";
import useCostSummary from "@/hooks/useCostSummary";

import CostSummaryStatusStrip from "@/components/cost-summary/CostSummaryStatusStrip";
import CostSummaryCard from "@/components/cost-summary/CostSummaryCard";
import CostSummaryHelpPanel from "@/components/cost-summary/CostSummaryHelpPanel";

export default function CostSummaryPage() {
  const labour = useLabour();
  const employee_overheads = useEmployeeOverheads();

  const { status, card } = useCostSummary({
    labour,
    employee_overheads,
  });

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="cost-summary-layout">
          <div className="cost-summary-layout__main">
            <CostSummaryCard
              recovery_model_label={card.recovery_model_block.recovery_model_label}
              linked_staff_count={card.recovery_model_block.linked_staff_count}
              linked_asset_count={card.recovery_model_block.linked_asset_count}
              unlinked_active_staff_count={status.unlinked_active_staff_count}
              recovery_warnings={card.recovery_model_block.warnings}
              people_cost_total={card.people_cost_total}
              gross_wages_total={card.gross_wages_total}
              entitlements_total={card.entitlements_total}
              employer_kiwisaver_total={card.employer_kiwisaver_total}
              esct_total={card.esct_total}
              employee_overheads_total={card.employee_overheads_total}
              people_rows={card.people_rows}
              business_cost_total={card.business_cost_total}
              asset_cost_total={card.asset_cost_total}
              general_overheads_total={card.general_overheads_total}
              asset_rows={card.asset_rows}
              general_overhead_rows={card.general_overhead_rows}
              total_cost_burden={card.total_cost_burden}
              required_revenue={card.required_revenue}
              required_recovery_rate={card.required_recovery_rate}
              total_productive_output={card.total_productive_output}
            />
          </div>

          <aside className="cost-summary-layout__rail">
            <div className="cost-summary-layout__rail-stack">
              <CostSummaryStatusStrip
                recovery_model_label={status.recovery_model_label}
                linked_staff_count={status.linked_staff_count}
                linked_asset_count={status.linked_asset_count}
                unlinked_active_staff_count={status.unlinked_active_staff_count}
                missing_modules={status.missing_modules}
                warnings={status.warnings}
                is_structure_complete={status.is_structure_complete}
              />

              {card.highlight_insight ? (
                <section className="ui-section">
                  <div className="ui-kicker">Highlight Insight</div>
                  <div className="mt-2 text-sm text-[var(--text-primary)]">
                    {card.highlight_insight}
                  </div>
                </section>
              ) : null}
            </div>
          </aside>
        </section>

        <CostSummaryHelpPanel />
      </div>
    </main>
  );
}