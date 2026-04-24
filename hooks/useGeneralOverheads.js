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
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalise_name(value) {
  return String(value || "").trim().toLowerCase();
}

function matches_keywords(name, keywords = []) {
  return keywords.some((keyword) => name.includes(keyword));
}

function is_vehicle_context(name) {
  return matches_keywords(name, [
    "vehicle",
    "motor vehicle",
    "car",
    "ute",
    "truck",
    "van",
    "fleet",
    "diesel",
    "petrol",
    "fuel",
    "rego",
    "registration",
    "tyre",
    "tire",
    "service",
    "servicing",
    "repair",
  ]);
}

function build_vehicle_prefill_from_pnl(pnl_output_contract) {
  const pnl_lines = Array.isArray(pnl_output_contract?.pnl_lines)
    ? pnl_output_contract.pnl_lines
    : [];

  const candidate_lines = pnl_lines.filter((line) => {
    return (
      line.category === "assets" ||
      line.category === "general_overheads"
    );
  });

  let fuel = 0;
  let maintenance = 0;
  let repairs = 0;
  let registration = 0;
  let tyres = 0;
  let consumables = 0;

  for (const line of candidate_lines) {
    const name = normalise_name(line.line_name);
    const amount = to_number(line.amount);

    if (matches_keywords(name, ["fuel", "diesel", "petrol"])) {
      fuel += amount;
      continue;
    }

    if (matches_keywords(name, ["tyre", "tyres", "tire", "tires"])) {
      tyres += amount;
      continue;
    }

    if (
      matches_keywords(name, ["insurance"]) &&
      is_vehicle_context(name)
    ) {
      registration += amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "rego",
        "registration",
        "licence",
        "licences",
        "license",
        "licenses",
      ])
    ) {
      registration += amount;
      continue;
    }

    if (matches_keywords(name, ["repair", "repairs"])) {
      repairs += amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "maintenance",
        "service",
        "services",
        "servicing",
      ])
    ) {
      maintenance += amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "oil",
        "fluid",
        "fluids",
        "consumable",
        "consumables",
        "filter",
        "filters",
      ])
    ) {
      consumables += amount;
      continue;
    }

    if (
      matches_keywords(name, [
        "motor vehicle expenses",
        "motor vehicle expense",
        "vehicle expenses",
        "vehicle expense",
      ])
    ) {
      fuel += amount;
      continue;
    }
  }

  return {
    fuel_cost_annual: fuel,
    vehicle_maintenance_cost_annual: maintenance,
    vehicle_repairs_cost_annual: repairs,
    vehicle_registration_cost_annual: registration,
    vehicle_tyres_cost_annual: tyres,
    vehicle_consumables_cost_annual: consumables,
  };
}

function vehicle_fields_are_empty(overhead_state) {
  return (
    to_number(overhead_state.fuel_cost_annual) === 0 &&
    to_number(overhead_state.vehicle_maintenance_cost_annual) === 0 &&
    to_number(overhead_state.vehicle_repairs_cost_annual) === 0 &&
    to_number(overhead_state.vehicle_registration_cost_annual) === 0 &&
    to_number(overhead_state.vehicle_tyres_cost_annual) === 0 &&
    to_number(overhead_state.vehicle_consumables_cost_annual) === 0
  );
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

  useEffect(() => {
    if (!is_hydrated) {
      return;
    }

    if (!vehicle_fields_are_empty(overhead_state)) {
      return;
    }

    const vehicle_prefill = build_vehicle_prefill_from_pnl(pnl_output_contract);

    const has_vehicle_prefill = Object.values(vehicle_prefill).some(
      (value) => to_number(value) > 0
    );

    if (!has_vehicle_prefill) {
      return;
    }

    set_overhead_state((current) => ({
      ...current,
      ...vehicle_prefill,
      overhead_category_overrides:
        current.overhead_category_overrides ?? {},
      updated_at: new Date().toISOString(),
    }));
  }, [is_hydrated, pnl_output_contract, overhead_state]);

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