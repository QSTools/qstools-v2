import RecoverySummaryReadOnlyRow from "@/components/recovery-summary/RecoverySummaryReadOnlyRow";
import { format_number } from "@/components/recovery-summary/recoverySummaryFormatters";

export default function RecoverySummaryStartingSplitBlock({
  labour_share_percent,
  asset_share_percent,
  material_share_percent,
  overhead_absorbed_percent,
  overhead_share_percent,
  explained_recovery_total,
  share_total,
  share_not_balanced,
  on_reset,
}) {
  const resolved_material_share_percent = Number(material_share_percent ?? 0);
  const resolved_overhead_absorbed_percent = Number(
    overhead_absorbed_percent ?? overhead_share_percent ?? 0
  );

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Suggested starting recovery split
          </h3>

          <p className="ui-help">
            These shares are a system-generated starting recovery assumption
            based on the current business structure. They are read-only in V1
            because the true split cannot be proven until live jobs are tracked.
            Cost Allocation will test whether this structure can support the
            model, and live job feedback will begin to reveal the actual split
            over time.
          </p>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <RecoverySummaryReadOnlyRow
              label="Labour recovery share"
              value={`${format_number(labour_share_percent)}%`}
            />

            <p className="ui-help">
              The share of recovery expected to come from people's productive
              work.
            </p>

            <RecoverySummaryReadOnlyRow
              label="Asset recovery share"
              value={`${format_number(asset_share_percent)}%`}
            />

            <p className="ui-help">
              The share of recovery expected to come from productive assets,
              plant, vehicles, machinery, or equipment. Support assets remain in
              cost burden but do not automatically carry asset recovery.
            </p>

            <RecoverySummaryReadOnlyRow
              label="Materials / products contribution"
              value={`${format_number(resolved_material_share_percent)}%`}
            />

            <p className="ui-help">
              The share of recovery expected to come from materials, supplied
              goods, product margin, resale margin, or transformed goods.
            </p>

            <RecoverySummaryReadOnlyRow
              label="Unassigned recovery share"
              value={`${format_number(resolved_overhead_absorbed_percent)}%`}
              emphasis
            />

            <p className="ui-help">
              This is calculated automatically as 100% minus the labour, asset,
              and materials / products shares. In V1, the suggested split is
              read-only and live job feedback will improve the actual split over
              time.
            </p>
          </div>
        </div>

        <RecoverySummaryReadOnlyRow
          label="Explained recovery total"
          value={`${format_number(explained_recovery_total)}%`}
          emphasis
        />

        <RecoverySummaryReadOnlyRow
          label="Total recovery model"
          value={`${format_number(share_total)}%`}
        />

        {share_not_balanced ? (
          <div className="ui-readonly">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Explained recovery shares cannot exceed 100%.
            </p>
          </div>
        ) : null}

        <div className="ui-actions">
          <button
            type="button"
            onClick={on_reset}
            className="ui-button-secondary"
          >
            Reset to system suggested split
          </button>
        </div>
      </div>
    </div>
  );
}
