"use client";

// R3 slice 4 batch B part 2 (Business Modelling brief, Addendum 24). The Remove / Undo list for scenario removals, shown on the Labour and Assets pages
// in Model mode ONLY (renders nothing otherwise, so baseline mode is untouched). It lists the REAL staff or assets and lets the owner mark one as
// removed in the scenario. A marker is only an id kept in mirra_scenarios_v1; real data and the baseline never change.
// Props: scenario = { kind, active, rows: [{ id, name, detail }], removed_ids, flags, unplaced, set_removed(id, removed) } from useLabour / useAssets.
// Existing ui-system classes only (no inline colours).

import { useState } from "react";

const TEXT = {
  staff: { article: "a", noun: "staff member", none: "No staff to show." },
  asset: { article: "an", noun: "asset", none: "No assets to show." },
};

function money(value) {
  return "$" + Math.round(Number(value) || 0).toLocaleString("en-NZ");
}

export default function ScenarioRemovalPanel({ scenario, heading = "Scenario" }) {
  const [message, set_message] = useState("");
  if (!scenario || scenario.active !== true) return null;

  const words = TEXT[scenario.kind] || TEXT.staff;
  const rows = Array.isArray(scenario.rows) ? scenario.rows : [];
  const removed = Array.isArray(scenario.removed_ids) ? scenario.removed_ids : [];
  const flags = scenario.flags || {};
  const unplaced_total = Object.values(scenario.unplaced || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);

  function toggle(id, remove) {
    if (typeof scenario.set_removed !== "function") return;
    const result = scenario.set_removed(id, remove);
    set_message(result && result.ok === false ? result.message || "The change could not be saved." : "");
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Scenario</div>
          <h2 className="ui-card-title">{heading}</h2>
          <p className="ui-help">
            Mark {words.article} {words.noun} as removed to see the business without them. Your real data does not change, and Undo returns exactly to the modelled numbers.
          </p>

          {message ? <p className="ui-help">{message}</p> : null}

          {unplaced_total > 0 ? (
            <p className="ui-help">
              No live asset is left to take {money(unplaced_total)} of overhead that was assigned to removed assets, so it shows as unassigned.
            </p>
          ) : null}

          {rows.length === 0 ? (
            <p className="ui-help">{words.none}</p>
          ) : (
            <div className="ui-stack-sm">
              {rows.map((row) => {
                const is_removed = removed.includes(row.id);
                const flag = flags[scenario.kind + ":" + row.id] || "";

                return (
                  <div key={row.id} className="ui-panel">
                    <div className="ui-split">
                      <div className="ui-stack-sm">
                        <div className="ui-label">{row.name}</div>
                        {row.detail ? <div className="ui-help">{row.detail}</div> : null}
                        {is_removed && flag === "baseline_changed" ? (
                          <div className="ui-help">
                            The baseline was corrected after this change was set. Check that it still makes sense.
                          </div>
                        ) : null}
                      </div>

                      <div className="ui-actions">
                        {is_removed ? <span className="ui-pill ui-pill-warning">Removed in scenario</span> : null}
                        <button
                          type="button"
                          className={is_removed ? "ui-button-secondary" : "ui-button-danger"}
                          onClick={() => toggle(row.id, !is_removed)}
                        >
                          {is_removed ? "Undo" : "Remove in scenario"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
