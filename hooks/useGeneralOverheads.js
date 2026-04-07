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

function create_custom_id() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function useGeneralOverheads() {
  const [is_hydrated, set_is_hydrated] = useState(false);

  const [overhead_state, set_overhead_state] = useState(
    create_empty_general_overhead_state()
  );

  const [saved_overheads, set_saved_overheads] = useState([]);

  useEffect(() => {
    set_overhead_state(load_general_overhead_state());
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
      updated_at: new Date().toISOString(),
    }));
  }

  function remove_custom_item(custom_overhead_id) {
    set_overhead_state((current) => ({
      ...current,
      custom_overhead_items: (current.custom_overhead_items ?? []).filter(
        (item) => item.custom_overhead_id !== custom_overhead_id
      ),
      updated_at: new Date().toISOString(),
    }));
  }

  function save_profile() {
    const saved_record = {
      ...overhead_state,
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
      updated_at: new Date().toISOString(),
    });
  }

  function delete_profile(overhead_profile_id) {
    const next_saved = delete_overhead_profile(overhead_profile_id);
    set_saved_overheads(next_saved);
  }

  function reset_state() {
    const next_state = reset_general_overhead_state();
    set_overhead_state(next_state);
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