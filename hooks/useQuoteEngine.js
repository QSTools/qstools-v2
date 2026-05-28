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
  buildQuoteEngineState,
  createQuoteJobRecord,
  createQuoteVersionRecord,
  getDefaultQuoteEngineState,
  getHydrationSafeQuoteEngineStore,
  getNextQuoteVersionNumber,
  loadQuoteEngineStore,
  mergeQuoteJobIntoState,
  saveQuoteEngineStore,
  upsertById,
} from "@/lib/storage/quoteEngineStorage";

const NUMERIC_FIELDS = [
  "quote_price_total",

  "cog_cost_total",
  "cog_markup_percent",
  "cog_sell_total",

  "labour_hours_allowed",
  "labour_hourly_cost_rate",
  "labour_cost_total",
  "labour_charge_total",

  // Legacy aliases
  "estimated_labour_cost_total",
  "material_cost_total",
  "material_sell_total",
  "material_markup_percent",
  "labour_sell_total",
  "labour_charge_out_rate",
  "base_labour_hours_allowed",
  "direct_cost_package_allowance_total",
  "direct_cost_package_cost_total",
];

const BOOLEAN_FIELDS = ["is_winning_quote", "is_live_job"];

const REPAIR_NUMERIC_FIELDS = [
  "price_adjustment_amount",
  "labour_hours_adjustment",
  "material_margin_adjustment_percent",
  "direct_cost_package_adjustment_amount",
];

