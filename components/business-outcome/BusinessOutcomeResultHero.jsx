"use client";

import {
  TIME_SCALES,
  formatCurrency,
  scalePeriodValue,
  getTimeScaleSuffix,
  getTimeScaleName,
} from "@/components/business-summary/BusinessSummaryCardUtils";

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

export default function BusinessOutcomeResultHero({
  required_recovery = 0,
  achieved_recovery = 0,
  recovery_surplus_or_gap = 0,
  net_annual_business_open_hours = 0,
  timeScale = "hour",
  onTimeScaleChange,
}) {
  const scale_suffix = getTimeScaleSuffix(timeScale);
  const scale_label = getTimeScaleName(timeScale).toLowerCase();

  const scaled_required = scalePeriodValue(
    required_recovery,
    timeScale,
    net_annual_business_open_hours
  );
  const scaled_achieved = scalePeriodValue(
    achieved_recovery,
    timeScale,
    net_annual_business_open_hours
  );
  const scaled_result = scalePeriodValue(
    recovery_surplus_or_gap,
    timeScale,
    net_annual_business_open_hours
  );

  const is_surplus = recovery_surplus_or_gap >= 0;
  const result_label =
    timeScale === "hour"
      ? is_surplus
        ? "Surplus per open hour"
        : "Deficit per open hour"
      : is_surplus
        ? `Surplus per ${scale_label}`
        : `Deficit per ${scale_label}`;

  return (
    <>
      <div className="ui-kicker">Business Outcome</div>
      <div className="ui-card-title-sm">
        {is_surplus ? "You are earning a surplus" : "You are running a deficit"}
      </div>

      <div className="ui-display">
        {formatCurrency(Math.abs(scaled_result))}
        <span className="ui-help"> {scale_suffix}</span>
      </div>

      <p className="ui-help">
        This compares your Business Summary trading margin against the
        required recovery from your cost burden.
      </p>

      <div className="cost-summary-toggle" aria-label="Time scale">
        {TIME_SCALES.map((option) => (
          <button
            key={option.key}
            type="button"
            className={
              option.key === timeScale
                ? "cost-summary-toggle-button active"
                : "cost-summary-toggle-button"
            }
            onClick={() => onTimeScaleChange?.(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="labour-summary-table">
        <TableRow
          label={
            timeScale === "hour"
              ? "Required operating cost per open hour"
              : `Required operating cost per ${scale_label}`
          }
          value={`${formatCurrency(scaled_required)} ${scale_suffix}`}
        />
        <TableRow
          label={
            timeScale === "hour"
              ? "Actual margin per open hour"
              : `Actual margin per ${scale_label}`
          }
          value={`${formatCurrency(scaled_achieved)} ${scale_suffix}`}
        />
        <TableRow
          label={result_label}
          value={`${formatCurrency(scaled_result)} ${scale_suffix}`}
          total
        />
      </div>
    </>
  );
}
