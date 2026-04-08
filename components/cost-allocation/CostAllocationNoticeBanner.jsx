"use client";

export default function CostAllocationNoticeBanner({
  active_profile_name = "",
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack">
          <div>
            <p className="ui-kicker">Important context</p>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              How to use this page
            </h2>
          </div>

          <div className="ui-stack">
            <p className="text-sm text-[var(--text-primary)]">
              This page validates whether your real-world structure can support
              your recovery model. It does not calculate pricing or costs.
            </p>

            <p className="text-sm text-[var(--text-secondary)]">
              You can create multiple allocation profiles, but only one profile is
              active at a time. The active profile is what the system uses for
              structural validation.
            </p>

            <div className="ui-readonly">
              <span className="ui-label">Active allocation profile</span>
              <div className="mt-1 text-sm text-[var(--text-primary)]">
                {active_profile_name || "No active profile selected"}
              </div>
            </div>

            <div className="ui-stack">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Recommended workflow
              </p>

              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                <li>Confirm recovery model above</li>
                <li>Create asset ↔ staff capability links</li>
                <li>Build operational groups</li>
                <li>Review structure validity and warnings</li>
                <li>Save the setup as a profile if needed</li>
              </ul>
            </div>

            <div className="ui-stack">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Key concepts
              </p>

              <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
                <li>Links = what can work together</li>
                <li>Groups = what must work together</li>
                <li>Profiles = saved structural setups (one active at a time)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}