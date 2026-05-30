function SummaryRow({ label, value }) {
  return (
    <div className="labour-summary-table-row">
      <div className="labour-summary-table-label">{label}</div>
      <div className="labour-summary-table-value">{value}</div>
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
  productive_asset_count_label,
  total_productive_asset_utilisation_hours_annual_label,
  productive_asset_cost_annual_label,
  productive_asset_recovery_rate_label,
  warning_count,
  warnings,
  is_ready,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Reconciliation</div>
          <div className="ui-display">Asset position</div>
          <div className="ui-help">
            As you enter assets, your position moves closer to your P&amp;L
            benchmark.
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
              <SummaryRow
                label="Productive Assets"
                value={productive_asset_count_label}
              />
              <SummaryRow
                label="Productive Asset Utilisation"
                value={total_productive_asset_utilisation_hours_annual_label}
              />
              <SummaryRow
                label="Productive Asset Annual Cost"
                value={productive_asset_cost_annual_label}
              />
              <SummaryRow
                label="Productive Asset Recovery Rate"
                value={productive_asset_recovery_rate_label}
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