"use client";

import RecoverySummaryHandoffBlock from "@/components/recovery-summary/RecoverySummaryHandoffBlock";
import {
  format_currency,
  format_number,
} from "@/components/recovery-summary/recoverySummaryFormatters";

function ProductRecoveryRequirementBlock({
  total_cost_burden = 0,
  total_units = 0,
  margin_per_unit = 0,
  required_cost_per_unit = 0,
  unit_surplus_or_gap = 0,
  total_annual_surplus_or_gap = 0,
  required_units_if_margin_fixed = 0,
  required_margin_if_units_fixed = 0,
  product_unit_recovery_status = "not_recoverable",
}) {
  const status_message =
    product_unit_recovery_status === "not_recoverable"
      ? "Product margin is not positive, so unit volume cannot recover the business cost burden."
      : product_unit_recovery_status === "shortfall"
        ? "Unit margin is below the full business cost per unit."
        : "Unit margin is above the full business cost per unit.";

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Product Recovery Requirement
          </h2>
          <p className="ui-help">
            Product mode tests whether trading margin per unit and expected
            unit volume can recover the full business cost burden. COGS is
            consumed before recovery begins.
          </p>
        </div>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Total Cost Burden</div>
            <div className="labour-summary-table-value">
              {format_currency(total_cost_burden)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Unit Margin</div>
            <div className="labour-summary-table-value">
              {format_currency(margin_per_unit)} /unit
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Full Business Cost per Unit
            </div>
            <div className="labour-summary-table-value">
              {format_currency(required_cost_per_unit)} /unit
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Units per Year</div>
            <div className="labour-summary-table-value">
              {format_number(total_units, " units")}
            </div>
          </div>
          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              Surplus / Gap per Unit
            </div>
            <div className="labour-summary-table-value">
              {format_currency(unit_surplus_or_gap)} /unit
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Annual Surplus / Gap
            </div>
            <div className="labour-summary-table-value">
              {format_currency(total_annual_surplus_or_gap)}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Required Units if Margin Fixed
            </div>
            <div className="labour-summary-table-value">
              {format_number(required_units_if_margin_fixed, " units")}
            </div>
          </div>
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Required Margin if Units Fixed
            </div>
            <div className="labour-summary-table-value">
              {format_currency(required_margin_if_units_fixed)} /unit
            </div>
          </div>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {status_message}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const label_map = {
    ready: "Ready",
    margin_available: "Margin available",
    no_direct_costs: "No direct costs",
    not_recoverable: "Not recoverable",
    missing_labour_cost: "Missing labour cost",
    missing_recovery_hours: "Missing recovery hours",
    missing_utilisation: "Missing utilisation",
    no_productive_assets: "No productive assets",
  };

  return <span className="ui-pill">{label_map[status] || status}</span>;
}

function RecoveryTestPanel({ title, question, status, rows = [], note }) {
  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <div className="ui-row-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
            <p className="ui-help">{question}</p>
          </div>
          <StatusPill status={status} />
        </div>

        <div className="labour-summary-table">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`labour-summary-table-row ${
                row.total ? "total" : ""
              }`}
            >
              <div className="labour-summary-table-label">{row.label}</div>
              <div className="labour-summary-table-value">{row.value}</div>
            </div>
          ))}
        </div>

        {note ? (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {note}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HoursBasedRecoveryTests({
  labour_recovery_cost = 0,
  labour_recovery_hours = 0,
  required_labour_recovery_rate = 0,
  labour_recovery_status = "ready",
  asset_recovery_cost = 0,
  asset_utilisation_hours_annual = 0,
  required_asset_recovery_rate = 0,
  asset_recovery_status = "ready",
  material_margin_pool = 0,
  material_margin_percent = 0,
  material_margin_status = "margin_available",
}) {
  return (
    <div className="ui-stack">
      <RecoveryTestPanel
        title="Labour Recovery"
        question="Is labour recovering labour?"
        status={labour_recovery_status}
        rows={[
          {
            label: "Annual Labour Cost",
            value: format_currency(labour_recovery_cost),
          },
          {
            label: "Recovery Hours",
            value: format_number(labour_recovery_hours, " hrs"),
          },
          {
            label: "Required Labour Recovery Rate",
            value: `${format_currency(required_labour_recovery_rate)} /hr`,
            total: true,
          },
        ]}
        note="Labour must stand on its own. Material margin is not used to reduce this labour recovery requirement."
      />

      <RecoveryTestPanel
        title="Asset Recovery"
        question="Are productive assets recovering their own cost?"
        status={asset_recovery_status}
        rows={[
          {
            label: "Productive Asset Cost",
            value: format_currency(asset_recovery_cost),
          },
          {
            label: "Annual Asset Utilisation",
            value: format_number(asset_utilisation_hours_annual, " hrs"),
          },
          {
            label: "Required Asset Recovery Rate",
            value: `${format_currency(required_asset_recovery_rate)} /hr`,
            total: true,
          },
        ]}
        note="Asset recovery is tested separately. Labour recovery must not hide asset under-recovery."
      />

      <RecoveryTestPanel
        title="Material Margin"
        question="Are materials covering their own cost and generating margin?"
        status={material_margin_status}
        rows={[
          {
            label: "Material / Trading Margin Pool",
            value: format_currency(material_margin_pool),
          },
          {
            label: "Material / Trading Margin %",
            value: `${Number(material_margin_percent || 0).toFixed(1)}%`,
            total: true,
          },
        ]}
        note="Materials cover themselves and create margin. In hours-based mode, material margin is not used to recover labour or productive assets."
      />
    </div>
  );
}

export default function RecoverySummaryMainCard({
  business_type,
  is_product_based,
  recovery_mode,

  labour_recovery_cost,
  labour_recovery_hours,
  labour_recovery_status,
  required_labour_recovery_rate,
  asset_recovery_cost,
  asset_utilisation_hours_annual,
  required_asset_recovery_rate,
  asset_recovery_status,
  material_margin_pool,
  material_margin_percent,
  material_margin_status,

  material_recovery_included,
  asset_recovery_included,

  total_cost_burden,
  total_units,
  margin_per_unit,
  required_cost_per_unit,
  unit_surplus_or_gap,
  total_annual_surplus_or_gap,
  required_units_if_margin_fixed,
  required_margin_if_units_fixed,
  product_unit_recovery_status,
}) {
  const product_mode_active =
    is_product_based === true ||
    business_type === "product_based" ||
    recovery_mode === "product_unit";

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Active recovery mode</div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {product_mode_active
                  ? "Product / unit recovery"
                  : "Hours-based separate stream recovery"}
              </h2>
              <p className="ui-help">
                {product_mode_active
                  ? "The unit carries the whole business. Margin after COGS must recover labour, assets, overheads, and profit."
                  : "Each recovery stream stands on its own. Labour, productive assets, and material margin are tested separately."}
              </p>
            </div>
          </div>

          {product_mode_active ? (
            <ProductRecoveryRequirementBlock
              total_cost_burden={total_cost_burden}
              total_units={total_units}
              margin_per_unit={margin_per_unit}
              required_cost_per_unit={required_cost_per_unit}
              unit_surplus_or_gap={unit_surplus_or_gap}
              total_annual_surplus_or_gap={total_annual_surplus_or_gap}
              required_units_if_margin_fixed={required_units_if_margin_fixed}
              required_margin_if_units_fixed={required_margin_if_units_fixed}
              product_unit_recovery_status={product_unit_recovery_status}
            />
          ) : (
            <HoursBasedRecoveryTests
              labour_recovery_cost={labour_recovery_cost}
              labour_recovery_hours={labour_recovery_hours}
              required_labour_recovery_rate={required_labour_recovery_rate}
              labour_recovery_status={labour_recovery_status}
              asset_recovery_cost={asset_recovery_cost}
              asset_utilisation_hours_annual={asset_utilisation_hours_annual}
              required_asset_recovery_rate={required_asset_recovery_rate}
              asset_recovery_status={asset_recovery_status}
              material_margin_pool={material_margin_pool}
              material_margin_percent={material_margin_percent}
              material_margin_status={material_margin_status}
            />
          )}

          <RecoverySummaryHandoffBlock
            material_recovery_included={material_recovery_included}
            asset_recovery_included={asset_recovery_included}
          />
        </div>
      </div>
    </section>
  );
}
