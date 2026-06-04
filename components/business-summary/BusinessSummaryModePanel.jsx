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
  activity_driver_display_label = "Net annual business open hours",
  activity_driver_suffix = "hrs",
  activity_driver_type = "hours",
  activity_driver_value = 0,
  business_type_label = "Service / Labour-based business",
  current_margin_label = "Actual margin per open hour",
  current_margin_per_driver = 0,
  recovery_gap_label = "Open-hour gap",
  recovery_gap_per_driver = 0,
  required_recovery_label = "Required operating cost per open hour",
  required_recovery_per_driver = 0,
  required_recovery_unit_label = "$/open hr",
  total_productive_output = 0,
  total_recovery_hours = 0,
  units_sold_annual = 0,
}) {
  const hours_mode = activity_driver_type === "hours";

  return (
    <>
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Business mode</div>
        <div className="ui-card-title-sm">{business_type_label}</div>
        <p className="ui-help">
          {activity_driver_type === "units"
            ? "Business Summary is calculating the result through units sold."
            : "Business Summary is comparing trading margin against net annual business open hours."}
        </p>
      </div>

      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">
          {activity_driver_type === "units"
            ? "Per-Unit Reality"
            : "Open-Hour Reality"}
        </div>

        <p className="ui-help">
          {activity_driver_type === "units"
            ? "This shows the business result spread across annual units sold."
            : "This shows the business result spread across net annual business open hours."}
        </p>

        <div className="labour-summary-table">
          <TableRow
            label={
              hours_mode
                ? "Required operating cost per open hour"
                : required_recovery_label
            }
            value={`${formatCurrency(
              required_recovery_per_driver
            )} ${required_recovery_unit_label}`}
          />

          <TableRow
            label={hours_mode ? "Actual margin per open hour" : current_margin_label}
            value={`${formatCurrency(
              current_margin_per_driver
            )} ${required_recovery_unit_label}`}
          />

          <TableRow
            label={hours_mode ? "Open-hour gap" : recovery_gap_label}
            value={`${formatCurrency(
              recovery_gap_per_driver
            )} ${required_recovery_unit_label}`}
            total
          />

          <TableRow
            label={
              hours_mode
                ? "Net annual business open hours"
                : activity_driver_display_label
            }
            value={`${formatNumber(activity_driver_value)} ${activity_driver_suffix}`}
          />

          {hours_mode ? null : (
            <TableRow
              label="Selected recovery hours"
              value={`${formatNumber(total_recovery_hours)} hrs`}
            />
          )}
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