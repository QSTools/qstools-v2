import {
  format_rate,
} from "@/components/recovery-summary/recoverySummaryFormatters";

export default function RecoveryDriverDetail({
  business_type_label,
  recovery_driver_label,
  product_mode_active,
  actual_recovery_rate,
  required_recovery_rate,
  profit_or_deficit_per_recovery_hour,
}) {
  const recovery_gap = Number(profit_or_deficit_per_recovery_hour ?? 0);
  const recovery_gap_abs = Math.abs(recovery_gap);

  const recovery_result_text =
    recovery_gap < 0
      ? `Every recoverable hour is currently ${format_rate(
          recovery_gap_abs
        )} below the required recovery rate.`
      : recovery_gap > 0
        ? `Every recoverable hour is currently ${format_rate(
            recovery_gap
          )} above the required recovery rate.`
        : "The business is currently matching the required recovery rate.";

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <p className="ui-label">Recovery driver</p>

        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {product_mode_active ? "Units and margin" : recovery_driver_label}
        </h3>

        <p className="ui-help">
          This explains the denominator used to express the recovery position.
        </p>

        <div className="labour-summary-table">
          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Business type</div>
            <div className="labour-summary-table-value">
              {business_type_label}
            </div>
          </div>

          <div className="labour-summary-table-row">
            <div className="labour-summary-table-label">Recovery driver</div>
            <div className="labour-summary-table-value">
              {product_mode_active ? "Units and margin" : recovery_driver_label}
            </div>
          </div>

          {!product_mode_active ? (
            <>
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Actual recovery per recovery hour
                </div>
                <div className="labour-summary-table-value">
                  {format_rate(actual_recovery_rate)}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Required recovery per recovery hour
                </div>
                <div className="labour-summary-table-value">
                  {format_rate(required_recovery_rate)}
                </div>
              </div>

              <div className="labour-summary-table-row total">
                <div className="labour-summary-table-label">
                  Recovery gap per recovery hour
                </div>
                <div className="labour-summary-table-value">
                  {format_rate(profit_or_deficit_per_recovery_hour)}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {!product_mode_active ? (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {recovery_result_text}
            </p>
          </div>
        ) : (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Product recovery is expressed through trading margin per unit and
              units sold. Cost Allocation remains a structural test and does not
              decide product margin.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}