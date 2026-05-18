"use client";

import { useState } from "react";

function format_currency(value) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function ComponentBreakdown({ active_component, values }) {
  if (!active_component) {
    return null;
  }

  if (active_component === "people_cost") {
    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">People Cost source</p>

          <p className="ui-help">
            People Cost is coming from the labour side of the model. This is
            usually where wages, employee overheads, and productive recovery
            assumptions flow into the annual cost burden.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">People Cost</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_people_cost_annual)}
              </div>
            </div>
          </div>

          <p className="ui-help">
            To trace this further, review Labour and Employee Overheads.
          </p>
        </div>
      </div>
    );
  }

  if (active_component === "asset_cost") {
    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Asset Cost source</p>

          <p className="ui-help">
            Asset Cost is coming from the Assets module. It represents the
            annual cost attached to active assets that flow into the Cost Summary
            burden.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Asset Cost</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_asset_cost_annual)}
              </div>
            </div>
          </div>

          <p className="ui-help">
            To trace this further, review Assets and confirm which assets are
            active and productive.
          </p>
        </div>
      </div>
    );
  }

  if (active_component === "business_overheads") {
    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Business Overheads source</p>

          <p className="ui-help">
            Business Overheads are coming from General Overheads. These are the
            wider annual operating costs the business must recover.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">
                Business Overheads
              </div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_business_overheads)}
              </div>
            </div>
          </div>

          <p className="ui-help">
            To trace this further, review General Overheads and overhead
            category mapping.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function SourceBreakdown({ active_breakdown, values }) {
  const [active_component, set_active_component] = useState(null);

  if (!active_breakdown) {
    return null;
  }

  if (active_breakdown === "margin_pool") {
    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Margin Pool breakdown</p>

          <p className="ui-help">
            Margin Pool comes from Revenue / COGS. It shows what is left after
            direct costs before the operating cost burden is recovered.
          </p>

          <div className="labour-summary-table">
            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Revenue</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_revenue)}
              </div>
            </div>

            <div className="labour-summary-table-row">
              <div className="labour-summary-table-label">Direct Costs</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_direct_costs)}
              </div>
            </div>

            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">Margin Pool</div>
              <div className="labour-summary-table-value">
                {format_currency(values.margin_pool)}
              </div>
            </div>
          </div>

          <p className="ui-help">Revenue - Direct Costs = Margin Pool</p>
        </div>
      </div>
    );
  }

  if (active_breakdown === "total_cost_burden") {
    return (
      <div className="ui-readonly">
        <div className="ui-stack-sm">
          <p className="ui-kicker">Total Cost Burden breakdown</p>

          <p className="ui-help">
            Total Cost Burden comes from Cost Summary. It is the annual cost the
            business must recover.
          </p>

          <div className="ui-stack-sm">
            <button
              type="button"
              onClick={() =>
                set_active_component(
                  active_component === "people_cost" ? null : "people_cost"
                )
              }
              className={`labour-summary-table-row w-full text-left transition ${
                active_component === "people_cost"
                  ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]"
                  : ""
              }`}
            >
              <div className="labour-summary-table-label">People Cost</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_people_cost_annual)}
              </div>
            </button>

            {active_component === "people_cost" ? (
              <ComponentBreakdown
                active_component={active_component}
                values={values}
              />
            ) : null}

            <button
              type="button"
              onClick={() =>
                set_active_component(
                  active_component === "asset_cost" ? null : "asset_cost"
                )
              }
              className={`labour-summary-table-row w-full text-left transition ${
                active_component === "asset_cost"
                  ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]"
                  : ""
              }`}
            >
              <div className="labour-summary-table-label">Asset Cost</div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_asset_cost_annual)}
              </div>
            </button>

            {active_component === "asset_cost" ? (
              <ComponentBreakdown
                active_component={active_component}
                values={values}
              />
            ) : null}

            <button
              type="button"
              onClick={() =>
                set_active_component(
                  active_component === "business_overheads"
                    ? null
                    : "business_overheads"
                )
              }
              className={`labour-summary-table-row w-full text-left transition ${
                active_component === "business_overheads"
                  ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]"
                  : ""
              }`}
            >
              <div className="labour-summary-table-label">
                Business Overheads
              </div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_business_overheads)}
              </div>
            </button>

            {active_component === "business_overheads" ? (
              <ComponentBreakdown
                active_component={active_component}
                values={values}
              />
            ) : null}

            <div className="labour-summary-table-row total">
              <div className="labour-summary-table-label">
                Total Cost Burden
              </div>
              <div className="labour-summary-table-value">
                {format_currency(values.total_cost_burden)}
              </div>
            </div>
          </div>

          <p className="ui-help">
            People Cost + Asset Cost + Business Overheads = Total Cost Burden
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function CalculationRow({ row, active, onClick, values }) {
  const is_clickable = Boolean(row.drilldown_key);

  return (
    <div className="ui-stack-sm">
      {is_clickable ? (
        <button
          type="button"
          onClick={() => onClick(active ? null : row.drilldown_key)}
          className={`labour-summary-table-row w-full text-left transition ${
            row.emphasis ? "total" : ""
          } ${
            active
              ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]"
              : ""
          }`}
        >
          <div className="labour-summary-table-label">{row.label}</div>
          <div className="labour-summary-table-value">{row.value}</div>
        </button>
      ) : (
        <div
          className={`labour-summary-table-row ${
            row.emphasis ? "total" : ""
          }`}
        >
          <div className="labour-summary-table-label">{row.label}</div>
          <div className="labour-summary-table-value">{row.value}</div>
        </div>
      )}

      {active ? (
        <SourceBreakdown active_breakdown={row.drilldown_key} values={values} />
      ) : null}
    </div>
  );
}

