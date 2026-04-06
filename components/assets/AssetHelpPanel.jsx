export default function AssetHelpPanel() {
  return (
    <section className="ui-section">
      <details className="ui-panel">
        <summary className="ui-label">Assets Help</summary>

        <div className="ui-stack mt-4">
          <p className="ui-help">
            Assets captures capital-cost inputs and produces asset-level annual
            cash-cost outputs.
          </p>

          <p className="ui-help">
            This module does not assign assets to staff, perform recovery logic,
            or create asset packages.
          </p>

          <p className="ui-help">
            Depreciation is excluded as this model is based on real cash cost recovery.
          </p>

          <p className="ui-help">
            In V1, the output contract is prepared for downstream Cost Summary use.
          </p>
        </div>
      </details>
    </section>
  );
}