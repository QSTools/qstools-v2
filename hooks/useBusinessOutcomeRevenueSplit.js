"use client";

import { useMemo } from "react";

import useBusinessSummary from "@/hooks/useBusinessSummary";

function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round_percent(value) {
  return Number(to_number(value).toFixed(1));
}

// Business Outcome revenue-split visual data - "where every revenue dollar
// goes". Additive, read-only. Sources all figures from Business Summary's
// output_contract so every segment is internally consistent (same source,
// same period). Does not touch useBusinessOutcomeTruth.js or
// useBusinessOutcomeLabourRecovery.js.

export default function useBusinessOutcomeRevenueSplit() {
  const business_summary = useBusinessSummary();
  const bs = business_summary.output_contract ?? {};

  return useMemo(() => {
    const total_revenue = to_number(bs.total_revenue);
    const labour = to_number(bs.total_people_cost_annual);
    const assets = to_number(bs.total_asset_cost_annual);
    const overheads = to_number(bs.total_business_overheads);
    const cog = to_number(bs.total_direct_costs);
    const net_profit = to_number(bs.net_position);

    const is_ready = total_revenue > 0;

    // Structural impossibility check (same principle as S30's revenue
    // ceiling Threshold 1, applied per-segment instead of to labour+
    // assets combined): a single committed cost category cannot
    // honestly exceed total_revenue and still be shown as "a slice of
    // the whole" in a 100%-stacked bar. When this happens the bar's
    // percentages become mathematically nonsensical (a segment >100%,
    // net profit correspondingly far past -100%) even though the
    // underlying dollar figures are all correct and still reconcile
    // exactly to total_revenue. Detected here so the component can
    // render a plain-text fallback instead of a broken bar.
    const is_over_committed =
      is_ready &&
      [labour, assets, overheads, cog].some((value) => value > total_revenue);

    const segment = (key, label, value) => ({
      key,
      label,
      value,
      percent: total_revenue > 0 ? round_percent((value / total_revenue) * 100) : 0,
    });

    const segments = [
      segment("labour", "Labour", labour),
      segment("assets", "Assets", assets),
      segment("overheads", "Overheads", overheads),
      segment("cog", "COG", cog),
      segment("net_profit", "Net profit", net_profit),
    ];

    const result = {
      is_ready,
      is_over_committed,
      total_revenue,
      segments,
    };

    return result;
  }, [bs]);
}
