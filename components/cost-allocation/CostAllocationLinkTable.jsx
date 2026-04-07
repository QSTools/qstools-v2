"use client";

import { useMemo, useState } from "react";

export default function CostAllocationLinkTable({
  links,
  add_asset_labour_link,
  remove_asset_labour_link,
}) {
  const [selected_asset_id, set_selected_asset_id] = useState("");
  const [selected_staff_id, set_selected_staff_id] = useState("");

  const active_rows = useMemo(() => {
    return (links?.rows ?? []).filter((row) => row?.is_active);
  }, [links]);

  function handle_add_link() {
    if (!selected_asset_id || !selected_staff_id) {
      return;
    }

    add_asset_labour_link(selected_asset_id, selected_staff_id);
    set_selected_asset_id("");
    set_selected_staff_id("");
  }

  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">C. Link management</p>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Asset ↔ labour capability links
          </h3>
          <p className="ui-help">
            Create active structural links only. Duplicate active pairs will be
            warned in the calculation layer.
          </p>
        </div>

        <div className="ui-stack">
          <label className="block">
            <span className="ui-label">Asset</span>
            <select
              className="ui-input"
              value={selected_asset_id}
              onChange={(event) => set_selected_asset_id(event.target.value)}
            >
              <option value="">Select asset</option>
              {(links?.asset_rows ?? []).map((asset) => (
                <option key={asset.asset_id} value={asset.asset_id}>
                  {asset.asset_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="ui-label">Staff</span>
            <select
              className="ui-input"
              value={selected_staff_id}
              onChange={(event) => set_selected_staff_id(event.target.value)}
            >
              <option value="">Select staff</option>
              {(links?.staff_rows ?? []).map((staff) => (
                <option key={staff.staff_id} value={staff.staff_id}>
                  {staff.staff_name}
                </option>
              ))}
            </select>
          </label>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-primary"
              onClick={handle_add_link}
            >
              Add link
            </button>
          </div>
        </div>

        <div className="ui-stack">
          {active_rows.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No active links yet.
            </p>
          ) : (
            active_rows.map((row) => {
              const asset = (links?.asset_rows ?? []).find(
                (item) => item.asset_id === row.asset_id,
              );
              const staff = (links?.staff_rows ?? []).find(
                (item) => item.staff_id === row.staff_id,
              );

              return (
                <div key={row.asset_labour_link_id} className="ui-readonly">
                  <div className="ui-actions">
                    <div>
                      <div className="text-sm text-[var(--text-primary)]">
                        {asset?.asset_name ?? row.asset_id} ↔{" "}
                        {staff?.staff_name ?? row.staff_id}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        Active structural link
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ui-button-danger"
                      onClick={() =>
                        remove_asset_labour_link(row.asset_labour_link_id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}