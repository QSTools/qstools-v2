export default function AssetHelpPanel() {
  return (
    <section className="ui-section">
      <details className="ui-panel">
        <summary className="ui-label">Assets Help</summary>

        <div className="ui-stack mt-4">
          <p className="ui-help">
            This page defines the structural cost of your owned assets.
          </p>

          <p className="ui-help">
            These are fixed costs that exist whether work is busy or quiet.
          </p>

          <p className="ui-help">
            The gap between this total and your P&amp;L benchmark represents broader
            fleet or operating cost pressure that gets resolved later in recovery.
          </p>

          <p className="ui-help">
            This page is not a fleet expense tracker or a running-cost model.
          </p>
        </div>
      </details>
    </section>
  );
}