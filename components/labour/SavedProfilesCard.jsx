"use client";

import { useState } from "react";

export default function SavedProfilesCard({
  profile_rows = [],
  active_profile_id,
  load_profile,
  save_profile,
  start_new_profile,
  delete_profile,
  has_profile,
}) {
  const [is_open, setIsOpen] = useState(false);

  function handle_delete(profile_id, profile_name) {
    const confirmed = window.confirm(
      `Delete profile "${profile_name || "Unnamed"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    delete_profile(profile_id);
  }

  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div className="ui-split">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Saved Profiles
              </h2>
              <p className="ui-help">
                Load, edit, save, or delete your labour profiles.
              </p>
            </div>

            <div className="ui-actions">
              <button
                type="button"
                onClick={() => setIsOpen((previous) => !previous)}
                className="ui-button-secondary"
              >
                {is_open ? "Hide Profiles" : "Show Profiles"}
              </button>
            </div>
          </div>

          <div className="ui-actions">
            <button
              type="button"
              onClick={save_profile}
              disabled={!has_profile || !active_profile_id}
              className="ui-button-primary"
            >
              Save Active Profile
            </button>

            <button
              type="button"
              onClick={start_new_profile}
              className="ui-button-secondary"
            >
              Start New Profile
            </button>
          </div>

          {active_profile_id ? (
            <div className="ui-help">
              Active profile loaded. Use{" "}
              <span className="text-[var(--text-primary)]">
                Save Active Profile
              </span>{" "}
              to update it.
            </div>
          ) : null}

          {is_open ? (
            <div className="ui-stack">
              {profile_rows.length === 0 ? (
                <div className="ui-panel border-dashed border-[var(--border-strong)]">
                  <div className="text-sm text-[var(--text-muted)]">
                    No saved profiles yet.
                  </div>
                </div>
              ) : (
                profile_rows.map((profile) => {
                  const is_active = profile.is_current;

                  return (
                    <div key={profile.profile_id} className="ui-panel">
                      <div className="ui-stack">
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">
                            {profile.staff_name}
                          </div>

                          <div className="ui-help">
                            {profile.staff_role} · {profile.labour_class}
                          </div>

                          <div className="mt-2 text-sm text-[var(--text-muted)]">
                            Updated: {format_date(profile.updated_at_label)}
                          </div>
                        </div>

                        {is_active ? (
                          <div className="ui-pill border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]">
                            Active
                          </div>
                        ) : null}

                        <div className="ui-actions">
                          <button
                            type="button"
                            onClick={() => load_profile(profile.profile_id)}
                            className="ui-button-secondary"
                          >
                            Load
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handle_delete(profile.profile_id, profile.staff_name)
                            }
                            className="ui-button-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function format_date(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString();
}