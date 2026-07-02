"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateRateBuilderQuotePreview,
  calculateRateBuilderRecoveryPreview,
  formatCurrency,
  formatRate,
  formatPercent,
} from "@/lib/calculations/rateBuilderCalculations";

import {
  loadRateBuilderCalculators,
  saveRateBuilderCalculators,
} from "@/lib/storage/rateBuilderStorage";

import useCostAllocation from "@/hooks/useCostAllocation";

const RATE_TYPES = [
  { value: "setup", label: "Setup / call-out" },
  { value: "time", label: "Time based" },
  { value: "output", label: "Output unit" },
  { value: "material", label: "Material" },
  { value: "subcontractor", label: "Subcontractor" },
  { value: "custom", label: "Custom" },
];

const UNIT_OPTIONS = [
  { value: "each", label: "Each" },
  { value: "hr", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "m3", label: "m³" },
  { value: "m2", label: "m²" },
  { value: "lm", label: "Lineal metre" },
  { value: "tonne", label: "Tonne" },
  { value: "item", label: "Item" },
  { value: "custom", label: "Custom" },
];

const DEFAULT_CALCULATOR = {
  id: "two_inch_line_pump",
  name: "2-inch line pump calculator",
  linked_cost_allocation_group_id: "",
  lines: [
    {
      id: "setup_fee",
      name: "Setup Fee",
      type: "setup",
      unit: "each",
      rate: 135,
      quantity: 1,
      is_output_driver: false,
    },
    {
      id: "m3_rate",
      name: "m3 Rate",
      type: "output",
      unit: "m3",
      rate: 13,
      quantity: 15,
      is_output_driver: true,
    },
    {
      id: "pump_hire_2inc",
      name: "2inc Line Pump Hire",
      type: "time",
      unit: "hr",
      rate: 135,
      quantity: 4,
      is_output_driver: false,
    },
  ],
};

const EMPTY_LINE = {
  name: "",
  type: "custom",
  unit: "each",
  rate: "",
  quantity: "",
};

function get_unit_label(unit_value) {
  const match = UNIT_OPTIONS.find((unit) => unit.value === unit_value);
  return match ? match.label : unit_value || "unit";
}

function build_id(name) {
  const base_id = String(name || "item")
    .toLowerCase()
    .trim()
    .replaceAll(" ", "_")
    .replace(/[^a-z0-9_]/g, "");

  return `${base_id || "item"}_${Date.now()}`;
}

function get_default_calculators() {
  return [DEFAULT_CALCULATOR];
}

