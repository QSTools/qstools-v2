"use client";

export default function CostAllocationProfilesCard({
  allocation_profile_name,
  effective_from,
  set_field,
  on_save_profile,
  on_new_profile,
  profiles,
  active_profile_id,
  on_load_profile,
  on_delete_profile,
}) {
  return (
    <section className="ui-panel">
      <div className="ui-stack">
        <div className="ui-actions">
          <div>
            <p className="ui-kicker">Profile</p>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">
              Save, load, and edit allocation setups
            </h3>
            <p className="ui-help">
              Save the current structural setup as an allocation profile, then
              load or edit it later.
            </p>
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={on_new_profile}
            >
              New
            </button>

            <button
              type="button"
              className="ui-button-primary"
              onClick={on_save_profile}
            >
              Save
            </button>
          </div>
        </div>

        <label className="block">
          <span className="ui-label">Profile name</span>
          <input
            className="ui-input"
            type="text"
            value={allocation_profile_name ?? ""}
            onChange={(event) =>
              set_field("allocation_profile_name", event.target.value)
            }
          />
        </label>

        <label className="block">
          <span className="ui-label">Effective from</span>
          <input
            className="ui-input"
            type="date"
            value={effective_from ?? ""}
            onChange={(event) => set_field("effective_from", event.target.value)}
          />
        </label>

        <div className="ui-stack">
          <span className="ui-label">Saved profiles</span>

          {!Array.isArray(profiles) || profiles.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">
              No saved allocation profiles yet.
            </p>
          ) : (
            profiles.map((profile) => {
              const is_active =
                profile?.active_allocation_profile_id === active_profile_id;

              return (
                <div
                  key={profile?.active_allocation_profile_id}
                  className={[
                    "ui-readonly",
                    is_active ? "border-[var(--accent)]" : "",
                  ].join(" ")}
                >
                  <div className="ui-actions">
                    <div>
                      <div className="text-sm text-[var(--text-primary)]">
                        {profile?.allocation_profile_name || "Unnamed Profile"}
                      </div>

                      <div className="text-sm text-[var(--text-secondary)]">
                        {profile?.effective_from || "No date"}
                        {is_active ? " · Active profile" : ""}
                      </div>
                    </div>

                    <div className="ui-actions">
                      <button
                        type="button"
                        className="ui-button-secondary"
                        onClick={() =>
                          on_load_profile(profile?.active_allocation_profile_id)
                        }
                      >
                        Load
                      </button>

                      <button
                        type="button"
                        className="ui-button-danger"
                        onClick={() =>
                          on_delete_profile(profile?.active_allocation_profile_id)
                        }
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
      </div>
    </section>
  );
}