"use client";

import useBusinessSummary from "@/hooks/useBusinessSummary";

import BusinessSummaryStatusStrip from "@/components/business-summary/BusinessSummaryStatusStrip";
import BusinessSummaryCard from "@/components/business-summary/BusinessSummaryCard";
import BusinessSummaryHelpPanel from "@/components/business-summary/BusinessSummaryHelpPanel";

export default function BusinessSummaryPage() {
  const { status, card } = useBusinessSummary();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
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
          margin_pool={card.margin_pool}
          gross_margin_percent={card.gross_margin_percent}
          total_cost_burden={card.total_cost_burden}
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
          net_position={card.net_position}
        />

        <BusinessSummaryHelpPanel />
      </div>
    </main>
  );
}