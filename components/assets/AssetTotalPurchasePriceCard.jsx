"use client";

function format_currency(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

/**
 * AssetTotalPurchasePriceCard
 *
 * Built 2026-09-12 specifically so the Balance Sheet Fixed Assets
 * reconciliation's Assets-side total (purchase_price summed across
 * active_assets) is visible and auditable somewhere in the app, not just
 * hidden inside a calculation. Before this, purchase_price was stored per
 * asset but never surfaced in aggregate anywhere - the user had no way to
 * check the reconciliation's number against anything. Lists each active
 * asset's own purchase price alongside the total, so it can be checked by
 * eye against the individual records.
 */
export default function AssetTotalPurchasePriceCard({ active_assets }) {
  const assets_with_price = (active_assets || []).filter(
    (a) => Number(a.purchase_price) > 0
  );
  const total = (active_assets || []).reduce(
    (sum, a) => sum + (Number(a.purchase_price) || 0),
    0
  );

  return (
    <div className="business-outcome-ledger">
      <div className="business-outcome-ledger-section-title">Total Purchase Price (active assets)</div>
      {assets_with_price.length === 0 ? (
        <p className="ui-help">No purchase price has been entered for any active asset yet.</p>
      ) : (
        <>
          <div className="business-outcome-ledger-table">
            {assets_with_price.map((asset, index) => (
              <div className="business-outcome-ledger-row" key={asset.id || index}>
                <span>{asset.asset_name || `Asset ${index + 1}`}</span>
                <span>{format_currency(asset.purchase_price)}</span>
              </div>
            ))}
            <div className="business-outcome-ledger-row business-outcome-ledger-true-total">
              <span>Total</span>
              <span>{format_currency(total)}</span>
            </div>
          </div>
          <p className="ui-help">
            Used by the Balance Sheet Fixed Assets reconciliation on the Business Outcome page - this is where that
            number comes from.
          </p>
        </>
      )}
    </div>
  );
}