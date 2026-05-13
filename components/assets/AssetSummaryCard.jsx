import CollapsibleSection from "@/components/common/CollapsibleSection";

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

function SelectedAssetDetailCard({
  rows = [],
  meta = {},
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
                  label="Operating Asset Cost Annual"
                  value={find_row_value("Operating Asset Cost Annual")}
                  strong
                />
              </div>
            </div>
          </div>

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
                Principal is shown only as future Cash Flow support. It is not
                part of operating asset cost, and vehicle running costs belong
                in General Overheads.
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
      on_new_asset={on_new_asset}
      on_save_asset={on_save_asset}
    />
  );
}