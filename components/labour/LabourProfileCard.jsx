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
  { value: "productive", label: "Productive" },
  { value: "non_productive", label: "Non-productive" },
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

  function handle_labour_class_change(value) {
    update_field?.("labour_class", value);
    update_field?.(
      "contributes_to_recovery_hours",
      value === "non_productive" ? false : true
    );
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
                handle_labour_class_change(event.target.value)
              }
            >
              {LABOUR_CLASS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="ui-help">
              Productive staff add recovery hours. Non-productive staff add
              cost, but their hours do not reduce the Cost Summary recovery
              rate.
            </span>
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
                Staff identity fields are now locked for this live profile.
                Labour class remains editable so recovery-hour treatment can be
                updated and saved.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
