"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  build_general_overhead_category_totals,
  build_general_overhead_allocation_outputs,
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

function round_allocation_amount(value) {
  const rounded = Number(to_number(value).toFixed(2));

  return Object.is(rounded, -0) ? 0 : rounded;
}

function normalise_name(value) {
  return String(value || "").trim().toLowerCase();
}

function matches_keywords(name, keywords = []) {
  return keywords.some((keyword) => name.includes(keyword));
}

function normalise_pnl_category(category) {
  switch (category) {
    case "employee_overheads":
      return "general_overheads";
    case "cogs_materials":
    case "cogs_subcontract":
    case "cogs_hire":
      return "cogs";
    default:
      return category || "unassigned";
  }
}

function is_excluded_operating_expense_category(category) {
  return [
    "revenue",
    "cogs",
    "direct_costs",
    "labour",
    "assets",
    "excluded",
  ].includes(normalise_pnl_category(category));
}

function is_interest_line(line) {
  return normalise_name(line?.line_name).includes("interest");
}

function normalise_interest_treatment(value) {
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

function create_synced_interest_item(line, amount, index) {
  const interest_treatment = normalise_interest_treatment(
    line?.interest_treatment
  );
  const source_id =
    line?.pnl_line_id || `${normalise_name(line?.line_name)}-${index}`;

  return {
    synced_overhead_id: `pnl-interest-${source_id}`,
    synced_overhead_name: line?.line_name || "P&L Interest",
    synced_overhead_amount: amount,
    source_module: "p_and_l",
    source_pnl_line_id: line?.pnl_line_id || "",
    source_line_name: line?.line_name || "",
    source_review_subcategory: line?.review_subcategory || "",
    source_category: line?.category || "",
    overhead_category_key: "finance_interest",
    interest_treatment,
    contains_asset_finance_interest:
      interest_treatment === "contains_asset_finance_interest",
  };
}

function get_overhead_category_key_for_line(line = {}) {
  const name = normalise_name(line.line_name);
  const review_subcategory = normalise_name(line.review_subcategory);

  switch (review_subcategory) {
    case "staff_overheads":
      return "staff_overheads";
    case "office_admin":
      return "office_admin";
    case "finance_admin":
      return "financial_admin";
    case "finance_interest":
      return "finance_interest";
    case "insurance_compliance":
      return "insurance_compliance";
    case "sales_growth":
      return "sales_growth";
    case "travel":
      return "travel";
    case "vehicle_running_costs":
      return "vehicles_running";
    default:
      break;
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
    return "vehicles_running";
  }

  if (
    matches_keywords(name, [
      "accounting",
      "accountant",
      "bookkeeper",
      "legal",
      "lawyer",
      "solicitor",
      "bank",
    ])
  ) {
    return "financial_admin";
  }

  if (
    matches_keywords(name, [
      "public liability",
      "liability insurance",
      "professional indemnity",
      "indemnity insurance",
      "asset insurance",
      "vehicle insurance",
      "plant insurance",
      "fleet insurance",
      "equipment insurance",
      "insurance",
    ])
  ) {
    return "insurance_compliance";
  }

  if (
    matches_keywords(name, [
      "software",
      "subscription",
      "subscriptions",
      "computer",
      "telephone",
      "phone",
      "internet",
      "stationery",
      "office expenses",
      "office supplies",
      "printing",
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
    return "office_admin";
  }

  if (
    matches_keywords(name, [
      "rent",
      "storage",
      "premises",
      "power",
      "electricity",
      "cleaning",
      "cleaner",
      "cleaners",
      "cleaning services",
    ])
  ) {
    return "facilities_premises";
  }

  if (matches_keywords(name, ["advertising", "marketing"])) {
    return "sales_growth";
  }

  return "other_unallocated";
}

function create_synced_pnl_overhead_item(line, amount, index) {
  if (is_interest_line(line)) {
    return create_synced_interest_item(line, amount, index);
  }

  const source_id =
    line?.pnl_line_id || `${normalise_name(line?.line_name)}-${index}`;

  return {
    synced_overhead_id: `pnl-overhead-${source_id}`,
    synced_overhead_name: line?.line_name || "P&L Operating Expense",
    synced_overhead_amount: amount,
    source_module: "p_and_l",
    source_pnl_line_id: line?.pnl_line_id || "",
    source_line_name: line?.line_name || "",
    source_review_subcategory: line?.review_subcategory || "",
    source_category: line?.category || "",
    source_section: line?.section || "",
    overhead_category_key: get_overhead_category_key_for_line(line),
    interest_treatment: "",
    contains_asset_finance_interest: false,
  };
}

function build_pnl_sync_signature(pnl_output_contract = {}) {
  const operating_expense_lines = Array.isArray(
    pnl_output_contract?.operating_expense_lines
  )
    ? pnl_output_contract.operating_expense_lines
    : [];

  return JSON.stringify(
    operating_expense_lines.map((line, index) => ({
      index,
      pnl_line_id: line?.pnl_line_id || "",
      line_name: line?.line_name || "",
      amount: to_number(line?.amount),
      section: line?.section || "",
      category: line?.category || "",
      review_subcategory: line?.review_subcategory || "",
      interest_treatment: line?.interest_treatment || "",
    }))
  );
}

function build_general_overheads_from_pnl({
  pnl_output_contract,
  current_overhead_state,
}) {
  const operating_expense_lines = Array.isArray(
    pnl_output_contract?.operating_expense_lines
  )
    ? pnl_output_contract.operating_expense_lines
    : [];

  const timestamp = new Date().toISOString();

  const next_state = {
    ...create_empty_general_overhead_state(),

    overhead_profile_id:
      current_overhead_state?.overhead_profile_id ||
      create_empty_general_overhead_state().overhead_profile_id,

    owner_scope_id: current_overhead_state?.owner_scope_id || "",

    overhead_profile_name:
      current_overhead_state?.overhead_profile_name ||
      "General Overheads from P&L",

    profile_version: Number(current_overhead_state?.profile_version || 1),

    effective_from:
      current_overhead_state?.effective_from ||
      current_overhead_state?.created_at ||
      "",

    is_active: current_overhead_state?.is_active !== false,

    created_at: current_overhead_state?.created_at || timestamp,
    updated_at: timestamp,

    change_reason: current_overhead_state?.change_reason || "",
    notes: current_overhead_state?.notes || "",

    synced_pnl_overhead_items: [],

    custom_overhead_items: Array.isArray(
      current_overhead_state?.custom_overhead_items
    )
      ? current_overhead_state.custom_overhead_items
      : [],

    overhead_category_overrides:
      current_overhead_state?.overhead_category_overrides ?? {},
    system_allocation_overrides:
      current_overhead_state?.system_allocation_overrides ?? {},
    system_allocation_amount_overrides:
      current_overhead_state?.system_allocation_amount_overrides ?? {},
  };

  for (const [index, line] of operating_expense_lines.entries()) {
    const amount = to_number(line.amount);
    const review_subcategory = normalise_name(line.review_subcategory);

    if (amount === 0) {
      continue;
    }

    if (is_excluded_operating_expense_category(line.category)) {
      continue;
    }

    if (
      review_subcategory &&
      [
        "wip_accounting_adjustment",
        "wip_accounting_adjustment_excluded",
        "wip_direct_job_cost",
        "wip_income_timing_adjustment",
      ].includes(review_subcategory)
    ) {
      continue;
    }

    next_state.synced_pnl_overhead_items = [
      ...(next_state.synced_pnl_overhead_items ?? []),
      create_synced_pnl_overhead_item(line, amount, index),
    ];
  }

  return next_state;
}

export default function useGeneralOverheads() {
  const [is_hydrated, set_is_hydrated] = useState(false);

  const [overhead_state, set_overhead_state] = useState(
    create_empty_general_overhead_state()
  );

  const [saved_overheads, set_saved_overheads] = useState([]);

  const last_pnl_sync_signature_ref = useRef("");

  const { profit_and_loss_state } = useProfitAndLossStorage();

  const pnl_output_contract = useMemo(() => {
    return calculateProfitAndLoss(profit_and_loss_state);
  }, [profit_and_loss_state]);

  const pnl_sync_signature = useMemo(() => {
    return build_pnl_sync_signature(pnl_output_contract);
  }, [pnl_output_contract]);

  useEffect(() => {
    const loaded_state = load_general_overhead_state();

    set_overhead_state({
      ...loaded_state,
      overhead_category_overrides:
        loaded_state?.overhead_category_overrides ?? {},
      system_allocation_overrides:
        loaded_state?.system_allocation_overrides ?? {},
      system_allocation_amount_overrides:
        loaded_state?.system_allocation_amount_overrides ?? {},
    });

    set_saved_overheads(load_saved_overheads());
    set_is_hydrated(true);
  }, []);

  useEffect(() => {
    if (!is_hydrated || !pnl_sync_signature) {
      return;
    }

    if (last_pnl_sync_signature_ref.current === pnl_sync_signature) {
      return;
    }

    last_pnl_sync_signature_ref.current = pnl_sync_signature;

    set_overhead_state((current) =>
      build_general_overheads_from_pnl({
        pnl_output_contract,
        current_overhead_state: current,
      })
    );
  }, [is_hydrated, pnl_output_contract, pnl_sync_signature]);

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
    const allocation_outputs = build_general_overhead_allocation_outputs({
      overhead_rows: calculated.overhead_rows,
      overhead_state,
    });
    const category_totals = build_general_overhead_category_totals(
      calculated.overhead_rows,
      overhead_state
    );

    const has_asset_finance_interest_duplication = calculated.overhead_rows.some(
      (row) =>
        row.contains_asset_finance_interest === true &&
        Number(row.active_amount ?? row.amount ?? 0) !== 0
    );

    return {
      total_general_overheads: calculated.total_general_overheads,
      category_totals,
      general_overheads_ready:
        Number.isFinite(Number(calculated.total_general_overheads)) &&
        category_totals.length > 0 &&
        !has_asset_finance_interest_duplication,
      non_asset_interest_annual: calculated.non_asset_interest_annual ?? 0,
      overhead_rows: allocation_outputs.allocation_rows,
      synced_pnl_overhead_items:
        overhead_state.synced_pnl_overhead_items ?? [],
      imported_pnl_overhead_rows: allocation_outputs.allocation_rows.filter(
        (row) => row.is_synced_from_pnl
      ),
      asset_overhead_pools: allocation_outputs.asset_overhead_pools,
      total_asset_overhead_pool_amount:
        allocation_outputs.total_asset_overhead_pool_amount,
      asset_related_pool_total:
        allocation_outputs.total_asset_overhead_pool_amount,
      asset_related_assigned_to_assets: 0,
      asset_related_overhead_pool: allocation_outputs.asset_overhead_pools,
      asset_related_unassigned_cost:
        allocation_outputs.total_asset_overhead_pool_amount,
      asset_related_unassigned_balance:
        allocation_outputs.total_asset_overhead_pool_amount,
      total_unassigned_asset_related_overhead_cost_annual:
        allocation_outputs.total_asset_overhead_pool_amount,
      asset_review_required:
        allocation_outputs.total_asset_overhead_pool_amount > 0,
      asset_related_pool_rows: allocation_outputs.allocation_rows.filter(
        (row) => row.is_asset_related_pool
      ),
      unallocated_overhead_lines:
        allocation_outputs.unallocated_overhead_lines,
      unallocated_overhead_amount:
        allocation_outputs.unallocated_overhead_amount,
      allocation_pool_warnings: allocation_outputs.allocation_pool_warnings,
      allocation_pool_summaries: allocation_outputs.allocation_pool_summaries,
    };
  }, [calculated, overhead_state]);

  function update_field(field, value) {
    set_overhead_state((current) => ({
      ...current,
      [field]: value,
      overhead_category_overrides: current.overhead_category_overrides ?? {},
      system_allocation_overrides:
        current.system_allocation_overrides ?? {},
      system_allocation_amount_overrides:
        current.system_allocation_amount_overrides ?? {},
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
      overhead_category_overrides: current.overhead_category_overrides ?? {},
      system_allocation_overrides:
        current.system_allocation_overrides ?? {},
      system_allocation_amount_overrides:
        current.system_allocation_amount_overrides ?? {},
      synced_pnl_overhead_items: current.synced_pnl_overhead_items ?? [],
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
      overhead_category_overrides: current.overhead_category_overrides ?? {},
      system_allocation_overrides:
        current.system_allocation_overrides ?? {},
      system_allocation_amount_overrides:
        current.system_allocation_amount_overrides ?? {},
      synced_pnl_overhead_items: current.synced_pnl_overhead_items ?? [],
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
      const next_system_allocation_overrides = {
        ...(current.system_allocation_overrides ?? {}),
      };
      const next_system_allocation_amount_overrides = {
        ...(current.system_allocation_amount_overrides ?? {}),
      };

      delete next_overrides[custom_overhead_id];
      delete next_system_allocation_overrides[custom_overhead_id];
      delete next_system_allocation_amount_overrides[custom_overhead_id];

      return {
        ...current,
        custom_overhead_items: next_custom_items,
        overhead_category_overrides: next_overrides,
        system_allocation_overrides: next_system_allocation_overrides,
        system_allocation_amount_overrides:
          next_system_allocation_amount_overrides,
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
      system_allocation_overrides:
        current.system_allocation_overrides ?? {},
      system_allocation_amount_overrides:
        current.system_allocation_amount_overrides ?? {},
      updated_at: new Date().toISOString(),
    }));
  }

  function update_system_allocation_override(row_key, system_allocation_type) {
    set_overhead_state((current) => ({
      ...current,
      overhead_category_overrides: current.overhead_category_overrides ?? {},
      system_allocation_overrides: {
        ...(current.system_allocation_overrides ?? {}),
        [row_key]: system_allocation_type,
      },
      system_allocation_amount_overrides:
        current.system_allocation_amount_overrides ?? {},
      updated_at: new Date().toISOString(),
    }));
  }

  function update_system_allocation_amount_override(row_key, allocation_amount) {
    set_overhead_state((current) => ({
      ...current,
      overhead_category_overrides: current.overhead_category_overrides ?? {},
      system_allocation_overrides:
        current.system_allocation_overrides ?? {},
      system_allocation_amount_overrides: {
        ...(current.system_allocation_amount_overrides ?? {}),
        [row_key]: round_allocation_amount(allocation_amount),
      },
      updated_at: new Date().toISOString(),
    }));
  }

  function sync_from_pnl() {
    set_overhead_state((current) =>
      build_general_overheads_from_pnl({
        pnl_output_contract,
        current_overhead_state: current,
      })
    );
  }

  function save_profile() {
    const saved_record = {
      ...overhead_state,
      overhead_category_overrides:
        overhead_state.overhead_category_overrides ?? {},
      system_allocation_overrides:
        overhead_state.system_allocation_overrides ?? {},
      system_allocation_amount_overrides:
        overhead_state.system_allocation_amount_overrides ?? {},
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
      overhead_category_overrides: loaded?.overhead_category_overrides ?? {},
      system_allocation_overrides: loaded?.system_allocation_overrides ?? {},
      system_allocation_amount_overrides:
        loaded?.system_allocation_amount_overrides ?? {},
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
      system_allocation_overrides: {},
      system_allocation_amount_overrides: {},
    });

    last_pnl_sync_signature_ref.current = "";
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
      update_system_allocation_override,
      update_system_allocation_amount_override,
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