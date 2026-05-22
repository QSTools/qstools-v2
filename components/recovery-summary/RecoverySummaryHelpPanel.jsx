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
            Recovery Summary tests whether the cost base is recovered correctly
            for the active business mode. It does not build the cost base.
            Labour, Assets, General Overheads, Revenue / COGS, Cost Summary,
            and Business Summary own the source numbers.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            What this page uses
          </h4>

          <p className="ui-help">
            In hours-based mode, labour recovers labour, productive assets
            recover productive assets, and materials cover themselves and
            create margin. There is no cross-subsidy between those streams.
          </p>

          <p className="ui-help">
            This exposes whether material margin is hiding a labour or asset
            recovery problem.
          </p>

          <p className="ui-help">
            In product / unit-based mode, COGS is consumed to create the
            product. Margin after COGS must recover labour, assets, overheads,
            and profit. The unit must carry the whole business.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            How to use it
          </h4>

          <p className="ui-help">
            Start by checking the active recovery mode. Hours-based businesses
            should review the labour, asset, and material margin tests
            separately.
          </p>

          <p className="ui-help">
            In product mode, start by checking whether margin per unit covers
            the full business cost per unit.
          </p>

          <p className="ui-help">
            Cost Allocation is still the structural test. It does not add
            materials to working-unit recovery.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            What this page does not do
          </h4>

          <p className="ui-help">
            This page does not set sell rates, packages, quotes, or pricing
            logic. It does not assign operators to assets. Labour-to-asset
            pairing happens later in Cost Allocation.
          </p>

          <p className="ui-help">
            Product mode does not create separate labour, material, and asset
            recovery streams at the Recovery Summary level. Only margin after
            COGS recovers the business.
          </p>
        </div>

        <div>
          <h4 className="text-base font-semibold text-[var(--text-primary)]">
            What happens next
          </h4>

          <p className="ui-help">
            Cost Allocation tests whether the actual business structure can
            support the recovery model. Live job feedback can later show what
            actually happened across labour, materials / products, and
            productive asset use.
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
