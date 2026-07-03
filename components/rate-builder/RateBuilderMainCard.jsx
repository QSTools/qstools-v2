"use client";
import { useState } from "react";
import { useRateBuilderLabourRates } from "@/hooks/rate-builder/useRateBuilderLabourRates";
import RateBuilderTabs from "@/components/rate-builder/RateBuilderTabs";
import RateBuilderOverview from "@/components/rate-builder/RateBuilderOverview";
import RateBuilderLineCalculator from "@/components/rate-builder/RateBuilderLineCalculator";
import RateBuilderLabourRatesBuilder from "@/components/rate-builder/RateBuilderLabourRatesBuilder";
import RateBuilderRecoveryLink from "@/components/rate-builder/RateBuilderRecoveryLink";
import RateBuilderHelpPanel from "@/components/rate-builder/RateBuilderHelpPanel";

const RATE_BUILDER_TABS = [
  { id: "overview", label: "Overview" },
  { id: "customer_charge_calculator", label: "Customer Charge Calculator" },
  { id: "labour_rates_builder", label: "Labour Rates Builder" },
  { id: "recovery_link", label: "Recovery Link" },
  { id: "help", label: "Help" },
];

export default function RateBuilderMainCard() {
  const [active_tab, set_active_tab] = useState("overview");
  const labour_rates_model = useRateBuilderLabourRates();

  const labour_rate_context = {
    current_charge_out_rate:
      Number(labour_rates_model?.current_charge_out_rate) || 0,
    minimum_recoverable_charge_out_rate:
      Number(labour_rates_model?.minimum_recoverable_charge_out_rate) || 0,
  };

  return (
    <section className="ui-stack">
      <RateBuilderTabs
        tabs={RATE_BUILDER_TABS}
        active_tab={active_tab}
        on_change={set_active_tab}
      />
      {active_tab === "overview" ? <RateBuilderOverview /> : null}
      {active_tab === "customer_charge_calculator" ? (
        <RateBuilderLineCalculator labour_rate_context={labour_rate_context} />
      ) : null}
      {active_tab === "labour_rates_builder" ? (
        <RateBuilderLabourRatesBuilder model={labour_rates_model} />
      ) : null}
      {active_tab === "recovery_link" ? <RateBuilderRecoveryLink /> : null}
      {active_tab === "help" ? <RateBuilderHelpPanel /> : null}
    </section>
  );
}
