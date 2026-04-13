export default function QuickStartHelpPanel() {
  return (
    <section className="ui-section">
      <details className="ui-panel">
        <summary className="ui-label">How Quick Start works</summary>

        <div className="ui-stack">
          <p className="ui-help">
            Quick Start is the entry point into QS Tools.
          </p>

          <p className="ui-help">
            The m² Labour Rate mode builds a labour rate per square metre from
            gang output, crew structure, and hourly recovery.
          </p>

          <p className="ui-help">
            It is designed to help you see what labour needs to charge per m²
            before you layer in materials, broader overheads, and full install pricing.
          </p>

          <p className="ui-help">
            It is not a full business model. It does not include overheads,
            entitlements, or your full cost structure.
          </p>

          <p className="ui-help">
            The full QS Tools system builds your business model from your real
            numbers and checks whether the quote actually works for your
            business before you commit.
          </p>
        </div>
      </details>
    </section>
  );
}