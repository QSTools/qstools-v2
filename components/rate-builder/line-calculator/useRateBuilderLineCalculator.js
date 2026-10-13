"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateRateBuilderQuotePreview,
  calculateRateBuilderRecoveryPreview,
  get_calculator_recovery_hours,
} from "@/lib/calculations/rateBuilderCalculations";

import {
  loadRateBuilderCalculators,
  saveRateBuilderCalculators,
} from "@/lib/storage/rateBuilderStorage";

import useCostAllocation from "@/hooks/useCostAllocation";
import { split_group_overhead } from "@/lib/calculations/shared/overheadSplit";
import { build_labour_staff_type_breakdown } from "@/lib/calculations/rateBuilderLabourByStaffType";

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

  const group_asset_options = useMemo(() => {
    const assignments = selected_cost_allocation_group?.asset_group_assignments;

    return Array.isArray(assignments)
      ? assignments.filter((assignment) => assignment?.asset_id)
      : [];
  }, [selected_cost_allocation_group]);

  const selected_asset_assignment = useMemo(() => {
    const linked_asset_id = active_calculator?.linked_asset_id || "";

    return (
      group_asset_options.find(
        (assignment) => assignment.asset_id === linked_asset_id
      ) || null
    );
  }, [active_calculator?.linked_asset_id, group_asset_options]);

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


  // OPEN-E (2026-10-13): with a group selected, labour is built per staff type
  // from the group's own labour assignments (each type's saved charge-out rate x
  // its hours / group recovery hours), the same weighting Cost Allocation uses
  // for cost. Incomplete (any unpriced staff type) = 0, so the panel shows the
  // warning and no number. With no group selected, the old single rate applies.
  const labour_breakdown = selected_cost_allocation_group
    ? build_labour_staff_type_breakdown({
        group: selected_cost_allocation_group,
        staff_type_rates: labour_rate_context.staff_type_rates,
        staff_type_floors: labour_rate_context.staff_type_floors,
        staff_type_names: labour_rate_context.staff_type_names,
        recovery_hours: selected_group_recovery_hours,
      })
    : null;

  const labour_charge_out_rate = labour_breakdown
    ? labour_breakdown.charge_rate
    : Number(labour_rate_context.current_charge_out_rate) || 0;
  const labour_minimum_recoverable_rate = labour_breakdown
    ? labour_breakdown.floor_rate
    : Number(labour_rate_context.minimum_recoverable_charge_out_rate) || 0;
  const has_labour_rate_context = labour_charge_out_rate > 0;

  // Asset-level pricing (2026-10-03): a calculator linked to one asset is
  // checked against THAT asset's own cost per hour - direct cost plus its
  // hours-share of the group's asset overhead pool, the same arithmetic
  // Business Outcome uses for an asset row's true_cost. A legacy group
  // calculator (no linked asset) falls through to the group figures unchanged.
  const selected_asset_cost_summary = useMemo(() => {
    if (!selected_asset_assignment || !selected_cost_allocation_group) {
      return null;
    }

    const all_assignments = Array.isArray(
      selected_cost_allocation_group.asset_group_assignments
    )
      ? selected_cost_allocation_group.asset_group_assignments
      : [];

    const asset_hours =
      Number(selected_asset_assignment.assigned_asset_hours) || 0;
    const asset_cost =
      Number(selected_asset_assignment.assigned_asset_cost) || 0;

    const group_asset_hours_sum = all_assignments.reduce(
      (sum, assignment) =>
        sum + (Number(assignment?.assigned_asset_hours) || 0),
      0
    );

    const { asset_overhead_pool } = split_group_overhead(
      selected_cost_allocation_group
    );

    const overhead_share =
      group_asset_hours_sum > 0
        ? (Number(asset_overhead_pool) || 0) *
          (asset_hours / group_asset_hours_sum)
        : 0;

    const total_cost = asset_cost + overhead_share;

    // Labour's side of the group overhead = assigned overhead minus the
    // asset pool (the split is two-way). Needed only when no labour
    // charge-out rate exists, so the fallback labour cost is not understated.
    const labour_overhead_pool = Math.max(
      0,
      (Number(selected_cost_allocation_group.assigned_overhead_amount) || 0) -
        (Number(asset_overhead_pool) || 0)
    );
    const labour_overhead_per_hour =
      selected_group_recovery_hours > 0
        ? labour_overhead_pool / selected_group_recovery_hours
        : 0;

    return {
      asset_id: selected_asset_assignment.asset_id,
      asset_name: selected_asset_assignment.asset_name || "Unnamed asset",
      asset_hours,
      asset_cost,
      overhead_share,
      total_cost,
      cost_per_hour: asset_hours > 0 ? total_cost / asset_hours : 0,
      labour_overhead_per_hour,
    };
  }, [selected_asset_assignment, selected_cost_allocation_group]);

  const effective_asset_rate = selected_asset_cost_summary
    ? selected_asset_cost_summary.cost_per_hour
    : selected_group_asset_rate;

  // Machine-only pricing (owner decision 2026-10-09, asset calculators brief
  // Addendum 10): an asset-linked calculator prices the MACHINE ONLY. The
  // operator is charged once, through the Labour tab rate, on the labour row.
  // So its cost is this asset's own cost per hour, with no labour component.
  // A legacy group calculator (no linked asset) keeps the all-in group rate.
  const effective_recovery_rate = selected_asset_cost_summary
    ? selected_asset_cost_summary.cost_per_hour
    : selected_group_recovery_rate;

  // CM-1b: the shared rule - the same function Business Outcome uses.
  const recovery_driver_quantity = useMemo(() => {
    return get_calculator_recovery_hours(preview.line_totals, preview.output_driver_quantity);
  }, [preview.line_totals, preview.output_driver_quantity]);

  const recovery_preview = useMemo(() => {
    return calculateRateBuilderRecoveryPreview({
      total_charge: preview.total_charge,
      selected_recovery_rate: effective_recovery_rate,
      recovery_driver_quantity,
      output_driver_quantity: preview.output_driver_quantity,
    });
  }, [
    preview.total_charge,
    preview.output_driver_quantity,
    recovery_driver_quantity,
    effective_recovery_rate,
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
      // OPEN-D: the placeholder option must never unlink the active calculator.
      // Doing so orphaned its lines. Leave it untouched; the select snaps back.
      return;
    }

    const target_group = asset_backed_group_options.find(
      (group) => group.group_id === value
    );

    const target_assets = Array.isArray(target_group?.asset_group_assignments)
      ? target_group.asset_group_assignments.filter(
          (assignment) => assignment?.asset_id
        )
      : [];

    const legacy_group_calculator = calculators.find(
      (calculator) =>
        calculator.linked_cost_allocation_group_id === value &&
        !calculator.linked_asset_id &&
        Array.isArray(calculator.lines) &&
        calculator.lines.length > 0
    );

    if (legacy_group_calculator?.id) {
      set_active_calculator_id(legacy_group_calculator.id);
      set_draft_line(EMPTY_LINE);
      return;
    }

    if (target_assets.length > 0) {
      const first_asset = target_assets[0];

      const first_asset_calculator = calculators.find(
        (calculator) =>
          calculator.linked_cost_allocation_group_id === value &&
          calculator.linked_asset_id === first_asset.asset_id
      );

      if (first_asset_calculator?.id) {
        set_active_calculator_id(first_asset_calculator.id);
        set_draft_line(EMPTY_LINE);
        return;
      }

      const first_asset_new_calculator = {
        id: build_id(first_asset.asset_name || "asset_calculator"),
        name: `${target_group?.group_name || "Asset group"} - ${
          first_asset.asset_name || "Unnamed asset"
        } calculator`,
        linked_cost_allocation_group_id: value,
        linked_asset_id: first_asset.asset_id,
        lines: [],
      };

      set_calculators((current) => [...current, first_asset_new_calculator]);
      set_active_calculator_id(first_asset_new_calculator.id);
      set_draft_line(EMPTY_LINE);
      return;
    }

    const selected_group = asset_backed_group_options.find(
      (group) => group.group_id === value
    );

    const existing_calculator = calculators.find(
      (calculator) =>
        calculator.linked_cost_allocation_group_id === value &&
        !calculator.linked_asset_id
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
      linked_asset_id: "",
      lines: [],
    };

    set_calculators((current) => [...current, next_calculator]);
    set_active_calculator_id(next_calculator.id);
    set_draft_line(EMPTY_LINE);
  }

  function updateLinkedAsset(asset_id) {
    const group_id = active_calculator?.linked_cost_allocation_group_id || "";

    if (!group_id) {
      return;
    }

    const next_asset_id = asset_id || "";

    if (!next_asset_id) {
      const legacy_calculator = calculators.find(
        (calculator) =>
          calculator.linked_cost_allocation_group_id === group_id &&
          !calculator.linked_asset_id &&
          Array.isArray(calculator.lines) &&
          calculator.lines.length > 0
      );

      if (legacy_calculator?.id) {
        set_active_calculator_id(legacy_calculator.id);
        set_draft_line(EMPTY_LINE);
      }

      return;
    }
    const selected_asset = group_asset_options.find(
      (assignment) => assignment.asset_id === next_asset_id
    );

    const existing_calculator = calculators.find(
      (calculator) =>
        calculator.linked_cost_allocation_group_id === group_id &&
        (calculator.linked_asset_id || "") === next_asset_id
    );

    if (existing_calculator?.id) {
      set_active_calculator_id(existing_calculator.id);
      set_draft_line(EMPTY_LINE);
      return;
    }

    const group_name =
      selected_cost_allocation_group?.group_name || "Asset group";

    const next_calculator = {
      id: build_id(selected_asset?.asset_name || group_name),
      name: selected_asset?.asset_name
        ? `${group_name} - ${selected_asset.asset_name} calculator`
        : `${group_name} calculator`,
      linked_cost_allocation_group_id: group_id,
      linked_asset_id: next_asset_id,
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
    labour_breakdown,
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
    group_asset_options,
    selected_asset_assignment,
    selected_asset_cost_summary,
    selected_group_asset_rate: effective_asset_rate,
    selected_group_labour_rate,
    selected_group_overhead_rate,
    selected_group_recovery_rate: effective_recovery_rate,
    addRateLine,
    deleteRateLine,
    setOutputDriver,
    updateDraftField,
    updateLinkedAsset,
    updateLinkedCostAllocationGroup,
    updateRateLine,
  };
}
