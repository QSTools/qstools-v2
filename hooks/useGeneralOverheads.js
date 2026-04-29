"use client";

import { useEffect, useMemo, useState } from "react";
import {
  create_empty_general_overhead_state,
  load_general_overhead_state,
  save_general_overhead_state,
  reset_general_overhead_state,
} from "@/lib/storage/generalOverheadStorage";
import {
  load_saved_overheads,
  save_overhead_profile,
  delete_overhead_profile,
  load_overhead_profile,
} from "@/lib/storage/generalOverheadProfileStorage";
import { calculate_general_overheads } from "@/lib/calculations/generalOverheadCalculations";
import {
  build_general_overhead_status,
  build_general_overhead_card,
} from "@/lib/selectors/generalOverheadSelectors";

import { useProfitAndLossStorage } from "@/lib/storage/profitAndLossStorage";
import { calculateProfitAndLoss } from "@/lib/calculations/profitAndLossCalculations";

function create_custom_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function to_number(value) {
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalise_name(value) {
  return String(value || "").trim().toLowerCase();
}

function matches_keywords(name, keywords = []) {
  return keywords.some((keyword) => name.includes(keyword));
}

function is_general_overhead_category(category) {
  return category === "general_overheads" || category === "employee_overheads";
}

function add_overhead_amount(state, key, amount) {
  state[key] = to_number(state[key]) + amount;
}

function assign_review_subcategory_cost(next_state, review_subcategory, name, amount) {
  switch (review_subcategory) {
    case "staff_overheads":
      add_overhead_amount(next_state, "staff_overheads_cost", amount);
      return true;
    case "office_admin":
      add_overhead_amount(next_state, "office_admin_cost", amount);
      return true;
    case "finance_admin":
      add_overhead_amount(next_state, "accounting_fees", amount);
      return true;
    case "finance_interest":
      add_overhead_amount(next_state, "finance_interest_cost", amount);
      return true;
    case "insurance_compliance":
      if (
        matches_keywords(name, ["professional indemnity", "indemnity insurance"])
      ) {
        add_overhead_amount(next_state, "professional_indemnity_insurance", amount);
        return true;
      }
      if (matches_keywords(name, ["public liability", "liability insurance"])) {
        add_overhead_amount(next_state, "public_liability_insurance", amount);
        return true;
      }
      add_overhead_amount(next_state, "insurance_compliance_cost", amount);
      return true;
    case "sales_growth":
      if (matches_keywords(name, ["advertising", "marketing"])) {
        add_overhead_amount(next_state, "marketing_cost", amount);
        return true;
      }
      add_overhead_amount(next_state, "sales_growth_cost", amount);
      return true;
    case "travel":
      add_overhead_amount(next_state, "travel_cost", amount);
      return true;
    case "vehicle_running_costs":
      if (
        matches_keywords(name, [
          "fuel",
          "diesel",
          "petrol",
          "motor vehicle",
          "vehicle",
          "rego",
          "registration",
          "licence",
          "licences",
          "license",
          "licenses",
          "repair",
          "repairs",
          "maintenance",
          "service",
          "servicing",
        ])
      ) {
        add_overhead_amount(next_state, "vehicle_running_cost_annual", amount);
      } else {
        add_overhead_amount(next_state, "vehicle_running_cost_annual", amount);
      }
      return true;
    default:
      return false;
  }
}

function build_general_overheads_from_pnl({
  pnl_output_contract,
  current_overhead_state,
}) {
  const pnl_lines = Array.isArray(pnl_output_contract?.pnl_lines)
    ? pnl_output_contract.pnl_lines
    : [];

  const next_state = {
    ...create_empty_general_overhead_state(),
    overhead_profile_name:
      current_overhead_state?.overhead_profile_name ||
      "General Overheads from P&L",
    effective_from: current_overhead_state?.effective_from || "",
    is_active: true,
    overhead_category_overrides:
      current_overhead_state?.overhead_category_overrides ?? {},
  };

  for (const line of pnl_lines) {
    const name = normalise_name(line.line_name);
    const amount = to_number(line.amount);
    const review_subcategory = normalise_name(line.review_subcategory);

    if (amount === 0) {
      continue;
    }

    if (!is_general_overhead_category(line.category)) {
      continue;
    }

    if (
      review_subcategory &&
      [
        "mixed_finance",
        "other_review_required",
        "wip_accounting_adjustment",
        "wip_accounting_adjustment_excluded",
        "wip_direct_job_cost",
        "wip_income_timing_adjustment",
      ].includes(review_subcategory)
    ) {
      continue;
    }

    if (review_subcategory && assign_review_subcategory_cost(next_state, review_subcategory, name, amount)) {
      continue;
    }

    if (
      matches_keywords(name, [
        "fuel",
        "diesel",
        "petrol",
        "motor vehicle",
        "vehicle",
        "rego",
        "registration",
        "licence",
        "licences",
        "license",
        "licenses",
        "repair",
        "repairs",
        "maintenance",
        "service",
        "servicing",
      ])
    ) {
      next_state.fuel_cost_annual =
        to_number(next_state.fuel_cost_annual) + amount;
      continue;
    }

    if (matches_keywords(name, ["accounting", "accountant", "bookkeeper"])) {
      next_state.accounting_fees =
        to_number(next_state.accounting_fees) + amount;
      continue;
    }

    if (matches_keywords(name, ["legal", "lawyer", "solicitor"])) {
      next_state.legal_fees = to_number(next_state.legal_fees) + amount;
      continue;
    }

    if (matches_keywords(name, ["bank"])) {
      next_state.bank_fees = to_number(next_state.bank_fees) + amount;
      continue;
    }

    if (matches_keywords(name, ["public liability", "liability insurance"])) {
      next_state.public_liability_insurance =
        to_number(next_state.public_liability_insurance) + amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "professional indemnity",
        "indemnity insurance",
      ])
    ) {
      next_state.professional_indemnity_insurance =
        to_number(next_state.professional_indemnity_insurance) + amount;
      continue;
    }

    if (matches_keywords(name, ["insurance"])) {
      next_state.public_liability_insurance =
        to_number(next_state.public_liability_insurance) + amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "software",
        "subscription",
        "subscriptions",
        "computer",
      ])
    ) {
      next_state.software_subscriptions =
        to_number(next_state.software_subscriptions) + amount;
      continue;
    }

    if (matches_keywords(name, ["telephone", "phone"])) {
      next_state.phone_system_cost =
        to_number(next_state.phone_system_cost) + amount;
      continue;
    }

    if (matches_keywords(name, ["internet"])) {
      next_state.internet_cost = to_number(next_state.internet_cost) + amount;
      continue;
    }

    if (matches_keywords(name, ["rent", "storage", "premises"])) {
      next_state.office_rent = to_number(next_state.office_rent) + amount;
      continue;
    }

    if (matches_keywords(name, ["power", "electricity"])) {
      next_state.power_cost = to_number(next_state.power_cost) + amount;
      continue;
    }

    if (matches_keywords(name, ["advertising", "marketing"])) {
      next_state.marketing_cost = to_number(next_state.marketing_cost) + amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "stationery",
        "office expenses",
        "office supplies",
        "printing",
      ])
    ) {
      next_state.office_supplies_cost =
        to_number(next_state.office_supplies_cost) + amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "admin",
        "administration",
        "staff",
        "ppe",
        "uniform",
        "uniforms",
        "training",
        "tools",
        "small equipment",
      ])
    ) {
      next_state.general_admin_cost =
        to_number(next_state.general_admin_cost) + amount;
      continue;
    }

    next_state.other_general_overhead_cost =
      to_number(next_state.other_general_overhead_cost) + amount;
  }

  return {
    ...next_state,
    updated_at: new Date().toISOString(),
  };
}

