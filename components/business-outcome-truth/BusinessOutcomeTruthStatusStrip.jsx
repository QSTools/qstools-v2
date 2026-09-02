"use client";

export default function BusinessOutcomeTruthStatusStrip({ output_contract }) {
  const { data_status, downstream_ready, warning_list, data_quality_list, reconciliation_status } =
    output_contract;
  const warning_count =
    (warning_list?.value?.length ?? 0) + (data_quality_list?.value?.length ?? 0);

  // Dark theme (this session) - matches the rest of the page. No amber/
  // warning CSS variable exists in this codebase, so "partial" reuses
  // --info (blue), consistent with how the Warnings panel handles the
  // same gap.
  const status_color =
    data_status === "blocked"
      ? "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]"
      : data_status === "partial"
        ? "border-[var(--info)] bg-[rgba(59,130,246,0.08)] text-[var(--info)]"
        : "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]";
  const status_label =
    data_status === "blocked"
      ? "Blocked - upstream data not trusted"
      : data_status === "partial"
        ? "Partial - some upstream sources not yet ready"
        : "Complete - all upstream sources ready";

  // Click-through to the combined "Not yet assigned & data quality"
  // section (this session) - lives inside BusinessOutcomePerSourceRevenueCard,
  // a sibling component, so this uses a stable DOM id + native scrollIntoView
  // rather than lifted state, to avoid threading shared state through two
  // separate component trees for a simple navigation action. Opens the
  // section (simulates a click on its own toggle, same mechanism the user
  // would use) if it's currently collapsed, then scrolls to it.
  function go_to_warnings_section() {
    // "Not yet assigned & data quality" lives nested inside the outer
    // breakdown wrapper. That wrapper no longer has its own toggle
    // button (merged into Card 1's "Show breakdown" button this
    // session) - so this dispatches a custom event the card listens for
    // to open both states together, then waits a frame for that state
    // update to actually render before finding and opening the specific
    // inner section and scrolling to it.
    window.dispatchEvent(new CustomEvent("business-outcome-open-breakdown"));
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById("business-outcome-warnings-section");
        if (!el) return;
        const toggle_btn = el.querySelector('button[aria-expanded="false"]');
        if (toggle_btn) toggle_btn.click();
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    });
  }

  return (
    <button
      type="button"
      onClick={go_to_warnings_section}
      className={`w-full text-left cursor-pointer rounded-lg border px-4 py-3 flex items-center justify-between ${status_color}`}
    >
      <div className="flex items-center gap-3">
        <span className="font-semibold text-sm">{status_label}</span>
        {warning_count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
            {warning_count} flag{warning_count !== 1 ? "s" : ""}
          </span>
        )}
        {reconciliation_status === "mismatch" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-input)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
            Reconciliation mismatch
          </span>
        )}
      </div>
      <span className="text-xs opacity-75">
        {downstream_ready?.value ? "Ready for downstream use" : "Not yet ready for downstream use"}
      </span>
    </button>
  );
}
