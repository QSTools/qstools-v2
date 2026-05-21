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

function buildNewUnitDriverRow(index = 0, revenue_share_percent = 0) {
  return {
    id: `unit-driver-${Date.now()}-${index}`,
    unit_label: index === 0 ? "Primary unit" : `Unit ${index + 1}`,
    unit_type: "each",
    revenue_share_percent,
    average_sale_rate_per_unit: 0,
    estimated_units_annual: 0,
  };
}

function normaliseSingleUnitRows(rows = []) {
  const first_row =
    Array.isArray(rows) && rows.length > 0
      ? rows[0]
      : buildNewUnitDriverRow(0, 100);

  return [
    {
      ...first_row,
      revenue_share_percent: 100,
    },
  ];
}

function normaliseMixedUnitRows(rows = []) {
  const source_rows = Array.isArray(rows) ? rows : [];

  if (source_rows.length >= 2) {
    return source_rows;
  }

  const first_row = source_rows[0] || buildNewUnitDriverRow(0, 50);

  return [
    {
      ...first_row,
      revenue_share_percent: 50,
    },
    buildNewUnitDriverRow(1, 50),
  ];
}

export default function useRevenueCogs() {
  const profit_and_loss = useProfitAndLoss();
  const business_setup = useBusinessSetup();

  const pnl_output_contract = profit_and_loss.output_contract ?? {};
  const business_setup_output_contract = business_setup.output_contract ?? {};

  const [storage_loaded, setStorageLoaded] = useState(false);
  const [last_manual_saved_at, setLastManualSavedAt] = useState("");
  const [save_status_message, setSaveStatusMessage] = useState("");

  const [revenue_cogs_state, setRevenueCogsState] = useState(() =>
    getDefaultRevenueCogsState()
  );

  useEffect(() => {
    const stored_state = loadRevenueCogsState();
    setRevenueCogsState(stored_state);
    setLastManualSavedAt(stored_state.updated_at || "");
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!storage_loaded) {
      return;
    }

    saveRevenueCogsState(revenue_cogs_state);
  }, [revenue_cogs_state, storage_loaded]);

  function updateRevenueCogsField(field, value) {
    if (field === "commercial_driver_mode") {
      updateCommercialDriverMode(value);
      return;
    }

    setRevenueCogsState((previous) =>
      buildRevenueCogsState({
        ...previous,
        [field]: toNumber(value),
        updated_at: new Date().toISOString(),
      })
    );
    setSaveStatusMessage("");
  }

  function updateCommercialDriverMode(mode) {
    setRevenueCogsState((previous) => {
      const current_rows = Array.isArray(previous.unit_driver_rows)
        ? previous.unit_driver_rows
        : [];

      const next_mode =
        mode === "mixed_unit_based" ? "mixed_unit_based" : "unit_based";

      const next_rows =
        next_mode === "mixed_unit_based"
          ? normaliseMixedUnitRows(current_rows)
          : normaliseSingleUnitRows(current_rows);

      return buildRevenueCogsState({
        ...previous,
        commercial_driver_mode: next_mode,
        unit_driver_rows: next_rows,
        updated_at: new Date().toISOString(),
      });
    });
    setSaveStatusMessage("");
  }

  function updateUnitDriverRow(row_id, field, value) {
    setRevenueCogsState((previous) => {
      const current_rows = Array.isArray(previous.unit_driver_rows)
        ? previous.unit_driver_rows
        : [];

      const is_single_mode = previous.commercial_driver_mode === "unit_based";

      const next_rows = current_rows.map((row) => {
        if (row.id !== row_id) {
          return row;
        }

        const next_row = {
          ...row,
          [field]:
            field === "unit_label" || field === "unit_type"
              ? value
              : toNumber(value),
        };

        if (is_single_mode) {
          next_row.revenue_share_percent = 100;
        }

        return next_row;
      });

      return buildRevenueCogsState({
        ...previous,
        unit_driver_rows: is_single_mode
          ? normaliseSingleUnitRows(next_rows)
          : next_rows,
        updated_at: new Date().toISOString(),
      });
    });
    setSaveStatusMessage("");
  }

  function addUnitDriverRow() {
    setRevenueCogsState((previous) => {
      const current_rows = normaliseMixedUnitRows(previous.unit_driver_rows);

      return buildRevenueCogsState({
        ...previous,
        commercial_driver_mode: "mixed_unit_based",
        unit_driver_rows: [
          ...current_rows,
          buildNewUnitDriverRow(current_rows.length, 0),
        ],
        updated_at: new Date().toISOString(),
      });
    });
    setSaveStatusMessage("");
  }

  function removeUnitDriverRow(row_id) {
    setRevenueCogsState((previous) => {
      const current_rows = normaliseMixedUnitRows(previous.unit_driver_rows);

      if (current_rows.length <= 2) {
        return buildRevenueCogsState({
          ...previous,
          commercial_driver_mode: "mixed_unit_based",
          unit_driver_rows: current_rows,
          updated_at: new Date().toISOString(),
        });
      }

      const next_rows = current_rows.filter((row) => row.id !== row_id);

      return buildRevenueCogsState({
        ...previous,
        commercial_driver_mode: "mixed_unit_based",
        unit_driver_rows: normaliseMixedUnitRows(next_rows),
        updated_at: new Date().toISOString(),
      });
    });
    setSaveStatusMessage("");
  }

  function saveRevenueCogsPage() {
    const saved_state = buildRevenueCogsState({
      ...revenue_cogs_state,
      updated_at: new Date().toISOString(),
    });

    saveRevenueCogsState(saved_state);
    setRevenueCogsState(saved_state);
    setLastManualSavedAt(saved_state.updated_at);
    setSaveStatusMessage("Revenue / COGS saved locally.");
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

    const resolved_unit_driver_rows =
      resolved_commercial_driver_mode === "unit_based"
        ? normaliseSingleUnitRows(revenue_cogs_state.unit_driver_rows)
        : resolved_commercial_driver_mode === "mixed_unit_based"
          ? normaliseMixedUnitRows(revenue_cogs_state.unit_driver_rows)
          : revenue_cogs_state.unit_driver_rows;

    const calculations = calculateRevenueCogs({
      total_revenue: pnl_output_contract.total_revenue ?? 0,
      total_direct_costs: pnl_output_contract.total_direct_costs ?? 0,
      revenue_lines: pnl_output_contract.revenue_lines ?? [],
      direct_cost_category_totals:
        pnl_output_contract.direct_cost_category_totals ?? [],
      commercial_driver_mode: resolved_commercial_driver_mode,
      unit_driver_rows: resolved_unit_driver_rows,
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
        last_manual_saved_at,
        save_status_message,
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
      saveRevenueCogsPage,
    };
  }, [
    pnl_output_contract,
    business_setup_output_contract,
    revenue_cogs_state,
    last_manual_saved_at,
    save_status_message,
  ]);
}