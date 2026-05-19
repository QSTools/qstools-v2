"use client";

import {
  TIME_SCALES,
  formatCurrency,
  formatNumber,
} from "@/components/business-summary/BusinessSummaryCardUtils";
import { PRODUCT_TIME_SCALES } from "@/components/business-summary/BusinessSummaryHierarchyBuilder";

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

export default function BusinessSummaryResultHero({
  active_time_scale = "hour",
  hero,
  onTimeScaleChange,
  product_mode_active = false,
  result_table,
  timeScale = "hour",
}) {
  const scaleOptions = product_mode_active ? PRODUCT_TIME_SCALES : TIME_SCALES;

  return (
    <>
      <div className="ui-kicker">Business Result</div>
      <div className="ui-card-title-sm">
        {product_mode_active
          ? hero.product_position_title
          : hero.recovery_result_label}
      </div>
      <div className="ui-display">
        {product_mode_active
          ? hero.product_hero_value
          : formatCurrency(hero.recovery_result_abs)}
        <span className="ui-help">
          {product_mode_active
            ? hero.product_hero_suffix
            : ` ${result_table.scale_suffix}`}
        </span>
      </div>
      <p className="ui-help">
        {product_mode_active
          ? hero.product_helper_text
          : hero.recovery_headline}
      </p>
      {product_mode_active ? (
        <p className="ui-help">{hero.product_secondary_result}</p>
      ) : (
        <>
          <p className="ui-help">
            Owner wages are already included in costs, so this result is after
            paying the owner properly.
          </p>
          <p className="ui-help">
            This compares your actual Gross Profit / Margin Pool against the
            Cost Summary recovery baseline.
          </p>
        </>
      )}

      <div className="cost-summary-toggle" aria-label="Time scale">
        {scaleOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            className={
              option.key === active_time_scale
                ? "cost-summary-toggle-button active"
                : "cost-summary-toggle-button"
            }
            onClick={() => onTimeScaleChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {product_mode_active ? (
        <div className="labour-summary-table">
          <TableRow
            label="Margin per Unit"
            value={`${formatCurrency(result_table.margin_per_unit)} /unit`}
          />
          <TableRow
            label="Current Units Sold"
            value={`${formatNumber(
              result_table.scaled_units_sold
            )} ${result_table.product_unit_suffix}`}
          />
          <TableRow
            label="Required Units to Break Even"
            value={`${formatNumber(
              result_table.scaled_required_units_to_break_even
            )} ${result_table.product_unit_suffix}`}
          />
          <TableRow
            label="Unit Surplus / Shortfall"
            value={`${formatNumber(
              result_table.scaled_unit_surplus_or_shortfall
            )} ${result_table.product_unit_suffix}`}
          />
          <TableRow
            label="Final Surplus / Deficit"
            value={`${formatCurrency(
              result_table.scaled_net_position
            )} ${result_table.scale_suffix}`}
            total
          />
        </div>
      ) : (
        <div className="labour-summary-table">
          <TableRow
            label={
              timeScale === "hour"
                ? "Required Recovery Rate"
                : `Required Recovery per ${result_table.scale_label}`
            }
            value={`${formatCurrency(
              result_table.scaled_required_recovery
            )} ${result_table.scale_suffix}`}
          />
          <TableRow
            label={
              timeScale === "hour"
                ? "Actual Recovery Rate"
                : `Actual Recovery per ${result_table.scale_label}`
            }
            value={`${formatCurrency(
              result_table.scaled_actual_recovery
            )} ${result_table.scale_suffix}`}
          />
          <TableRow
            label={hero.recovery_result_label}
            value={`${formatCurrency(
              result_table.scaled_recovery_result
            )} ${result_table.scale_suffix}`}
            total
          />
          <TableRow
            label="Recovery Hours Used"
            value={`${formatNumber(result_table.recovery_hours_used)} hrs`}
          />
        </div>
      )}
    </>
  );
}
