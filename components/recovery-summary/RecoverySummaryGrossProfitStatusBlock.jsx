import RecoverySummaryReadOnlyRow from "@/components/recovery-summary/RecoverySummaryReadOnlyRow";
import {
  format_currency,
  format_status_label,
} from "@/components/recovery-summary/recoverySummaryFormatters";

export default function RecoverySummaryGrossProfitStatusBlock({
  gross_profit,
  margin_pool,
  gross_profit_source_status,
  material_margin_status,
  asset_utilisation_status,
}) {
  const resolved_gross_profit = Number(gross_profit ?? margin_pool ?? 0);

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Gross Profit Source Status
          </h3>

          <p className="ui-help">
            Gross profit is known from current business data, but the system
            cannot yet separate how much of that margin came from labour
            recovery, materials / products contribution, or asset contribution.
          </p>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              The recovery split below is therefore a starting recovery
              assumption, not a fully verified result.
            </p>

            <p className="ui-help">
              As full jobs are run through the live feedback loop, actual labour
              recovery, material margin, and asset contribution will begin to
              reveal themselves. The starting split can then be corrected using
              real job evidence.
            </p>
          </div>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <RecoverySummaryReadOnlyRow
              label="Gross profit"
              value={`Known - ${format_currency(resolved_gross_profit)}`}
            />

            <RecoverySummaryReadOnlyRow
              label="Margin source"
              value={format_status_label(gross_profit_source_status)}
            />

            <RecoverySummaryReadOnlyRow
              label="Materials / COGS"
              value="Known"
            />

            <RecoverySummaryReadOnlyRow
              label="Material margin"
              value={format_status_label(material_margin_status)}
            />

            <RecoverySummaryReadOnlyRow
              label="Asset contribution"
              value={format_status_label(asset_utilisation_status)}
            />

            <RecoverySummaryReadOnlyRow
              label="Labour recovery"
              value="Based on current selected recovery hours"
            />
          </div>
        </div>

        <p className="ui-help">
          Materials / COGS are known. Material margin is not yet verified.
          Productive assets can carry recovery. Support assets stay in the cost
          burden but do not automatically carry asset recovery.
        </p>
      </div>
    </div>
  );
}
