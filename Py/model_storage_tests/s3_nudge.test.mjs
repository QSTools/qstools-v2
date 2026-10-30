// R3 slice 3 batch 2 test. READ-ONLY and PURE: no storage, no repo file written. Run: node Py\model_storage_tests\s3_nudge.test.mjs
// Checks lib/calculations/generalOverheadNudge.js against the REAL calculate_general_overheads: an empty layer is the identity (same object,
// nothing calculated), a nudge scales exactly the eligible lines of its category and no others, the effect equals pct of the category base,
// asset-finance-interest and asset-pool lines are left alone, reclassified lines follow their effective category, a category with no eligible
// line is flagged orphan with zero effect, the input is never changed, untouched fields keep their identity, nudges on two categories add up,
// and the file stays under 600 lines. Exit code 0 only if every check passes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const calc_dir = path.resolve(here, "..", "..", "lib", "calculations");
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}
const near = (a, b) => Math.abs(a - b) < 1e-9;

const { calculate_general_overheads } = await import(pathToFileURL(path.join(calc_dir, "generalOverheadCalculations.js")).href);
const { apply_overhead_nudges } = await import(pathToFileURL(path.join(calc_dir, "generalOverheadNudge.js")).href);

// A small state: two synced lines in office_admin, one in facilities_premises, one asset-pool line (fuel) in vehicles_running, one flagged
// asset-finance interest line in finance_interest, one custom line in office_admin, one fixed field (office_rent) in facilities_premises.
const base_state = () => ({
  overhead_profile_id: "p1", system_allocation_overrides: { sync_reclass: "business_overhead" }, overhead_category_overrides: { sync_reclass: "travel" },
  office_rent: 1000, vehicle_running_cost_annual: 0,
  synced_pnl_overhead_items: [
    { synced_overhead_id: "sync_admin1", synced_overhead_name: "Software", synced_overhead_amount: 600, overhead_category_key: "office_admin", source_module: "p_and_l" },
    { synced_overhead_id: "sync_admin2", synced_overhead_name: "Stationery", synced_overhead_amount: 400, overhead_category_key: "office_admin", source_module: "p_and_l" },
    { synced_overhead_id: "sync_prem", synced_overhead_name: "Electricity", synced_overhead_amount: 2000, overhead_category_key: "facilities_premises", source_module: "p_and_l" },
    { synced_overhead_id: "sync_fuel", synced_overhead_name: "Fuel", synced_overhead_amount: 5000, overhead_category_key: "vehicles_running", source_module: "p_and_l" },
    { synced_overhead_id: "sync_int", synced_overhead_name: "Vehicle loan interest", synced_overhead_amount: 3000, overhead_category_key: "finance_interest", interest_treatment: "contains_asset_finance_interest", contains_asset_finance_interest: true, source_module: "p_and_l" },
    { synced_overhead_id: "sync_reclass", synced_overhead_name: "Courier", synced_overhead_amount: 800, overhead_category_key: "office_admin", source_module: "p_and_l" },
  ],
  custom_overhead_items: [{ custom_overhead_id: "cust1", custom_overhead_name: "Gym", custom_overhead_amount: 500, overhead_category_key: "office_admin" }],
});
const ASSET_FINANCE_INTEREST_TOTAL = 1200;
const calls = { n: 0 };
const calculate = (state) => { calls.n += 1; return calculate_general_overheads(state, ASSET_FINANCE_INTEREST_TOTAL); };
// The category and eligibility rule the hook will take from the selectors, written out for the test.
const category_of = (row, state) => (state.overhead_category_overrides || {})[row.key] || row.overhead_category_key || (row.key === "office_rent" ? "facilities_premises" : "other_unallocated");
const classify_row = (row, state) => ({
  category_key: category_of(row, state),
  eligible: row.is_asset_finance_interest !== true && !/fuel/i.test(row.label || "") ,
});
const run = (state, nudges) => apply_overhead_nudges({ overhead_state: state, nudges, calculate, classify_row });
const total = (state) => calculate_general_overheads(state, ASSET_FINANCE_INTEREST_TOTAL).total_general_overheads;

// 1. empty layer
let state = base_state();
calls.n = 0;
let r = run(state, {});
check("empty nudge set: the very same state object comes back", r.state === state && r.applied === false && r.total_effect === 0);
check("empty nudge set: nothing is calculated", calls.n === 0);
r = run(state, undefined);
check("undefined nudge set behaves the same", r.state === state && r.applied === false);
r = run(undefined, { office_admin: { pct: 5 } });
check("missing state returns as is", r.state === undefined && r.applied === false);

