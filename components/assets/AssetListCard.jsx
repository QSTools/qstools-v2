export default function AssetListCard({
  asset_rows = [],
  on_load_asset,
  on_delete_asset,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Saved Assets</div>
            <div className="ui-card-title-sm">Asset register</div>
            <div className="ui-help">
              Saved asset records available for loading and editing.
            </div>
          </div>

          {asset_rows.length === 0 ? (
            <div className="ui-panel">
              <div className="ui-help">No assets saved yet.</div>
            </div>
          ) : (
            <div className="ui-stack-sm">
              {asset_rows.map((asset) => (
                <div key={asset.asset_id} className="ui-panel">
                  <div className="ui-stack-sm">
                    <div className="ui-split">
                      <div className="ui-stack-sm">
                        <div className="ui-label">{asset.asset_name}</div>
                        <div className="ui-help">
                          {asset.asset_type} · {asset.lifecycle}
                        </div>
                      </div>

                      {asset.is_current && (
                        <div className="ui-pill">Loaded</div>
                      )}
                    </div>

                    <div className="labour-summary-table">
                      <div className="labour-summary-row">
                        <span className="labour-summary-label">
                          Effective From
                        </span>
                        <span className="labour-summary-value">
                          {asset.effective_from}
                        </span>
                      </div>

                      <div className="labour-summary-row">
                        <span className="labour-summary-label">
                          Total Annual Cost
                        </span>
                        <span className="labour-summary-value labour-summary-value-strong">
                          {asset.total_asset_cost_annual}
                        </span>
                      </div>
                    </div>

                    <div className="ui-actions">
                      <button
                        type="button"
                        className="ui-button-secondary"
                        onClick={() => on_load_asset(asset.asset_id)}
                      >
                        Load
                      </button>

                      <button
                        type="button"
                        className="ui-button-danger"
                        onClick={() => on_delete_asset(asset.asset_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}