import CollapsibleSection from "@/components/common/CollapsibleSection";
import {
  format_number_with_commas,
  parse_number_string,
} from "@/lib/formatters/numberFormatters";

function SummaryRow({ label, value, strong = false, helper = "" }) {
  return (
    <div className={`labour-summary-table-row ${strong ? "total" : ""}`}>
      <div className="labour-summary-table-label">
        <div>{label}</div>
        {helper ? <div className="ui-help">{helper}</div> : null}
      </div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

function PortfolioSummaryCard({ portfolio_summary = {} }) {
  const rows = Array.isArray(portfolio_summary.rows)
    ? portfolio_summary.rows
    : [];

  return (
    <section className="ui-section">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Asset Portfolio</div>
        <h2 className="ui-card-title-sm">Live asset cost baseline</h2>
        <p className="ui-help">
          As assets are added, this shows the annual cost of the active asset
          portfolio.
        </p>

        <div className="ui-panel">
          <div className="labour-summary-table">
            {rows.map((row, index) => (
              <SummaryRow
                key={`${row.label}-${index}`}
                label={row.label}
                value={row.value}
                strong={row.emphasis === true}
              />
            ))}
          </div>
        </div>

        {portfolio_summary.note ? (
          <p className="ui-help">{portfolio_summary.note}</p>
        ) : null}
      </div>
    </section>
  );
}

function AssetOverheadPoolAssignmentCard({
  pool_summary = [],
  on_change_asset_overhead_pool_assignment,
}) {
  if (!Array.isArray(pool_summary) || pool_summary.length === 0) {
    return null;
  }

  return (
    <div className="ui-panel">
      <div className="ui-stack-sm">
        <div className="ui-kicker">Asset Overhead Pools</div>
        <h3 className="ui-card-title-sm">Assign overhead pools to this asset</h3>
        <p className="ui-help">
          These values come from General Overheads. Assign the portion of each
          pool that belongs to this asset. Cost Summary transfers assigned
          amounts from overheads into asset recovery so the same source cost is
          not counted twice.
        </p>

        <div className="ui-stack-sm">
          {pool_summary.map((pool) => {
            const assigned_to_current_asset = Number(
              pool.assigned_to_current_asset || 0
            );

            const max_assignable_to_current_asset = Number(
              pool.max_assignable_to_current_asset || 0
            );

            const is_over_allocated =
              pool.allocation_status === "over_allocated";

            return (
              <div key={pool.pool_key} className="ui-readonly">
                <div className="ui-stack-sm">
                  <div className="ui-row-between">
                    <div>
                      <div className="ui-label">{pool.label}</div>
                      <div className="ui-help">
                        Available {pool.available_amount_label} · Remaining{" "}
                        {pool.remaining_amount_label} · Max this asset{" "}
                        {pool.max_assignable_to_current_asset_label}
                      </div>

                      {is_over_allocated ? (
                        <div className="ui-help">
                          This pool is over-allocated by{" "}
                          {pool.over_allocated_amount_label}. Reduce the
                          assigned amount before using this asset downstream.
                        </div>
                      ) : null}
                    </div>

                    <div className="labour-summary-table-value">
                      {pool.assigned_total_label}
                    </div>
                  </div>

                  <label className="ui-field">
                    <span className="ui-label">Assigned to this asset</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="ui-input"
                      value={format_number_with_commas(
                        assigned_to_current_asset
                      )}
                      onChange={(event) => {
                        const next_value = Math.max(
                          0,
                          parse_number_string(event.target.value)
                        );

                        const safe_value = Math.min(
                          next_value,
                          max_assignable_to_current_asset
                        );

                        on_change_asset_overhead_pool_assignment(
                          pool.pool_key,
                          safe_value
                        );
                      }}
                    />
                  </label>

                  <div className="labour-summary-table">
                    <SummaryRow
                      label="Available Pool"
                      value={pool.available_amount_label}
                    />
                    <SummaryRow
                      label="Assigned to Other Assets"
                      value={pool.assigned_to_other_assets_label}
                    />
                    <SummaryRow
                      label="Assigned Total"
                      value={pool.assigned_total_label}
                    />
                    <SummaryRow
                      label="Remaining Pool"
                      value={pool.remaining_amount_label}
                    />
                    <SummaryRow
                      label="Maximum For This Asset"
                      value={pool.max_assignable_to_current_asset_label}
                    />
                    {is_over_allocated ? (
                      <SummaryRow
                        label="Over Allocated"
                        value={pool.over_allocated_amount_label}
                        strong
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SelectedAssetDetailCard({
  rows = [],
  meta = {},
  asset_overhead_pool_summary = [],
  on_change_asset_overhead_pool_assignment,
  on_new_asset,
  on_save_asset,
}) {
  const find_row_value = (label, fallback = "$0") =>
    rows.find((row) => row.label === label)?.value || fallback;

  const lifecycle = meta.lifecycle || "Active";
  const is_retired = lifecycle === "Retired";

  return (
    <CollapsibleSection
      title="Selected asset summary"
      summary="Finance build, lifecycle and selected asset detail"
      defaultOpen={false}
    >
      <section className="ui-section">
        <div className="ui-stack">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Selected Asset Summary</div>
            <h2 className="ui-card-title">Selected asset position</h2>
            <p className="ui-help">
              Detail for the currently selected asset. The portfolio total
              remains visible in the side card as you build the asset list.
            </p>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Asset Details</div>

              <div className="labour-summary-table">
                <SummaryRow
                  label="Asset Name"
                  value={meta.asset_name || "Unnamed asset"}
                />
                <SummaryRow
                  label="Asset Type"
                  value={meta.asset_type || "Productive"}
                />
                <SummaryRow
                  label="Effective From"
                  value={meta.effective_from || "—"}
                />
                <SummaryRow label="Lifecycle" value={lifecycle} />
              </div>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Finance Build</div>

              <div className="labour-summary-table">
                <SummaryRow
                  label="Finance Status"
                  value={find_row_value("Finance Status", "Not financed")}
                />
                <SummaryRow
                  label="Finance Start Date"
                  value={find_row_value("Finance Start Date", "-")}
                />
                <SummaryRow
                  label="Finance End Date"
                  value={find_row_value("Finance End Date", "-")}
                />
                <SummaryRow
                  label="Principal Annual (Cash Flow Later)"
                  value={find_row_value("Principal Annual (Cash Flow Later)")}
                />
                <SummaryRow
                  label="Asset Interest Annual"
                  value={find_row_value("Asset Interest Annual")}
                />
                <SummaryRow
                  label="Estimated Remaining Finance Balance"
                  value={find_row_value("Estimated Remaining Finance Balance")}
                />
                <SummaryRow
                  label="Finance Progress"
                  value={find_row_value("Finance Progress", "0.00%")}
                />
                <SummaryRow
                  label="Base Asset Cost Annual"
                  value={find_row_value("Base Asset Cost Annual")}
                  strong
                />
                <SummaryRow
                  label="Allocated Asset Overhead Pools"
                  value={find_row_value("Allocated Asset Overhead Pools")}
                />
                <SummaryRow
                  label="Asset Recovery Cost Annual"
                  value={find_row_value("Asset Recovery Cost Annual")}
                  strong
                />
                <SummaryRow
                  label="Utilisation Hours / Week"
                  value={find_row_value("Utilisation Hours / Week", "-")}
                />
                <SummaryRow
                  label="Annual Utilisation Hours"
                  value={find_row_value("Annual Utilisation Hours", "-")}
                />
                <SummaryRow
                  label="Required Asset Recovery Rate"
                  value={find_row_value("Required Asset Recovery Rate", "-")}
                  strong
                />
              </div>
            </div>
          </div>

          <AssetOverheadPoolAssignmentCard
            pool_summary={asset_overhead_pool_summary}
            on_change_asset_overhead_pool_assignment={
              on_change_asset_overhead_pool_assignment
            }
          />

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Asset Position</div>

              <div className="labour-summary-table">
                <SummaryRow label="Asset Status" value={lifecycle} />
                <SummaryRow
                  label="Asset Type"
                  value={meta.asset_type || "Productive"}
                />
                <SummaryRow
                  label="Cost Included"
                  value={is_retired ? "No" : "Yes"}
                />
              </div>
            </div>
          </div>

          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Next Step</div>
            <p className="ui-help">
              Check this asset summary, save the asset, then continue to the
              next setup module.
            </p>

            <div className="ui-actions">
              <button
                type="button"
                className="ui-button-primary"
                onClick={on_save_asset}
              >
                Save Asset
              </button>

              <button
                type="button"
                className="ui-button-secondary"
                onClick={on_new_asset}
              >
                Create New Asset
              </button>

              <a className="ui-button-secondary" href="/general-overheads">
                Next Module
              </a>
            </div>
          </div>

          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">What this means</div>
              <p className="ui-help">
                This is the forward-looking annual asset ownership cost. Asset
                finance interest comes from Assets, not from P&amp;L interest.
              </p>

              <p className="ui-help">
                Principal is shown only as future Cash Flow support. Asset
                overhead pools come from General Overheads and are used for
                asset recovery. Cost Summary transfers assigned pool amounts
                from overheads to assets so the same source cost has one owner.
              </p>
            </div>
          </div>
        </div>
      </section>
    </CollapsibleSection>
  );
}

export default function AssetSummaryCard({
  rows = [],
  portfolio_summary = {},
  meta = {},
  status = {},
  asset_overhead_pool_summary = [],
  on_change_asset_overhead_pool_assignment,
  on_new_asset,
  on_save_asset,
  view = "detail",
}) {
  if (view === "portfolio") {
    return <PortfolioSummaryCard portfolio_summary={portfolio_summary} />;
  }

  return (
    <SelectedAssetDetailCard
      rows={rows}
      meta={meta}
      status={status}
      asset_overhead_pool_summary={asset_overhead_pool_summary}
      on_change_asset_overhead_pool_assignment={
        on_change_asset_overhead_pool_assignment
      }
      on_new_asset={on_new_asset}
      on_save_asset={on_save_asset}
    />
  );
}