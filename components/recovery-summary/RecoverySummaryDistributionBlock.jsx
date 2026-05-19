import RecoverySummaryReadOnlyRow from "@/components/recovery-summary/RecoverySummaryReadOnlyRow";
import { format_currency } from "@/components/recovery-summary/recoverySummaryFormatters";

export default function RecoverySummaryDistributionBlock({
  labour_recovery_cost,
  asset_recovery_cost,
  material_recovery_cost,
  overhead_absorbed_cost,
}) {
  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Recovery distribution
          </h3>

          <p className="ui-help">
            This shows how the cost burden is being assigned by the current
            starting recovery strategy.
          </p>
        </div>

        <RecoverySummaryReadOnlyRow
          label="Labour recovery cost"
          value={format_currency(labour_recovery_cost)}
        />

        <RecoverySummaryReadOnlyRow
          label="Asset recovery cost"
          value={format_currency(asset_recovery_cost)}
        />

        <RecoverySummaryReadOnlyRow
          label="Materials / products recovery contribution"
          value={format_currency(material_recovery_cost)}
        />

        <RecoverySummaryReadOnlyRow
          label="Unassigned recovery share"
          value={format_currency(overhead_absorbed_cost)}
        />
      </div>
    </div>
  );
}
