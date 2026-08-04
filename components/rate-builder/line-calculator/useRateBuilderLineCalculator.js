"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateRateBuilderQuotePreview,
  calculateRateBuilderRecoveryPreview,
} from "@/lib/calculations/rateBuilderCalculations";

import {
  loadRateBuilderCalculators,
  saveRateBuilderCalculators,
} from "@/lib/storage/rateBuilderStorage";

import useCostAllocation from "@/hooks/useCostAllocation";

import {
  DEFAULT_CALCULATOR,
  EMPTY_LINE,
  build_id,
  get_default_calculators,
} from "./rateBuilderLineCalculatorConstants";

export default function useRateBuilderLineCalculator({ labour_rate_context = {} }) {
  const cost_allocation = useCostAllocation();

  const asset_backed_group_options = useMemo(() => {
    const group_rows =
      cost_allocation?.output_contract?.operational_group_cost_rows ?? [];

    return group_rows.filter(
      (group) => Number(group?.assigned_asset_burden) > 0
    );
  }, [cost_allocation?.output_contract?.operational_group_cost_rows]);

  const [calculators, set_calculators] = useState(get_default_calculators);
  const [active_calculator_id, set_active_calculator_id] = useState(
    DEFAULT_CALCULATOR.id
  );
  const [draft_line, set_draft_line] = useState(EMPTY_LINE);
  const [has_loaded_storage, set_has_loaded_storage] = useState(false);

  useEffect(() => {
    const stored_calculators = loadRateBuilderCalculators(
      get_default_calculators()
    );

    set_calculators(stored_calculators);

    const first_calculator = stored_calculators[0];

    if (first_calculator?.id) {
      set_active_calculator_id(first_calculator.id);
    }

    set_has_loaded_storage(true);
  }, []);

  useEffect(() => {
    if (!has_loaded_storage) {
      return;
    }

    saveRateBuilderCalculators(calculators);
  }, [calculators, has_loaded_storage]);

  const active_calculator = useMemo(() => {
    return (
      calculators.find(
        (calculator) => calculator.id === active_calculator_id
      ) || calculators[0]
    );
  }, [calculators, active_calculator_id]);

  const rate_lines = active_calculator?.lines || [];

  const preview = useMemo(() => {
    return calculateRateBuilderQuotePreview(rate_lines);
  }, [rate_lines]);

  const selected_cost_allocation_group = useMemo(() => {
    const selected_group_id =
      active_calculator?.linked_cost_allocation_group_id || "";

    return (
      asset_backed_group_options.find(
        (group) => group.group_id === selected_group_id
      ) || null
    );
  }, [
    active_calculator?.linked_cost_allocation_group_id,
    asset_backed_group_options,
  ]);

  const selected_group_recovery_hours =
    Number(selected_cost_allocation_group?.group_recovery_hours) || 0;

  const selected_group_labour_rate =
    Number(selected_cost_allocation_group?.labour_recovery_rate) ||
    (selected_group_recovery_hours > 0
      ? Number(selected_cost_allocation_group?.assigned_labour_cost || 0) /
        selected_group_recovery_hours
      : 0);

  const selected_group_asset_rate =
    Number(selected_cost_allocation_group?.asset_recovery_rate) ||
    (selected_group_recovery_hours > 0
      ? Number(selected_cost_allocation_group?.assigned_asset_burden || 0) /
        selected_group_recovery_hours
      : 0);

  const selected_group_overhead_rate =
    Number(selected_cost_allocation_group?.overhead_recovery_rate) ||
    (selected_group_recovery_hours > 0
      ? Number(selected_cost_allocation_group?.assigned_overhead_amount || 0) /
        selected_group_recovery_hours
      : 0);

  const selected_group_recovery_rate =
    Number(selected_cost_allocation_group?.group_cost_per_hour) || 0;


  const labour_charge_out_rate =
    Number(labour_rate_context.current_charge_out_rate) || 0;
  const labour_minimum_recoverable_rate =
    Number(labour_rate_context.minimum_recoverable_charge_out_rate) || 0;
  const has_labour_rate_context = labour_charge_out_rate > 0;

  const recovery_driver_quantity = useMemo(() => {
    const time_line_quantity = preview.line_totals
      .filter((line) => line.unit === "hr")
      .reduce((total, line) => total + Number(line.quantity || 0), 0);

    if (time_line_quantity > 0) {
      return time_line_quantity;
    }

    return preview.output_driver_quantity;
  }, [preview.line_totals, preview.output_driver_quantity]);

  const recovery_preview = useMemo(() => {
    return calculateRateBuilderRecoveryPreview({
      total_charge: preview.total_charge,
      selected_recovery_rate: selected_group_recovery_rate,
      recovery_driver_quantity,
      output_driver_quantity: preview.output_driver_quantity,
    });
  }, [
    preview.total_charge,
    preview.output_driver_quantity,
    recovery_driver_quantity,
    selected_group_recovery_rate,
  ]);

  const labour_job_charge =
    labour_charge_out_rate * recovery_driver_quantity;
  const labour_job_cost =
    labour_minimum_recoverable_rate * recovery_driver_quantity;
  const labour_job_profit = labour_job_charge - labour_job_cost;
  const labour_per_hr_profit =
    labour_charge_out_rate - labour_minimum_recoverable_rate;

  const display_calculator_name =
    String(active_calculator?.name || "").trim() || "Unnamed calculator";

  function updateDraftField(field, value) {
    set_draft_line((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateActiveCalculator(updater) {
    set_calculators((current) =>
      current.map((calculator) =>
        calculator.id === active_calculator?.id
          ? updater(calculator)
          : calculator
      )
    );
  }

  function updateCalculatorName(value) {
    updateActiveCalculator((calculator) => ({
      ...calculator,
      name: value,
    }));
  }

  function updateLinkedCostAllocationGroup(value) {
    if (!value) {
      updateActiveCalculator((calculator) => ({
        ...calculator,
        linked_cost_allocation_group_id: "",
      }));

      return;
    }

    const selected_group = asset_backed_group_options.find(
      (group) => group.group_id === value
    );

    const existing_calculator = calculators.find(
      (calculator) => calculator.linked_cost_allocation_group_id === value
    );

    if (existing_calculator?.id) {
      set_active_calculator_id(existing_calculator.id);
      set_draft_line(EMPTY_LINE);
      return;
    }

    const next_calculator = {
      id: build_id(selected_group?.group_name || "asset_group_calculator"),
      name: selected_group?.group_name
        ? `${selected_group.group_name} calculator`
        : "Asset group calculator",
      linked_cost_allocation_group_id: value,
      lines: [],
    };

    set_calculators((current) => [...current, next_calculator]);
    set_active_calculator_id(next_calculator.id);
    set_draft_line(EMPTY_LINE);
  }

  function createNewCalculator() {
    const next_calculator = {
      id: build_id("new_calculator"),
      name: "New rate calculator",
      lines: [],
    };

    set_calculators((current) => [...current, next_calculator]);
    set_active_calculator_id(next_calculator.id);
    set_draft_line(EMPTY_LINE);
  }

  function deleteActiveCalculator() {
    if (!active_calculator) {
      return;
    }

    set_calculators((current) => {
      const filtered_calculators = current.filter(
        (calculator) => calculator.id !== active_calculator.id
      );

      if (filtered_calculators.length === 0) {
        const fallback_calculators = get_default_calculators();
        set_active_calculator_id(fallback_calculators[0].id);
        return fallback_calculators;
      }

      set_active_calculator_id(filtered_calculators[0].id);
      return filtered_calculators;
    });
  }

  function duplicateActiveCalculator() {
    if (!active_calculator) {
      return;
    }

    const duplicated_calculator = {
      ...active_calculator,
      id: build_id(active_calculator.name),
      name: `${active_calculator.name} copy`,
      lines: active_calculator.lines.map((line) => ({
        ...line,
        id: build_id(line.name),
      })),
    };

    set_calculators((current) => [...current, duplicated_calculator]);
    set_active_calculator_id(duplicated_calculator.id);
  }

  function addRateLine() {
    const name = String(draft_line.name || "").trim();

    if (!name || !active_calculator) {
      return;
    }

    const next_line = {
      id: build_id(name),
      name,
      unit: draft_line.unit,
      rate: Number(draft_line.rate) || 0,
      quantity: Number(draft_line.quantity) || 0,
      is_output_driver: rate_lines.length === 0,
    };

    updateActiveCalculator((calculator) => ({
      ...calculator,
      lines: [...calculator.lines, next_line],
    }));

    set_draft_line(EMPTY_LINE);
  }

  function updateRateLine(id, field, value) {
    updateActiveCalculator((calculator) => ({
      ...calculator,
      lines: calculator.lines.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]: value,
            }
          : line
      ),
    }));
  }

  function setOutputDriver(id) {
    updateActiveCalculator((calculator) => ({
      ...calculator,
      lines: calculator.lines.map((line) => ({
        ...line,
        is_output_driver: line.id === id,
      })),
    }));
  }

  function deleteRateLine(id) {
    updateActiveCalculator((calculator) => {
      const filtered_lines = calculator.lines.filter((line) => line.id !== id);

      if (filtered_lines.length === 0) {
        return {
          ...calculator,
          lines: [],
        };
      }

      if (filtered_lines.some((line) => line.is_output_driver)) {
        return {
          ...calculator,
          lines: filtered_lines,
        };
      }

      return {
        ...calculator,
        lines: filtered_lines.map((line, index) => ({
          ...line,
          is_output_driver: index === 0,
        })),
      };
    });
  }

  return {
    active_calculator,
    asset_backed_group_options,
    display_calculator_name,
    draft_line,
    has_labour_rate_context,
    labour_charge_out_rate,
    labour_job_charge,
    labour_job_cost,
    labour_job_profit,
    labour_minimum_recoverable_rate,
    labour_per_hr_profit,
    preview,
    rate_lines,
    recovery_driver_quantity,
    recovery_preview,
    selected_cost_allocation_group,
    selected_group_asset_rate,
    selected_group_labour_rate,
    selected_group_overhead_rate,
    selected_group_recovery_rate,
    addRateLine,
    deleteRateLine,
    setOutputDriver,
    updateDraftField,
    updateLinkedCostAllocationGroup,
    updateRateLine,
  };
}
