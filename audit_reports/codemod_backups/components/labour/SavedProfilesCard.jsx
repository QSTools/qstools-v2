"use client";

import { useMemo, useState } from "react";

export default function SavedProfilesCard({
  profiles,
  active_profile_id,
  load_profile,
  save_profile,
  start_new_profile,
  delete_profile,
  has_profile,
}) {
  const [is_open, setIsOpen] = useState(false);

  const sorted_profiles = useMemo(() => {
    return [...profiles].sort((a, b) => {
      const a_time = new Date(a.updated_at || a.created_at || 0).getTime();
      const b_time = new Date(b.updated_at || b.created_at || 0).getTime();
      return b_time - a_time;
    });
  }, [profiles]);

  function handle_delete(profile_id, profile_name) {
    const confirmed = window.confirm(
      `Delete profile "${profile_name || "Unnamed"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    delete_profile(profile_id);
  }

  return (
    <section className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Saved Profiles</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Load, edit, save, or delete your labour profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((previous) => !previous)}
          className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"
        >
          {is_open ? "Hide Profiles" : "Show Profiles"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save_profile}
          disabled={!has_profile || !active_profile_id}
          className="rounded-xl bg-white px-4 py-3 text-sm min-h-[44px] font-medium text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save Active Profile
        </button>

        <button
          type="button"
          onClick={start_new_profile}
          className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"
        >
          Start New Profile
        </button>
      </div>

      {active_profile_id && (
        <div className="mt-3 text-sm text-[var(--text-muted)]">
          Active profile loaded. Use{" "}
          <span className="text-white">Save Active Profile</span> to update it.
        </div>
      )}

      {is_open && (
        <div className="mt-5 space-y-3">
          {sorted_profiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-input)] px-4 py-4 text-sm text-[var(--text-muted)]">
              No saved profiles yet.
            </div>
          ) : (
            sorted_profiles.map((profile) => {
              const is_active = profile.profile_id === active_profile_id;
              const profile_name = profile.data?.staff_name || "Unnamed";

              return (
                <div
                  key={profile.profile_id}
                  className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-input)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {profile_name}
                      </div>
                      <div className="mt-1 text-sm text-[var(--text-muted)]">
                        {profile.data?.staff_role || "No role"} ·{" "}
                        {profile.data?.labour_class || "No class"}
                      </div>
                      <div className="mt-2 text-sm text-[var(--text-muted)]">
                        Updated:{" "}
                        {format_date(profile.updated_at || profile.created_at)}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {is_active && (
                        <div className="rounded-full border border-[var(--success)] bg-[var(--success-soft)] px-3 py-2 text-sm min-h-[40px] text-[var(--success)]">
                          Active
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => load_profile(profile.profile_id)}
                          className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-3 text-sm min-h-[44px] text-[var(--text-primary)]"
                        >
                          Load
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handle_delete(profile.profile_id, profile_name)
                          }
                          className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm min-h-[44px] text-[var(--danger)]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

function format_date(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString();
}