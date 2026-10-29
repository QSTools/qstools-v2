// R3 slice 2 batch 1 test. READ-ONLY: uses a fake in-memory store only (touches no repo file and no real browser storage).
// Run: node Py\model_storage_tests\s2_lock.test.mjs
// Checks: the lock gate (every refusal writes nothing), a successful lock (only baseline keys written, real keys byte-identical,
// entries equal the real keys), Model mode needs a LOCKED baseline, the deliberate unlock (meta key only), five lock / unlock / edit /
// relock cycles, storage full during a lock, a write during a lock (the lock is withdrawn), the settle step, the fingerprints, and
// that modelBaselineLock.js stays under 600 lines. Exit code 0 only if every check passes.
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
  constructor(capacity = Infinity) { this.map = new Map(); this.capacity = capacity; this.log = []; }
  used() { let n = 0; for (const [k, v] of this.map) n += k.length + v.length; return n; }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) {
    const value = String(v);
    const old = this.map.has(k) ? k.length + this.map.get(k).length : 0;
    if (this.used() - old + k.length + value.length > this.capacity) {
      const e = new Error("quota exceeded"); e.name = "QuotaExceededError"; throw e;
    }
    this.log.push(["set", k]); this.map.set(k, value);
  }
  removeItem(k) { this.log.push(["remove", k]); this.map.delete(k); }
}

const h = await import(pathToFileURL(path.join(storage_dir, "modelStorage.js")).href);
const L = await import(pathToFileURL(path.join(storage_dir, "modelBaselineLock.js")).href);

const GO = "qs_tools_general_overhead_state", PNL = "qs_tools_profit_and_loss_state", QE = "qs_tools_quote_engine_store_v4";
const go_value = (notes = "", stamp = "2026-01-01T00:00:00.000Z") => JSON.stringify({
  overhead_profile_id: "p1", vehicle_running_cost_annual: 38700, custom_overhead_items: [{ id: "c1", amount: 10 }],
  created_at: "2026-01-01T00:00:00.000Z", updated_at: stamp, notes,
});
const pnl_value = (pad = "") => JSON.stringify({ revenue: 1000, pad });
const real_data = () => ({ [GO]: go_value(), [PNL]: pnl_value(), [QE]: "{\"quote\":1}" });

