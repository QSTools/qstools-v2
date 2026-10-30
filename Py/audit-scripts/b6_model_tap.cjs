// b6_model_tap.cjs
// R3 slice 1, batch 6 (BM brief Addenda 12 to 14). Call-level storage tap for Model mode.
// WHAT IT DOES: paste the whole file into the browser console of the running app. It wraps Storage getItem / setItem / removeItem /
//   clear / key, logs every call with a page label, then passes the call straight through. It changes no data of its own.
//   __b6.mark("/labour")  sets the page label for the calls that follow (call it before each client-side navigation, wait ~1.5 s after).
//   __b6.report()         prints and copies the result (a line of "undefined" afterwards is normal). __b6.remove() restores Storage.
//   In MODEL mode the report ends in PASS / FAIL lines (rules in evaluate() below). In BASELINE mode it lists, per key, which JSON
//   fields changed on a visit with no edits (those are the volatile fields) and the first-visit keys created from defaults.
// READ-ONLY: yes (no app file is touched). Also loadable in node (module.exports) so the test can check the classifier.
// LIMITS: a full page load removes the tap (paste again), so move between pages with the app's own links or the router. Production
//   builds give no caller names; the rules therefore use keys and page labels only. The first page's own mount is not covered
//   (install the tap on /dev/model-mode, then navigate). key() calls are counted; the length getter is not.
// The key lists below must equal lib/storage/modelStorageRegistry.js (tested by Py\model_storage_tests\b6_tap_lists.test.mjs).
(function (root) {
  const LISTS = {
    modelled: [
      "qs_tools_asset_state", "qs_tools_saved_assets", "qs_tools_balance_sheet_state_v1", "qs_tools_business_modelling_levers_v1",
      "qs_tools_business_modelling_scenario_state_v1", "qs_tools_business_modelling_state_v1",
      "qstools_business_outcome_non_productive_policy_v1", "qs_tools_business_setup_v1", "qs_tools_cost_allocation_profiles_v2_2",
      "qs_tools_cost_allocation_v2_1", "qs_employee_overhead_library_v1", "qs_employee_overhead_profiles_v1",
      "qs_tools_fixed_asset_register_state_v1", "qs_tools_saved_overheads", "qs_tools_general_overhead_state",
      "qs_tools_labour_profiles_v1", "qs_tools_labour_staff_types_v1", "qs_tools_module_reconciliation_acceptance_v1",
      "mirra_opening_hours_state_v4", "pnl_profiles_v3", "qs_tools_profit_and_loss_state", "qs_tools_rate_builder_labour_rates_v1",
      "qstools_rate_builder_labour_source_rates_v1", "qstools_rate_builder_materials_markup_v1", "qs_tools_rate_builder_calculators_v1",
      "qs_tools_recovery_summary_profiles", "qs_tools_recovery_summary_state", "qs_tools_revenue_cogs_state_v2",
    ],
    unmodelled: [
      "qs_tools_quick_start_state_v6", "qs_tools_quick_start_profiles_v1", "qs_tools_quote_engine_store_v4",
      "qs_tools_labour_rate_reality_check_v1",
    ],
    scheduling: "qs_tools_scheduling_v4_tasks",
    theme: "qstools-theme",
    mode_key: "mirra_mode_v1",
    session_log_key: "mirra_model_stats_v1",
    new_prefix: "mirra_",
    dev_page: "/dev/model-mode",
    // Dev-only pages that read real keys on purpose (P&L brief: /dev/cross-import-check is dev only). Rule 3 skips these labels.
    dev_exempt: ["/dev/model-mode", "/dev/cross-import-check"],
    notice_prefix: "notice:",
  };

  const hash = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(16); };

  // Paths (array positions shown as []) whose value differs between two stored JSON strings.
  function diff_paths(a, b, path, out) {
    if (out.size >= 60) return;
    const both_objects = a && b && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b);
    if (both_objects) {
      const arr = Array.isArray(a);
      const keys = arr ? Array.from({ length: Math.max(a.length, b.length) }, (_, i) => i) : Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
      for (const k of keys) diff_paths(a[k], b[k], path + (arr ? "[]" : "." + k), out);
    } else if (JSON.stringify(a) !== JSON.stringify(b)) out.add(path || "(root)");
  }
  function changed_paths(prev_text, next_text) {
    if (prev_text === null || prev_text === undefined) return { created: true, paths: [] };
    try {
      const out = new Set();
      diff_paths(JSON.parse(prev_text), JSON.parse(next_text), "", out);
      return { created: false, paths: Array.from(out).sort() };
    } catch { return { created: false, unparsable: true, paths: [] }; }
  }

  function key_class(k) {
    if (k.startsWith(LISTS.new_prefix) && !LISTS.modelled.includes(k)) return "new";
    if (LISTS.modelled.includes(k)) return "modelled";
    if (LISTS.unmodelled.includes(k)) return "unmodelled";
    if (k === LISTS.scheduling) return "scheduling";
    if (k === LISTS.theme) return "theme";
    return "other";
  }
  const is_notice = (label) => String(label).startsWith(LISTS.notice_prefix);

  // Model mode rules. ctx = { start, end, diffs_text, scenarios_text }. Returns [{ id, ok, text }].
  function evaluate(log, ctx) {
    const checks = [];
    const add = (id, bad, what) => checks.push({ id, ok: bad.length === 0, text: what + (bad.length ? "  ->  " + bad.slice(0, 8).join(" ; ") + (bad.length > 8 ? " (+" + (bad.length - 8) + " more)" : "") : "") });
    const local = log.filter((e) => e.st === "local");
    const session = log.filter((e) => e.st === "session");
    const writes = local.filter((e) => ["W", "X", "C"].includes(e.op));
    add("1 no local writes", writes.filter((e) => !(key_class(e.k) === "theme" && e.op === "W" && e.same)).map((e) => e.label + " " + e.op + " " + e.k), "zero setItem / removeItem / clear on localStorage (unchanged theme value allowed)");
    add("2 session log only", session.filter((e) => e.k !== LISTS.session_log_key).map((e) => e.label + " " + e.op + " " + e.k), "sessionStorage touched only at " + LISTS.session_log_key);
    add("3 no bypass", local.filter((e) => e.op === "R" && key_class(e.k) === "modelled" && !LISTS.dev_exempt.includes(e.label)).map((e) => e.label + " R " + e.k), "zero raw reads of the 28 real modelled keys (dev pages exempt: " + LISTS.dev_exempt.join(", ") + ")");
    const notice_bad = log.filter((e) => is_notice(e.label) && !(e.st === "local" && e.op === "R" && e.k === LISTS.mode_key)).map((e) => e.label + " " + e.st + " " + e.op + " " + e.k);
    add("4 notice routes", notice_bad, "notice routes make no storage call except the read of " + LISTS.mode_key);
    add("5 scheduling key", log.filter((e) => e.k === LISTS.scheduling).map((e) => e.label + " " + e.op), "no operation on the scheduling key, and no key() enumeration on notice routes");
    const enum_bad = log.filter((e) => e.op === "K" && is_notice(e.label)).map((e) => e.label + " key()");
    checks[checks.length - 1].ok = checks[checks.length - 1].ok && enum_bad.length === 0;
    if (enum_bad.length) checks[checks.length - 1].text += "  ->  " + enum_bad.slice(0, 4).join(" ; ");
    const keys = Array.from(new Set([...Object.keys(ctx.start), ...Object.keys(ctx.end)])).sort();
    add("6 storage unchanged", keys.filter((k) => ctx.start[k] !== ctx.end[k]).map((k) => k + " " + (ctx.start[k] || "absent") + "->" + (ctx.end[k] || "absent")), "hash of every localStorage key identical at install and at report");
    // Slice 3: a visit must not change the modelled layer. diffs_start is the text at install (nudges set BEFORE the tap are allowed); with no
    // diffs_start the old slice 1 rule applies (the layer must still be empty).
    const diffs_expected = ctx.diffs_start !== undefined ? ctx.diffs_start : '{"version":1,"by_key":{}}';
    // Slice 4 batch B: scenario removals are set BEFORE the tap, so mirra_scenarios_v1 is compared with its text at install. With no
    // scenarios_start the old rule applies (the list must still be empty).
    const scenarios_expected = ctx.scenarios_start !== undefined ? ctx.scenarios_start : '{"version":1,"items":[]}';
    add("7 layer unchanged", [ctx.diffs_text !== diffs_expected ? "diffs=" + ctx.diffs_text + " (expected " + diffs_expected + ")" : "", ctx.scenarios_text !== scenarios_expected ? "scenarios=" + ctx.scenarios_text + " (expected " + scenarios_expected + ")" : ""].filter(Boolean), "mirra_diffs_v1 unchanged since install, and mirra_scenarios_v1 unchanged since install");
    return checks;
  }

  function install() {
    if (root.__b6) { console.log("b6 tap already installed. Run __b6.report()"); return; }
    const S = Storage.prototype;
    const orig = { g: S.getItem, s: S.setItem, r: S.removeItem, c: S.clear, k: S.key };
    const log = [];
    let label = location.pathname;
    const store = (self) => (self === root.sessionStorage ? "session" : "local");
    const snap = () => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = orig.k.call(localStorage, i); const v = orig.g.call(localStorage, k) || ""; o[k] = v.length + ":" + hash(v); } return o; };
    S.getItem = function (k) { log.push({ op: "R", st: store(this), k: String(k), label }); return orig.g.apply(this, arguments); };
    S.setItem = function (k, v) {
      const prev = orig.g.call(this, k);
      const e = { op: "W", st: store(this), k: String(k), label, same: prev === String(v) };
      if (!e.same && e.st === "local") e.diff = changed_paths(prev, String(v));
      log.push(e);
      return orig.s.apply(this, arguments);
    };
    S.removeItem = function (k) { log.push({ op: "X", st: store(this), k: String(k), label }); return orig.r.apply(this, arguments); };
    S.clear = function () { log.push({ op: "C", st: store(this), k: "*", label }); return orig.c.apply(this, arguments); };
    S.key = function (i) { log.push({ op: "K", st: store(this), k: "(enumeration)", label }); return orig.k.apply(this, arguments); };
    const start = snap();
    const diffs_start = orig.g.call(localStorage, "mirra_diffs_v1") || "(absent)";
    const scenarios_start = orig.g.call(localStorage, "mirra_scenarios_v1") || "(absent)";
    const mode_text = orig.g.call(localStorage, LISTS.mode_key) || "";
    const mode = /"mode"\s*:\s*"model"/.test(mode_text) ? "model" : "baseline";

    root.__b6 = {
      log, start, mode, diffs_start, scenarios_start,
      mark(l) { label = String(l); },
      remove() { S.getItem = orig.g; S.setItem = orig.s; S.removeItem = orig.r; S.clear = orig.c; S.key = orig.k; delete root.__b6; console.log("b6 tap removed"); },
      report() {
        const lines = ["B6 STORAGE TAP REPORT   " + new Date().toISOString(), "mode at install: " + mode, "calls logged: " + log.length, ""];
        const pages = {};
        log.forEach((e) => { const p = pages[e.label] || (pages[e.label] = { LR: 0, LW: 0, LX: 0, K: 0, SR: 0, SW: 0, base: 0 }); if (e.st === "local") { if (e.op === "R") { p.LR++; if (e.k.startsWith("mirra_baseline_v1_")) p.base++; } if (e.op === "W") p.LW++; if (e.op === "X" || e.op === "C") p.LX++; if (e.op === "K") p.K++; } else { if (e.op === "R") p.SR++; else p.SW++; } });
        lines.push("page label | local reads (of which baseline entries) | local writes | removes+clears | key() | session reads | session writes");
        Object.keys(pages).forEach((l) => { const p = pages[l]; lines.push(l + " | " + p.LR + " (" + p.base + ") | " + p.LW + " | " + p.LX + " | " + p.K + " | " + p.SR + " | " + p.SW); });
        const end = snap();
        const ctx = { start, end, diffs_start, scenarios_start, diffs_text: orig.g.call(localStorage, "mirra_diffs_v1") || "(absent)", scenarios_text: orig.g.call(localStorage, "mirra_scenarios_v1") || "(absent)" };
        if (mode === "model") {
          lines.push("", "MODEL MODE CHECKS");
          const checks = evaluate(log, ctx);
          checks.forEach((c) => lines.push((c.ok ? "PASS " : "FAIL ") + c.id + ": " + c.text));
          lines.push("OVERALL: " + (checks.every((c) => c.ok) ? "PASS" : "FAIL"));
        } else {
          lines.push("", "BASELINE MODE WRITES (a visit with no edits: changed fields are the volatile fields)");
          const per = {};
          log.filter((e) => e.st === "local" && e.op === "W").forEach((e) => {
            const r = per[e.k] || (per[e.k] = { n: 0, same: 0, created: 0, paths: new Set(), unparsable: 0 });
            r.n++; if (e.same) r.same++;
            if (e.diff) { if (e.diff.created) r.created++; if (e.diff.unparsable) r.unparsable++; e.diff.paths.forEach((p) => r.paths.add(p)); }
          });
          Object.keys(per).sort().forEach((k) => { const r = per[k]; lines.push(k + " | " + key_class(k) + " | writes " + r.n + " | same " + r.same + " | created-from-default " + r.created + " | changed fields: " + (r.paths.size ? Array.from(r.paths).join(", ") : "none")); });
        }
        let helper = "(none)";
        try { helper = orig.g.call(root.sessionStorage, LISTS.session_log_key) || "(none)"; } catch { helper = "(unreadable)"; }
        lines.push("", "Helper session log (mirra_model_stats_v1): " + helper);
        lines.push("mirra_diffs_v1: " + ctx.diffs_text, "mirra_scenarios_v1: " + ctx.scenarios_text);
        const changed = Array.from(new Set([...Object.keys(start), ...Object.keys(end)])).sort().filter((k) => start[k] !== end[k]);
        lines.push("", "Keys changed since install (length:hash): " + (changed.length ? "" : "none"));
        changed.forEach((k) => lines.push("  " + k + "   " + (start[k] || "absent") + "  ->  " + (end[k] || "absent")));
        const text = lines.join("\n");
        console.log(text);
        try { copy(text); } catch { /* copy() exists only in devtools consoles */ }
        return text;
      },
    };
    console.log("b6 tap installed (mode " + mode + "). Use __b6.mark(label) before each navigation, then __b6.report()");
  }

  const api = { LISTS, changed_paths, evaluate, key_class, hash };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined" && typeof Storage !== "undefined" && typeof module === "undefined") install();
})(typeof window !== "undefined" ? window : globalThis);
