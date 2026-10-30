// R3 slice 1 batch 1 test. READ-ONLY (touches no repo file, no real browser storage). Run: node Py\model_storage_tests\b1_passthrough.test.mjs
// Checks: helper == direct localStorage (get/set/remove/quota error); registry sanity; every key constant in lib/storage is
// registered; new key names avoid the eight scheduling-scan words. Exit code 0 only if every check passes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const storage_dir = path.resolve(here, "..", "..", "lib", "storage");
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}

class FakeStorage {
  constructor() { this.map = new Map(); this.fail_set = false; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) {
    if (this.fail_set) { const e = new Error("quota exceeded"); e.name = "QuotaExceededError"; throw e; }
    this.map.set(String(k), String(v));
  }
  removeItem(k) { this.map.delete(k); }
}

const helper = await import(pathToFileURL(path.join(storage_dir, "modelStorage.js")).href);
const reg = await import(pathToFileURL(path.join(storage_dir, "modelStorageRegistry.js")).href);

// 1. pass-through: same op sequence on A (via helper) and B (direct)
const A = new FakeStorage(), B = new FakeStorage();
globalThis.window = { localStorage: A };
const ops = [
  ["set", "k1", "v1"], ["get", "k1"], ["get", "absent"], ["set", "k1", "v2"], ["get", "k1"],
  ["remove", "k1"], ["get", "k1"], ["remove", "absent"], ["set", "num", 123], ["get", "num"], ["set", "qs_tools_x y", "{\"a\":1}"], ["get", "qs_tools_x y"],
];
let same_returns = true;
for (const [op, k, v] of ops) {
  let ra, rb;
  if (op === "set") { ra = helper.setItem(k, v); rb = B.setItem(k, v); }
  if (op === "get") { ra = helper.getItem(k); rb = B.getItem(k); }
  if (op === "remove") { ra = helper.removeItem(k); rb = B.removeItem(k); }
  if (ra !== rb) same_returns = false;
}
check("helper returns equal direct returns for " + ops.length + " operations", same_returns);
check("helper leaves the same stored contents as direct calls", JSON.stringify([...A.map]) === JSON.stringify([...B.map]));
check("model_storage object exposes the same three functions", helper.model_storage.getItem === helper.getItem && helper.model_storage.setItem === helper.setItem && helper.model_storage.removeItem === helper.removeItem);
A.fail_set = true; B.fail_set = true;
let ea = null, eb = null;
try { helper.setItem("q", "1"); } catch (e) { ea = e; }
try { B.setItem("q", "1"); } catch (e) { eb = e; }
check("a quota error propagates unchanged", ea && eb && ea.name === eb.name && ea.message === eb.message);

// 2. registry sanity
const codes = reg.MODELLED_KEYS.map((e) => e.code), keys = reg.MODELLED_KEYS.map((e) => e.key);
check("28 modelled keys registered", reg.MODELLED_KEYS.length === 28, String(reg.MODELLED_KEYS.length));
check("codes unique and shaped mNN", new Set(codes).size === codes.length && codes.every((c) => /^m\d\d$/.test(c)));
check("keys unique across modelled, unmodelled and excluded", new Set([...keys, ...reg.UNMODELLED_KEYS, ...reg.EXCLUDED_KEYS]).size === keys.length + reg.UNMODELLED_KEYS.length + reg.EXCLUDED_KEYS.length);
check("find_modelled_entry finds the general overheads key", reg.find_modelled_entry("qs_tools_general_overhead_state")?.code === "m15");
check("baseline_entry_key builds mirra_baseline_v1_m15", reg.baseline_entry_key("m15") === "mirra_baseline_v1_m15");

// 3. new key names avoid the eight words (Addendum 9 item 1)
const new_names = [...Object.values(reg.NEW_KEYS), ...codes.map((c) => reg.baseline_entry_key(c))];
const bad = new_names.filter((n) => reg.FORBIDDEN_KEY_WORDS.some((w) => n.toLowerCase().includes(w)));
check("all " + new_names.length + " new key names avoid the eight scheduling-scan words", bad.length === 0, bad.join(","));

// 4. every key constant in lib/storage is registered, and every registered key is used
const known = new Set([...keys, ...reg.UNMODELLED_KEYS, ...reg.EXCLUDED_KEYS]);
const found = new Set();
for (const f of fs.readdirSync(storage_dir)) {
  if (!/\.(js|ts)$/.test(f) || f.startsWith("modelStorage")) continue;
  const text = fs.readFileSync(path.join(storage_dir, f), "utf8");
  for (const m of text.matchAll(/\w*KEY\w*\s*=\s*["']([^"']+)["']/g)) found.add(m[1]);
}
const unknown = [...found].filter((k) => !known.has(k));
const stale = [...known].filter((k) => !found.has(k));
check("every key constant in lib/storage is in the registry (" + found.size + " found)", unknown.length === 0, "unregistered: " + unknown.join(","));
const retired = reg.RETIRED_KEYS || [];
check("every retired key is still a registered modelled key", retired.every((k) => keys.includes(k)));
const stale_live = stale.filter((k) => !retired.includes(k));
check("no registered key is missing from lib/storage (retired keys excepted)", stale_live.length === 0, "stale: " + stale_live.join(","));

console.log("SUMMARY PASS " + pass + " / FAIL " + fail);
process.exit(fail === 0 ? 0 : 1);