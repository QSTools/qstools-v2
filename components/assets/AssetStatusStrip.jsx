function SummaryRow({ label, value }) {
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
      <span className="labour-summary-value">{value}</span>
    </div>
  );
}

export default function AssetStatusStrip({
  module_total_asset_cost_label,
  assets_benchmark_total_label,
  assets_variance_amount_label,
  assets_variance_percent_label,
  reconciliation_label,
  active_asset_count_label,
  warning_count,
  warnings,
  is_ready,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Reconciliation</div>
          <div className="ui-display">Asset Position</div>
          <div className="ui-help">
            As you enter assets, the gap to your P&amp;L benchmark should reduce.
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Status</div>

            <div className="labour-summary-table">
              <SummaryRow
                label="Module State"
                value={is_ready ? "Ready" : "Needs attention"}
              />
              <SummaryRow
                label="Reconciliation"
                value={reconciliation_label}
              />
              <SummaryRow
                label="Active Assets"
                value={active_asset_count_label}
              />
            </div>
          </div>
        </div>

        <div className="ui-panel">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Benchmark Position</div>

            <div className="labour-summary-table">
              <SummaryRow
                label="Assets Benchmark"
                value={assets_benchmark_total_label}
              />
              <SummaryRow
                label="Module Total"
                value={module_total_asset_cost_label}
              />
              <SummaryRow
                label="Variance"
                value={assets_variance_amount_label}
              />
              <SummaryRow
                label="Variance %"
                value={assets_variance_percent_label}
              />
            </div>
          </div>
        </div>

        {warning_count > 0 && (
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Warnings</div>

              <div className="labour-summary-table">
                {warnings.map((warning, index) => (
                  <SummaryRow
                    key={`${warning}-${index}`}
                    label={`Warning ${index + 1}`}
                    value={warning}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}