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
            It reflects a quote or rate back to you in simple terms so you can
            quickly see what your time is earning, how the work is structured,
            and where the value is coming from.
          </p>

          <p className="ui-help">
            The Labour Reality Check mode shows what a contractor rate is
            actually worth after standard NZ unpaid time assumptions.
          </p>

          <p className="ui-help">
            It is not a full business model. It does not include overheads,
            entitlements beyond the simplified assumption set, or your full cost
            structure.
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