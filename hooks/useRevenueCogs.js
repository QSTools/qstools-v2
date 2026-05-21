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

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildNewUnitDriverRow(index = 0) {
  return {
    id: `unit-driver-${Date.now()}-${index}`,
    unit_label: index === 0 ? "Primary unit" : `Unit ${index + 1}`,
    unit_type: "each",
    revenue_share_percent: index === 0 ? 100 : 0,
    average_sale_rate_per_unit: 0,
    direct_cost_per_unit: 0,
  };
}

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
        [field]:
          field === "commercial_driver_mode"
            ? value
            : toNumber(value),
        updated_at: new Date().toISOString(),
      })
    );
  }

  function updateUnitDriverRow(row_id, field, value) {
    setRevenueCogsState((previous) => {
      const current_rows = Array.isArray(previous.unit_driver_rows)
        ? previous.unit_driver_rows
        : [];

      const next_rows = current_rows.map((row) => {
        if (row.id !== row_id) {
          return row;
        }

        return {
          ...row,
          [field]:
            field === "unit_label" || field === "unit_type"
              ? value
              : toNumber(value),
        };
      });

      return buildRevenueCogsState({
        ...previous,
        unit_driver_rows: next_rows,
        updated_at: new Date().toISOString(),
      });
    });
  }

  function addUnitDriverRow() {
    setRevenueCogsState((previous) => {
      const current_rows = Array.isArray(previous.unit_driver_rows)
        ? previous.unit_driver_rows
        : [];

      return buildRevenueCogsState({
        ...previous,
        commercial_driver_mode:
          current_rows.length >= 1
            ? "mixed_unit_based"
            : previous.commercial_driver_mode,
        unit_driver_rows: [
          ...current_rows,
          buildNewUnitDriverRow(current_rows.length),
        ],
        updated_at: new Date().toISOString(),
      });
    });
  }

  function removeUnitDriverRow(row_id) {
    setRevenueCogsState((previous) => {
      const current_rows = Array.isArray(previous.unit_driver_rows)
        ? previous.unit_driver_rows
        : [];

      const next_rows = current_rows.filter((row) => row.id !== row_id);

      return buildRevenueCogsState({
        ...previous,
        commercial_driver_mode:
          next_rows.length > 1
            ? "mixed_unit_based"
            : previous.commercial_driver_mode === "mixed_unit_based"
              ? "unit_based"
              : previous.commercial_driver_mode,
        unit_driver_rows: next_rows.length > 0 ? next_rows : current_rows,
        updated_at: new Date().toISOString(),
      });
    });
  }

  return useMemo(() => {
    const business_type =
      business_setup_output_contract.business_type || "labour_based";

    const is_product_based = business_type === "product_based";
    const is_labour_based = business_type === "labour_based";

    const stored_commercial_driver_mode =
      revenue_cogs_state.commercial_driver_mode || "hours_based";

    const resolved_commercial_driver_mode = is_product_based
      ? stored_commercial_driver_mode === "mixed_unit_based"
        ? "mixed_unit_based"
        : "unit_based"
      : "hours_based";

    const calculations = calculateRevenueCogs({
      total_revenue: pnl_output_contract.total_revenue ?? 0,
      total_direct_costs: pnl_output_contract.total_direct_costs ?? 0,
      revenue_lines: pnl_output_contract.revenue_lines ?? [],
      direct_cost_category_totals:
        pnl_output_contract.direct_cost_category_totals ?? [],
      commercial_driver_mode: resolved_commercial_driver_mode,
      unit_driver_rows: revenue_cogs_state.unit_driver_rows,
      units_sold_annual: revenue_cogs_state.units_sold_annual,
    });

    const status = buildRevenueCogsStatus(calculations);
    const card = buildRevenueCogsCard(calculations);

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

      commercial_driver_mode: calculations.commercial_driver_mode,
      unit_driver_rows: calculations.unit_driver_rows,
      total_unit_revenue: calculations.total_unit_revenue,
      total_unit_direct_cost: calculations.total_unit_direct_cost,
      total_unit_margin_pool: calculations.total_unit_margin_pool,
      total_derived_units_annual: calculations.total_derived_units_annual,
      primary_unit_label: calculations.primary_unit_label,
      primary_unit_type: calculations.primary_unit_type,
      weighted_average_margin_per_unit:
        calculations.weighted_average_margin_per_unit,
      unit_recovery_ready: calculations.unit_recovery_ready,
      unit_recovery_warnings: calculations.unit_recovery_warnings,

      units_sold_annual: calculations.units_sold_annual,
      margin_per_unit: calculations.margin_per_unit,
      product_recovery_ready: calculations.product_recovery_ready,
      product_recovery_status: calculations.product_recovery_status,
    };

    return {
      status: {
        ...status,
        business_type,
        is_product_based,
        is_labour_based,
      },
      card: {
        ...card,
        business_type,
        is_product_based,
        is_labour_based,
        raw_state: revenue_cogs_state,
      },
      output_contract,
      updateRevenueCogsField,
      updateUnitDriverRow,
      addUnitDriverRow,
      removeUnitDriverRow,
    };
  }, [
    pnl_output_contract,
    business_setup_output_contract,
    revenue_cogs_state,
  ]);
}