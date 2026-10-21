// QS Tools dataset backup / restore - paste into the BROWSER console (not PowerShell).
// Storage keys covered (19 as of 2026-09-29): every localStorage key starting
// qs_tools_ or qstools_ (cost_allocation_v2_1, saved_assets, business_setup_v1,
// balance_sheet_state_v1, business_modelling_state_v1, general_overhead_state,
// rate_builder_labour_source_rates_v1, saved_overheads, business_modelling_levers_v1,
// labour_staff_types_v1, rate_builder_labour_rates_v1, recovery_summary_state,
// labour_profiles_v1, profit_and_loss_state, business_modelling_scenario_state_v1,
// revenue_cogs_state_v2, asset_state, rate_builder_materials_markup_v1,
// business_outcome_non_productive_policy_v1).
// Capture by DOWNLOAD, never clipboard (kickoff s8).

// ---- BACKUP: downloads PADDED_dataset_backup_<timestamp>.json ----
(() => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith("qs_tools_") || k.startsWith("qstools_"));
  const dump = { _meta: { taken_at: new Date().toISOString(), origin: location.origin, key_count: keys.length }, raw: {} };
  keys.forEach(k => { dump.raw[k] = localStorage.getItem(k); });
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "PADDED_dataset_backup_" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  console.log("Backed up " + keys.length + " keys:", keys);
})();

// ---- RESTORE: pick a backup file; REPLACES all qs_tools_/qstools_ keys, then reload ----
(() => {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = ".json";
  inp.onchange = async () => {
    const d = JSON.parse(await inp.files[0].text());
    Object.keys(localStorage).filter(k => k.startsWith("qs_tools_") || k.startsWith("qstools_")).forEach(k => localStorage.removeItem(k));
    Object.entries(d.raw).forEach(([k, v]) => { if (v !== null) localStorage.setItem(k, v); });
    console.log("Restored " + Object.keys(d.raw).length + " keys. Reload the page now.");
  };
  inp.click();
})();