"use client";

import { useState } from "react";

/**
 * AssetRegisterNameCombobox
 *
 * Built 2026-09-12. One field: free text always works; a toggle button
 * always shows the FULL register list regardless of current text,
 * live-filtered as you type while open. Picking a name is the ONLY way
 * a link is created or changed - no fragile auto-matching. Picking a
 * DIFFERENT asset always re-links immediately, even while already
 * locked to something else (only free typing is blocked while locked,
 * forcing Unlink first for manual entry).
 *
 * CSS moved to styles/modules/assets.css (asset-register-combobox-*)
 * per established convention - was inline styles initially, corrected
 * same session.
 */
export default function AssetRegisterNameCombobox({ value, locked, register_assets, on_pick, on_type }) {
  const [is_open, set_is_open] = useState(false);
  const [filter_text, set_filter_text] = useState("");

  const visible_assets = register_assets.filter((a) =>
    a.asset_name.toLowerCase().includes(filter_text.toLowerCase())
  );

  function handle_pick(asset) {
    on_pick(asset);
    set_is_open(false);
    set_filter_text("");
  }

  return (
    <div className="ui-stack-sm asset-register-combobox">
      <div className="asset-register-combobox-row">
        <input
          className="ui-input"
          type="text"
          value={value ?? ""}
          readOnly={locked}
          onChange={(event) => on_type(event.target.value)}
        />
        {register_assets.length > 0 && (
          <button
            type="button"
            className="ui-button-secondary"
            onClick={() => set_is_open((open) => !open)}
          >
            {is_open ? "Close" : "Browse register"}
          </button>
        )}
      </div>

      {is_open && (
        <div className="ui-panel asset-register-combobox-dropdown">
          <input
            className="ui-input"
            type="text"
            placeholder="Filter..."
            value={filter_text}
            onChange={(event) => set_filter_text(event.target.value)}
            autoFocus
          />
          {visible_assets.length === 0 ? (
            <p className="ui-help">No matches.</p>
          ) : (
            visible_assets.map((asset) => (
              <button
                key={asset.asset_number}
                type="button"
                className="ui-button-secondary asset-register-combobox-option"
                onClick={() => handle_pick(asset)}
              >
                {asset.asset_name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}