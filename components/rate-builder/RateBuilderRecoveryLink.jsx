"use client";

export default function RateBuilderRecoveryLink() {
  return (
    <section className="ui-section">
      <p className="ui-kicker">Recovery Link</p>

      <h2 className="ui-section-title">Recovery comparison</h2>

      <p className="ui-help">
        This section will later compare calculated rates against required
        recovery targets from Recovery Summary and Business Outcome.
      </p>

      <div className="mt-5 rate-builder-recovery-note">
        <p className="rate-builder-recovery-note__title">
          Future connection point
        </p>

        <p className="rate-builder-recovery-note__body">
          Once labour rates and customer charge calculators are stable, this
          section will test whether the calculated effective rates are high
          enough to recover labour, asset, overhead, and profit requirements.
        </p>
      </div>
    </section>
  );
}