// 2. a nudge on one category
state = base_state();
const before = JSON.stringify(state);
const total_before = total(state);
r = run(state, { office_admin: { pct: 10, flag: "" } });
check("input state is not changed", JSON.stringify(state) === before);
check("nudge applied", r.applied === true && r.state !== state);
const items = Object.fromEntries(r.state.synced_pnl_overhead_items.map((i) => [i.synced_overhead_id, i.synced_overhead_amount]));
check("office_admin synced lines scale by 10 percent", near(items.sync_admin1, 660) && near(items.sync_admin2, 440));
check("custom office_admin line scales by 10 percent", near(r.state.custom_overhead_items[0].custom_overhead_amount, 550));
check("a line reclassified to travel is NOT scaled by an office_admin nudge (effective category)", near(items.sync_reclass, 800));
check("other categories are untouched (premises, fuel, interest)", near(items.sync_prem, 2000) && near(items.sync_fuel, 5000) && near(items.sync_int, 3000) && near(r.state.office_rent, 1000));
check("summary: base 1500 (600+400+500), effect 150, 3 lines, not orphan", near(r.by_category.office_admin.base_total, 1500) && near(r.by_category.office_admin.effect, 150) && r.by_category.office_admin.lines === 3 && r.by_category.office_admin.orphan === false, JSON.stringify(r.by_category));
check("total effect equals the change in total general overheads, to the cent", near(r.total_effect, 150) && near(total(r.state) - total_before, 150), String(total(r.state) - total_before));
check("fields not touched keep their identity (no field dropping)", r.state.system_allocation_overrides === state.system_allocation_overrides && r.state.overhead_category_overrides === state.overhead_category_overrides && r.state.overhead_profile_id === "p1");
check("untouched list items keep their identity", r.state.synced_pnl_overhead_items[2] === state.synced_pnl_overhead_items[2]);

// 3. fixed field and a reclassified line
r = run(state, { facilities_premises: { pct: -50 } });
check("fixed field office_rent scales with its category", near(r.state.office_rent, 500));
check("synced premises line scales with its category", near(r.state.synced_pnl_overhead_items.find((i) => i.synced_overhead_id === "sync_prem").synced_overhead_amount, 1000));
check("effect is -1500 (half of 1000 + 2000)", near(r.total_effect, -1500));
r = run(state, { travel: { pct: 25 } });
check("a nudge on travel scales the line reclassified into travel", near(r.state.synced_pnl_overhead_items.find((i) => i.synced_overhead_id === "sync_reclass").synced_overhead_amount, 1000) && near(r.by_category.travel.effect, 200));

// 4. ineligible lines are left alone
r = run(state, { finance_interest: { pct: 20 } });
check("asset finance interest line is not scaled", near(r.state.synced_pnl_overhead_items.find((i) => i.synced_overhead_id === "sync_int").synced_overhead_amount, 3000));
check("a category with only an ineligible line is orphan with zero effect", r.by_category.finance_interest.orphan === true && r.by_category.finance_interest.effect === 0 && r.by_category.finance_interest.lines === 0 && r.total_effect === 0);
check("an orphan nudge changes no amount: total is unchanged", near(total(r.state), total_before));
r = run(state, { vehicles_running: { pct: 30 } });
check("an asset-pool (fuel) line is not scaled", near(r.state.synced_pnl_overhead_items.find((i) => i.synced_overhead_id === "sync_fuel").synced_overhead_amount, 5000) && r.by_category.vehicles_running.orphan === true);

// 5. category with no lines at all
r = run(state, { sales_growth: { pct: 10 } });
check("a category with no lines at all is orphan, zero effect, state values unchanged", r.by_category.sales_growth.orphan === true && near(r.total_effect, 0) && near(total(r.state), total_before));

// 6. zero, limits, stacking, record flag
r = run(state, { office_admin: { pct: 0 } });
check("a 0 percent nudge changes nothing: total equal to the cent", near(total(r.state), total_before) && near(r.total_effect, 0));
r = run(state, { office_admin: { pct: -100 } });
check("-100 percent zeroes the category", near(r.by_category.office_admin.effect, -1500) && near(total(r.state), total_before - 1500));
r = run(state, { office_admin: { pct: 10 }, facilities_premises: { pct: -10 } });
check("two categories add up: 150 - 300 = -150", near(r.total_effect, -150) && near(total(r.state) - total_before, -150));
r = run(state, { office_admin: { pct: 10, flag: "baseline_changed" } });
check("the stored record flag is carried into the summary and is separate from orphan", r.by_category.office_admin.flag === "baseline_changed" && r.by_category.office_admin.orphan === false);

// 7. a deleted line leaves the category orphan
const gone = base_state();
gone.synced_pnl_overhead_items = gone.synced_pnl_overhead_items.filter((i) => i.overhead_category_key !== "facilities_premises");
gone.office_rent = 0;
r = run(gone, { facilities_premises: { pct: 10 } });
check("deleting every line of a nudged category resolves the nudge to zero with the orphan flag (never throws)", r.by_category.facilities_premises.orphan === true && near(r.total_effect, 0));

// 8. purity
const again = run(state, { office_admin: { pct: 10 } });
const twice = run(state, { office_admin: { pct: 10 } });
check("same input twice gives the same output", JSON.stringify(again.state) === JSON.stringify(twice.state));
check("applying twice does NOT compound (the caller always passes the un-nudged state)", near(total(twice.state) - total_before, 150));

const lines = fs.readFileSync(path.join(calc_dir, "generalOverheadNudge.js"), "utf8").split("\n").length;
check("generalOverheadNudge.js stays under 600 lines (" + lines + ") and has no imports", lines < 600 && !/^\s*import\s/m.test(fs.readFileSync(path.join(calc_dir, "generalOverheadNudge.js"), "utf8")));

console.log("\n" + pass + " of " + (pass + fail) + " passed");
process.exit(fail === 0 ? 0 : 1);
