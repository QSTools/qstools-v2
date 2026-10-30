// R3 slice 3 batch 1b test. READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\s3_ids.test.mjs
// Checks the generated-id difference identity (BM Addendum 15 item 6, Addendum 18 slice 3 item 2): for each key whose module can
// regenerate an id when the saved copy lacks it, a write-back that differs ONLY in that id is no difference, and a write-back that changes
// anything else is still a difference. Ids that are REFERENCES (asset_id / staff_id inside cost allocation links) are NOT ignored. Also
// pins the reviewed volatile list of each key. Exit code 0 only if every check passes.
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
  constructor() { this.map = new Map(); this.log = []; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { this.log.push(["set", k]); this.map.set(k, String(v)); }
  removeItem(k) { this.log.push(["remove", k]); this.map.delete(k); }
}

const h = await import(pathToFileURL(path.join(storage_dir, "modelStorage.js")).href);
const L = await import(pathToFileURL(path.join(storage_dir, "modelBaselineLock.js")).href);
const R = await import(pathToFileURL(path.join(storage_dir, "modelStorageRegistry.js")).href);

const K = {
  asset_state: "qs_tools_asset_state",
  saved_assets: "qs_tools_saved_assets",
  allocation: "qs_tools_cost_allocation_v2_1",
  labour: "qs_tools_labour_profiles_v1",
  staff_types: "qs_tools_labour_staff_types_v1",
  pnl_profiles: "pnl_profiles_v3",
  pnl_state: "qs_tools_profit_and_loss_state",
  rates: "qs_tools_rate_builder_labour_rates_v1",
};
const base = {
  [K.asset_state]: { asset_id: "a1", asset_name: "Truck", purchase_price: 100, updated_at: "t0" },
  [K.saved_assets]: [{ asset_id: "a1", asset_name: "Truck", purchase_price: 100, updated_at: "t0" }],
  [K.allocation]: { active_allocation_profile_id: "ap1", asset_labour_links: [{ asset_id: "a1", staff_id: "s1" }], percent: 50 },
  [K.labour]: [{ staff_id: "s1", profile_id: "s1", staff_name: "Al", hourly_rate: 30 }],
  [K.staff_types]: [{ staff_type_id: "t1", staff_id: "s1", label: "Fitter" }],
  [K.pnl_profiles]: [{ id: "p1", name: "Main", lines: [{ pnl_line_id: "l1", amount: 5 }] }],
  [K.pnl_state]: { lines: [{ pnl_line_id: "l1", amount: 5 }] },
  [K.rates]: { labour_rate_model_id: "r1", rate: 10 },
};
const clone = (v) => JSON.parse(JSON.stringify(v));

// Build a storage, lock the baseline and enter Model mode.
const s = new FakeStorage();
for (const [k, v] of Object.entries(base)) s.map.set(k, JSON.stringify(v));
globalThis.window = { localStorage: s };
h.clear_model_caches();
const ready = { loaded: true, overall_status: "ready", blocking_count: 0, warning_count: 0, checked_at: "2026-10-30T00:00:00.000Z" };
const locked = L.lock_baseline({ readiness: ready, settled_fingerprint: L.fingerprint_real() });
const entered = h.set_mode("model");
check("setup: baseline locked and Model mode entered", locked.ok === true && entered.ok === true, JSON.stringify([locked, entered]));

function outcome(key, next) {
  h.reset_model_stats();
  s.log.length = 0;
  h.setItem(key, JSON.stringify(next));
  const st = h.get_model_stats();
  return { noop: st.noop_writes, dropped: st.dropped_writes, reason: st.dropped[0] ? st.dropped[0].reason : "", written: s.log.length };
}
function expect_noop(label, key, next) {
  const o = outcome(key, next);
  check(label + ": counted as no difference, nothing written", o.noop === 1 && o.dropped === 0 && o.written === 0, JSON.stringify(o));
}
function expect_difference(label, key, next) {
  const o = outcome(key, next);
  check(label + ": still a difference (discarded and counted), nothing written", o.noop === 0 && o.dropped === 1 && o.reason === "difference_not_stored_yet" && o.written === 0, JSON.stringify(o));
}

// asset_id (assetStorage.js builds a new uuid when the saved copy lacks one)
let v = clone(base[K.asset_state]); v.asset_id = "regenerated";
expect_noop("asset state, regenerated asset_id", K.asset_state, v);
v.purchase_price = 101;
expect_difference("asset state, regenerated asset_id AND a changed price", K.asset_state, v);
v = clone(base[K.saved_assets]); v[0].asset_id = "regenerated";
expect_noop("saved assets, regenerated asset_id", K.saved_assets, v);
v[0].purchase_price = 999;
expect_difference("saved assets, regenerated asset_id AND a changed price", K.saved_assets, v);
v = clone(base[K.saved_assets]); v.push({ asset_id: "a2", asset_name: "Digger", purchase_price: 5, updated_at: "t0" });
expect_difference("saved assets, a second asset added", K.saved_assets, v);

