import {
  format_currency,
  format_number,
  format_rate,
} from "@/components/recovery-summary/recoverySummaryFormatters";

export default function RecoverySummaryRequirementBlock({
  total_cost_burden,
  required_recovery_rate,
  recovery_hours_used,

  business_type,
  activity_driver_type,
  units_sold_annual,

  actual_recovery_rate,
  profit_or_deficit_per_recovery_hour,
}) {
  const is_product_based =
    business_type === "product_based" || activity_driver_type === "units";

  const recovery_driver_label = is_product_based
    ? "Units used"
    : "Selected recovery hours";

  const recovery_driver_quantity = is_product_based
    ? units_sold_annual
    : recovery_hours_used;

  const required_recovery_label = is_product_based
    ? "Required recovery per unit"
    : "Required recovery per recovery hour";

  const actual_recovery_label = is_product_based
    ? "Actual recovery per unit"
    : "Actual recovery per recovery hour";

  const variance_label = is_product_based
    ? "Recovery variance per unit"
    : "Recovery variance per recovery hour";

  const rate_suffix = is_product_based ? "/unit" : "/hr";

  const required_recovery_rate_display = format_rate(
    required_recovery_rate,
    rate_suffix
  );

  const actual_recovery_rate_display = format_rate(
    actual_recovery_rate,
    rate_suffix
  );

  const recovery_variance_display = format_rate(
    profit_or_deficit_per_recovery_hour,
    rate_suffix
  );

  const has_recovery_shortfall =
    Number(profit_or_deficit_per_recovery_hour ?? 0) < 0;

  const has_recovery_surplus =
    Number(profit_or_deficit_per_recovery_hour ?? 0) > 0;

  const recovery_result_text = has_recovery_shortfall
    ? `The business is currently ${format_rate(
        Math.abs(Number(profit_or_deficit_per_recovery_hour ?? 0)),
        rate_suffix
      )} below the required recovery rate.`
    : has_recovery_surplus
      ? `The business is currently ${format_rate(
          profit_or_deficit_per_recovery_hour,
          rate_suffix
        )} above the required recovery rate.`
      : "The business is currently matching the required recovery rate.";

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Recovery requirement
          </h3>

          <p className="ui-help">
            This shows how the Business Summary cost burden becomes the recovery
            rate carried forward into Cost Allocation.
          </p>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">Required recovery build-up</p>

            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Total cost burden
                </div>
                <div className="labour-summary-table-value">
                  {format_currency(total_cost_burden)}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  {recovery_driver_label}
                </div>
                <div className="labour-summary-table-value">
                  {is_product_based
                    ? format_number(recovery_driver_quantity)
                    : `${format_number(recovery_driver_quantity)} hrs`}
                </div>
              </div>

              <div className="labour-summary-table-row total">
                <div className="labour-summary-table-label">
                  {required_recovery_label}
                </div>
                <div className="labour-summary-table-value">
                  {required_recovery_rate_display}
                </div>
              </div>
            </div>

            <p className="ui-help">
              {is_product_based
                ? "Total cost burden ÷ units used = required recovery per unit."
                : "Total cost burden ÷ selected recovery hours = required recovery per recovery hour."}
            </p>
          </div>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">Actual vs required</p>

            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  {actual_recovery_label}
                </div>
                <div className="labour-summary-table-value">
                  {actual_recovery_rate_display}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  {required_recovery_label}
                </div>
                <div className="labour-summary-table-value">
                  {required_recovery_rate_display}
                </div>
              </div>

              <div className="labour-summary-table-row total">
                <div className="labour-summary-table-label">
                  {variance_label}
                </div>
                <div className="labour-summary-table-value">
                  {recovery_variance_display}
                </div>
              </div>
            </div>

            <p className="ui-help">
              Actual recovery rate - required recovery rate = recovery variance.
            </p>

            <div className="ui-readonly">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {recovery_result_text}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}