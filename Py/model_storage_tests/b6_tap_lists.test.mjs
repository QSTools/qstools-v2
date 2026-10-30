// R3 slice 1 batch 6 test. READ-ONLY: reads repo files, touches no storage.
// Run: node Py\model_storage_tests\b6_tap_lists.test.mjs
// Checks: (1) the key lists embedded in Py\audit-scripts\b6_model_tap.cjs equal lib\storage\modelStorageRegistry.js, the theme and
// scheduling keys equal the ones in their own files; (2) every reviewed (non-null) volatile list in the registry repeats the default
// pair updated_at / created_at (a reviewed array REPLACES the default in modelStorage.js); (3) the tap classifier passes a clean Model
// mode log and FAILS on each planted fault (write, bypass read, stray session key, notice-route call, scheduling key, changed hash,
// non-empty diffs); (4) changed_paths reports the fields that differ. Exit code 0 only if every check passes.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const require = createRequire(import.meta.url);
const tap = require(path.join(root, "Py", "audit-scripts", "b6_model_tap.cjs"));
const reg = await import(pathToFileURL(path.join(root, "lib", "storage", "modelStorageRegistry.js")).href);
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); } else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}
const same_list = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

// 1. lists
check("tap modelled keys equal the registry (28)", same_list(tap.LISTS.modelled, reg.MODELLED_KEYS.map((e) => e.key)) && reg.MODELLED_KEYS.length === 28);
check("tap unmodelled keys equal the registry", same_list(tap.LISTS.unmodelled, reg.UNMODELLED_KEYS));
check("tap scheduling key equals the registry excluded key", reg.EXCLUDED_KEYS.length === 1 && reg.EXCLUDED_KEYS[0] === tap.LISTS.scheduling);
check("tap mode key equals NEW_KEYS.mode", reg.NEW_KEYS.mode === tap.LISTS.mode_key);
const theme_src = fs.readFileSync(path.join(root, "lib", "theme", "themeStorage.js"), "utf8");
check("tap theme key equals lib/theme/themeStorage.js", theme_src.includes('"' + tap.LISTS.theme + '"'));
const store_src = fs.readFileSync(path.join(root, "lib", "storage", "modelStorage.js"), "utf8");
check("tap session log key equals modelStorage.js", store_src.includes('"' + tap.LISTS.session_log_key + '"'));
check("tap notice prefix does not collide with a route", !tap.LISTS.notice_prefix.startsWith("/"));

// 2. reviewed volatile lists keep the default pair
const bad_volatile = reg.MODELLED_KEYS.filter((e) => e.volatile !== null && !(e.volatile.includes("updated_at") && e.volatile.includes("created_at")));
check("every reviewed volatile list repeats updated_at and created_at", bad_volatile.length === 0, bad_volatile.map((e) => e.key).join(", "));

