import RecoverySummaryHandoffBlock from "@/components/recovery-summary/RecoverySummaryHandoffBlock";
import {
  format_currency,
  format_number,
} from "@/components/recovery-summary/recoverySummaryFormatters";

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
    not_selected: "Not selected",
  };

  return <span className="ui-pill">{label_map[status] || status}</span>;
}

function RecoveryEvidencePanel({ title, question, status, rows = [], note }) {
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

function ProductRecoveryEvidence({
  total_cost_burden = 0,
  total_units = 0,
  margin_per_unit = 0,
  required_cost_per_unit = 0,
  unit_surplus_or_gap = 0,
  total_annual_surplus_or_gap = 0,
  required_units_if_margin_fixed = 0,
  required_margin_if_units_fixed = 0,
  product_unit_recovery_status = "not_recoverable",
  product_unit_margin_label = "Margin per unit",
  product_required_cost_label = "Required cost per unit",
  product_surplus_gap_label = "Surplus / gap per unit",
  product_total_units_label = "Total units",
  product_unit_suffix = "units",
  product_rate_suffix = "/unit",
}) {
  const status_message =
    product_unit_recovery_status === "not_recoverable"
      ? "The current unit margin is not enough to recover the business cost burden."
      : product_unit_recovery_status === "shortfall"
        ? `Unit margin is below the required business cost per ${product_unit_suffix}.`
        : `Unit margin currently covers the business cost per ${product_unit_suffix}.`;

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <p className="ui-label">Supporting evidence</p>

        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Product / unit recovery test
        </h3>

        <p className="ui-help">
          Product mode tests whether trading margin after COGS can carry the
          full business burden. Revenue alone is not treated as the recovery
          answer.
        </p>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Total cost burden</div>
            <div className="labour-summary-table-value">
              {format_currency(total_cost_burden)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              {product_unit_margin_label}
            </div>
            <div className="labour-summary-table-value">
              {format_currency(margin_per_unit)} {product_rate_suffix}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              {product_required_cost_label}
            </div>
            <div className="labour-summary-table-value">
              {format_currency(required_cost_per_unit)} {product_rate_suffix}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              {product_total_units_label}
            </div>
            <div className="labour-summary-table-value">
              {format_number(total_units, ` ${product_unit_suffix}`)}
            </div>
          </div>

          <div className="labour-summary-table-row total">
            <div className="labour-summary-table-label">
              {product_surplus_gap_label}
            </div>
            <div className="labour-summary-table-value">
              {format_currency(unit_surplus_or_gap)} {product_rate_suffix}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Annual surplus / gap
            </div>
            <div className="labour-summary-table-value">
              {format_currency(total_annual_surplus_or_gap)}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Required units if margin fixed
            </div>
            <div className="labour-summary-table-value">
              {format_number(
                required_units_if_margin_fixed,
                ` ${product_unit_suffix}`
              )}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">
              Required margin if units fixed
            </div>
            <div className="labour-summary-table-value">
              {format_currency(required_margin_if_units_fixed)}{" "}
              {product_rate_suffix}
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

function HoursBasedRecoveryEvidence({
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
      <RecoveryEvidencePanel
        title="Labour recovery"
        question="Can labour recover the labour cost it creates?"
        status={labour_recovery_status}
        rows={[
          {
            label: "Annual labour cost",
            value: format_currency(labour_recovery_cost),
          },
          {
            label: "Recovery hours",
            value: format_number(labour_recovery_hours, " hrs"),
          },
          {
            label: "Required labour recovery rate",
            value: `${format_currency(required_labour_recovery_rate)} /hr`,
            total: true,
          },
        ]}
        note="Labour must stand on its own. Material margin is not used to hide labour under-recovery."
      />

      <RecoveryEvidencePanel
        title="Asset recovery"
        question="Can productive assets recover their own cost?"
        status={asset_recovery_status}
        rows={[
          {
            label: "Productive asset cost",
            value: format_currency(asset_recovery_cost),
          },
          {
            label: "Annual asset utilisation",
            value: format_number(asset_utilisation_hours_annual, " hrs"),
          },
          {
            label: "Required asset recovery rate",
            value: `${format_currency(required_asset_recovery_rate)} /hr`,
            total: true,
          },
        ]}
        note="Productive assets are tested separately. Labour recovery must not hide asset under-recovery."
      />

      <RecoveryEvidencePanel
        title="Material margin"
        question="Are materials covering their own cost and creating margin?"
        status={material_margin_status}
        rows={[
          {
            label: "Material / trading margin pool",
            value: format_currency(material_margin_pool),
          },
          {
            label: "Material / trading margin %",
            value: `${Number(material_margin_percent || 0).toFixed(1)}%`,
            total: true,
          },
        ]}
        note="Materials cover themselves and create margin. In hours-based mode, material margin is not used to recover labour or productive assets."
      />
    </div>
  );
}

export default function RecoverySupportingEvidenceDetail({
  product_mode_active,
  material_recovery_included,
  asset_recovery_included,

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

  total_cost_burden,
  total_units,
  margin_per_unit,
  required_cost_per_unit,
  unit_surplus_or_gap,
  total_annual_surplus_or_gap,
  required_units_if_margin_fixed,
  required_margin_if_units_fixed,
  product_unit_recovery_status,
  product_unit_margin_label,
  product_required_cost_label,
  product_surplus_gap_label,
  product_total_units_label,
  product_unit_suffix,
  product_rate_suffix,
}) {
  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-label">Supporting recovery evidence</p>

          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Recovery streams tested
          </h3>

          <p className="ui-help">
            These checks explain the recovery outcome. They show where labour,
            assets, and material margin are expected to stand on their own
            instead of hiding pressure in another stream.
          </p>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {product_mode_active
              ? "Product / unit mode: unit margin carries the business after COGS."
              : "Hours-based mode: labour, productive assets, and material margin are tested separately."}
          </p>
        </div>

        {product_mode_active ? (
          <ProductRecoveryEvidence
            total_cost_burden={total_cost_burden}
            total_units={total_units}
            margin_per_unit={margin_per_unit}
            required_cost_per_unit={required_cost_per_unit}
            unit_surplus_or_gap={unit_surplus_or_gap}
            total_annual_surplus_or_gap={total_annual_surplus_or_gap}
            required_units_if_margin_fixed={required_units_if_margin_fixed}
            required_margin_if_units_fixed={required_margin_if_units_fixed}
            product_unit_recovery_status={product_unit_recovery_status}
            product_unit_margin_label={product_unit_margin_label}
            product_required_cost_label={product_required_cost_label}
            product_surplus_gap_label={product_surplus_gap_label}
            product_total_units_label={product_total_units_label}
            product_unit_suffix={product_unit_suffix}
            product_rate_suffix={product_rate_suffix}
          />
        ) : (
          <HoursBasedRecoveryEvidence
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
  );
}