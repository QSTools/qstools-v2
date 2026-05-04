"use client";

export default function QuoteEngineHelpPanel() {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-card-title">How the Quote Engine works</div>

        <p className="ui-help">
          This page checks whether a quote supports your business model. It is a
          baseline-only Quote Engine, not a scenario comparison or full estimating
          system.
        </p>

        <p className="ui-help">
          Internal labour is checked against your true labour model. Direct cost
          packages are checked against the quote allowance pool. Materials are
          checked for margin only.
        </p>

        <p className="ui-help">
          QS Tools does not validate material quantities. It validates the quote
          build-up against the business recovery requirement and the model
          labour cost.
        </p>

        <p className="ui-help">
          The quote gap shows whether the margin pool is enough to carry the
          business for the hours allowed.
        </p>

        <p className="ui-help">
          Later, the same quote can be tested against baseline, upside, and
          downside scenarios once the broader modelling sheets are in place.
        </p>

        <p className="ui-help">
          Accepted quotes may later feed the monthly feedback loop, but this page
          only supports baseline review today.
        </p>
      </div>
    </section>
  );
}
