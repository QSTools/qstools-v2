"use client";

export default function BusinessSetupHelpPanel() {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-md">
        <div>
          <div className="ui-kicker">How this works</div>
          <div className="ui-card-title-sm">Why business type matters</div>
          <p className="ui-help">
            QS Tools uses one core engine: total business cost divided by the
            output driver. The business type decides what that driver is.
          </p>
        </div>

        <div className="ui-grid ui-grid-2">
          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Hours</div>
            <strong>Service / Labour-based</strong>
            <p className="ui-help">
              Use this when the business mainly sells time, labour, services,
              charge-out hours, or productive output.
            </p>
            <p className="ui-help">
              The activity driver is productive hours.
            </p>
          </div>

          <div className="ui-panel ui-stack-sm">
            <div className="ui-kicker">Units</div>
            <strong>Product / Unit-based</strong>
            <p className="ui-help">
              Use this when the business mainly sells products, units,
              subscriptions, licences, or productised outputs.
            </p>
            <p className="ui-help">The activity driver is units sold.</p>
          </div>
        </div>

        <p className="ui-help">
          This setup does not lock the business into an industry. It only tells
          the system whether recovery should be interpreted through hours or
          units.
        </p>
      </div>
    </section>
  );
}