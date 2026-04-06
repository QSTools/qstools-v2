export default function AssetListCard({
  asset_rows = [],
  on_load_asset,
  on_delete_asset,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Registry</p>
            <h2 className="text-xl font-semibold">Saved Assets</h2>
            <p className="ui-help">
              Saved asset records for setup and later downstream use.
            </p>
          </div>

          {asset_rows.length === 0 ? (
            <p className="ui-help">No assets saved yet.</p>
          ) : (
            <div className="ui-stack">
              {asset_rows.map((asset) => (
                <div key={asset.asset_id} className="ui-panel">
                  <div className="ui-split">
                    <div>
                      <p className="ui-label">{asset.asset_name}</p>
                      <p className="ui-help">
                        Effective From: {asset.effective_from}
                      </p>
                      <p className="ui-help">Lifecycle: {asset.lifecycle}</p>
                      <p className="ui-help">
                        Total Annual Cost: {asset.total_asset_cost_annual}
                      </p>
                      {asset.is_current && (
                        <p className="ui-help">Currently loaded in form</p>
                      )}
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