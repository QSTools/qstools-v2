"use client";

import { useMemo } from "react";
import {
  createEmptyAssetState,
  useAssetStorage,
} from "@/lib/storage/assetStorage";
import { calculateAssetOutputs } from "@/lib/calculations/assetCalculations";
import {
  buildAssetStatus,
  buildAssetCard,
} from "@/lib/selectors/assetSelectors";

export default function useAssets() {
  const {
    asset_state,
    saved_assets,
    active_asset_count,
    set_asset_field,
    set_asset_fields,
    replace_asset_state,
    reset_asset_state,
    save_asset,
    load_asset,
    delete_asset,
  } = useAssetStorage();

  const calculations = useMemo(() => {
    return calculateAssetOutputs(asset_state);
  }, [asset_state]);

  function handle_new_asset() {
    replace_asset_state(createEmptyAssetState());
  }

  function handle_save_asset() {
    save_asset(calculations);
  }

  function handle_load_asset(asset_id) {
    load_asset(asset_id);
  }

  function handle_delete_asset(asset_id) {
    delete_asset(asset_id);
  }

  const status = useMemo(() => {
    return buildAssetStatus({
      asset_state,
      calculations,
      saved_assets,
      active_asset_count,
    });
  }, [asset_state, calculations, saved_assets, active_asset_count]);

  const card = useMemo(() => {
    return buildAssetCard({
      asset_state,
      calculations,
      saved_assets,
      actions: {
        set_asset_field,
        set_asset_fields,
        reset_asset_state,
        new_asset: handle_new_asset,
        save_asset: handle_save_asset,
        load_asset: handle_load_asset,
        delete_asset: handle_delete_asset,
      },
    });
  }, [
    asset_state,
    calculations,
    saved_assets,
    set_asset_field,
    set_asset_fields,
    reset_asset_state,
  ]);

  return {
    status,
    card,
  };
}