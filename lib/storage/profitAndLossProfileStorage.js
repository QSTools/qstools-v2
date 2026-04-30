"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pnl_profiles_v3";

function get_month_name(month) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return months[month - 1] ?? "";
}

function make_profile_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `pnl_profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function infer_section_from_category(category) {
  switch (category) {
    case "revenue":
      return "trading_income";
    case "cogs_materials":
    case "cogs_subcontract":
    case "cogs_hire":
      return "cost_of_sales";
    case "labour":
    case "employee_overheads":
    case "assets":
    case "general_overheads":
    case "unassigned":
    default:
      return "operating_expenses";
  }
}

function normalize_interest_treatment(value) {
  switch (value) {
    case "asset_finance_exclude":
      return "contains_asset_finance_interest";
    case "general_overhead_keep":
      return "no_asset_finance_interest";
    case "unknown":
    case "not_reviewed":
    case undefined:
    case null:
    case "":
      return "not_reviewed";
    default:
      return value;
  }
}

function normalize_pnl_lines(lines = []) {
  return (lines ?? []).map((line, index) => ({
    pnl_line_id:
      line?.pnl_line_id ||
      line?.line_id ||
      `pnl_migrated_${Date.now()}_${index}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    line_name: line?.line_name || line?.name || "",
    amount: line?.amount ?? line?.value ?? 0,
    section:
      line?.section ||
      infer_section_from_category(line?.category || "unassigned"),
    category: line?.category || "unassigned",
    interest_treatment: normalize_interest_treatment(line?.interest_treatment),
  }));
}

function build_period_key(financial_year, month) {
  return `${financial_year || ""}::${month || "full_year"}`;
}

function normalize_profile(profile) {
  const state = profile?.state ?? {};

  return {
    id: profile?.id || make_profile_id(),
    label:
      profile?.label ||
      (state?.period_month
        ? `${get_month_name(Number(state.period_month))} FY${state.financial_year}`
        : `FY ${state.financial_year || ""}`.trim()),
    financial_year: profile?.financial_year ?? state?.financial_year ?? null,
    month: profile?.month ?? state?.period_month ?? null,
    type: profile?.type ?? (state?.period_month ? "monthly" : "annual"),
    period_key: build_period_key(
      profile?.financial_year ?? state?.financial_year ?? null,
      profile?.month ?? state?.period_month ?? null,
    ),
    state: {
      financial_year: state?.financial_year ?? "",
      period_month: state?.period_month ?? "",
      pnl_lines: normalize_pnl_lines(state?.pnl_lines),
    },
    created_at: profile?.created_at || new Date().toISOString(),
    updated_at: profile?.updated_at || null,
  };
}

function dedupe_profiles_by_period(profiles = []) {
  const map = new Map();

  for (const raw_profile of profiles) {
    const profile = normalize_profile(raw_profile);
    map.set(profile.period_key, profile);
  }

  return Array.from(map.values());
}

export function useProfitAndLossProfileStorage() {
  const [profiles, set_profiles] = useState([]);
  const [has_loaded, set_has_loaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        set_profiles([]);
        set_has_loaded(true);
        return;
      }

      const parsed = JSON.parse(stored);
      const normalized = Array.isArray(parsed)
        ? dedupe_profiles_by_period(parsed)
        : [];

      set_profiles(normalized);
    } catch {
      set_profiles([]);
    } finally {
      set_has_loaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!has_loaded) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles, has_loaded]);

  function save_profile({
    label,
    financial_year,
    month = null,
    type = "annual",
    state,
  }) {
    const normalized = normalize_profile({
      label,
      financial_year,
      month,
      type,
      state,
      updated_at: new Date().toISOString(),
    });

    let result = null;

    set_profiles((prev) => {
      const next = [...prev];
      const existing_index = next.findIndex(
        (profile) => profile.period_key === normalized.period_key,
      );

      if (existing_index !== -1) {
        const existing = next[existing_index];

        result = {
          ...normalized,
          id: existing.id,
          created_at: existing.created_at,
          updated_at: new Date().toISOString(),
          was_updated: true,
        };

        next[existing_index] = result;
        return dedupe_profiles_by_period(next);
      }

      result = {
        ...normalized,
        id: normalized.id || make_profile_id(),
        created_at: new Date().toISOString(),
        updated_at: null,
        was_updated: false,
      };

      next.push(result);
      return dedupe_profiles_by_period(next);
    });

    return result;
  }

  function load_profile(id) {
    return profiles.find((profile) => profile.id === id) || null;
  }

  function delete_profile(id) {
    set_profiles((prev) => prev.filter((profile) => profile.id !== id));
  }

  return {
    profiles,
    save_profile,
    load_profile,
    delete_profile,
  };
}