// 3. classifier
const KEYS = reg.MODELLED_KEYS.map((e) => e.key);
const start = { a: "1:x", b: "2:y" };
const ctx = (over = {}) => ({ start, end: { ...start }, diffs_text: '{"version":1,"by_key":{}}', scenarios_text: '{"version":1,"items":[]}', ...over });
const ok_log = () => [
  { op: "R", st: "local", k: "mirra_mode_v1", label: "/labour" },
  { op: "R", st: "local", k: "mirra_baseline_v1", label: "/labour" },
  { op: "R", st: "local", k: "mirra_baseline_v1_m16", label: "/labour" },
  { op: "R", st: "session", k: "mirra_model_stats_v1", label: "/labour" },
  { op: "W", st: "session", k: "mirra_model_stats_v1", label: "/labour" },
  { op: "R", st: "local", k: KEYS[0], label: "/dev/model-mode" },
  { op: "R", st: "local", k: "mirra_mode_v1", label: "notice:/scheduling" },
  { op: "W", st: "local", k: "qstools-theme", label: "/labour", same: true },
];
const verdict = (log, c = ctx()) => tap.evaluate(log, c);
const all_pass = (checks) => checks.every((c) => c.ok);
const failed_ids = (checks) => checks.filter((c) => !c.ok).map((c) => c.id.split(" ")[0]).join(",");
check("clean Model mode log passes every rule", all_pass(verdict(ok_log())), JSON.stringify(verdict(ok_log()).filter((c) => !c.ok)));
let l = [...ok_log(), { op: "W", st: "local", k: KEYS[3], label: "/labour", same: true }];
check("planted write to a real key fails rule 1", failed_ids(verdict(l)) === "1");
l = [...ok_log(), { op: "W", st: "local", k: "mirra_baseline_v1_m03", label: "/labour", same: true }];
check("planted write to a baseline entry fails rule 1", failed_ids(verdict(l)) === "1");
l = [...ok_log(), { op: "W", st: "local", k: "qstools-theme", label: "/labour", same: false }];
check("changed theme value fails rule 1", failed_ids(verdict(l)) === "1");
l = [...ok_log(), { op: "R", st: "local", k: KEYS[14], label: "/general-overheads" }];
check("planted raw read of a real modelled key fails rule 3", failed_ids(verdict(l)) === "3");
l = [...ok_log(), { op: "R", st: "local", k: "qs_tools_profit_and_loss_state", label: "/dev/cross-import-check" }];
check("dev-only page /dev/cross-import-check may read a real key (rule 3 exempt)", all_pass(verdict(l)), JSON.stringify(verdict(l).filter((c) => !c.ok)));
l = [...ok_log(), { op: "R", st: "local", k: "qs_tools_profit_and_loss_state", label: "/dev/model-readiness" }];
check("another /dev page is NOT exempt from rule 3", failed_ids(verdict(l)) === "3");
check("dev exemption list is exactly the two reviewed pages", same_list(tap.LISTS.dev_exempt, ["/dev/model-mode", "/dev/cross-import-check"]));
l = [...ok_log(), { op: "R", st: "session", k: "other_key", label: "/labour" }];
check("stray session key fails rule 2", failed_ids(verdict(l)) === "2");
l = [...ok_log(), { op: "R", st: "local", k: "qs_tools_quote_engine_store_v4", label: "notice:/quote-engine" }];
check("notice route reading another key fails rule 4", failed_ids(verdict(l)) === "4");
l = [...ok_log(), { op: "K", st: "local", k: "(enumeration)", label: "notice:/scheduling" }];
check("key() enumeration on a notice route fails", failed_ids(verdict(l)).includes("4") || failed_ids(verdict(l)).includes("5"));
l = [...ok_log(), { op: "R", st: "local", k: "qs_tools_scheduling_v4_tasks", label: "/labour" }];
check("scheduling key access fails rule 5", failed_ids(verdict(l)) === "5");
check("changed hash fails rule 6", failed_ids(verdict(ok_log(), ctx({ end: { a: "1:x", b: "2:z" } }))) === "6");
check("non-empty diffs fail rule 7", failed_ids(verdict(ok_log(), ctx({ diffs_text: '{"version":1,"by_key":{"k":[1]}}' }))) === "7");
const NUDGED = '{"version":1,"generation":1,"by_key":{"k":[{"path":"category:travel","kind":"pct","value":5,"flag":""}]}}';
check("slice 3: a layer that was set before install and is unchanged passes rule 7", failed_ids(verdict(ok_log(), ctx({ diffs_start: NUDGED, diffs_text: NUDGED }))) === "");
check("slice 3: a layer that changed since install fails rule 7", failed_ids(verdict(ok_log(), ctx({ diffs_start: NUDGED, diffs_text: NUDGED.replace('"value":5', '"value":6') }))) === "7");
check("slice 3: a layer that was empty at install and is no longer empty fails rule 7", failed_ids(verdict(ok_log(), ctx({ diffs_start: '{"version":1,"by_key":{}}', diffs_text: NUDGED }))) === "7");

// 4. changed_paths
const cp = tap.changed_paths(JSON.stringify({ a: 1, updated_at: "t1", list: [{ id: 1, v: 2, stamp: "x" }] }), JSON.stringify({ a: 1, updated_at: "t2", list: [{ id: 1, v: 2, stamp: "y" }] }));
check("changed_paths lists the fields that differ (arrays shown as [])", same_list(cp.paths, [".updated_at", ".list[].stamp"]) && !cp.created, JSON.stringify(cp));
check("changed_paths marks a key created from nothing", tap.changed_paths(null, "{}").created === true);
check("changed_paths marks unparsable text", tap.changed_paths("{", "{").unparsable === true);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
