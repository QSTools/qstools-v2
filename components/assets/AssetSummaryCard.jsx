export default function AssetSummaryCard({
  rows = [],
  reconciliation_rows = [],
  meta = {},
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Summary</div>
          <div className="ui-card-title-sm">Selected asset</div>
          <div className="ui-help">
            Structural ownership cost for the currently loaded asset.
          </div>
        </div>

        <div className="ui-stack-sm">
          <div className="ui-label">Asset Details</div>

          <div className="labour-summary-table">
            <div className="labour-summary-row">
              <span className="labour-summary-label">Asset Name</span>
              <span className="labour-summary-value">
                {meta.asset_name || "Unnamed asset"}
              </span>
            </div>

            <div className="labour-summary-row">
              <span className="labour-summary-label">Asset Type</span>
              <span className="labour-summary-value">
                {meta.asset_type || "Productive"}
              </span>
            </div>

            <div className="labour-summary-row">
              <span className="labour-summary-label">Effective From</span>
              <span className="labour-summary-value">
                {meta.effective_from || "—"}
              </span>
            </div>

            <div className="labour-summary-row">
              <span className="labour-summary-label">Lifecycle</span>
              <span className="labour-summary-value">
                {meta.lifecycle || "Active"}
              </span>
            </div>
          </div>
        </div>

        <div className="ui-stack-sm">
          <div className="ui-label">Cost Breakdown</div>

          <div className="labour-summary-table">
            {rows.map((row) => (
              <div key={row.label} className="labour-summary-row">
                <span className="labour-summary-label">{row.label}</span>
                <span
                  className={`labour-summary-value${
                    row.emphasis ? " labour-summary-value-strong" : ""
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-stack-sm">
          <div className="ui-label">Reconciliation</div>

          <div className="labour-summary-table">
            {reconciliation_rows.map((row) => (
              <div key={row.label} className="labour-summary-row">
                <span className="labour-summary-label">{row.label}</span>
                <span
                  className={`labour-summary-value${
                    row.emphasis ? " labour-summary-value-strong" : ""
                  }`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-stack-sm">
          <div className="ui-label">What this means</div>
          <div className="ui-help">
            This shows what the selected asset costs you to own.
          </div>
          <div className="ui-help">
            It is a structural cost baseline, not a full running-cost model.
          </div>
          <div className="ui-help">
            Any remaining gap to the benchmark is resolved later in the recovery structure.
          </div>
        </div>
      </div>
    </section>
  );
}