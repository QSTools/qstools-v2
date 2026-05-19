"use client";

import useBusinessSummary from "@/hooks/useBusinessSummary";

import BusinessSummaryStatusStrip from "@/components/business-summary/BusinessSummaryStatusStrip";
import BusinessSummaryCard from "@/components/business-summary/BusinessSummaryCard";
import BusinessSummaryMacroPositionCard from "@/components/business-summary/BusinessSummaryMacroPositionCard";
import BusinessSummaryHelpPanel from "@/components/business-summary/BusinessSummaryHelpPanel";

export default function BusinessSummaryPage() {
  const { status, card } = useBusinessSummary();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <section className="ui-hero">
          <div className="ui-hero-inner">
            <div className="ui-kicker">Business Performance</div>
            <h1 className="ui-hero-title">Business Summary</h1>
            <p className="ui-hero-copy">
              Turn your P&amp;L into an operating result.
            </p>
            <p className="ui-hero-copy">
              This page shows what your business is actually making after
              direct costs and your Cost Summary baseline are covered.
            </p>
          </div>
        </section>

        <BusinessSummaryStatusStrip
          net_position={status.net_position}
          current_margin_per_driver={status.current_margin_per_driver}
          required_recovery_per_driver={status.required_recovery_per_driver}
          recovery_gap_per_driver={status.recovery_gap_per_driver}
          current_margin_label={status.current_margin_label}
          required_recovery_label={status.required_recovery_label}
          recovery_gap_label={status.recovery_gap_label}
          required_recovery_unit_label={status.required_recovery_unit_label}
          warning_count={status.warning_count}
          business_summary_warnings={status.business_summary_warnings}
        />

        <BusinessSummaryCard
          total_revenue={card.total_revenue}
          total_direct_costs={card.total_direct_costs}
          direct_cost_category_totals={card.direct_cost_category_totals}
          margin_pool={card.margin_pool}
          gross_margin_percent={card.gross_margin_percent}
          total_cost_burden={card.total_cost_burden}
          total_people_cost_annual={card.total_people_cost_annual}
          total_asset_cost_annual={card.total_asset_cost_annual}
          total_business_overheads={card.total_business_overheads}
          total_recovery_hours={card.total_recovery_hours}
          recovery_hours_used={card.recovery_hours_used}
          total_productive_output={card.total_productive_output}
          units_sold_annual={card.units_sold_annual}
          business_type={card.business_type}
          activity_driver_type={card.activity_driver_type}
          activity_driver_display_label={card.activity_driver_display_label}
          activity_driver_value={card.activity_driver_value}
          activity_driver_suffix={card.activity_driver_suffix}
          required_recovery_per_driver={card.required_recovery_per_driver}
          required_recovery_label={card.required_recovery_label}
          required_recovery_unit_label={card.required_recovery_unit_label}
          current_margin_per_driver={card.current_margin_per_driver}
          current_margin_label={card.current_margin_label}
          recovery_gap_per_driver={card.recovery_gap_per_driver}
          recovery_gap_label={card.recovery_gap_label}
          required_recovery_rate={card.required_recovery_rate}
          actual_recovery_rate={card.actual_recovery_rate}
          profit_or_deficit_per_recovery_hour={
            card.profit_or_deficit_per_recovery_hour
          }
          net_position={card.net_position}
        />

        <BusinessSummaryMacroPositionCard
          total_revenue={card.total_revenue}
          total_direct_costs={card.total_direct_costs}
          direct_cost_category_totals={card.direct_cost_category_totals}
          margin_pool={card.margin_pool}
          gross_margin_percent={card.gross_margin_percent}
          total_cost_burden={card.total_cost_burden}
          total_people_cost_annual={card.total_people_cost_annual}
          total_asset_cost_annual={card.total_asset_cost_annual}
          total_business_overheads={card.total_business_overheads}
          net_position={card.net_position}
          cost_burden_breakdown={card.cost_burden_breakdown}
        />

        <BusinessSummaryHelpPanel />
      </div>
    </main>
  );
}
