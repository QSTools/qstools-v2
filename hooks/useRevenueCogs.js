"use client";

import { useEffect, useMemo, useState } from "react";

import useProfitAndLoss from "@/hooks/useProfitAndLoss";
import useBusinessSetup from "@/hooks/useBusinessSetup";
import { calculateRevenueCogs } from "@/lib/calculations/revenueCogsCalculations";
import {
  buildRevenueCogsCard,
  buildRevenueCogsStatus,
} from "@/lib/selectors/revenueCogsSelectors";
import {
  buildRevenueCogsState,
  getDefaultRevenueCogsState,
  loadRevenueCogsState,
  saveRevenueCogsState,
} from "@/lib/storage/revenueCogsStorage";

export default function useRevenueCogs() {
  const profit_and_loss = useProfitAndLoss();
  const business_setup = useBusinessSetup();

  const pnl_output_contract = profit_and_loss.output_contract ?? {};
  const business_setup_output_contract = business_setup.output_contract ?? {};

  const [storage_loaded, setStorageLoaded] = useState(false);

  const [revenue_cogs_state, setRevenueCogsState] = useState(() =>
    getDefaultRevenueCogsState()
  );

  useEffect(() => {
    const stored_state = loadRevenueCogsState();
    setRevenueCogsState(stored_state);
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!storage_loaded) {
      return;
    }

    saveRevenueCogsState(revenue_cogs_state);
  }, [revenue_cogs_state, storage_loaded]);

  function updateRevenueCogsField(field, value) {
    setRevenueCogsState((previous) =>
      buildRevenueCogsState({
        ...previous,
        [field]: Number(String(value).replace(/,/g, "")) || 0,
        updated_at: new Date().toISOString(),
      })
    );
  }

  return useMemo(() => {
    const calculations = calculateRevenueCogs({
      total_revenue: pnl_output_contract.total_revenue ?? 0,
      total_direct_costs: pnl_output_contract.total_direct_costs ?? 0,
      revenue_lines: pnl_output_contract.revenue_lines ?? [],
      direct_cost_category_totals:
        pnl_output_contract.direct_cost_category_totals ?? [],
    });

    const status = buildRevenueCogsStatus(calculations);
    const card = buildRevenueCogsCard(calculations);

    const business_type =
      business_setup_output_contract.business_type || "labour_based";
    const is_product_based = business_type === "product_based";
    const is_labour_based = business_type === "labour_based";
    const units_sold_annual = Number(revenue_cogs_state.units_sold_annual) || 0;

    const output_contract = {
      total_revenue: calculations.total_revenue,
      total_direct_costs: calculations.total_direct_costs,
      margin_pool: calculations.margin_pool,
      gross_margin_percent: calculations.gross_margin_percent,
      revenue_cogs_ready: status.revenue_cogs_ready,
      revenue_cogs_warnings: status.revenue_cogs_warnings,
      direct_cost_category_totals: calculations.direct_cost_category_totals,

      business_type,
      is_product_based,
      is_labour_based,
      units_sold_annual,
    };

    return {
      status: {
        ...status,
        business_type,
        is_product_based,
        is_labour_based,
        units_sold_annual,
      },
      card: {
        ...card,
        business_type,
        is_product_based,
        is_labour_based,
        units_sold_annual,
      },
      output_contract,
      updateRevenueCogsField,
    };
  }, [
    pnl_output_contract,
    business_setup_output_contract,
    revenue_cogs_state,
  ]);
}