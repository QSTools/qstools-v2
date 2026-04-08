export default function AssetSummaryCard({ rows = [], meta = {} }) {
  const asset_type = meta.asset_type || "Productive";

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Summary</p>
            <h2 className="text-xl font-semibold">Asset Outputs</h2>
            <p className="ui-help">
              Annual cash-cost outputs plus productive capacity metrics.
            </p>
          </div>

          <div className="ui-panel">
            <p className="ui-help">Asset: {meta.asset_name || "Unnamed asset"}</p>
            <p className="ui-help">Type: {asset_type}</p>
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
              Cost Summary continues to consume total annual asset cost only.
            </p>
            <p className="ui-help">
              Depreciation is excluded as this model is based on real cash cost recovery.
            </p>
            <p className="ui-help">
              Productive assets contribute recovery capacity. Support assets remain part of cost only.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}