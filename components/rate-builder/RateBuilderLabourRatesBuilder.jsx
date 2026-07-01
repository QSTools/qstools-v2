"use client";

import { useRateBuilderLabourRates } from "@/hooks/rate-builder/useRateBuilderLabourRates";

import RateBuilderLabourRatesInputCard from "@/components/rate-builder/RateBuilderLabourRatesInputCard";
import RateBuilderLabourRatesResultPanel from "@/components/rate-builder/RateBuilderLabourRatesResultPanel";
import RateBuilderLabourRatesSetupCard from "@/components/rate-builder/RateBuilderLabourRatesSetupCard";

export default function RateBuilderLabourRatesBuilder() {
  const model = useRateBuilderLabourRates();

  if (!model.active_model) {
    return (
      <section className="ui-section">
        <p className="ui-help">Loading labour rate builder…</p>
      </section>
    );
  }

  return (
    <section className="ui-section">
      <div className="ui-stack">
        <div>
          <p className="ui-kicker">Labour Rates Builder</p>
          <h2 className="ui-section-title">
            Build customer-facing labour charge-out rates.
          </h2>
          <p className="ui-help">
            Enter customer-facing rates by productive staff type. The all
            productive rate is a read-only weighted summary.
          </p>
        </div>

        <div className="rate-builder-labour">
          <div className="rate-builder-labour__left">
            <RateBuilderLabourRatesSetupCard model={model} />
            <RateBuilderLabourRatesInputCard model={model} />
          </div>

          <RateBuilderLabourRatesResultPanel model={model} />
        </div>
      </div>
    </section>
  );
}