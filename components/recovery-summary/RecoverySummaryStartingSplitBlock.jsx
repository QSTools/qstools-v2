import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_share_percent(value) {
  const numeric_value = Number(value || 0);

  if (!Number.isFinite(numeric_value)) {
    return "0.0";
  }

  return numeric_value.toFixed(1);
}

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
  const resolved_labour_share_percent = Number(labour_share_percent ?? 0);
  const resolved_asset_share_percent = Number(asset_share_percent ?? 0);
  const resolved_material_share_percent = Number(material_share_percent ?? 0);
  const resolved_overhead_absorbed_percent = Number(
    overhead_absorbed_percent ?? overhead_share_percent ?? 0
  );

  return (
    <CollapsibleSection
      title="Suggested starting recovery split"
      summary={`${format_share_percent(share_total)}% model`}
      defaultOpen={false}
    >
      <div className="ui-stack">
        <p className="ui-help">
          These shares are a system-generated starting recovery assumption based
          on the current business structure. They are read-only in V1 because
          the true split cannot be proven until live jobs are tracked. Cost
          Allocation will test whether this structure can support the model, and
          live job feedback will begin to reveal the actual split over time.
        </p>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">System suggested split</p>

            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Labour recovery share
                </div>
                <div className="labour-summary-table-value">
                  {format_share_percent(resolved_labour_share_percent)}%
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Asset recovery share
                </div>
                <div className="labour-summary-table-value">
                  {format_share_percent(resolved_asset_share_percent)}%
                </div>
              </div>

              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Materials / products contribution
                </div>
                <div className="labour-summary-table-value">
                  {format_share_percent(resolved_material_share_percent)}%
                </div>
              </div>

              <div className="labour-summary-table-row total">
                <div className="labour-summary-table-label">
                  Unassigned recovery share
                </div>
                <div className="labour-summary-table-value">
                  {format_share_percent(resolved_overhead_absorbed_percent)}%
                </div>
              </div>
            </div>

            <p className="ui-help">
              This suggested split is read-only in V1. It is based on the
              current business structure and will improve as live job feedback
              reveals the actual recovery split over time.
            </p>
          </div>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">Recovery model total</p>

            <div className="labour-summary-table">
              <div className="labour-summary-table-row">
                <div className="labour-summary-table-label">
                  Explained recovery total
                </div>
                <div className="labour-summary-table-value">
                  {format_share_percent(explained_recovery_total)}%
                </div>
              </div>

              <div className="labour-summary-table-row total">
                <div className="labour-summary-table-label">
                  Total recovery model
                </div>
                <div className="labour-summary-table-value">
                  {format_share_percent(share_total)}%
                </div>
              </div>
            </div>
          </div>
        </div>

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
    </CollapsibleSection>
  );
}