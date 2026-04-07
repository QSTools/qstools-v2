export default function GeneralOverheadProfilesCard({
  overhead_profile_name,
  effective_from,
  is_active,
  save_profile,
  reset_state,
  update_field,
  saved_overheads,
  load_profile,
  delete_profile,
}) {
  return (
    <section className="ui-panel">
      <div className="ui-page-stack">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Profile
          </h2>
          <p className="ui-help">
            Save, load, and manage general overhead versions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <label className="ui-stack">
            <span className="ui-label">Profile name</span>
            <input
              className="ui-input"
              value={overhead_profile_name || ""}
              onChange={(event) =>
                update_field("overhead_profile_name", event.target.value)
              }
              placeholder="Office baseline 2026"
            />
          </label>

          <label className="ui-stack">
            <span className="ui-label">Effective from</span>
            <input
              type="date"
              className="ui-input"
              value={effective_from || ""}
              onChange={(event) =>
                update_field("effective_from", event.target.value)
              }
            />
          </label>
        </div>

        <div className="ui-actions">
          <button type="button" className="ui-button-primary" onClick={save_profile}>
            Save profile
          </button>
          <button type="button" className="ui-button-secondary" onClick={reset_state}>
            Reset
          </button>
          <span className="ui-pill">{is_active ? "Active" : "Inactive"}</span>
        </div>

        <div className="ui-stack">
          {(saved_overheads ?? []).map((item) => (
            <div key={item.overhead_profile_id} className="ui-panel">
              <div className="ui-split">
                <div>
                  <p className="ui-label">
                    {item.overhead_profile_name || "Untitled Profile"}
                  </p>
                  <p className="ui-help">
                    Effective from: {item.effective_from || "Not set"}
                  </p>
                </div>

                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={() => load_profile(item.overhead_profile_id)}
                  >
                    Load
                  </button>

                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={() => delete_profile(item.overhead_profile_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}