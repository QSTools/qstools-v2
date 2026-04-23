function SummaryRow({ label, value, strong = false }) {
  return (
    <div
      className="labour-summary-row"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <span className="labour-summary-label">{label}</span>
      <span
        className={`labour-summary-value${
          strong ? " labour-summary-value-strong" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function AssetSummaryCard({
  rows = [],
  meta = {},
  module_total_asset_cost_label = "$0",
  selected_asset_share_label = "0.00%",
}) {
  const finance_cost_row =
    rows.find((row) => row.label === "Finance Cost Annual") || null;

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Summary</div>
          <div className="ui-display">Selected asset</div>
          <div className="ui-help">
            Structural ownership position for the currently loaded asset.
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
              <SummaryRow
                label="Lifecycle"
                value={meta.lifecycle || "Active"}
              />
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Ownership Cost</div>

            <div className="labour-summary-table">
              <SummaryRow
                label="Finance Cost Annual"
                value={finance_cost_row?.value || "$0"}
                strong
              />
              <SummaryRow
                label="Module Total"
                value={module_total_asset_cost_label}
              />
              <SummaryRow
                label="Share of Module Total"
                value={selected_asset_share_label}
              />
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">What this means</div>
            <div className="ui-help">
              This shows what the selected asset costs you to own.
            </div>
            <div className="ui-help">
              It makes the asset burden visible as a real part of the business.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}