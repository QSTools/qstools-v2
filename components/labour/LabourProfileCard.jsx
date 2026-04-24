"use client";

const STAFF_ROLE_OPTIONS = [
  { value: "", label: "Select staff role" },
  { value: "owner_director", label: "Owner / Director" },
  { value: "project_manager", label: "Project Manager" },
  { value: "site_foreman", label: "Site Foreman" },
  { value: "leading_hand", label: "Leading Hand" },
  { value: "qualified_tradesperson", label: "Qualified Tradesperson" },
  { value: "apprentice", label: "Apprentice" },
  { value: "labourer", label: "Labourer" },
  { value: "operator", label: "Operator" },
  { value: "admin_support", label: "Admin / Support" },
];

const LABOUR_CLASS_OPTIONS = [
  { value: "", label: "Select labour class" },
  { value: "productive_labour", label: "Productive Labour" },
  { value: "supervision", label: "Supervision" },
  { value: "management", label: "Management" },
  { value: "apprentice_labour", label: "Apprentice Labour" },
  { value: "support_labour", label: "Support Labour" },
];

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
            <select
              className="ui-select"
              value={state.staff_role ?? ""}
              onChange={(event) =>
                update_field?.("staff_role", event.target.value)
              }
              disabled={profile_is_locked}
            >
              {STAFF_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="ui-stack-sm">
            <span className="ui-label">Labour class</span>
            <select
              className="ui-select"
              value={state.labour_class ?? ""}
              onChange={(event) =>
                update_field?.("labour_class", event.target.value)
              }
              disabled={profile_is_locked}
            >
              {LABOUR_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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