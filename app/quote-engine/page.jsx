"use client";

import useQuoteEngine from "@/hooks/useQuoteEngine";

import QuoteEngineStatusStrip from "@/components/quote-engine/QuoteEngineStatusStrip";
import QuoteEngineMainCard from "@/components/quote-engine/QuoteEngineMainCard";
import QuoteEngineSideCard from "@/components/quote-engine/QuoteEngineSideCard";
import QuoteEngineBuildUpCard from "@/components/quote-engine/QuoteEngineBuildUpCard";
import QuoteEngineRepairPanel from "@/components/quote-engine/QuoteEngineRepairPanel";
import QuoteEngineHelpPanel from "@/components/quote-engine/QuoteEngineHelpPanel";

export default function QuoteEnginePage() {
  const {
    quote_state,
    repair_state,
    update_field,
    update_repair_field,
    status,
    build_up,
    repair,
  } = useQuoteEngine();

  return (
    <main className="ui-page">
      <div className="ui-page-stack">
        <QuoteEngineStatusStrip
          quote_result_status={status.quote_result_status}
          quote_warnings={status.quote_warnings}
          model_ready={status.model_ready}
          model_readiness_status={status.model_readiness_status}
          model_trust_state={status.model_trust_state}
          required_recovery_rate={status.required_recovery_rate}
          hourly_gap={status.hourly_gap}
          quote_gap={status.quote_gap}
        />

        <QuoteEngineMainCard
          quote_state={quote_state}
          update_field={update_field}
        />

        <QuoteEngineSideCard
          quote_result_status={status.quote_result_status}
          summary={status.summary}
        />

        <QuoteEngineBuildUpCard build_up={build_up} />

        <QuoteEngineRepairPanel
          repair_state={repair_state}
          update_repair_field={update_repair_field}
          repair={repair}
        />

        <QuoteEngineHelpPanel />
      </div>
    </main>
  );
}
