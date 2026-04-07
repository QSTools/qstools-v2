"use client";

export default function CostAllocationNoticeBanner() {
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
              You can create multiple allocation profiles (different structural
              setups), but only one profile is active at a time. The active
              profile is what the system uses for validation.
            </p>

            <div className="ui-stack">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Recommended workflow
              </p>

              <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)] space-y-1">
                <li>1. Confirm your recovery model above (read-only)</li>
                <li>2. Create asset ↔ staff capability links</li>
                <li>3. Build operational groups (real delivery units)</li>
                <li>4. Review structure validity and warnings</li>
                <li>5. Save the setup as a profile if needed</li>
              </ul>
            </div>

            <div className="ui-stack">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Key concepts
              </p>

              <ul className="list-disc pl-5 text-sm text-[var(--text-secondary)] space-y-1">
                <li>
                  <strong>Links</strong> = what <em>can</em> work together
                </li>
                <li>
                  <strong>Groups</strong> = what <em>must</em> work together
                </li>
                <li>
                  <strong>Profiles</strong> = saved structural setups (only one active at a time)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}