// active_allocation_profile_id (costAllocationStorage.js generates one in its empty state); links are REFERENCES
v = clone(base[K.allocation]); v.active_allocation_profile_id = "regenerated";
expect_noop("cost allocation, regenerated active_allocation_profile_id", K.allocation, v);
v = clone(base[K.allocation]); v.asset_labour_links[0].asset_id = "a2";
expect_difference("cost allocation, a link now points at a different asset (reference ids are NOT ignored)", K.allocation, v);
v = clone(base[K.allocation]); v.asset_labour_links[0].staff_id = "s9";
expect_difference("cost allocation, a link now points at a different staff member", K.allocation, v);
v = clone(base[K.allocation]); v.percent = 60;
expect_difference("cost allocation, a changed percent", K.allocation, v);

// staff_id / profile_id (labourProfileStorage.js: staff_id || generateStaffId(), profile_id || staff_id)
v = clone(base[K.labour]); v[0].staff_id = "regenerated"; v[0].profile_id = "regenerated";
expect_noop("labour profiles, regenerated staff_id and profile_id", K.labour, v);
v[0].hourly_rate = 31;
expect_difference("labour profiles, regenerated ids AND a changed rate", K.labour, v);
v = clone(base[K.staff_types]); v[0].staff_id = "regenerated";
expect_difference("staff types (not reviewed for ids): a staff_id change is still a difference", K.staff_types, v);

// pnl_line_id and the P&L profile id (profitAndLossProfileStorage.js, profitAndLossDefaults.js)
v = clone(base[K.pnl_profiles]); v[0].id = "regenerated"; v[0].lines[0].pnl_line_id = "regenerated";
expect_noop("P&L profiles, regenerated profile id and pnl_line_id", K.pnl_profiles, v);
v[0].lines[0].amount = 6;
expect_difference("P&L profiles, regenerated ids AND a changed amount", K.pnl_profiles, v);
v = clone(base[K.pnl_state]); v.lines[0].pnl_line_id = "regenerated";
expect_noop("P&L state, regenerated pnl_line_id", K.pnl_state, v);
v.lines[0].amount = 6;
expect_difference("P&L state, regenerated pnl_line_id AND a changed amount", K.pnl_state, v);
v = clone(base[K.pnl_state]); v.lines.push({ pnl_line_id: "l2", amount: 1 });
expect_difference("P&L state, a line added", K.pnl_state, v);
v = clone(base[K.pnl_state]); v.lines = [];
expect_difference("P&L state, the only line removed", K.pnl_state, v);

// labour_rate_model_id (rateBuilderLabourRatesStorage.js: overrides.labour_rate_model_id || crypto.randomUUID())
v = clone(base[K.rates]); v.labour_rate_model_id = "regenerated";
expect_noop("rate builder labour rates, regenerated labour_rate_model_id", K.rates, v);
v.rate = 11;
expect_difference("rate builder labour rates, regenerated id AND a changed rate", K.rates, v);

// the timestamp pair still works on a reviewed key
v = clone(base[K.rates]); v.updated_at = "later"; v.created_at = "earlier";
expect_noop("a reviewed key still ignores updated_at and created_at", K.rates, v);

// the lists, pinned
const volatile_of = (code) => R.MODELLED_KEYS.find((e) => e.code === code).volatile;
const want = {
  m01: ["updated_at", "created_at", "asset_id"],
  m02: ["updated_at", "created_at", "asset_id"],
  m10: ["updated_at", "created_at", "active_allocation_profile_id"],
  m15: ["updated_at", "created_at", "overhead_profile_id"],
  m16: ["updated_at", "created_at", "staff_id", "profile_id"],
  m20: ["updated_at", "created_at", "id", "pnl_line_id"],
  m21: ["updated_at", "created_at", "pnl_line_id"],
  m22: ["updated_at", "created_at", "labour_rate_model_id"],
};
for (const [code, list] of Object.entries(want)) {
  check("registry " + code + " volatile list is " + list.join(","), JSON.stringify(volatile_of(code)) === JSON.stringify(list), JSON.stringify(volatile_of(code)));
}
const reviewed = R.MODELLED_KEYS.filter((e) => e.volatile !== null).map((e) => e.code).sort().join();
check("exactly these 8 codes are reviewed; the rest stay unreviewed (null = default pair)", reviewed === Object.keys(want).sort().join(), reviewed);
check("the registry version is unchanged (a baseline locked before this patch stays valid)", R.REGISTRY_VERSION === 1);
check("a reference id is not in the cost allocation list (asset_id, staff_id)", !volatile_of("m10").includes("asset_id") && !volatile_of("m10").includes("staff_id"));

console.log("\n" + pass + " of " + (pass + fail) + " passed");
process.exit(fail === 0 ? 0 : 1);
