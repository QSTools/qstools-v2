"use client";

import { useCallback, useState } from "react";

export const DEFAULT_REVENUE_SUMMARY_STATE = {
  sales_revenue: 0,

  pnl_direct_labour: 0,
  subcontract_labour_cost: 0,
  subcontract_general_cost: 0,
  equipment_hire_cost: 0,
  trade_delivery_other_cost: 0,

  material_cost_total: 0,
  operating_expenses_total: 0,

  target_profit_percent: 0,
  target_profit_amount_override: 0,

  target_material_percent: 0,
  target_labour_percent: 0,

  profile_version: 1,
  effective_from: "",
  is_active: true,
  created_at: "",
  updated_at: "",
};

export function useRevenueSummaryStorage() {
  const [revenue_summary_state, set_revenue_summary_state] = useState(
    DEFAULT_REVENUE_SUMMARY_STATE
  );

  const update_revenue_summary_field = useCallback((field, value) => {
    set_revenue_summary_state((current) => ({
      ...(current ?? DEFAULT_REVENUE_SUMMARY_STATE),
      [field]: value,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const reset_revenue_summary_state = useCallback(() => {
    set_revenue_summary_state(DEFAULT_REVENUE_SUMMARY_STATE);
  }, []);

  return {
    revenue_summary_state,
    set_revenue_summary_state,
    update_revenue_summary_field,
    reset_revenue_summary_state,
  };
}