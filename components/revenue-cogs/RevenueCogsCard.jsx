"use client";

import { useState } from "react";

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(number);
}

function formatCurrencyPrecise(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercent(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("en-NZ", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(number);
}

function formatNumber(value) {
  const number = toNumber(value);

  return new Intl.NumberFormat("en-NZ", {
    maximumFractionDigits: 0,
  }).format(number);
}

function formatNumberPrecise(value) {
  const number = toNumber(value);

  return new Intl.NumberFormat("en-NZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(number);
}

function TableRow({ label, value, total = false, help }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">
        <div>{label}</div>
        {help ? <div className="ui-help">{help}</div> : null}
      </div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

function DetailList({ title, empty_message, items = [] }) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-card-title-sm">{title}</div>
      {items.length > 0 ? (
        <div className="labour-summary-table">
          {items.map((item) => (
            <TableRow
              key={item.line_id || item.category_id}
              label={item.label}
              value={formatCurrency(item.amount)}
            />
          ))}
        </div>
      ) : (
        <p className="ui-help">{empty_message}</p>
      )}
    </div>
  );
}

function TextInput({ label, value, onChange, inputMode = "decimal", help }) {
  return (
    <label className="form-field ui-stack-sm">
      <span>{label}</span>
      <input
        className="ui-input"
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {help ? <span className="ui-help">{help}</span> : null}
    </label>
  );
}

function SelectInput({ label, value, onChange, children, help }) {
  return (
    <label className="form-field ui-stack-sm">
      <span>{label}</span>
      <select
        className="ui-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      {help ? <span className="ui-help">{help}</span> : null}
    </label>
  );
}

function DriverModeButton({ title, body, active, onClick }) {
  return (
    <button
      type="button"
      className={`ui-readonly text-left transition ${active ? "border border-[var(--accent)]" : ""
        }`}
      onClick={onClick}
    >
      <div className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </div>
      <p className="mt-1 ui-help">{body}</p>
    </button>
  );
}

function UnitDriverRow({
  row,
  is_mixed_unit_based,
  updateUnitDriverRow,
  removeUnitDriverRow,
  can_remove,
}) {
  return (
    <div className="ui-panel ui-stack">
      <div className="ui-split">
        <div>
          <div className="ui-kicker">Unit driver</div>
          <div className="ui-card-title-sm">
            {row.unit_label || "Unit driver"}
          </div>
          <p className="ui-help">
            Define one commercial unit, such as m², m³, tonne, each, lineal
            metre, or another output unit.
          </p>
        </div>

        {can_remove ? (
          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={() => removeUnitDriverRow(row.id)}
            >
              Remove
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <TextInput
          label="Unit label"
          value={row.unit_label || ""}
          onChange={(value) => updateUnitDriverRow(row.id, "unit_label", value)}
          inputMode="text"
          help="Example: Slab m², pumped concrete m³, coffees, shirts."
        />

        <SelectInput
          label="Unit type"
          value={row.unit_type || "each"}
          onChange={(value) => updateUnitDriverRow(row.id, "unit_type", value)}
        >
          <option value="each">Each</option>
          <option value="m2">m²</option>
          <option value="m3">m³</option>
          <option value="lm">Lineal metre</option>
          <option value="tonne">Tonne</option>
          <option value="hour">Hour</option>
          <option value="custom">Custom</option>
        </SelectInput>

        <TextInput
          label="Revenue split %"
          value={String(row.revenue_share_percent ?? "")}
          onChange={(value) =>
            updateUnitDriverRow(
              row.id,
              "revenue_share_percent",
              value.replace(/,/g, "")
            )
          }
          help={
            is_mixed_unit_based
              ? "Estimated share of total revenue for this unit."
              : "Single unit mode uses 100%."
          }
        />

        <TextInput
          label="Average sale rate"
          value={String(row.average_sale_rate_per_unit ?? "")}
          onChange={(value) =>
            updateUnitDriverRow(
              row.id,
              "average_sale_rate_per_unit",
              value.replace(/,/g, "")
            )
          }
          help="Average charge per unit."
        />
      </div>

      <div className="labour-summary-table">
        <TableRow
          label="Derived annual revenue"
          value={formatCurrency(row.annual_revenue)}
        />
        <TableRow
          label="Derived annual units"
          value={`${formatNumber(row.derived_units_annual)} ${row.unit_type_label || "units"
            }`}
        />
        <TableRow
          label="Margin per unit"
          value={formatCurrencyPrecise(row.margin_per_unit)}
          help="Derived from the P&L margin pool, not from a user-entered direct cost."
        />
        <TableRow
          label="Annual margin pool"
          value={formatCurrency(row.annual_margin_pool)}
          total
        />
      </div>
    </div>
  );
}

export default function RevenueCogsCard({
  total_revenue = 0,
  total_direct_costs = 0,
  margin_pool = 0,
  gross_margin_percent = 0,
  revenue_line_items = [],
  direct_cost_categories = [],

  business_type = "labour_based",
  is_product_based = false,

  commercial_driver_mode = "hours_based",
  commercial_driver_label = "Hours-based trading model",
  is_unit_based = false,
  is_mixed_unit_based = false,

  unit_driver_rows = [],
  total_unit_margin_pool = 0,
  total_derived_units_annual = 0,
  weighted_average_margin_per_unit = 0,
  unit_recovery_warnings = [],

  updateRevenueCogsField,
  updateUnitDriverRow,
  addUnitDriverRow,
  removeUnitDriverRow,
}) {
  const [detailsOpen, setDetailsOpen] = useState(true);

  const revenue_split_total = unit_driver_rows.reduce(
    (sum, row) => sum + toNumber(row.revenue_share_percent),
    0
  );

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Revenue / COGS</div>
          <div className="ui-card-title">Commercial driver layer</div>
          <p className="ui-help">
            Revenue / COGS defines how the business sells work. This does not
            change Cost Summary or Business Summary cost calculations.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Commercial driver mode</div>
          <div className="ui-card-title-sm">{commercial_driver_label}</div>

          {is_product_based ? (
            <>
              <p className="ui-help">
                Business Setup is set to product / unit-based. Revenue / COGS
                defines whether this is a single-unit or mixed-unit trading
                model.
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <DriverModeButton
                  title="Single unit-based"
                  body="One output unit drives trading recovery, such as coffees, m², m³, or each."
                  active={commercial_driver_mode === "unit_based"}
                  onClick={() =>
                    updateRevenueCogsField(
                      "commercial_driver_mode",
                      "unit_based"
                    )
                  }
                />

                <DriverModeButton
                  title="Mixed unit-based"
                  body="Multiple output units share revenue, such as m² work and m³ pumping."
                  active={commercial_driver_mode === "mixed_unit_based"}
                  onClick={() =>
                    updateRevenueCogsField(
                      "commercial_driver_mode",
                      "mixed_unit_based"
                    )
                  }
                />
              </div>
            </>
          ) : (
            <>
              <p className="ui-help">
                Business Setup is set to hours-based. Revenue / COGS stays in
                hours-based mode.
              </p>

              <div className="ui-readonly">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  Hours-based
                </div>
                <p className="mt-1 ui-help">
                  Labour / asset time is the recovery engine. Materials and
                  COGS remain a margin layer and do not reduce the hourly
                  recovery requirement.
                </p>
              </div>
            </>
          )}

          <p className="ui-help">Current stored business type: {business_type}</p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Macro Result</div>
          <div className="labour-summary-table">
            <TableRow label="Revenue" value={formatCurrency(total_revenue)} />
            <TableRow
              label="Direct Costs"
              value={formatCurrency(total_direct_costs)}
            />
            <TableRow
              label={is_unit_based ? "Trading Margin Pool" : "Margin Pool"}
              value={formatCurrency(margin_pool)}
              total
            />
            <TableRow
              label={is_unit_based ? "Trading Margin %" : "Gross Margin %"}
              value={formatPercent(gross_margin_percent)}
            />
          </div>
        </div>

        {is_product_based && is_unit_based ? (
          <div className="ui-panel ui-stack">
            <div className="ui-split">
              <div>
                <div className="ui-kicker">Unit-based trading model</div>
                <div className="ui-card-title-sm">
                  Define the commercial units being sold
                </div>
                <p className="ui-help">
                  This is a commercial estimate. It helps Recovery Summary test
                  whether unit-based revenue can recover the business cost
                  burden. It does not change Cost Summary.
                </p>

                {is_mixed_unit_based ? (
                  <p className="ui-help">
                    Add another unit when your revenue is split across more
                    than one output, such as m² work and m³ pumping.
                  </p>
                ) : null}
              </div>

              {is_mixed_unit_based ? (
                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-primary"
                    onClick={addUnitDriverRow}
                  >
                    + Add another unit
                  </button>
                </div>
              ) : null}
            </div>

            <div className="labour-summary-table">
              <TableRow
                label="Revenue split total"
                value={`${formatNumberPrecise(revenue_split_total)}%`}
                help="For unit-based recovery testing, the unit split should total 100%."
              />
              <TableRow
                label="Derived annual units"
                value={formatNumber(total_derived_units_annual)}
              />
              <TableRow
                label="Weighted average margin per unit"
                value={formatCurrencyPrecise(weighted_average_margin_per_unit)}
              />
              <TableRow
                label="Derived annual margin pool"
                value={formatCurrency(total_unit_margin_pool)}
                total
              />
            </div>

            <div className="ui-stack">
              {unit_driver_rows.map((row) => (
                <UnitDriverRow
                  key={row.id}
                  row={row}
                  is_mixed_unit_based={is_mixed_unit_based}
                  updateUnitDriverRow={updateUnitDriverRow}
                  removeUnitDriverRow={removeUnitDriverRow}
                  can_remove={
                    is_mixed_unit_based && unit_driver_rows.length > 2
                  }
                />
              ))}
            </div>

            {is_mixed_unit_based ? (
              <div className="ui-actions">
                <button
                  type="button"
                  className="ui-button-primary"
                  onClick={addUnitDriverRow}
                >
                  + Add another unit
                </button>
              </div>
            ) : null}

            {unit_recovery_warnings.length > 0 ? (
              <div className="ui-readonly">
                <div className="ui-card-title-sm">Unit driver warnings</div>
                <div className="ui-stack-sm">
                  {unit_recovery_warnings.map((warning) => (
                    <p
                      className="ui-help"
                      key={`${warning.warning_id}-${warning.unit_driver_id || "all"}`}
                    >
                      {warning.message}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {!is_product_based ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Hours-based trading model</div>
            <div className="ui-card-title-sm">Materials remain margin layer</div>
            <p className="ui-help">
              In hours-based mode, Revenue / COGS remains a margin-pool view.
              Labour and assets recover the business cost through operating
              hours. Materials do not reduce the hourly recovery requirement.
            </p>
          </div>
        ) : null}

        <div className="ui-panel ui-stack-sm">
          <div className="ui-split">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Supporting Detail</div>
              <div className="ui-card-title-sm">P&amp;L classification view</div>
              <p className="ui-help">
                Display-only detail from P&amp;L revenue lines and direct cost
                category totals.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setDetailsOpen((prev) => !prev)}
                className="ui-button-secondary"
              >
                {detailsOpen ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {detailsOpen ? (
            <div className="ui-stack">
              <DetailList
                title="Revenue Lines"
                items={revenue_line_items}
                empty_message="No revenue lines are available from P&L."
              />
              <DetailList
                title="Direct Cost Categories"
                items={direct_cost_categories}
                empty_message="No direct cost category totals are available from P&L."
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}