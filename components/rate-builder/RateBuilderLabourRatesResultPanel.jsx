import RateBuilderMinimumRecoveryCard from "@/components/rate-builder/RateBuilderMinimumRecoveryCard";
import RateBuilderLabourWeightedSummaryCard from "@/components/rate-builder/RateBuilderLabourWeightedSummaryCard";

import {
  format_currency,
  format_percent,
  format_rate,
} from "@/lib/calculations/rateBuilderLabourRateCalculations";

export default function RateBuilderLabourRatesResultPanel({ model }) {
  const {
    active_model,
    selected_labour_source,
    weighted_summary,
    current_charge_out_rate,
    effective_labour_cost_rate,
    current_rate_gap_to_minimum,
    current_rate_above_minimum,
    current_margin_after_recovery_percent,
    is_all_productive_summary,
    labour_unit_label,
  } = model;

  return (
    <aside className="rate-builder-labour__right">
      <div className="rate-builder-result-card">
        <p className="rate-builder-result-label">
          {is_all_productive_summary
            ? "Overall productive labour summary"
            : "Labour source"}
        </p>
        <p className="rate-builder-result-value">
          {selected_labour_source?.labour_source_type_name ||
            active_model.labour_source_type_name ||
            "Labour source"}
        </p>
        <p className="ui-help">
          Status:{" "}
          {selected_labour_source?.rate_status ||
            active_model.rate_status ||
            "ready"}
        </p>
      </div>

      <div className="rate-builder-result-card">
        <p className="rate-builder-result-label">
          {is_all_productive_summary
            ? "Weighted current charge-out rate"
            : "Current charge-out rate"}
        </p>
        <p className="rate-builder-result-value">
          {format_rate(current_charge_out_rate, labour_unit_label)}
        </p>
        {is_all_productive_summary ? (
          <p className="ui-help">
            Derived from saved staff-type charge-out rates.{" "}
            {weighted_summary.missing_rate_count > 0
              ? `${weighted_summary.missing_rate_count} staff type rate(s) are missing.`
              : "All productive staff-type rates are included."}
          </p>
        ) : null}
      </div>

      <RateBuilderMinimumRecoveryCard
        selected_labour_source={selected_labour_source}
        labour_unit_label={labour_unit_label}
      />

      <div
        className={
          current_rate_above_minimum
            ? "rate-builder-status-card rate-builder-status-card--good"
            : "rate-builder-status-card rate-builder-status-card--bad"
        }
      >
        <p className="rate-builder-result-label">
          {is_all_productive_summary
            ? "Weighted rate vs minimum recoverable rate"
            : "Current rate vs minimum recoverable rate"}
        </p>

        <p className="rate-builder-result-value">
          {current_rate_above_minimum ? "Above minimum" : "Below minimum"}
        </p>

        <p className="ui-help">
          {current_rate_above_minimum
            ? `Surplus: ${format_currency(
                current_rate_gap_to_minimum
              )} / ${labour_unit_label}`
            : `Leak: ${format_currency(
                Math.abs(current_rate_gap_to_minimum)
              )} / ${labour_unit_label}`}
        </p>

        <div className="rate-builder-labour-breakdown">
          <div className="rate-builder-labour-breakdown__row">
            <span>Labour-only cost</span>
            <strong>
              {format_rate(effective_labour_cost_rate, labour_unit_label)}
            </strong>
          </div>

          <div className="rate-builder-labour-breakdown__row">
            <span>Margin after full recovery</span>
            <strong>
              {format_percent(current_margin_after_recovery_percent)}
            </strong>
          </div>
        </div>
      </div>

      {is_all_productive_summary ? (
        <RateBuilderLabourWeightedSummaryCard model={model} />
      ) : null}
    </aside>
  );
}