function parseValue(field, value) {
  if (BOOLEAN_FIELDS.includes(field)) {
    return Boolean(value);
  }

  if (NUMERIC_FIELDS.includes(field) || REPAIR_NUMERIC_FIELDS.includes(field)) {
    const parsed = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return value;
}

function getIsoNow() {
  return new Date().toISOString();
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function sortQuoteJobs(quote_jobs = []) {
  return [...quote_jobs].sort((a, b) => {
    const a_label = `${a.job_number || ""} ${a.job_name || ""}`;
    const b_label = `${b.job_number || ""} ${b.job_name || ""}`;

    return a_label.localeCompare(b_label);
  });
}

function sortQuoteVersions(quote_versions = []) {
  return [...quote_versions].sort((a, b) => {
    const a_version = Number(a.quote_version || 0);
    const b_version = Number(b.quote_version || 0);

    return b_version - a_version;
  });
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

  const [quote_store, setQuoteStore] = useState(() =>
    getHydrationSafeQuoteEngineStore()
  );

  const [has_loaded_quote_store, setHasLoadedQuoteStore] = useState(false);
  const [selected_quote_job_id, setSelectedQuoteJobId] = useState("");

  const [repair_state, setRepairState] = useState({
    price_adjustment_amount: 0,
    labour_hours_adjustment: 0,
    material_margin_adjustment_percent: 0,
    direct_cost_package_adjustment_amount: 0,
  });

  useEffect(() => {
    setQuoteStore(loadQuoteEngineStore());
    setHasLoadedQuoteStore(true);
  }, []);

  useEffect(() => {
    if (!has_loaded_quote_store) {
      return;
    }

    saveQuoteEngineStore(quote_store);
  }, [quote_store, has_loaded_quote_store]);

  const quote_state = quote_store.current_quote_state;

  const saved_quote_jobs = useMemo(
    () => sortQuoteJobs(quote_store.quote_jobs),
    [quote_store.quote_jobs]
  );

  const saved_quote_versions = useMemo(
    () => sortQuoteVersions(quote_store.quote_versions),
    [quote_store.quote_versions]
  );

  function update_field(field, value) {
    setQuoteStore((previous) => {
      const parsed_value = parseValue(field, value);

      const next_quote_state = {
        ...previous.current_quote_state,
        [field]: parsed_value,
        updated_at: getIsoNow(),
      };

      if (field === "job_name") {
        next_quote_state.quote_name = parsed_value;
      }

      if (field === "job_number") {
        next_quote_state.quote_reference = parsed_value;
      }

      if (!next_quote_state.created_at) {
        next_quote_state.created_at = getIsoNow();
      }

      return {
        ...previous,
        current_quote_state: next_quote_state,
      };
    });
  }

  function update_repair_field(field, value) {
    setRepairState((previous) => ({
      ...previous,
      [field]: parseValue(field, value),
    }));
  }

  function start_new_quote() {
    const next_quote_state = getDefaultQuoteEngineState();

    setSelectedQuoteJobId("");

    setQuoteStore((previous) => ({
      ...previous,
      current_quote_state: next_quote_state,
    }));
  }

  function save_current_quote() {
    setQuoteStore((previous) => {
      const current_quote_state = buildQuoteEngineState(
        previous.current_quote_state
      );

      const quote_job = createQuoteJobRecord(current_quote_state);
      const quote_version = createQuoteVersionRecord(current_quote_state);

      return {
        ...previous,
        current_quote_state,
        quote_jobs: upsertById(
          previous.quote_jobs,
          quote_job,
          "quote_job_id"
        ),
        quote_versions: upsertById(
          previous.quote_versions,
          quote_version,
          "quote_version_id"
        ),
      };
    });
  }

  function update_selected_quote_job_id(quote_job_id) {
    setSelectedQuoteJobId(quote_job_id);

    if (!quote_job_id) {
      return;
    }

    setQuoteStore((previous) => {
      const quote_job = previous.quote_jobs.find(
        (job) => job.quote_job_id === quote_job_id
      );

      if (!quote_job) {
        return previous;
      }

      return {
        ...previous,
        current_quote_state: mergeQuoteJobIntoState(quote_job, {
          ...previous.current_quote_state,
          quote_job_id: quote_job.quote_job_id,
          quote_name: quote_job.job_name || "",
          quote_reference: quote_job.job_number || "",
          updated_at: getIsoNow(),
        }),
      };
    });
  }

  function create_new_quote_version_from_selected_job() {
    if (!selected_quote_job_id) {
      return;
    }

    setQuoteStore((previous) => {
      const quote_job = previous.quote_jobs.find(
        (job) => job.quote_job_id === selected_quote_job_id
      );

      if (!quote_job) {
        return previous;
      }

      const next_version = getNextQuoteVersionNumber(
        previous.quote_versions,
        selected_quote_job_id
      );

      const next_quote_state = mergeQuoteJobIntoState(quote_job, {
        quote_id: "",
        quote_version_id: "",

        quote_name: quote_job.job_name || "",
        quote_reference: quote_job.job_number || "",

        quote_date: getTodayDate(),
        quote_status: "draft",
        quote_version: next_version,

        is_winning_quote: false,
        is_live_job: false,
        live_job_id: "",

        quote_price_total: 0,

        cog_cost_total: 0,
        cog_pricing_mode: "markup",
        cog_markup_percent: 0,
        cog_sell_total: 0,

        labour_hours_allowed: 0,
        labour_hourly_cost_rate: 0,
        labour_cost_total: 0,
        labour_charge_total: 0,

        estimated_labour_cost_total: 0,
        material_cost_total: 0,
        material_sell_total: 0,
        material_markup_percent: 0,
        labour_sell_total: 0,
        labour_charge_out_rate: 0,
        base_labour_hours_allowed: 0,
        direct_cost_package_allowance_total: 0,
        direct_cost_package_cost_total: 0,

        created_at: getIsoNow(),
        updated_at: getIsoNow(),
      });

      return {
        ...previous,
        current_quote_state: next_quote_state,
      };
    });
  }

  function load_quote_version(quote_version_id) {
    if (!quote_version_id) {
      return;
    }

    setQuoteStore((previous) => {
      const quote_version = previous.quote_versions.find(
        (version) => version.quote_version_id === quote_version_id
      );

      if (!quote_version) {
        return previous;
      }

      const quote_job = previous.quote_jobs.find(
        (job) => job.quote_job_id === quote_version.quote_job_id
      );

      if (!quote_job) {
        return previous;
      }

      setSelectedQuoteJobId(quote_job.quote_job_id);

      return {
        ...previous,
        current_quote_state: mergeQuoteJobIntoState(quote_job, {
          ...quote_version,
          quote_name: quote_job.job_name || "",
          quote_reference: quote_job.job_number || "",
          updated_at: getIsoNow(),
        }),
      };
    });
  }

  const calculations = useMemo(() => {
    return calculateQuoteEngine({
      quote_state,
      cost_summary_output_contract: cost_summary.output_contract ?? {},
      business_summary_output_contract:
        business_summary.output_contract ?? {},
      labour_output_contract: labour.output_contract ?? {},
    });
  }, [
    quote_state,
    cost_summary.output_contract,
    business_summary.output_contract,
    labour.output_contract,
  ]);

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

    saved_quote_jobs,
    saved_quote_versions,
    selected_quote_job_id,

    update_field,
    update_repair_field,

    start_new_quote,
    save_current_quote,
    update_selected_quote_job_id,
    create_new_quote_version_from_selected_job,
    load_quote_version,

    status,
    build_up,
    repair,
    output_contract,
  };
}