function CalculationTable({ title, rows = [], formula, values }) {
  const [active_breakdown, set_active_breakdown] = useState(null);

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <p className="ui-kicker">{title}</p>

        <div className="ui-stack-sm">
          {rows.map((row) => (
            <CalculationRow
              key={row.label}
              row={row}
              active={active_breakdown === row.drilldown_key}
              onClick={set_active_breakdown}
              values={values}
            />
          ))}
        </div>

        {formula ? <p className="ui-help">{formula}</p> : null}
      </div>
    </div>
  );
}

function get_warning_detail(warning_key, values = {}) {
  const {
    margin_pool,
    total_cost_burden,
    net_position,
    current_margin_per_driver,
    required_recovery_per_driver,
    recovery_gap_per_driver,
    total_revenue,
    total_direct_costs,
  } = values;

  const detail_map = {
    negative_net_position: {
      title: "Margin pool is below total cost burden",
      meaning:
        "Business Summary is showing that the margin pool generated by the business is not enough to cover the total cost burden.",
      source:
        "This comes from Business Summary: margin pool is compared against total cost burden.",
      calculation_title: "Net Position calculation",
      actual_maths: [
        {
          label: "Margin Pool",
          value: format_currency(margin_pool),
          drilldown_key: "margin_pool",
        },
        {
          label: "Total Cost Burden",
          value: format_currency(total_cost_burden),
          drilldown_key: "total_cost_burden",
        },
        {
          label: "Net Position",
          value: format_currency(net_position),
          emphasis: true,
        },
      ],
      formula: "Margin Pool - Total Cost Burden = Net Position",
    },

    recovery_gap_negative: {
      title: "Required recovery level is not being met",
      meaning:
        "The business is not currently generating enough margin to meet the recovery level required by the current model.",
      source:
        "This comes from Business Summary: current margin is compared against required recovery.",
      calculation_title: "Recovery Gap calculation",
      actual_maths: [
        {
          label: "Current Margin",
          value: format_currency(current_margin_per_driver),
        },
        {
          label: "Required Recovery",
          value: format_currency(required_recovery_per_driver),
        },
        {
          label: "Recovery Gap",
          value: format_currency(recovery_gap_per_driver),
          emphasis: true,
        },
      ],
      formula: "Current Margin - Required Recovery = Recovery Gap",
    },

    negative_margin_pool: {
      title: "Direct costs are higher than revenue",
      meaning:
        "The business is currently showing a negative margin pool before the operating cost burden is recovered.",
      source:
        "This comes from Revenue / COGS: revenue is compared with direct costs.",
      calculation_title: "Margin Pool calculation",
      actual_maths: [
        {
          label: "Revenue",
          value: format_currency(total_revenue),
        },
        {
          label: "Direct Costs",
          value: format_currency(total_direct_costs),
        },
        {
          label: "Margin Pool",
          value: format_currency(margin_pool),
          emphasis: true,
        },
      ],
      formula: "Revenue - Direct Costs = Margin Pool",
    },

    share_not_balanced: {
      title: "Recovery split does not total 100%",
      meaning:
        "The recovery burden cannot be assigned correctly until the labour, asset, and absorbed overhead shares total 100%.",
      source: "This comes from Recovery Summary recovery split inputs.",
      calculation_title: "Recovery Split rule",
      actual_maths: [],
      formula: "Labour Share + Asset Share + Absorbed Overhead Share = 100%",
    },

    business_summary_not_ready: {
      title: "Business Summary is not ready",
      meaning:
        "Recovery Summary is waiting for a usable Business Summary result before it can produce a reliable recovery model.",
      source: "This comes from the Business Summary readiness state.",
      calculation_title: "Business Summary readiness",
      actual_maths: [],
      formula: "Business Summary Ready = true",
    },

    upstream_model_not_ready: {
      title: "Upstream model is not trusted",
      meaning:
        "The model has upstream readiness issues, so the recovery model should not be treated as final.",
      source: "This comes from Model Readiness.",
      calculation_title: "Model Readiness rule",
      actual_maths: [],
      formula: "Model Readiness = ready or warning",
    },

    no_activity_driver: {
      title: "No recovery driver is available",
      meaning:
        "The system does not yet have a valid activity base to spread the cost burden across.",
      source:
        "This comes from Business Summary and Business Setup through the selected activity driver.",
      calculation_title: "Recovery Driver rule",
      actual_maths: [],
      formula: "Total Cost Burden ÷ Activity Driver = Required Recovery",
    },

    no_required_recovery_per_driver: {
      title: "Required recovery level is missing",
      meaning:
        "The system cannot calculate the required recovery level for the selected driver.",
      source: "This comes from Business Summary.",
      calculation_title: "Required Recovery calculation",
      actual_maths: [],
      formula: "Required Recovery = Total Cost Burden ÷ Activity Driver",
    },

    no_productive_output: {
      title: "No productive output is available",
      meaning:
        "Labour-driven recovery cannot be calculated without productive output or recovery hours.",
      source: "This comes from Labour / Cost Summary.",
      calculation_title: "Recovery Hours rule",
      actual_maths: [],
      formula: "Required Recovery Per Hour = Total Cost Burden ÷ Recovery Hours",
    },

    no_units_sold: {
      title: "No units sold value is available",
      meaning:
        "Product-driven recovery cannot be calculated without annual units sold.",
      source: "This comes from Revenue / COGS in product-based mode.",
      calculation_title: "Units Sold rule",
      actual_maths: [],
      formula: "Required Recovery Per Unit = Total Cost Burden ÷ Units Sold",
    },

    asset_share_without_asset_recovery_base: {
      title: "Asset recovery has no asset base",
      meaning:
        "The recovery split assigns burden to assets, but there is no usable asset recovery base available.",
      source: "This comes from Recovery Summary and Assets.",
      calculation_title: "Asset Recovery calculation",
      actual_maths: [],
      formula: "Asset Recovery Cost = Total Cost Burden × Asset Share",
    },

    labour_share_without_productive_output: {
      title: "Labour recovery has no labour base",
      meaning:
        "The recovery split assigns burden to labour, but there is no usable recovery-hour base available.",
      source: "This comes from Recovery Summary and Labour / Cost Summary.",
      calculation_title: "Labour Recovery calculation",
      actual_maths: [],
      formula: "Labour Recovery Rate = Labour Recovery Cost ÷ Recovery Hours",
    },
  };

  return (
    detail_map[warning_key] || {
      title: "Recovery note",
      meaning:
        "This note is attached to the current recovery model and should be reviewed.",
      source: "Source not specified.",
      calculation_title: "Recovery note",
      actual_maths: [],
      formula: "No formula available.",
    }
  );
}

