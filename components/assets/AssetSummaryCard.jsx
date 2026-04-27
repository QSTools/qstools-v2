function SummaryRow({ label, value, strong = false }) {
  return (
    <div className={`labour-summary-table-row ${strong ? "total" : ""}`}>
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
    </div>
  );
}

export default function AssetSummaryCard({
  rows = [],
  meta = {},
  status = {},
  on_new_asset,
  on_save_asset,
}) {
  const find_row_value = (label, fallback = "$0") =>
    rows.find((row) => row.label === label)?.value || fallback;

  const lifecycle = meta.lifecycle || "Active";
  const is_retired = lifecycle === "Retired";

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Summary</div>
          <div className="ui-display">Selected asset</div>
          <div className="ui-help">
            Check the asset cost build before saving or moving to the next
            setup module.
          </div>
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
            <div className="ui-kicker">First-Principles Finance Build</div>

            <div className="labour-summary-table">
              <SummaryRow
                label="Principal Annual"
                value={find_row_value("Principal Annual")}
              />
              <SummaryRow
                label="Interest Annual"
                value={find_row_value("Interest Annual")}
              />
              <SummaryRow
                label="Finance Cost Annual"
                value={find_row_value("Finance Cost Annual")}
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
          <div className="ui-help">
            Check this asset summary, save the profile, then continue to the
            next setup module.
          </div>

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
            <div className="ui-help">
              This is the true annual cost of owning this asset based on actual
              finance repayments. It replaces the P&L view, where asset costs are
              often split or hidden.
            </div>

            <div className="ui-help">
              Principal and interest are shown separately so the full repayment is
              visible and auditable. Running costs will be added as a separate layer.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}