export default function RateBuilderLineCalculator() {
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

  const recovery_driver_quantity = useMemo(() => {
    const time_line_quantity = preview.line_totals
      .filter((line) => line.type === "time")
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
      type: draft_line.type,
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

  return (
    <section className="rate-builder-calculator">
      <div className="rate-builder-calculator__left ui-stack">
        <article className="ui-section">
          <p className="ui-kicker">Calculator setup</p>

          <h2 className="ui-section-title">Asset-backed pricing group</h2>

          <p className="ui-help">
            Select the Cost Allocation group this calculator is pricing. Only
            asset-backed operational groups are shown here.
          </p>

          <div className="mt-5 grid gap-4">
            <label className="ui-field">
              <span className="ui-label">Select cost allocation group</span>

              <select
                value={active_calculator?.linked_cost_allocation_group_id || ""}
                onChange={(event) =>
                  updateLinkedCostAllocationGroup(event.target.value)
                }
                className="ui-select"
              >
                <option value="">Select asset-backed group</option>

                {asset_backed_group_options.map((group) => (
                  <option key={group.group_id} value={group.group_id}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </article>

        <article className="ui-section">
          <p className="ui-kicker">Rate setup</p>

          <h2 className="ui-section-title">Add customer charge line</h2>

          <p className="ui-help">
            Create the charge lines this calculator uses. Each line has a name,
            unit, rate, and example quantity.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="ui-field sm:col-span-2">
              <span className="ui-label">Line item name</span>

              <input
                type="text"
                value={draft_line.name}
                onChange={(event) =>
                  updateDraftField("name", event.target.value)
                }
                placeholder="Example: Setup fee"
                className="ui-input"
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Charge type</span>

              <select
                value={draft_line.type}
                onChange={(event) =>
                  updateDraftField("type", event.target.value)
                }
                className="ui-select"
              >
                {RATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ui-field">
              <span className="ui-label">Unit</span>

              <select
                value={draft_line.unit}
                onChange={(event) =>
                  updateDraftField("unit", event.target.value)
                }
                className="ui-select"
              >
                {UNIT_OPTIONS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="ui-field">
              <span className="ui-label">Rate</span>

              <input
                type="number"
                value={draft_line.rate}
                onChange={(event) =>
                  updateDraftField("rate", event.target.value)
                }
                placeholder="Example: 135"
                className="ui-input"
              />
            </label>

            <label className="ui-field">
              <span className="ui-label">Example job quantity</span>

              <input
                type="number"
                value={draft_line.quantity ?? ""}
                onChange={(event) =>
                  updateDraftField("quantity", event.target.value)
                }
                placeholder="Example: 3"
                className="ui-input"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={addRateLine}
            className="ui-button-primary mt-5"
          >
            Add line item
          </button>
        </article>

        <article className="ui-section">
          <p className="ui-kicker">Calculator result</p>

          <h2 className="ui-section-title">
            Example charge total - {display_calculator_name}
          </h2>

          <p className="ui-help">
            The total charge is divided by the selected output driver quantity
            to show the effective rate per output unit.
          </p>

          <div className="mt-5 grid gap-3">
            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">Total charge</p>

              <p className="rate-builder-result-value">
                {formatCurrency(preview.total_charge)}
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Primary output driver
              </p>

              <p className="rate-builder-driver-name">
                {preview.output_driver_name}
              </p>

              <p className="rate-builder-driver-quantity">
                {preview.output_driver_quantity}{" "}
                {get_unit_label(preview.output_driver_unit)}
              </p>
            </div>

            <div className="rate-builder-effective-card">
              <p className="rate-builder-effective-label">Effective rate</p>

              <p className="rate-builder-result-value">
                {formatRate(
                  preview.effective_rate_per_output_unit,
                  get_unit_label(preview.output_driver_unit)
                )}
              </p>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">
                Cost Allocation source
              </p>

              <p className="rate-builder-driver-name">
                {selected_cost_allocation_group?.group_name ||
                  "No cost group selected"}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p className="ui-help">
                  Labour cost:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.assigned_labour_cost || 0
                  )}
                </p>

                <p className="ui-help">
                  Labour hours:{" "}
                  {Number(
                    selected_cost_allocation_group?.assigned_labour_hours || 0
                  ).toFixed(2)}
                </p>

                <p className="ui-help">
                  Labour recovery rate:{" "}
                  {formatRate(selected_group_labour_rate, "hr")}
                </p>

                <p className="ui-help">
                  Asset cost:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.assigned_asset_burden || 0
                  )}
                </p>

                <p className="ui-help">
                  Asset hours:{" "}
                  {Number(
                    selected_cost_allocation_group?.assigned_asset_hours || 0
                  ).toFixed(2)}
                </p>

                <p className="ui-help">
                  Asset recovery rate: {formatRate(selected_group_asset_rate, "hr")}
                </p>

                <p className="ui-help">
                  Overhead allocation:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.assigned_overhead_amount || 0
                  )}
                </p>

                <p className="ui-help">
                  Overhead recovery rate:{" "}
                  {formatRate(selected_group_overhead_rate, "hr")}
                </p>

                <p className="ui-help">
                  Total group cost:{" "}
                  {formatCurrency(
                    selected_cost_allocation_group?.total_group_cost || 0
                  )}
                </p>                <p className="ui-help">
                  Recovery basis:{" "}
                  {selected_cost_allocation_group?.group_recovery_hour_source ===
                  "asset_hours"
                    ? "Asset hours"
                    : selected_cost_allocation_group?.group_recovery_hour_source ===
                        "manual_hours"
                      ? "Manual hours"
                      : "Labour hours"}
                </p>

                <p className="ui-help">
                  Recovery hours used:{" "}
                  {Number(
                    selected_cost_allocation_group?.group_recovery_hours || 0
                  ).toFixed(2)}
                </p>

                <p className="ui-help sm:col-span-2">
                  Group recovery rate:{" "}
                  {formatRate(selected_group_recovery_rate, "hr")}
                </p>
              </div>
            </div>

            <div className="rate-builder-result-card">
              <p className="rate-builder-result-label">Profit / shortfall</p>

              <p className="rate-builder-result-value">
                {formatCurrency(recovery_preview.profit_amount)}
              </p>

              <p className="ui-help mt-2">
                Margin: {formatPercent(recovery_preview.profit_margin_percent)}
              </p>

              <p className="ui-help">
                Profit per {get_unit_label(preview.output_driver_unit)}:{" "}
                {formatCurrency(recovery_preview.profit_per_output_unit)}
              </p>

              <p className="ui-help">
                Recovery cost per {get_unit_label(preview.output_driver_unit)}:{" "}
                {formatCurrency(
                  recovery_preview.recovery_cost_per_output_unit
                )}
              </p>

              <p className="ui-help">
                Status: {recovery_preview.recovery_status}
              </p>
            </div>
          </div>
        </article>
      </div>

      <article className="rate-builder-calculator__right ui-section">
        <p className="ui-kicker">Charge lines</p>

        <h2 className="ui-section-title">{display_calculator_name}</h2>

        <p className="ui-help">
          Select one line as the primary output driver. The total charge will be
          divided by that line quantity to calculate the effective rate.
        </p>

        <div className="rate-builder-charge-list mt-5">
          {rate_lines.map((line) => (
            <div
              key={line.id}
              className={`rate-builder-charge-card ${
                line.is_output_driver
                  ? "rate-builder-charge-card--selected"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Output driver
                  </p>

                  <button
                    type="button"
                    onClick={() => setOutputDriver(line.id)}
                    className={`rate-builder-output-pill mt-2 ${
                      line.is_output_driver
                        ? "rate-builder-output-pill--selected"
                        : ""
                    }`}
                  >
                    {line.is_output_driver
                      ? "Selected output driver"
                      : "Click to use as output driver"}
                  </button>
                </div>

                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteRateLine(line.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      deleteRateLine(line.id);
                    }
                  }}
                  className="rate-builder-delete-action"
                >
                  Delete
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Line item</span>

                  <input
                    type="text"
                    value={line.name}
                    onChange={(event) =>
                      updateRateLine(line.id, "name", event.target.value)
                    }
                    className="ui-input"
                  />
                </label>

                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Unit</span>

                  <select
                    value={line.unit}
                    onChange={(event) =>
                      updateRateLine(line.id, "unit", event.target.value)
                    }
                    className="ui-select"
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Type</span>

                  <select
                    value={line.type}
                    onChange={(event) =>
                      updateRateLine(line.id, "type", event.target.value)
                    }
                    className="ui-select"
                  >
                    {RATE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Rate</span>

                  <input
                    type="number"
                    value={line.rate}
                    onChange={(event) =>
                      updateRateLine(line.id, "rate", event.target.value)
                    }
                    className="ui-input"
                  />
                </label>

                <label
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Example job quantity</span>

                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(event) =>
                      updateRateLine(line.id, "quantity", event.target.value)
                    }
                    className="ui-input"
                  />
                </label>

                <div
                  className="ui-field"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="ui-label">Line total</span>

                  <div className="ui-readonly">
                    {formatCurrency(Number(line.rate) * Number(line.quantity))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rate_lines.length === 0 ? (
            <div className="ui-panel text-sm text-slate-400">
              No charge lines have been added yet.
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}






























































