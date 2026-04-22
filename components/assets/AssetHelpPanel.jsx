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
            These are fixed costs that exist regardless of workload.
          </p>

          <p className="ui-help">
            The difference between this total and your P&amp;L benchmark represents
            shared fleet costs, pooled expenses, or broader operational cost pressure.
          </p>

          <p className="ui-help">
            Those are resolved later in the recovery structure.
          </p>

          <p className="ui-help">
            This page is not a fleet expense tracker or a running-cost model.
          </p>
        </div>
      </details>
    </section>
  );
}