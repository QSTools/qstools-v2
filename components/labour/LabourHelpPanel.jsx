"use client";

export default function LabourHelpPanel() {
  return (
    <details className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5">
      <summary className="cursor-pointer list-none text-lg font-semibold">
        Labour Help
      </summary>

      <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
        <p>
          Productive hours are paid hours less entitlements, then reduced by the
          productivity percent.
        </p>
        <p>
          Employer contributions include KiwiSaver and ESCT when enabled.
        </p>
        <p>
          Minimum charge-out rate shows what the business needs to recover for the
          selected margin target.
        </p>
      </div>
    </details>
  );
}