"use client";

import { useEffect, useMemo, useState } from "react";

import useBusinessSummary from "@/hooks/useBusinessSummary";
import useCostSummary from "@/hooks/useCostSummary";
import useLabour from "@/hooks/useLabour";
import useModelReadiness from "@/hooks/useModelReadiness";

import { calculateQuoteEngine } from "@/lib/calculations/quoteEngineCalculations";
import {
  buildQuoteEngineStatus,
  buildQuoteEngineBuildUp,
  buildQuoteEngineRepair,
  buildQuoteEngineOutputContract,
} from "@/lib/selectors/quoteEngineSelectors";
import {
  getDefaultQuoteEngineState,
  loadQuoteEngineState,
  saveQuoteEngineState,
} from "@/lib/storage/quoteEngineStorage";

const NUMERIC_FIELDS = [
  "quote_price_total",
  "material_cost_total",
  "material_sell_total",
  "material_markup_percent",
  "labour_sell_total",
  "labour_charge_out_rate",
  "base_labour_hours_allowed",
  "direct_cost_package_allowance_total",
  "direct_cost_package_cost_total",
];

const REPAIR_NUMERIC_FIELDS = [
  "price_adjustment_amount",
  "labour_hours_adjustment",
  "material_margin_adjustment_percent",
  "direct_cost_package_adjustment_amount",
];

function parseValue(field, value) {
  if (NUMERIC_FIELDS.includes(field) || REPAIR_NUMERIC_FIELDS.includes(field)) {
    const parsed = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return value;
}

export default function useQuoteEngine() {
  const labour = useLabour();
  const model_readiness = useModelReadiness();
  const business_summary = useBusinessSummary();
  const cost_summary = useCostSummary({
    labour: labour.output_contract,
    assets: model_readiness.modules.assets,
    general_overheads: model_readiness.modules.generalOverheads,
    model_readiness: model_readiness.status,
  });

  const [quote_state, setQuoteState] = useState(() => {
    if (typeof window === "undefined") {
      return getDefaultQuoteEngineState();
    }

    return loadQuoteEngineState();
  });
  const [repair_state, setRepairState] = useState({
    price_adjustment_amount: 0,
    labour_hours_adjustment: 0,
    material_margin_adjustment_percent: 0,
    direct_cost_package_adjustment_amount: 0,
  });

  useEffect(() => {
    saveQuoteEngineState(quote_state);
  }, [quote_state]);

  function update_field(field, value) {
    setQuoteState((previous) => {
      const next = {
        ...previous,
        [field]: parseValue(field, value),
        updated_at: new Date().toISOString(),
      };

      if (!next.created_at) {
        next.created_at = new Date().toISOString();
      }

      return next;
    });
  }

  function update_repair_field(field, value) {
    setRepairState((previous) => ({
      ...previous,
      [field]: parseValue(field, value),
    }));
  }

  const calculations = useMemo(() => {
    return calculateQuoteEngine({
      quote_state,
      cost_summary_output_contract: cost_summary.output_contract ?? {},
      business_summary_output_contract:
        business_summary.output_contract ?? {},
      labour_output_contract: labour.output_contract ?? {},
    });
  }, [quote_state, cost_summary.output_contract, business_summary.output_contract, labour.output_contract]);

  const status = useMemo(() => {
    return buildQuoteEngineStatus({
      calculations,
      upstream: {
        model_ready: calculations.model_ready,
        model_readiness_status: calculations.model_readiness_status,
        model_trust_state: calculations.quote_model_trust_state,
        business_summary_warnings:
          business_summary.status.business_summary_warnings ?? [],
      },
    });
  }, [calculations, business_summary.status.business_summary_warnings]);

  const build_up = useMemo(() => {
    return buildQuoteEngineBuildUp({ calculations });
  }, [calculations]);

  const repair = useMemo(() => {
    return buildQuoteEngineRepair({
      calculations,
      repair_state,
    });
  }, [calculations, repair_state]);

  const output_contract = useMemo(() => {
    return {
      ...buildQuoteEngineOutputContract({ calculations }),
      quote_result_status: status.quote_result_status,
      quote_warnings: status.quote_warnings,
      quote_model_used: calculations.quote_model_used,
      quote_model_trust_state: calculations.quote_model_trust_state,
    };
  }, [calculations, status.quote_result_status, status.quote_warnings]);

  return {
    quote_state,
    repair_state,
    update_field,
    update_repair_field,
    status,
    build_up,
    repair,
    output_contract,
  };
}
