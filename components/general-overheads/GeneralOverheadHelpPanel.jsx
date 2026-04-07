export default function GeneralOverheadHelpPanel() {
  return (
    <section className="ui-section">
      <details>
        <summary className="ui-label cursor-pointer">
          What this module includes
        </summary>

        <div className="mt-4 ui-stack">
          <p className="ui-help">
            General Overheads captures annual business-level operating costs that
            are not tied directly to staff, staff overheads, or assets.
          </p>
          <p className="ui-help">
            This module does not perform allocation, recovery, pricing, or linking logic.
          </p>
          <p className="ui-help">
            Cost Summary must consume the locked output contract only:
            total_general_overheads.
          </p>
        </div>
      </details>
    </section>
  );
}