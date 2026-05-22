export default function RecoverySummaryHandoffBlock({
  material_recovery_included,
  asset_recovery_included,
}) {
  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Cost Allocation handoff
          </h3>

          <p className="ui-help">
            Recovery Summary defines the recovery test. Cost Allocation will
            test whether the business structure can support the relevant
            working-unit recovery.
          </p>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Next step: test the recovery model against labour, productive
              assets, and operating links where working-unit recovery applies.
            </p>

            {material_recovery_included ? (
              <p className="ui-help">
                Materials / products recovery is included. Actual material or
                product margin will be validated later through live job
                feedback.
              </p>
            ) : null}

            {asset_recovery_included ? (
              <p className="ui-help">
                Asset recovery is included. Cost Allocation will test whether
                productive asset structure can support the selected model.
              </p>
            ) : null}

            {!asset_recovery_included ? (
              <p className="ui-help">
                Asset recovery is not currently included in the starting split.
                Assets remain in the cost burden and can be tested later when
                productive utilisation is available.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
