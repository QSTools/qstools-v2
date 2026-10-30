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
} from "@/lib/selectors/generalOverheadSelectors";
import { build_general_overhead_output_contract } from "@/hooks/general-overheads/generalOverheadOutputContract";
import {
  build_general_overheads_from_pnl,
  build_pnl_sync_signature,
} from "@/hooks/general-overheads/generalOverheadPnlSync";
import {
  create_custom_id,
  round_allocation_amount,
} from "@/hooks/general-overheads/generalOverheadHookUtils";

import { useProfitAndLossStorage } from "@/lib/storage/profitAndLossStorage";
import { calculateProfitAndLoss } from "@/lib/calculations/profitAndLossCalculations";
import { useAssetStorage } from "@/lib/storage/assetStorage";
import { get_mode } from "@/lib/storage/modelStorage";
import { get_overhead_nudges, set_overhead_nudge, subscribe_to_diffs } from "@/lib/storage/modelDiffs";
import { apply_overhead_nudges } from "@/lib/calculations/generalOverheadNudge";
import { classify_nudge_row } from "@/hooks/general-overheads/generalOverheadNudgeClassify";

export default function useGeneralOverheads() {
  const [is_hydrated, set_is_hydrated] = useState(false);

  const [overhead_state, set_overhead_state] = useState(
    create_empty_general_overhead_state()
  );

  const [saved_overheads, set_saved_overheads] = useState([]);

  const last_pnl_sync_signature_ref = useRef("");

  // R3 slice 3: the modelled layer. Empty (and no storage is read) in baseline mode. Read after mount, never during the first render, so the
  // first render matches the server. Every mounted copy of this hook listens, so none goes stale when a nudge changes.
  const [nudges, set_nudges] = useState({});
  const [model_active, set_model_active] = useState(false);

  const { profit_and_loss_state } = useProfitAndLossStorage();

  // Read Assets' raw saved records directly from storage - not via the
  // useAssets hook, because useAssets itself imports useGeneralOverheads
  // (for asset_overhead_pools). Going through useAssets here would create
  // a circular hook dependency. Reading storage directly breaks that
  // cycle: this pulls the same saved asset records Assets itself reads,
  // with no dependency on Assets' calculated output.
  const { saved_assets, has_hydrated: assets_has_hydrated } =
    useAssetStorage();

  const assets_finance_interest_total = useMemo(() => {
    if (!assets_has_hydrated) {
      return 0;
    }

    return (saved_assets ?? [])
      .filter((asset) => !asset.is_retired)
      .reduce(
        (sum, asset) =>
          sum + Number(asset.asset_interest_annual ?? asset.interest_annual ?? 0),
        0
      );
  }, [saved_assets, assets_has_hydrated]);

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
    // Keep the same empty object in baseline mode so this adds no re-render there.
    const loaded_nudges = get_overhead_nudges();
    set_nudges((current) =>
      Object.keys(loaded_nudges).length === 0 && Object.keys(current).length === 0 ? current : loaded_nudges
    );
    set_model_active(get_mode() === "model");
    set_is_hydrated(true);
  }, []);

  useEffect(() => {
    return subscribe_to_diffs(() => set_nudges(get_overhead_nudges()));
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

  // R3 slice 3: the per-category nudge is applied HERE, after the P&L rebuild, to a COPY. overhead_state (what is saved and what the form edits)
  // is never changed. With no nudges (always the case in baseline mode) modelled_state IS overhead_state and nothing extra is calculated.
  const nudge_result = useMemo(() => {
    return apply_overhead_nudges({
      overhead_state,
      nudges,
      calculate: (state) =>
        calculate_general_overheads(state, assets_finance_interest_total),
      classify_row: classify_nudge_row,
    });
  }, [overhead_state, nudges, assets_finance_interest_total]);

  const modelled_state = nudge_result.state;

  const calculated = useMemo(() => {
    return calculate_general_overheads(
      modelled_state,
      assets_finance_interest_total
    );
  }, [modelled_state, assets_finance_interest_total]);

  const output_contract = useMemo(() => {
    return build_general_overhead_output_contract({
      calculated,
      overhead_state: modelled_state,
    });
  }, [calculated, modelled_state]);

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

  function set_nudge(category_key, pct) {
    const result = set_overhead_nudge(category_key, pct);
    if (result.ok) {
      set_nudges(result.nudges);
    }
    return result;
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

  const model_layer = {
    active: model_active,
    nudges,
    by_category: nudge_result.by_category,
    set_nudge,
  };

  let cached_card;
  let card_built = false;
  const build_card = () => build_general_overhead_card({
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
    get card() { if (!card_built) { card_built = true; cached_card = { ...build_card(), modelling: model_layer }; } return cached_card; },
    is_hydrated,
  };
}
