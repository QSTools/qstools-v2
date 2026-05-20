export default function RecoverySummaryHelpPanel() {
  return (
    <details className="ui-panel">
      <summary className="cursor-pointer text-lg font-semibold text-[var(--text-primary)]">
        Recovery Summary help
      </summary>

      <div className="ui-stack mt-4">
        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            What this page does
          </h4>

          <p className="ui-help">
            Recovery Summary explains how the business intends to recover the
            cost burden carried forward from Business Summary. It turns the
            current recovery pressure into a starting recovery strategy before
            Cost Allocation tests whether the structure can support it.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            What this page uses
          </h4>

          <p className="ui-help">
            This page uses the Business Summary recovery outputs, including the
            selected recovery driver, required recovery rate, actual recovery
            rate, recovery gap, total cost burden, and current business model
            status.
          </p>

          <p className="ui-help">
            Labour recovery is tested through productive hours. Product
            recovery is tested through trading margin per unit and units sold.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            How to use it
          </h4>

          <p className="ui-help">
            Start by checking the recovery pressure at the top of the page. If
            the business is below the required recovery rate, the page shows how
            that burden is expected to be recovered through labour, productive
            assets, materials / products, or a hybrid model.
          </p>

          <p className="ui-help">
            In product mode, start by checking whether margin per unit and
            expected annual unit volume can cover the business cost burden.
          </p>

          <p className="ui-help">
            The recovery strategy selector lets you choose the model that best
            matches how the business expects to recover margin. The suggested
            starting split is read-only in V1 because the true split cannot be
            proven until live job feedback is available.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            What this page does not do
          </h4>

          <p className="ui-help">
            This page does not set sell rates, packages, quotes, or pricing
            logic. It does not prove actual labour margin, material margin, or
            asset contribution. Those become clearer later through Cost
            Allocation and live job feedback.
          </p>

          <p className="ui-help">
            Product mode does not belong in Cost Allocation. Cost Allocation
            remains structural only: it tests whether the selected recovery
            model can be supported by the visible business structure.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            What happens next
          </h4>

          <p className="ui-help">
            Cost Allocation uses the selected recovery model to test whether the
            actual business structure can support it. Live job feedback will
            later improve the recovery split by showing what actually happened
            across labour, materials / products, and productive asset use.
          </p>
        </div>

        <div className="ui-readonly">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Guardrail: Recovery Summary defines the starting recovery model. It
            must not rebuild upstream Labour, Assets, General Overheads, Cost
            Summary, or Business Summary calculations.
          </p>
        </div>
      </div>
    </details>
  );
}
