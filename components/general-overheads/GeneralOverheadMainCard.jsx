"use client";

import GeneralOverheadSummaryCard from "@/components/general-overheads/GeneralOverheadSummaryCard";
import GeneralOverheadReclassificationSection from "@/components/general-overheads/GeneralOverheadReclassificationSection";

function ProfilePanel({
  overhead_profile_name,
  effective_from,
  is_active,
  update_field,
  save_profile,
  reset_state,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Profile</div>
      <div className="ui-card-title-sm">General Overheads Profile</div>

      <label className="ui-field">
        <span className="ui-label">Profile Name</span>
        <input
          type="text"
          className="ui-input"
          value={overhead_profile_name ?? ""}
          onChange={(event) =>
            update_field("overhead_profile_name", event.target.value)
          }
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">Effective From</span>
        <input
          type="date"
          className="ui-input"
          value={effective_from ?? ""}
          onChange={(event) =>
            update_field("effective_from", event.target.value)
          }
        />
      </label>

      <label className="ui-field">
        <span className="ui-label">Active Profile</span>
        <select
          className="ui-input"
          value={is_active ? "true" : "false"}
          onChange={(event) =>
            update_field("is_active", event.target.value === "true")
          }
        >
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </label>

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-primary"
          onClick={save_profile}
        >
          Save Profile
        </button>

        <button
          type="button"
          className="ui-button-secondary"
          onClick={reset_state}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function SavedProfilesPanel({
  saved_overheads,
  load_profile,
  delete_profile,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Saved Profiles</div>
      <div className="ui-card-title-sm">Saved General Overheads</div>

      {saved_overheads?.length ? (
        <div className="ui-stack-sm">
          {saved_overheads.map((profile) => (
            <div
              key={profile.overhead_profile_id}
              className="ui-row-between ui-panel"
            >
              <div className="ui-stack-sm">
                <div className="ui-label">
                  {profile.overhead_profile_name || "Untitled Profile"}
                </div>
                <div className="ui-help">
                  {profile.effective_from || "No effective date"}
                </div>
              </div>

              <div className="ui-actions">
                <button
                  type="button"
                  className="ui-button-secondary"
                  onClick={() =>
                    load_profile(profile.overhead_profile_id)
                  }
                >
                  Load
                </button>

                <button
                  type="button"
                  className="ui-button-secondary"
                  onClick={() =>
                    delete_profile(profile.overhead_profile_id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ui-help">
          No saved overhead profiles yet.
        </div>
      )}
    </div>
  );
}

export default function GeneralOverheadMainCard({
  profile,
  profiles,
  form,
  summary,
  reclassification,
}) {
  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Business Overheads</div>
          <div className="ui-card-title">General Overheads</div>
          <p className="ui-help">
            Review, group, and confirm the annual overhead costs required to run
            the business outside Labour and Assets.
          </p>
        </div>

        <ProfilePanel {...profile} />

        <SavedProfilesPanel {...profiles} />

        <GeneralOverheadSummaryCard {...summary} />

        <GeneralOverheadReclassificationSection
          reclassification={reclassification}
          form={form}
        />
      </div>
    </section>
  );
}