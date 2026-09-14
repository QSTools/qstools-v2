"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

function format_currency(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "N/A";
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

// Estimated current-year depreciation - cross-validated 2026-09-12
// against a real, full amortisation schedule for PC55 (within ~1.2%
// of Xero's own reported accumulated figure). Diminishing Value only:
// rate x current book value. Deliberately does NOT apply this to any
// other method (Straight Line, Full Depreciation at Purchase) - those
// need a genuinely different formula, and guessing wrong here would be
// worse than saying N/A. In this business's real data, non-diminishing-
// value assets already show $0 book value, so this guard doesn't
// currently hide anything real - it's here for the next asset that
// might not work out that way.
function estimate_annual_depreciation(asset) {
  if (String(asset.depreciation_method || "").toLowerCase() !== "diminishing value") {
    return null;
  }
  const rate = Number(asset.depreciation_rate);
  const book_value = Number(asset.book_value);
  if (!Number.isFinite(rate) || !Number.isFinite(book_value)) return null;
  return book_value * (rate / 100);
}

/**
 * FixedAssetRegisterPreviewTable
 *
 * CORRECTED 2026-09-12: no matching dropdown here - user clarified the
 * flow runs the other direction. This register import is the SOURCE
 * list; the Assets module (a specific asset's own edit form) is where
 * a dropdown will later let someone PULL a real purchase price in from
 * here, not the reverse. This component just shows what's available to
 * pull from, with a checkbox to mark which imported assets are
 * relevant/available for that later step.
 *
 * Wrapped in CollapsibleSection per user request, so the full asset
 * list doesn't dominate the page once a large register is imported.
 */
export default function FixedAssetRegisterPreviewTable({ assets, onSetIncluded }) {
  if (!Array.isArray(assets) || assets.length === 0) {
    return (
      <div className="business-outcome-ledger">
        <p className="ui-help">No assets imported yet.</p>
      </div>
    );
  }

  const included_count = assets.filter((a) => a.is_included).length;

  return (
    <CollapsibleSection
      title={`Imported Assets (${assets.length})`}
      summary={`${included_count} available`}
      defaultOpen={false}
    >
      <div className="business-outcome-ledger">
        <div className="business-outcome-ledger-table">
          <div className="business-outcome-ledger-row business-outcome-ledger-header" style={{ gridTemplateColumns: "0.4fr 1.4fr 0.9fr 0.9fr 0.9fr 1fr" }}>
            <span>Include</span>
            <span>Asset</span>
            <span>Purchase Date</span>
            <span>Purchase Price</span>
            <span>Book Value</span>
            <span>Est. Depreciation/yr</span>
          </div>
          {assets.map((asset) => {
            const est_depreciation = estimate_annual_depreciation(asset);
            return (
              <div
                className="business-outcome-ledger-row"
                key={asset.asset_number}
                style={{ gridTemplateColumns: "0.4fr 1.4fr 0.9fr 0.9fr 0.9fr 1fr" }}
              >
                <span>
                  <input
                    type="checkbox"
                    checked={asset.is_included === true}
                    onChange={() => onSetIncluded(asset.asset_number, !asset.is_included)}
                  />
                </span>
                <span>{asset.asset_name}</span>
                <span>{asset.purchase_date || "N/A"}</span>
                <span>{format_currency(asset.purchase_price)}</span>
                <span>{format_currency(asset.book_value)}</span>
                <span>{est_depreciation === null ? "N/A" : format_currency(est_depreciation)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </CollapsibleSection>
  );
}