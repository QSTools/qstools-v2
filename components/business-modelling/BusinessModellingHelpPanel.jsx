"use client";

export default function BusinessModellingHelpPanel() {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">How Business Modelling works</div>
        <div className="ui-card-title-sm">Controlled scenario benchmark</div>
        <p className="ui-help">
          Business Summary shows what the business currently is. Business Modelling
          shows what the business could become if the assumptions change.
        </p>
        <div className="ui-stack-sm">
          <p className="ui-help">
            Baseline is the locked current business. It is read-only unless you refresh it
            explicitly from current Business Summary.
          </p>
          <p className="ui-help">
            Upside tests a stronger performance scenario. Downside tests pressure. Scenario
            changes do not alter the real business model.
          </p>
          <p className="ui-help">
            Quote Engine can later test quotes against the selected model, using the benchmark
            created here.
          </p>
        </div>
      </div>
    </section>
  );
}