export default function RecoverySummaryNoteDrilldown({
  warning_count,
  warning_items = [],
  values = {},
}) {
  const [active_warning_key, set_active_warning_key] = useState(
    warning_items[0]?.warning_key ?? null
  );

  const selected_warning =
    warning_items.find((warning) => warning.warning_key === active_warning_key) ||
    warning_items[0];

  const selected_detail = selected_warning
    ? get_warning_detail(selected_warning.warning_key, values)
    : null;

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-label">Model notes</p>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {warning_count} active note{warning_count === 1 ? "" : "s"}
          </h3>
          <p className="ui-help">
            Click a note to see what it means, where it came from, and the
            actual values behind it.
          </p>
        </div>

        {warning_items.length > 0 ? (
          <div className="ui-split-2">
            <div className="ui-stack-sm">
              {warning_items.map((warning) => (
                <button
                  key={warning.warning_key}
                  type="button"
                  onClick={() => set_active_warning_key(warning.warning_key)}
                  className={`ui-readonly text-left transition ${
                    active_warning_key === warning.warning_key
                      ? "border-[var(--accent)] shadow-[0_0_0_3px_var(--accent-soft)]"
                      : ""
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {warning.label}
                  </p>
                </button>
              ))}
            </div>

            {selected_detail ? (
              <div className="ui-panel">
                <div className="ui-stack-sm">
                  <div>
                    <p className="ui-label">Selected note</p>
                    <h4 className="text-base font-semibold text-[var(--text-primary)]">
                      {selected_detail.title}
                    </h4>
                  </div>

                  <div className="ui-readonly">
                    <p className="ui-label">What it means</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {selected_detail.meaning}
                    </p>
                  </div>

                  <div className="ui-readonly">
                    <p className="ui-label">Where it came from</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {selected_detail.source}
                    </p>
                  </div>

                  {selected_detail.actual_maths.length > 0 ? (
                    <CalculationTable
                      title={selected_detail.calculation_title}
                      rows={selected_detail.actual_maths}
                      formula={selected_detail.formula}
                      values={values}
                    />
                  ) : (
                    <div className="ui-readonly">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        No value breakdown is available for this note yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              No active recovery notes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}