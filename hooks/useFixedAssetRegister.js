"use client";

import { useEffect, useMemo, useState } from "react";

import { parseXeroFixedAssetRegisterFile } from "@/lib/imports/xeroFixedAssetRegisterImporter";
import {
  getDefaultFixedAssetRegisterState,
  loadFixedAssetRegisterState,
  saveFixedAssetRegisterState,
  buildFixedAssetRegisterStateFromImport,
  buildFixedAssetRegisterState,
} from "@/lib/storage/fixedAssetRegisterStorage";

/**
 * useFixedAssetRegister
 *
 * Follows useBalanceSheet.js's pattern, WITH the save-before-load race
 * condition fix applied from the start this time (has_loaded guard) -
 * that exact bug was found live 2026-09-12 in useBalanceSheet.js
 * (silently wiped imported data on every navigation) - no reason to
 * reintroduce the same class of bug here now that it's known.
 */
export default function useFixedAssetRegister() {
  const [state, setState] = useState(() => getDefaultFixedAssetRegisterState());
  const [is_importing, set_is_importing] = useState(false);
  const [import_error, set_import_error] = useState(null);
  const [has_loaded, set_has_loaded] = useState(false);

  useEffect(() => {
    const stored_state = loadFixedAssetRegisterState();
    setState(stored_state);
    set_has_loaded(true);
  }, []);

  useEffect(() => {
    if (!has_loaded) return;
    saveFixedAssetRegisterState(state);
  }, [state, has_loaded]);

  async function importFile(file) {
    set_is_importing(true);
    set_import_error(null);

    try {
      const parsed = await parseXeroFixedAssetRegisterFile(file);
      const next_state = buildFixedAssetRegisterStateFromImport(parsed, file?.name || "");
      setState(next_state);
      return { success: true, warnings: parsed.warnings || [] };
    } catch (error) {
      const message =
        error && error.message
          ? error.message
          : "Could not read this file - check it's a Fixed Asset Register exported from Xero as .xlsx.";
      set_import_error(message);
      return { success: false, error: message };
    } finally {
      set_is_importing(false);
    }
  }

  function clearImport() {
    setState(getDefaultFixedAssetRegisterState());
    set_import_error(null);
  }

  function setAssetIncluded(asset_number, is_included) {
    setState((previous) =>
      buildFixedAssetRegisterState({
        ...previous,
        assets: previous.assets.map((a) =>
          a.asset_number === asset_number ? { ...a, is_included } : a
        ),
      })
    );
  }

  const has_data = state.assets.length > 0;
  const included_count = useMemo(
    () => state.assets.filter((a) => a.is_included).length,
    [state.assets]
  );

  return {
    assets: state.assets,
    import_warnings: state.import_warnings,
    source_filename: state.source_filename,
    imported_at: state.imported_at,
    has_data,
    included_count,
    is_importing,
    import_error,
    importFile,
    clearImport,
    setAssetIncluded,
  };
}