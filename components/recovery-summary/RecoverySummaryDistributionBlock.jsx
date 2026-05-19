import CollapsibleSection from "@/components/common/CollapsibleSection";
import { format_currency } from "@/components/recovery-summary/recoverySummaryFormatters";

export default function RecoverySummaryDistributionBlock({
  labour_recovery_cost,
  asset_recovery_cost,
  material_recovery_cost,
  overhead_absorbed_cost,
}) {
  return (
    <CollapsibleSection
      title="Recovery distribution"
      summary="Cost allocation"
      defaultOpen={false}
    >
      <div className="ui-stack">
        <p className="ui-help">
          This shows how the cost burden is being assigned by the current
          starting recovery strategy.
        </p>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">Recovery cost allocation</p>

            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Labour recovery cost
                </div>
                <div className="labour-summary-table-value">
                  {format_currency(labour_recovery_cost)}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Asset recovery cost
                </div>
                <div className="labour-summary-table-value">
                  {format_currency(asset_recovery_cost)}
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Materials / products recovery contribution
                </div>
                <div className="labour-summary-table-value">
                  {format_currency(material_recovery_cost)}
                </div>
              </div>

              <div className="labour-summary-table-row total">
                <div className="labour-summary-table-label">
                  Unassigned recovery share
                </div>
                <div className="labour-summary-table-value">
                  {format_currency(overhead_absorbed_cost)}
                </div>
              </div>
            </div>

            <p className="ui-help">
              These values apply the suggested starting split to the total cost
              burden. They are not verified source-of-margin results.
            </p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}