export default function AssetStatusStrip({
  asset_name_label,
  lifecycle_label,
  asset_type_label,
  effective_from_label,
  total_asset_cost_label,
  saved_asset_count_label,
  active_asset_count_label,
  warning_count,
  warnings,
  is_ready,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <p className="ui-kicker">Assets</p>
              <h1 className="text-xl font-semibold">Asset Setup</h1>
              <p className="ui-help">
                Create and maintain asset cost inputs.
              </p>
            </div>

            <div>
              <span className="ui-pill">
                {is_ready ? "Ready" : "Needs attention"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="ui-readonly">{asset_name_label}</div>
            <div className="ui-readonly">{asset_type_label}</div>
            <div className="ui-readonly">{lifecycle_label}</div>
            <div className="ui-readonly">{effective_from_label}</div>
            <div className="ui-readonly">{total_asset_cost_label}</div>
            <div className="ui-readonly">{saved_asset_count_label}</div>
            <div className="ui-readonly">{active_asset_count_label}</div>
          </div>

          {warning_count > 0 && (
            <div className="ui-panel">
              <p className="ui-label">Warnings</p>
              <div className="ui-stack">
                {warnings.map((warning) => (
                  <p key={warning} className="ui-help">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}