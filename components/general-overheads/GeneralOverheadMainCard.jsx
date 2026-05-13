"use client";

import GeneralOverheadSummaryCard from "@/components/general-overheads/GeneralOverheadSummaryCard";
import GeneralOverheadReclassificationSection from "@/components/general-overheads/GeneralOverheadReclassificationSection";

function ProfilePanel({
  overhead_profile_name,
  update_field,
  save_profile,
  reset_state,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Baseline</div>
      <div className="ui-card-title-sm">General Overheads Baseline</div>
      <p className="ui-help">
        Name and confirm the current overhead baseline. Operating-cost rows from
        P&amp;L are synced automatically.
      </p>

      <label className="ui-field">
        <span className="ui-label">Baseline Name</span>
        <input
          type="text"
          className="ui-input"
          value={overhead_profile_name ?? ""}
          onChange={(event) =>
            update_field("overhead_profile_name", event.target.value)
          }
        />
      </label>

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-primary"
          onClick={save_profile}
        >
          Save Baseline
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

export default function GeneralOverheadMainCard({
  profile,
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
            Confirm the overhead baseline, then reclassify any P&amp;L rows that
            are sitting in the wrong overhead category.
          </p>
        </div>

        <div className="general-overheads-layout">
          <div className="general-overheads-layout__left">
            <div className="general-overheads-layout__left-stack">
              <ProfilePanel {...profile} />

              <GeneralOverheadReclassificationSection
                reclassification={reclassification}
                form={form}
              />
            </div>
          </div>

          <div className="general-overheads-layout__right">
            <div className="general-overheads-layout__right-stack">
              <GeneralOverheadSummaryCard {...summary} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}