export default function useGeneralOverheads() {
  const [is_hydrated, set_is_hydrated] = useState(false);

  const [overhead_state, set_overhead_state] = useState(
    create_empty_general_overhead_state()
  );

  const [saved_overheads, set_saved_overheads] = useState([]);

  const { profit_and_loss_state } = useProfitAndLossStorage();

  const pnl_output_contract = useMemo(() => {
    return calculateProfitAndLoss(profit_and_loss_state);
  }, [profit_and_loss_state]);

  useEffect(() => {
    const loaded_state = load_general_overhead_state();

    set_overhead_state({
      ...loaded_state,
      overhead_category_overrides:
        loaded_state?.overhead_category_overrides ?? {},
    });

    set_saved_overheads(load_saved_overheads());
    set_is_hydrated(true);
  }, []);

  useEffect(() => {
    if (!is_hydrated) {
      return;
    }

    save_general_overhead_state(overhead_state);
  }, [overhead_state, is_hydrated]);

  const calculated = useMemo(() => {
    return calculate_general_overheads(overhead_state);
  }, [overhead_state]);

  const output_contract = useMemo(() => {
    return {
      total_general_overheads: calculated.total_general_overheads,
      overhead_rows: calculated.overhead_rows,
    };
  }, [calculated]);

  function update_field(field, value) {
    set_overhead_state((current) => ({
      ...current,
      [field]: value,
      overhead_category_overrides:
        current.overhead_category_overrides ?? {},
      updated_at: new Date().toISOString(),
    }));
  }

  function update_custom_item(custom_overhead_id, field, value) {
    set_overhead_state((current) => ({
      ...current,
      custom_overhead_items: (current.custom_overhead_items ?? []).map((item) =>
        item.custom_overhead_id === custom_overhead_id
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
      overhead_category_overrides:
        current.overhead_category_overrides ?? {},
      updated_at: new Date().toISOString(),
    }));
  }

  function add_custom_item() {
    set_overhead_state((current) => ({
      ...current,
      custom_overhead_items: [
        ...(current.custom_overhead_items ?? []),
        {
          custom_overhead_id: create_custom_id(),
          custom_overhead_name: "",
          custom_overhead_amount: 0,
        },
      ],
      overhead_category_overrides:
        current.overhead_category_overrides ?? {},
      updated_at: new Date().toISOString(),
    }));
  }

  function remove_custom_item(custom_overhead_id) {
    set_overhead_state((current) => {
      const next_custom_items = (current.custom_overhead_items ?? []).filter(
        (item) => item.custom_overhead_id !== custom_overhead_id
      );

      const next_overrides = {
        ...(current.overhead_category_overrides ?? {}),
      };

      delete next_overrides[custom_overhead_id];

      return {
        ...current,
        custom_overhead_items: next_custom_items,
        overhead_category_overrides: next_overrides,
        updated_at: new Date().toISOString(),
      };
    });
  }

  function update_category_override(row_key, category_key) {
    set_overhead_state((current) => ({
      ...current,
      overhead_category_overrides: {
        ...(current.overhead_category_overrides ?? {}),
        [row_key]: category_key,
      },
      updated_at: new Date().toISOString(),
    }));
  }

  function sync_from_pnl() {
    const next_state = build_general_overheads_from_pnl({
      pnl_output_contract,
      current_overhead_state: overhead_state,
    });

    set_overhead_state(next_state);
  }

  function save_profile() {
    const saved_record = {
      ...overhead_state,
      overhead_category_overrides:
        overhead_state.overhead_category_overrides ?? {},
      output_contract,
      total_general_overheads: calculated.total_general_overheads,
      overhead_rows: calculated.overhead_rows,
      updated_at: new Date().toISOString(),
    };

    const next_saved = save_overhead_profile(saved_record);
    set_saved_overheads(next_saved);
  }

  function load_profile(overhead_profile_id) {
    const loaded = load_overhead_profile(overhead_profile_id);

    if (!loaded) {
      return;
    }

    set_overhead_state({
      ...loaded,
      overhead_category_overrides:
        loaded?.overhead_category_overrides ?? {},
      updated_at: new Date().toISOString(),
    });
  }

  function delete_profile(overhead_profile_id) {
    const next_saved = delete_overhead_profile(overhead_profile_id);
    set_saved_overheads(next_saved);
  }

  function reset_state() {
    const next_state = reset_general_overhead_state();

    set_overhead_state({
      ...next_state,
      overhead_category_overrides: {},
    });
  }

  const status = build_general_overhead_status({
    overhead_state,
    saved_overheads,
    calculated,
  });

  const card = build_general_overhead_card({
    overhead_state,
    saved_overheads,
    calculated,
    output_contract,
    actions: {
      update_field,
      update_custom_item,
      add_custom_item,
      remove_custom_item,
      update_category_override,
      sync_from_pnl,
      save_profile,
      load_profile,
      delete_profile,
      reset_state,
    },
  });

  return {
    overhead_state,
    saved_overheads,
    calculated,
    output_contract,
    status,
    card,
    is_hydrated,
  };
}