function fresh(capacity = Infinity, data = real_data()) {
  const s = new FakeStorage(capacity);
  for (const [k, v] of Object.entries(data)) s.map.set(k, v);
  globalThis.window = { localStorage: s };
  h.clear_model_caches();
  h.reset_model_stats();
  return s;
}
const ready = (over = {}) => ({ loaded: true, overall_status: "ready", blocking_count: 0, warning_count: 0, checked_at: "2026-10-30T00:00:00.000Z", ...over });
const good_args = () => ({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
const real_only = (s) => new Map([...s.map].filter(([k]) => !k.startsWith("mirra_")));
const same_map = (a, b) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
const mirra_entries = (s) => JSON.stringify([...s.map].filter(([k]) => k.startsWith("mirra_")).sort());

// 1. gate (pure)
let g = L.check_lock_gate({ mode: "baseline", locked: false, readiness: ready(), settled_fingerprint: "a", current_fingerprint: "a" });
check("gate passes with ready, 0 blocking, 0 warnings, settled, baseline mode, not locked", g.ok === true && g.reasons.length === 0);
const gate_code = (over) => {
  const input = { mode: "baseline", locked: false, readiness: ready(), settled_fingerprint: "a", current_fingerprint: "a", ...over };
  return L.check_lock_gate(input).reasons.map((x) => x.code);
};
check("gate refuses in Model mode", gate_code({ mode: "model" }).includes("model_mode_active"));
check("gate refuses when already locked", gate_code({ locked: true }).includes("already_locked"));
check("gate refuses when readiness has not loaded", gate_code({ readiness: ready({ loaded: false }) }).includes("not_loaded"));
check("gate refuses when readiness is missing", gate_code({ readiness: undefined }).includes("not_loaded"));
check("gate refuses an unknown overall_status", gate_code({ readiness: ready({ overall_status: "weird" }) }).includes("not_loaded"));
check("gate refuses when blocked", gate_code({ readiness: ready({ overall_status: "blocked", blocking_count: 1 }) }).join() === "blocked");
check("gate refuses on an unresolved warning (owner decision 1)", gate_code({ readiness: ready({ overall_status: "warning", warning_count: 1 }) }).join() === "open_checks");
check("gate refuses 'ready' with a stray warning count", gate_code({ readiness: ready({ warning_count: 2 }) }).join() === "open_checks");
check("gate refuses when the fingerprint moved", gate_code({ current_fingerprint: "b" }).join() === "not_settled");
check("gate refuses with no settled fingerprint", gate_code({ settled_fingerprint: "" }).join() === "not_settled");
check("gate lists every reason that applies, most important first", gate_code({ mode: "model", locked: true, readiness: ready({ overall_status: "blocked" }), current_fingerprint: "b" }).join() === "model_mode_active,already_locked,blocked,not_settled");

// 2. refusals write nothing
let s = fresh();
const real_before = new Map(s.map);
const attempts = [
  ["readiness blocked", { ...good_args(), readiness: ready({ overall_status: "blocked", blocking_count: 1 }) }, "blocked"],
  ["open warning", { ...good_args(), readiness: ready({ overall_status: "warning", warning_count: 1 }) }, "open_checks"],
  ["readiness not loaded", { ...good_args(), readiness: ready({ loaded: false }) }, "not_loaded"],
  ["data not settled", { ...good_args(), settled_fingerprint: "stale" }, "not_settled"],
  ["no arguments at all", undefined, "not_loaded"],
];
for (const [label, args, code] of attempts) {
  s.log.length = 0;
  const r = L.lock_baseline(args);
  check("lock refused (" + label + "): reason " + code + ", message present, nothing written", r.ok === false && r.reason === code && typeof r.message === "string" && r.message.length > 0 && s.log.length === 0, JSON.stringify(r));
}
check("after all refusals storage is byte-identical and no mirra key exists", same_map(s.map, real_before));

// 2b. refusal in Model mode (needs a locked baseline to get there)
s = fresh();
let r = L.lock_baseline(good_args());
h.set_mode("model");
s.log.length = 0;
const model_attempt = L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
check("lock refused in Model mode, nothing written", model_attempt.ok === false && model_attempt.reason === "model_mode_active" && s.log.length === 0);
const unlock_in_model = L.unlock_baseline({ confirmed: true });
check("unlock refused in Model mode, nothing written", unlock_in_model.ok === false && unlock_in_model.reason === "model_mode_active" && s.log.length === 0);

// 3. successful lock
s = fresh();
const real_pre = real_only(s);
s.log.length = 0;
r = L.lock_baseline(good_args());
check("lock succeeds", r.ok === true && r.generation === 1, JSON.stringify(r));
const meta = JSON.parse(s.getItem("mirra_baseline_v1"));
check("meta: locked true, locked_at set, source lock, generation 1, version 1, registry_version 1", meta.locked === true && meta.locked_at !== "" && meta.source === "lock" && meta.generation === 1 && meta.version === 1 && meta.registry_version === 1);
check("meta records the readiness summary and the fingerprint", meta.readiness.overall_status === "ready" && meta.readiness.blocking_count === 0 && meta.readiness.warning_count === 0 && meta.fingerprint === r.fingerprint && meta.unlocked_at === "");
check("meta lists 2 present and 26 absent codes covering all 28", meta.codes.length === 2 && meta.absent_codes.length === 26);
check("each baseline entry equals its real key byte for byte", s.getItem("mirra_baseline_v1_m15") === go_value() && s.getItem("mirra_baseline_v1_m21") === pnl_value());
check("every write of the lock is a baseline key (no real key written)", s.log.length > 0 && s.log.every(([, k]) => k.startsWith("mirra_baseline_v1")));
check("real keys are byte-identical after the lock", same_map(real_only(s), real_pre));
check("is_baseline_locked is true and baseline_matches_real is true", h.is_baseline_locked() === true && L.baseline_matches_real() === true);
const state = L.get_lock_state();
check("get_lock_state reports locked, generation 1, has_baseline", state.locked === true && state.has_baseline === true && state.generation === 1 && state.source === "lock");
r = L.lock_baseline(good_args());
check("a second lock while locked is refused (already_locked)", r.ok === false && r.reason === "already_locked");

// 4. Model mode needs a LOCKED baseline
s = fresh();
h.take_baseline_snapshot();
r = h.set_mode("model");
check("set_mode(model) is refused on a complete but unlocked baseline (dev copy)", r.ok === false && r.reason === "baseline_not_locked" && h.get_mode() === "baseline", JSON.stringify(r));
check("the refusal wrote nothing to the mode, diffs or scenarios keys", s.getItem("mirra_mode_v1") === null && s.getItem("mirra_diffs_v1") === null && s.getItem("mirra_scenarios_v1") === null);
s = fresh();
r = h.set_mode("model");
check("set_mode(model) with no baseline at all is still refused (no_baseline)", r.ok === false && r.reason === "no_baseline");
s = fresh();
L.lock_baseline(good_args());
r = h.set_mode("model");
check("set_mode(model) succeeds on a locked baseline", r.ok === true && h.get_mode() === "model");
h.set_mode("baseline");

// 5. unlock
s = fresh();
L.lock_baseline(good_args());
s.map.set("mirra_diffs_v1", JSON.stringify({ version: 1, by_key: {} }));
s.map.set("mirra_scenarios_v1", JSON.stringify({ version: 1, items: [] }));
const keep = new Map(s.map);
s.log.length = 0;
r = L.unlock_baseline();
check("unlock without confirmation is refused, nothing written", r.ok === false && r.reason === "not_confirmed" && s.log.length === 0);
r = L.unlock_baseline({ confirmed: "yes" });
check("unlock needs confirmed === true exactly", r.ok === false && r.reason === "not_confirmed" && s.log.length === 0);
r = L.unlock_baseline({ confirmed: true });
check("unlock with confirmation succeeds", r.ok === true);
check("unlock wrote the baseline meta key and nothing else", s.log.length === 1 && s.log[0][0] === "set" && s.log[0][1] === "mirra_baseline_v1", JSON.stringify(s.log));
const meta_after = JSON.parse(s.getItem("mirra_baseline_v1"));
check("meta: locked false, unlocked_at set, generation unchanged", meta_after.locked === false && meta_after.unlocked_at !== "" && meta_after.generation === 1);
check("every other key is byte-identical (real, baseline entries, diffs, scenarios)", same_map(new Map([...s.map].filter(([k]) => k !== "mirra_baseline_v1")), new Map([...keep].filter(([k]) => k !== "mirra_baseline_v1"))));
check("Model mode is refused again after the unlock", h.set_mode("model").reason === "baseline_not_locked");
s.log.length = 0;
r = L.unlock_baseline({ confirmed: true });
check("unlocking an unlocked baseline is refused (not_locked), nothing written", r.ok === false && r.reason === "not_locked" && s.log.length === 0);
s = fresh();
r = L.unlock_baseline({ confirmed: true });
check("unlock with no baseline is refused (not_locked)", r.ok === false && r.reason === "not_locked");

// 6. five lock / unlock / edit / relock cycles
s = fresh();
s.map.set("mirra_diffs_v1", JSON.stringify({ version: 1, by_key: {} }));
s.map.set("mirra_scenarios_v1", JSON.stringify({ version: 1, items: [] }));
const diffs_text = s.getItem("mirra_diffs_v1"), scenarios_text = s.getItem("mirra_scenarios_v1");
let cycles_ok = true, detail = "";
let expected_real = go_value();
for (let n = 1; n <= 5; n += 1) {
  r = L.lock_baseline({ readiness: ready(), settled_fingerprint: L.fingerprint_real() });
  const m = JSON.parse(s.getItem("mirra_baseline_v1"));
  if (!(r.ok && r.generation === n && m.locked === true && s.getItem("mirra_baseline_v1_m15") === expected_real && L.baseline_matches_real())) { cycles_ok = false; detail += " lock" + n + ":" + JSON.stringify(r); }
  if (!L.unlock_baseline({ confirmed: true }).ok) { cycles_ok = false; detail += " unlock" + n; }
  const old_baseline = expected_real;
  expected_real = go_value("edit " + n);
  s.map.set(GO, expected_real);
  if (s.getItem("mirra_baseline_v1_m15") !== old_baseline) { cycles_ok = false; detail += " baseline moved while unlocked at " + n; }
  if (s.getItem("mirra_diffs_v1") !== diffs_text || s.getItem("mirra_scenarios_v1") !== scenarios_text) { cycles_ok = false; detail += " diffs/scenarios moved at " + n; }
}
check("5 cycles: each lock copies the current real data, generation counts 1 to 5, the baseline never moves while unlocked, diffs and scenarios untouched", cycles_ok, detail);
check("5 cycles: the real key holds only the deliberate edits (last edit present, others untouched)", s.getItem(GO) === go_value("edit 5") && s.getItem(PNL) === pnl_value());

// 7. storage full during a lock: previous baseline unchanged
s = fresh();
L.lock_baseline(good_args());
L.unlock_baseline({ confirmed: true });
const pad = "x".repeat(3000);
s.map.set(GO, go_value(pad)); s.map.set(PNL, pnl_value(pad));
const arg7 = { readiness: ready(), settled_fingerprint: L.fingerprint_real() };
const baseline_before = mirra_entries(s);
s.capacity = s.used() + 3200;
s.log.length = 0;
r = L.lock_baseline(arg7);
check("lock with a full store stops with the plain message", r.ok === false && r.reason === "storage_full" && r.message === "This business is too large for Model mode until the database arrives", JSON.stringify(r));
check("the failed lock left every mirra key exactly as before (previous baseline and its unlocked state)", mirra_entries(s) === baseline_before);
check("the failed lock wrote something first (rollback really exercised)", s.log.some(([op, k]) => op === "set" && k.startsWith("mirra_baseline_v1_")));

// 8. a real key is written while the lock runs: the lock is withdrawn
s = fresh();
const args8 = good_args();
const original_set = s.setItem.bind(s);
s.setItem = (k, v) => {
  original_set(k, v);
  if (k === "mirra_baseline_v1" && String(v).includes("\"locked\":true")) s.map.set(GO, go_value("written by a second tab"));
};
r = L.lock_baseline(args8);
check("a real change during the lock withdraws it (not_settled)", r.ok === false && r.reason === "not_settled");
check("the withdrawn lock leaves locked false and Model mode refused", JSON.parse(s.getItem("mirra_baseline_v1")).locked === false && h.set_mode("model").ok === false);

// 9. settle step
let st = L.settle_step(null, "f1", 1000);
check("settle: first sight is not settled", st.settled === false && st.state.fingerprint === "f1");
st = L.settle_step(st.state, "f1", 1000 + L.SETTLE_MS - 1);
check("settle: not settled just before SETTLE_MS", st.settled === false);
st = L.settle_step(st.state, "f1", 1000 + L.SETTLE_MS);
check("settle: settled at SETTLE_MS with an unchanged fingerprint", st.settled === true);
st = L.settle_step(st.state, "f2", 9000);
check("settle: a moved fingerprint restarts the clock", st.settled === false && st.state.since === 9000);

// 10. fingerprints
s = fresh();
const f0 = L.fingerprint_real();
s.map.set(GO, go_value("", "2099-12-31T00:00:00.000Z"));
check("fingerprint ignores volatile fields (updated_at)", L.fingerprint_real() === f0);
s.map.set(GO, go_value("a real change"));
check("fingerprint changes with a real change", L.fingerprint_real() !== f0);
s.map.set(GO, go_value());
check("fingerprint returns when the change is undone", L.fingerprint_real() === f0);
s.map.delete(PNL);
check("fingerprint changes when a key is removed", L.fingerprint_real() !== f0);

// 11. size rule
const lines = fs.readFileSync(path.join(storage_dir, "modelBaselineLock.js"), "utf8").split("\n").length;
check("modelBaselineLock.js stays under 600 lines (" + lines + ")", lines < 600);

console.log("SUMMARY PASS " + pass + " / FAIL " + fail);
process.exit(fail === 0 ? 0 : 1);
