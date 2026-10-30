// R3 slice 4 batch C2a test. READ-ONLY and PURE: no storage, no repo file written. Run: node Py\model_storage_tests\s4_overhead_line.test.mjs
// Checks lib/calculations/scenarioOverheadLine.js against the REAL calculate_general_overheads and the REAL scenarioAdds.non_productive_total:
// nothing to add is the identity (same object), the total rises by exactly the amount to the cent, the line is a custom row with a fixed label that
// cannot trigger an asset-pool or interest rule, the allocation override is a real type that is not an asset pool, existing overrides, items and
// untouched fields survive (same identity), the input is never changed, injecting twice gives one line, and the file stays under 600 lines.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const calc_dir = path.join(root, "lib", "calculations");
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}
const cents = (n) => Math.round(n * 100);

const { calculate_general_overheads } = await import(pathToFileURL(path.join(calc_dir, "generalOverheadCalculations.js")).href);
const line = await import(pathToFileURL(path.join(calc_dir, "scenarioOverheadLine.js")).href);
const { non_productive_total } = await import(pathToFileURL(path.join(calc_dir, "scenarioAdds.js")).href);
const { inject_scenario_overhead, SCENARIO_OVERHEAD_ID, SCENARIO_OVERHEAD_LABEL, SCENARIO_OVERHEAD_ALLOCATION_TYPE } = line;

function deep_freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(deep_freeze); }
  return value;
}
const base_state = () => ({
  overhead_profile_id: "p1", office_rent: 1000,
  system_allocation_overrides: { cust1: "business_overhead" },
  synced_pnl_overhead_items: [{ synced_overhead_id: "s1", synced_overhead_name: "Software", synced_overhead_amount: 600, overhead_category_key: "office_admin" }],
  custom_overhead_items: [{ custom_overhead_id: "cust1", custom_overhead_name: "Gym", custom_overhead_amount: 500, overhead_category_key: "office_admin" }],
});

// ---- identity ----
const s0 = base_state();
for (const bad of [0, -5, NaN, Infinity, undefined, null, "x"]) {
  const r = inject_scenario_overhead({ overhead_state: s0, amount: bad });
  check("amount " + String(bad) + " is the identity (same object, not applied)", r.state === s0 && r.applied === false && r.amount === 0);
}
check("no state is the identity", inject_scenario_overhead({ overhead_state: undefined, amount: 100 }).applied === false);

// ---- the total rises by exactly the amount ----
const office = 62345.67, vehicle = 8123.45;
const adds = [
  { id: "scratch_a1", kind: "staff", name: "Office hire", is_productive: false, annual_cost: office },
  { id: "scratch_a2", kind: "asset", name: "Ute 1", is_productive: false, annual_cost: vehicle },
  { id: "scratch_a3", kind: "asset", name: "Ute 2", is_productive: false, annual_cost: vehicle },
  { id: "scratch_a4", kind: "asset", name: "Ute 3", is_productive: false, annual_cost: vehicle },
  { id: "scratch_a5", kind: "asset", name: "Digger", is_productive: true, annual_cost: 90000, productive_hours: 1200, group_id: "g1" },
];
const amount = non_productive_total(adds);
check("non_productive_total is 86,716.02 (productive digger not counted)", cents(amount) === 8671602, String(amount));

const frozen = deep_freeze(base_state());
const before_total = calculate_general_overheads(frozen, 1200).total_general_overheads;
const r = inject_scenario_overhead({ overhead_state: frozen, amount });
check("applied with the cent-rounded amount", r.applied === true && cents(r.amount) === 8671602);
check("input state was not changed (deep frozen, no throw)", r.state !== frozen);
const after = calculate_general_overheads(r.state, 1200);
check("total_general_overheads rises by exactly the amount to the cent", cents(after.total_general_overheads - before_total) === 8671602, String(after.total_general_overheads - before_total));
const row = after.overhead_rows.find((x) => x.key === SCENARIO_OVERHEAD_ID);
check("the line is a custom row with the fixed label", !!row && row.is_custom === true && row.label === SCENARIO_OVERHEAD_LABEL);
check("the line carries the full amount as active_amount", !!row && cents(row.active_amount) === 8671602);
check("the line is not an asset-finance-interest row", !!row && row.is_asset_finance_interest === false);
check("interest total does not move", cents(after.interest_in_overheads_annual) === cents(calculate_general_overheads(frozen, 1200).interest_in_overheads_annual));

// ---- the label and override cannot be misrouted ----
const triggers = ["fuel", "registration", "licens", "licence", "tyre", "tire", "consumable", "insurance", "interest", "loan", "maintenance", "repairs", "vehicle", "asset", "plant", "fleet"];
check("the fixed label contains no asset-pool or interest trigger word", triggers.every((t) => !SCENARIO_OVERHEAD_LABEL.toLowerCase().includes(t)), SCENARIO_OVERHEAD_LABEL);
check("override is business_overhead", SCENARIO_OVERHEAD_ALLOCATION_TYPE === "business_overhead" && r.state.system_allocation_overrides[SCENARIO_OVERHEAD_ID] === "business_overhead");
const defs = fs.readFileSync(path.join(root, "lib", "selectors", "general-overheads", "generalOverheadDefinitions.js"), "utf8");
const types_block = defs.slice(defs.indexOf("export const SYSTEM_ALLOCATION_TYPES"));
check("business_overhead is a real system allocation type", /key:\s*"business_overhead"/.test(types_block));
const pool_start = defs.indexOf("export const ASSET_POOL_BY_ALLOCATION_TYPE");
const pool_block = defs.slice(pool_start, defs.indexOf("};", pool_start));
check("business_overhead is NOT an asset pool type", pool_start > 0 && !pool_block.includes("business_overhead"));

// ---- carried over, not rebuilt ----
check("existing allocation override kept", r.state.system_allocation_overrides.cust1 === "business_overhead");
check("existing custom item kept and first", r.state.custom_overhead_items[0].custom_overhead_id === "cust1" && r.state.custom_overhead_items.length === 2);
check("untouched list keeps its identity", r.state.synced_pnl_overhead_items === frozen.synced_pnl_overhead_items);
check("untouched fields carried", r.state.office_rent === 1000 && r.state.overhead_profile_id === "p1");

// ---- twice gives one line; replaces the amount ----
const twice = inject_scenario_overhead({ overhead_state: r.state, amount: 100 });
check("injecting twice leaves ONE scenario line", twice.state.custom_overhead_items.filter((i) => i.custom_overhead_id === SCENARIO_OVERHEAD_ID).length === 1);
check("the second amount replaces the first", cents(calculate_general_overheads(twice.state, 1200).overhead_rows.find((x) => x.key === SCENARIO_OVERHEAD_ID).active_amount) === 10000);

// ---- state with no custom items or overrides ----
const bare = inject_scenario_overhead({ overhead_state: { office_rent: 5 }, amount: 12.34 });
check("works on a state with no custom items or overrides", bare.applied === true && bare.state.custom_overhead_items.length === 1 && cents(bare.amount) === 1234);

const lines = fs.readFileSync(path.join(calc_dir, "scenarioOverheadLine.js"), "utf8").split("\n").length;
check("file is under 600 lines", lines < 600, String(lines));

console.log(pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
