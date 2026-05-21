"use client";

import {
  formatCurrency,
  formatNumber,
} from "@/components/business-summary/BusinessSummaryCardUtils";

function TableRow({ label, value, total = false }) {
  return (
    <div className={`labour-summary-table-row${total ? " total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

export default function BusinessSummaryModePanel({
  activity_driver_display_label = "Productive hours",
  activity_driver_suffix = "hrs",
  activity_driver_type = "hours",
  activity_driver_value = 0,
  business_type_label = "Service / Labour-based business",
  current_margin_label = "Current margin per hour",
  current_margin_per_driver = 0,
  recovery_gap_label = "Hourly gap",
  recovery_gap_per_driver = 0,
  required_recovery_label = "Required recovery per hour",
  required_recovery_per_driver = 0,
  required_recovery_unit_label = "$/hour",
  total_productive_output = 0,
  total_recovery_hours = 0,
  units_sold_annual = 0,
}) {
  return (
    <>
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business mode</div>
        <div className="ui-card-title-sm">{business_type_label}</div>
        <p className="ui-help">
          {activity_driver_type === "units"
            ? "Business Summary is calculating recovery through units sold."
            : "Business Summary is calculating recovery through operating recovery hours."}
        </p>
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">
          {activity_driver_type === "units"
            ? "Per-Unit Reality"
            : "Productive Hour Reality"}
        </div>

        <p className="ui-help">
          {activity_driver_type === "units"
            ? "This shows the business result spread across annual units sold."
            : "This shows the business result spread across operating recovery hours."}
        </p>

        <div className="labour-summary-table">
          <TableRow
            label={
              activity_driver_type === "hours"
                ? "Required recovery per recovery hour"
                : required_recovery_label
            }
            value={`${formatCurrency(
              required_recovery_per_driver
            )} ${required_recovery_unit_label}`}
          />
          <TableRow
            label={
              activity_driver_type === "hours"
                ? "Current margin per recovery hour"
                : current_margin_label
            }
            value={`${formatCurrency(
              current_margin_per_driver
            )} ${required_recovery_unit_label}`}
          />
          <TableRow
            label={
              activity_driver_type === "hours"
                ? "Recovery hourly gap"
                : recovery_gap_label
            }
            value={`${formatCurrency(
              recovery_gap_per_driver
            )} ${required_recovery_unit_label}`}
            total
          />
          <TableRow
            label={activity_driver_display_label}
            value={`${formatNumber(activity_driver_value)} ${activity_driver_suffix}`}
          />
          {activity_driver_type === "hours" ? (
            <TableRow
              label="Operating Recovery Hours"
              value={`${formatNumber(total_recovery_hours)} hrs`}
            />
          ) : null}
        </div>
      </div>

      {activity_driver_type === "units" ? (
        <div className="ui-panel ui-stack-sm">
          <div className="ui-kicker">Product driver source</div>
          <div className="labour-summary-table">
            <TableRow
              label="Units sold per year"
              value={`${formatNumber(units_sold_annual)} units`}
            />
            <TableRow
              label="Productive hours still available"
              value={`${formatNumber(total_productive_output)} hrs`}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
