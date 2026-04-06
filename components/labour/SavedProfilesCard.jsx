"use client";

function formatMoney(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function SummaryField({ label, value, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--danger)] border-[var(--danger)] bg-[var(--danger-soft)]"
      : "text-[var(--text-primary)] border-[var(--border-strong)] bg-[var(--bg-card)]";

  return (
    <div>
      <div className="ui-label">{label}</div>
      <div className={`ui-readonly ${toneClass}`}>{value}</div>
    </div>
  );
}

function ActiveBadge() {
  return (
    <div className="ui-pill border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]">
      Active
    </div>
  );
}

export default function SavedProfilesCard({
  saved_profiles = [],
  active_profile_id = "",
  selected_profile_id = "",
  set_selected_profile_id,
  load_profile,
  delete_profile,
}) {
  const activeProfile =
    saved_profiles.find((profile) => profile.id === active_profile_id) || null;

  return (
    <section className="ui-section">
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Saved Profiles
        </h2>
        <p className="ui-help">
          Load an existing labour profile or remove one you no longer need.
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="ui-label">Select Saved Profile</label>
          <select
            value={selected_profile_id || ""}
            onChange={(e) => set_selected_profile_id?.(e.target.value)}
            className="ui-input"
          >
            <option value="">Choose a saved profile</option>
            {saved_profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.staff_name}
                {profile.staff_role ? ` • ${profile.staff_role}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="ui-actions">
          <button
            type="button"
            onClick={() => load_profile?.(selected_profile_id)}
            disabled={!selected_profile_id}
            className="ui-button-primary"
          >
            Load Profile
          </button>

          <button
            type="button"
            onClick={() => delete_profile?.(selected_profile_id)}
            disabled={!selected_profile_id}
            className="ui-button-danger"
          >
            Delete Profile
          </button>
        </div>

        {activeProfile ? (
          <div className="ui-panel">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {activeProfile.staff_name || "Unnamed Profile"}
                </div>

                <div className="ui-help mt-2">
                  {[activeProfile.staff_role, activeProfile.labour_class]
                    .filter(Boolean)
                    .join(" • ") || "No role details"}
                </div>
              </div>

              <ActiveBadge />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SummaryField
                label="Charge-Out Rate"
                value={formatMoney(activeProfile.charge_out_rate)}
              />

              <SummaryField
                label="Labour Rate"
                value={formatMoney(activeProfile.labour_rate)}
              />

              <SummaryField
                label="Productivity %"
                value={`${Number(activeProfile.productivity_percent || 0).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )}%`}
              />

              <SummaryField
                label="Margin Target %"
                value={`${Number(activeProfile.margin_target_percent || 0).toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )}%`}
              />
            </div>
          </div>
        ) : (
          <div className="ui-panel text-[var(--text-muted)]">
            No active profile loaded
          </div>
        )}
      </div>
    </section>
  );
}