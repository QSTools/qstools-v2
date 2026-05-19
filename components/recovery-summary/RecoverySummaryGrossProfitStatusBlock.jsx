import RecoverySummaryReadOnlyRow from "@/components/recovery-summary/RecoverySummaryReadOnlyRow";
import {
  format_currency,
  format_percent,
} from "@/components/recovery-summary/recoverySummaryFormatters";

export default function RecoverySummaryGrossProfitStatusBlock({
  gross_profit,
  margin_pool,
  gross_margin_percent,
}) {
  const resolved_margin_pool = Number(gross_profit ?? margin_pool ?? 0);

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Margin Pool
          </h3>

          <p className="ui-help">
            This is the margin remaining after materials / COGS / direct costs.
          </p>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Margin pool
                </div>
                <div className="labour-summary-table-value">
                  {format_currency(resolved_margin_pool)}
                </div>
              </div>

              <div className="labour-summary-table-row total">
                <div className="labour-summary-table-label">
                  Margin pool percentage
                </div>
                <div className="labour-summary-table-value">
                  {format_percent(gross_margin_percent)}
                </div>
              </div>
            </div>

            <p className="ui-help">
              Labour, assets, and overheads are not included at this stage. They
              are tested in the recovery model below.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}