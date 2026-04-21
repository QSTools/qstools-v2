"use client";

export default function SavedProfilesCard({
  profile_rows = [],
  active_profile_id = "",
  load_profile,
  save_profile,
  start_new_profile,
  delete_profile,
  has_profile = false,
}) {
  function handle_load(profile_id) {
    if (typeof load_profile === "function") {
      load_profile(profile_id);
    }
  }

  function handle_save() {
    if (typeof save_profile === "function") {
      save_profile();
    }
  }

  function handle_new() {
    if (typeof start_new_profile === "function") {
      start_new_profile();
    }
  }

  function handle_delete(profile_id, staff_name) {
    const confirmed = window.confirm(
      `Delete Labour profile "${staff_name}"? This will also remove linked employee overhead profiles for that staff record.`
    );

    if (!confirmed) return;

    if (typeof delete_profile === "function") {
      delete_profile(profile_id);
    }
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-split">
          <div className="ui-stack-sm">
            <div className="ui-kicker">Profiles</div>
            <h2 className="ui-card-title">Saved Labour profiles</h2>
            <p className="ui-help">
              Load, save, start fresh, or remove Labour profiles. The active
              profile controls the live Labour state.
            </p>
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-primary"
              onClick={handle_save}
              disabled={!has_profile}
            >
              Save profile
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={handle_new}
            >
              New profile
            </button>
          </div>
        </div>

        {profile_rows.length === 0 ? (
          <div className="ui-panel">
            <p className="ui-help">
              No saved Labour profiles yet. Create your first Labour profile to
              begin.
            </p>
          </div>
        ) : (
          <div className="ui-stack-sm">
            {profile_rows.map((profile) => {
              const is_active =
                profile.is_current || profile.profile_id === active_profile_id;

              return (
                <div key={profile.profile_id} className="ui-panel">
                  <div className="ui-stack-sm">
                    <div className="ui-split">
                      <div className="ui-stack-sm">
                        <div className="ui-label">{profile.staff_name}</div>
                        <div className="ui-help">
                          {profile.staff_role} · {profile.labour_class}
                        </div>
                        {profile.updated_at_label ? (
                          <div className="ui-help">
                            Updated: {profile.updated_at_label}
                          </div>
                        ) : null}
                      </div>

                      <div className="ui-actions">
                        <span className="ui-pill">
                          {is_active ? "Active" : "Saved"}
                        </span>
                      </div>
                    </div>

                    <div className="ui-actions">
                      <button
                        type="button"
                        className="ui-button-secondary"
                        onClick={() => handle_load(profile.profile_id)}
                      >
                        Load
                      </button>

                      <button
                        type="button"
                        className="ui-button-danger"
                        onClick={() =>
                          handle_delete(profile.profile_id, profile.staff_name)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}