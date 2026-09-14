"use client";

import { useEffect, useMemo, useState } from "react";

import { calculateWorkingCapitalRatios } from "@/lib/calculations/balanceSheetCalculations";
import { parseXeroBalanceSheetFile } from "@/lib/imports/xeroBalanceSheetImporter";
import {
  getDefaultBalanceSheetState,
  loadBalanceSheetState,
  saveBalanceSheetState,
  buildBalanceSheetStateFromImport,
} from "@/lib/storage/balanceSheetStorage";

/**
 * useBalanceSheet
 *
 * Follows the same load-on-mount / save-on-change / derive-via-useMemo
 * pattern as useRevenueCogs.js. Unlike Revenue/COGS (user-entered form
 * fields), Balance Sheet state is entirely IMPORT-DERIVED - there are no
 * per-field update functions here, just importFile() to bring in a new
 * Xero Excel export, and clearImport() to reset back to empty.
 */
export default function useBalanceSheet() {
  const [state, setState] = useState(() => getDefaultBalanceSheetState());
  const [is_importing, set_is_importing] = useState(false);
  const [import_error, set_import_error] = useState(null);

  useEffect(() => {
    const stored_state = loadBalanceSheetState();
    setState(stored_state);
  }, []);

  useEffect(() => {
    saveBalanceSheetState(state);
  }, [state]);

  async function importFile(file) {
    set_is_importing(true);
    set_import_error(null);

    try {
      const parsed = await parseXeroBalanceSheetFile(file);
      const next_state = buildBalanceSheetStateFromImport(parsed, file?.name || "");
      setState(next_state);
      return { success: true, warnings: parsed.warnings || [] };
    } catch (error) {
      const message =
        error && error.message
          ? error.message
          : "Could not read this file - check it's a Balance Sheet exported from Xero as .xlsx.";
      set_import_error(message);
      return { success: false, error: message };
    } finally {
      set_is_importing(false);
    }
  }

  function clearImport() {
    setState(getDefaultBalanceSheetState());
    set_import_error(null);
  }

  const ratios = useMemo(
    () => calculateWorkingCapitalRatios({ totals: state.totals, accounts: state.accounts }),
    [state.totals, state.accounts]
  );

  const has_data = Boolean(state.as_at_date) && state.accounts.length > 0;

  return {
    as_at_date: state.as_at_date,
    accounts: state.accounts,
    totals: state.totals,
    import_warnings: state.import_warnings,
    source_filename: state.source_filename,
    imported_at: state.imported_at,
    has_data,
    ratios,
    is_importing,
    import_error,
    importFile,
    clearImport,
  };
}