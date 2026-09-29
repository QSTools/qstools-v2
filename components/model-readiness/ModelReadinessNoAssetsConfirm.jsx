"use client";

// Shown inside the Asset Finance card on Model Readiness. Lets a business with
// no assets confirm that in one click, instead of finding the checkbox on the
// Assets form. Writes the same field (no_active_assets_confirmed) through the
// same spread-safe setter the Assets form uses, on the live useAssets instance
// passed in via modules.assets, so the checks recompute immediately.
export default function ModelReadinessNoAssetsConfirm({ assets }) {
  const set_field = assets?.card?.form?.on_change;
  const confirmed = assets?.output_contract?.no_active_assets_confirmed === true;
  const active_count = Array.isArray(assets?.active_assets)
    ? assets.active_assets.length
    : 0;

  if (typeof set_field !== "function") return null;
  if (active_count > 0) return null;

  if (confirmed) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="ui-help">
          Confirmed: this business has no assets to include.
        </p>
        <button
          type="button"
          className="ui-button-secondary"
          onClick={() => set_field("no_active_assets_confirmed", false)}
        >
          Undo: I do have assets
        </button>
      </div>
    );
  }

  return (
    <div
      className="ui-stack-sm"
      style={{
        border: "2px solid var(--danger)",
        borderRadius: "0.75rem",
        padding: "0.75rem 1rem",
      }}
    >
      <p className="ui-help">
        <strong>Action required:</strong> no assets are saved. If this business
        genuinely has no assets to include, confirm it here so Assets readiness
        can pass.
      </p>
      <div>
        <button
          type="button"
          onClick={() => set_field("no_active_assets_confirmed", true)}
          style={{
            background: "var(--danger)",
            color: "#fff",
            border: "1px solid var(--danger)",
            borderRadius: "0.875rem",
            minHeight: "44px",
            padding: "0.85rem 1.1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Confirm: I have no assets
        </button>
      </div>
    </div>
  );
}