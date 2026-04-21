"use client";

export default function LabourProfileCard({
  state = {},
  has_profile = false,
  update_field,
  create_profile,
}) {
  function handle_create_profile() {
    if (typeof create_profile === "function") {
      create_profile();
    }
  }

  const profile_is_locked = Boolean(has_profile);

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Profile</div>
          <h2 className="ui-card-title">Labour profile</h2>
          <p className="ui-help">
            Start by creating the staff profile. Labour inputs stay locked until
            a profile exists because Labour owns staff identity.
          </p>
        </div>

        <div className="ui-stack-sm">
          <label className="ui-stack-sm">
            <span className="ui-label">Staff name</span>
            <input
              className="ui-input"
              type="text"
              value={state.staff_name ?? ""}
              onChange={(event) =>
                update_field?.("staff_name", event.target.value)
              }
              placeholder="Enter staff name"
              disabled={profile_is_locked}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Staff role</span>
            <input
              className="ui-input"
              type="text"
              value={state.staff_role ?? ""}
              onChange={(event) =>
                update_field?.("staff_role", event.target.value)
              }
              placeholder="Enter staff role"
              disabled={profile_is_locked}
            />
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Labour class</span>
            <input
              className="ui-input"
              type="text"
              value={state.labour_class ?? ""}
              onChange={(event) =>
                update_field?.("labour_class", event.target.value)
              }
              placeholder="Enter labour class"
              disabled={profile_is_locked}
            />
          </label>
        </div>

        <div className="ui-actions">
          <button
            type="button"
            className="ui-button-primary"
            onClick={handle_create_profile}
            disabled={profile_is_locked}
          >
            Create profile
          </button>
        </div>

        {profile_is_locked ? (
          <div className="ui-panel">
            <div className="ui-stack-sm">
              <div className="ui-kicker">Profile active</div>
              <p className="ui-help">
                The identity fields are now locked for this live profile. Start
                a new profile or load another saved profile to change the
                identity setup.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}