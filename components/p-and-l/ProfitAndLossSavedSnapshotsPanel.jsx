"use client";

import CollapsibleSection from "@/components/common/CollapsibleSection";

export default function ProfitAndLossSavedSnapshotsPanel({
  profiles = [],
  show_saved_snapshots = false,
  on_load,
  on_delete,
}) {
  if (!show_saved_snapshots) return null;

  return (
    <CollapsibleSection
      title="Saved Snapshots"
      summary="Load a saved full-year or monthly P&L snapshot."
      defaultOpen={true}
    >
      <div className="ui-stack-sm">
        {profiles.length === 0 ? (
          <div className="ui-panel ui-stack-sm">
            <div className="ui-help">No saved snapshots yet.</div>
          </div>
        ) : (
          profiles
            .slice()
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .map((profile) => (
              <div key={profile.id} className="ui-panel ui-stack-sm">
                <div className="ui-stack-sm">
                  <div className="ui-label">{profile.label}</div>
                  <div className="ui-help">
                    {profile.type === "monthly"
                      ? "Monthly snapshot"
                      : "Full-year snapshot"}
                  </div>
                </div>

                <div className="ui-actions">
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={() => on_load(profile.id)}
                  >
                    Load
                  </button>

                  <button
                    type="button"
                    className="ui-button-danger"
                    onClick={() => on_delete(profile.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
        )}
      </div>
    </CollapsibleSection>
  );
}