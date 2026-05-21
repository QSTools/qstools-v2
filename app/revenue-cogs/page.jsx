"use client";

import useRevenueCogs from "@/hooks/useRevenueCogs";

import RevenueCogsStatusStrip from "@/components/revenue-cogs/RevenueCogsStatusStrip";
import RevenueCogsCard from "@/components/revenue-cogs/RevenueCogsCard";
import RevenueCogsHelpPanel from "@/components/revenue-cogs/RevenueCogsHelpPanel";

export default function RevenueCogsPage() {
  const {
    status,
    card,
    updateRevenueCogsField,
    updateUnitDriverRow,
    addUnitDriverRow,
    removeUnitDriverRow,
  } = useRevenueCogs();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <RevenueCogsStatusStrip
          revenue_cogs_ready={status.revenue_cogs_ready}
          total_revenue={status.total_revenue}
          total_direct_costs={status.total_direct_costs}
          margin_pool={status.margin_pool}
          warning_count={status.warning_count}
          revenue_cogs_warnings={status.revenue_cogs_warnings}
        />

        <RevenueCogsCard
          total_revenue={card.total_revenue}
          total_direct_costs={card.total_direct_costs}
          margin_pool={card.margin_pool}
          gross_margin_percent={card.gross_margin_percent}
          revenue_line_items={card.revenue_line_items}
          direct_cost_categories={card.direct_cost_categories}
          business_type={card.business_type}
          is_product_based={card.is_product_based}
          is_labour_based={card.is_labour_based}

          commercial_driver_mode={card.commercial_driver_mode}
          commercial_driver_label={card.commercial_driver_label}
          is_hours_based={card.is_hours_based}
          is_unit_based={card.is_unit_based}
          is_mixed_unit_based={card.is_mixed_unit_based}

          unit_driver_rows={card.unit_driver_rows}
          total_unit_revenue={card.total_unit_revenue}
          total_unit_direct_cost={card.total_unit_direct_cost}
          total_unit_margin_pool={card.total_unit_margin_pool}
          total_derived_units_annual={card.total_derived_units_annual}
          weighted_average_margin_per_unit={
            card.weighted_average_margin_per_unit
          }
          unit_recovery_ready={card.unit_recovery_ready}
          unit_recovery_warnings={card.unit_recovery_warnings}

          units_sold_annual={card.units_sold_annual}
          margin_per_unit={card.margin_per_unit}

          updateRevenueCogsField={updateRevenueCogsField}
          updateUnitDriverRow={updateUnitDriverRow}
          addUnitDriverRow={addUnitDriverRow}
          removeUnitDriverRow={removeUnitDriverRow}
        />

        <RevenueCogsHelpPanel />
      </div>
    </main>
  );
}