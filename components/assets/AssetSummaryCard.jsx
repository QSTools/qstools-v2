export default function AssetSummaryCard({ rows = [], meta = {} }) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Summary</p>
            <h2 className="text-xl font-semibold">Annual Asset Outputs</h2>
            <p className="ui-help">
              Locked cash-cost outputs for downstream Cost Summary use.
            </p>
          </div>

          <div className="ui-panel">
            <p className="ui-help">Asset: {meta.asset_name || "Unnamed asset"}</p>
            <p className="ui-help">Effective From: {meta.effective_from || "—"}</p>
            <p className="ui-help">Lifecycle: {meta.lifecycle || "Active"}</p>
          </div>

          <div className="ui-stack">
            {rows.map((row) => (
              <div key={row.label} className="ui-split">
                <span className="ui-label">{row.label}</span>
                <span className={row.emphasis ? "font-semibold" : ""}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="ui-panel">
            <p className="ui-help">
              Depreciation is excluded as this model is based on real cash cost recovery.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}