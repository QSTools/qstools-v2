// R3 slice 5 batch B test. READ-ONLY: reads repo files and runs pure functions only (touches no browser storage and writes no file).
// Run: node Py\model_storage_tests\s5_whole_business_nodes.test.mjs
// Checks lib/calculations/wholeBusinessGroupInputs.js (the ONE shared function), lib/calculation-trace/pilot-map/wholeBusinessTraceNodes.js
// (hours node per group with seat hours above 0, plus 7 whole-business nodes), their registration in calculationTraceSelectors.js, and that the
// Business Modelling page now calls the shared function. The harness expected values (Py/stress_test/mirra_expected_l2.py) are NOT checked here:
// they follow after the owner approves the new totals (BM brief Addendum 42 item 1). Exit code 0 only if every check passes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8").replace(/\r\n/g, "\n");
const count = (text, piece) => text.split(piece).length - 1;
const load = (...parts) => import(pathToFileURL(path.join(root, ...parts)).href);

const S = await load("lib", "calculations", "wholeBusinessGroupInputs.js");
const R = await load("lib", "calculations", "wholeBusinessRateGap.js");
const B = await load("lib", "calculations", "businessModellingIndependentCalculations.js");
const N = await load("lib", "calculation-trace", "pilot-map", "wholeBusinessTraceNodes.js");
const G = await load("lib", "calculation-trace", "pilot-map", "groupRateGapTraceNodes.js");

function deep_freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deep_freeze);
  }
  return value;
}

// ---------- fixture: g1 equal hours, g2 support, g3 covered BELOW seat, g4 left out for missing revenue (like G03 on scenario_b), g5 equal hours ----------
const live = deep_freeze({
  cost_allocation: {
    operational_group_cost_rows: [
      { group_id: "g1", group_name: "Civil", group_recovery_hours: 1000, total_group_cost: 80000, group_cost_per_hour: 80 },
      { group_id: "g2", group_name: "Support", group_recovery_hours: 0, total_group_cost: 5000, group_cost_per_hour: null },
      { group_id: "g3", group_name: "Trucks", group_recovery_hours: 500, total_group_cost: 50000, group_cost_per_hour: 100 },
      { group_id: "g4", group_name: "Dry hire", group_recovery_hours: 200, total_group_cost: 10000, group_cost_per_hour: 50 },
      { group_id: "g5", group_name: "Plant", group_recovery_hours: 300, total_group_cost: 27000, group_cost_per_hour: 90 },
    ],
    operational_group_recovery_rows: [
      { group_id: "g1", minimum_recoverable_rate_per_hour: 78 },
      { group_id: "g2", minimum_recoverable_rate_per_hour: 0 },
      { group_id: "g3", minimum_recoverable_rate_per_hour: 95 },
      { group_id: "g4", minimum_recoverable_rate_per_hour: 40 },
      { group_id: "g5", minimum_recoverable_rate_per_hour: 85 },
    ],
  },
  business_outcome: {
    labour_groups: [{ group_id: "g1" }, { group_id: "g5" }],
    asset_groups: [{ group_id: "g3" }],
    real_capacity: {
      group_real_capacity: [
        { group_id: "g1", group_name: "Civil", modelled_revenue: 100000, true_cost: 80000, group_recovery_hours: 1000 },
        { group_id: "g3", group_name: "Trucks", modelled_revenue: 60000, true_cost: 50000, group_recovery_hours: 400 },
        { group_id: "g4", group_name: "Dry hire", modelled_revenue: 0, true_cost: 10000, group_recovery_hours: 0 },
        { group_id: "g5", group_name: "Plant", modelled_revenue: 24000, true_cost: 27000, group_recovery_hours: 300 },
      ],
    },
  },
});
const lists = {
  cost_rows: live.cost_allocation.operational_group_cost_rows,
  recovery_rows: live.cost_allocation.operational_group_recovery_rows,
  capacity_rows: live.business_outcome.real_capacity.group_real_capacity,
};

// ---------- A. the shared function ----------
const calc = S.calculateWholeBusinessFromContracts(lists);
check("shared: five table rows, one per Cost Allocation group", calc.rows.length === 5);
check("shared: whole business is available and includes g1, g3, g5 only", calc.whole.available === true && calc.whole.included_group_ids.join(",") === "g1,g3,g5", JSON.stringify(calc.whole.included_group_ids));
check("shared: g4 is left out for missing revenue (no breakeven result), g2 support is ignored", calc.whole.excluded_groups.length === 1 && calc.whole.excluded_groups[0].group_id === "g4" && /revenue/.test(calc.whole.excluded_groups[0].reason));
check("shared: group minimum rate 151,000 / 1,800 = 83.89", calc.whole.min_rate === 83.89, String(calc.whole.min_rate));
check("shared: full cost rate 157,000 / 1,800 = 87.22", calc.whole.full_cost_rate === 87.22, String(calc.whole.full_cost_rate));
check("shared: revenue per seat hour 184,000 / 1,800 = 102.22", calc.whole.revenue_per_seat_hour === 102.22, String(calc.whole.revenue_per_seat_hour));
check("shared: gaps subtract the DISPLAYED rounded rates (18.33 and 15.00)", calc.whole.gap_to_min_rate === 18.33 && calc.whole.gap_to_full_cost_rate === 15, `${calc.whole.gap_to_min_rate}, ${calc.whole.gap_to_full_cost_rate}`);
check("shared: total seat hours 1,800 and total covered hours 1,700 (g3 covered 400 of 500)", calc.whole.total_seat_hours === 1800 && calc.whole.total_covered_hours === 1700 && calc.whole.covered_differs === true);
const g4_row = calc.rows.find((r) => r.group_id === "g4");
check("shared: g4 row keeps its seat hours but revenue is null (never 0)", g4_row.hours === 200 && g4_row.modelled_revenue === null && g4_row.revenue_rate === null);

// The page's row shape and result must be identical before and after batch B: re-run the page's OLD inline mapping here and compare.
function old_page_rows(cost_rows, recovery_rows, capacity_rows) {
  const min_rate_by_id = new Map(recovery_rows.map((r) => [r.group_id, r.minimum_recoverable_rate_per_hour]));
  const capacity_by_id = new Map(capacity_rows.map((g) => [g.group_id, g]));
  return cost_rows.map((cost) => {
    const hours = Number(cost.group_recovery_hours) || 0;
    const capacity = capacity_by_id.get(cost.group_id);
    const charged = capacity ? B.calculateIndependentGroupBreakeven({ group: capacity }) : null;
    return {
      group_id: cost.group_id, group_name: cost.group_name, hours, has_hours: hours > 0,
      total_group_cost: Number(cost.total_group_cost) || 0,
      min_rate: min_rate_by_id.get(cost.group_id), full_cost_rate: cost.group_cost_per_hour,
      revenue_rate: charged && charged.available ? charged.current_rate_per_hour : null,
      covered_hours: capacity ? capacity.group_recovery_hours : null,
      modelled_revenue: charged && charged.available ? capacity.modelled_revenue : null,
    };
  });
}
const old_rows = old_page_rows(lists.cost_rows, lists.recovery_rows, lists.capacity_rows);
check("identity: the rows equal the page's old inline mapping, field for field", JSON.stringify(old_rows) === JSON.stringify(calc.rows));
const old_whole = R.calculateWholeBusinessRateGap(old_rows.map((r) => ({ group_id: r.group_id, group_name: r.group_name, seat_hours: r.hours, min_rate: r.min_rate, full_cost_rate: r.full_cost_rate, modelled_revenue: r.modelled_revenue, covered_hours: r.covered_hours })));
check("identity: the whole business result equals the old inline result", JSON.stringify(old_whole) === JSON.stringify(calc.whole));
const dollars = (calc.whole.revenue_per_seat_hour - calc.whole.full_cost_rate) * calc.whole.total_seat_hours;
check("dollar identity: gap x seat hours is within rounding of revenue minus cost (184,000 - 157,000 = 27,000)", Math.abs(dollars - 27000) <= 0.01 * calc.whole.total_seat_hours, String(dollars));

// ---------- B. hours nodes ----------
const hours_nodes = N.buildGroupSeatHoursNodes(live);
const hours_ids = hours_nodes.map((n) => n.node_id);
check("hours: one node per group with seat hours above 0, g4 (left out of the row) included, g2 support not", hours_ids.join(",") === "cost_allocation.group.g1.group_recovery_hours,cost_allocation.group.g3.group_recovery_hours,cost_allocation.group.g4.group_recovery_hours,cost_allocation.group.g5.group_recovery_hours", hours_ids.join(","));
check("hours: values are 1000, 500, 200, 300", hours_nodes.map((n) => n.resolve(live)).join(",") === "1000,500,200,300");
const fields = ["node_id", "display_label", "module_name", "is_root_input", "value_format", "formula_text", "brief_reference", "last_verified_against", "source_file", "implementation_status", "inputs", "resolve"];
check("hours: every node-contract field is present, boundary node with no inputs", hours_nodes.every((n) => fields.every((f) => f in n) && n.inputs.length === 0 && n.is_root_input === false && n.module_name === "cost-allocation"));
const bad_hours = (v) => deep_freeze({ cost_allocation: { operational_group_cost_rows: [{ group_id: "g1", group_recovery_hours: v }] } });
for (const [label, v] of [["undefined", undefined], ["null", null], ["blank", ""], ["zero", 0], ["negative", -5], ["NaN", NaN], ["text", "x"]]) {
  check("hours: " + label + " seat hours emits nothing (never a silent 0)", N.buildGroupSeatHoursNodes(bad_hours(v)).length === 0);
}
check("hours: a group row with no id emits nothing", N.buildGroupSeatHoursNodes(deep_freeze({ cost_allocation: { operational_group_cost_rows: [{ group_name: "No id", group_recovery_hours: 10 }] } })).length === 0);
check("hours: a numeric string is read as a number", N.buildGroupSeatHoursNodes(deep_freeze({ cost_allocation: { operational_group_cost_rows: [{ group_id: "g1", group_recovery_hours: "12.5" }] } }))[0].resolve() === 12.5);

// ---------- C. whole-business nodes ----------
const whole_nodes = N.buildWholeBusinessNodes(live);
const wid = (f) => "business_modelling.whole_business." + f;
const by_id = new Map(whole_nodes.map((n) => [n.node_id, n]));
check("whole: exactly seven nodes with the planned ids", whole_nodes.length === 7 && ["min_rate", "full_cost_rate", "revenue_per_seat_hour", "gap_to_min_rate", "gap_to_full_cost_rate", "total_seat_hours", "total_covered_hours"].every((f) => by_id.has(wid(f))), whole_nodes.map((n) => n.node_id).join(","));
const expect = { min_rate: 83.89, full_cost_rate: 87.22, revenue_per_seat_hour: 102.22, gap_to_min_rate: 18.33, gap_to_full_cost_rate: 15, total_seat_hours: 1800, total_covered_hours: 1700 };
for (const [f, v] of Object.entries(expect)) {
  check("whole: " + f + " resolves to " + v + " and equals the shared function result", by_id.get(wid(f)).resolve(live) === v && by_id.get(wid(f)).resolve(live) === (calc.whole[f]));
}
check("whole: every node-contract field is present, none is a root input, business-modelling module", whole_nodes.every((n) => fields.every((f) => f in n) && n.is_root_input === false && n.module_name === "business-modelling"));
check("whole: total hours takes the INCLUDED groups' hours nodes only (g4 feeds nothing)", by_id.get(wid("total_seat_hours")).inputs.join(",") === "cost_allocation.group.g1.group_recovery_hours,cost_allocation.group.g3.group_recovery_hours,cost_allocation.group.g5.group_recovery_hours");
check("whole: total covered hours is a boundary node with no inputs and says so", by_id.get(wid("total_covered_hours")).inputs.length === 0 && /BOUNDARY/.test(by_id.get(wid("total_covered_hours")).formula_text));
check("whole: each gap has the displayed rate nodes as its only inputs", by_id.get(wid("gap_to_min_rate")).inputs.join(",") === wid("revenue_per_seat_hour") + "," + wid("min_rate") && by_id.get(wid("gap_to_full_cost_rate")).inputs.join(",") === wid("revenue_per_seat_hour") + "," + wid("full_cost_rate"));
check("whole: no input of any whole-business node names g2 (support) or g4 (left out)", whole_nodes.every((n) => n.inputs.every((i) => !/\.g2\.|\.g4\./.test(i))));

// ---------- D. graph integrity: every input resolves to a node that exists ----------
const all_new = N.buildWholeBusinessTraceNodes(live);
const existing = new Set([
  ...G.buildGroupRateGapNodes(live).map((n) => n.node_id),
  ...lists.cost_rows.filter((c) => c.group_id).map((c) => `cost_allocation.group.${c.group_id}.group_cost_per_hour`), // built by costAllocationTraceNodes.js for every cost row with an id (it uses an @/ alias, so this test cannot load it)
  ...all_new.map((n) => n.node_id),
]);
const missing = all_new.flatMap((n) => n.inputs.filter((i) => !existing.has(i)).map((i) => n.node_id + " <- " + i));
check("graph: eleven new nodes (4 hours + 7 whole business), no duplicate ids", all_new.length === 11 && new Set(all_new.map((n) => n.node_id)).size === 11, String(all_new.length));
check("graph: no missing endpoints for any input of the new nodes", missing.length === 0, missing.join("; "));

// ---------- E. whole business unavailable / bad input ----------
for (const [label, bad] of [["undefined", undefined], ["null", null], ["empty object", {}], ["junk", "x"], ["no arrays", { cost_allocation: {}, business_outcome: {} }]]) {
  let ok = true, nodes = [];
  try { nodes = N.buildWholeBusinessTraceNodes(bad); } catch (e) { ok = false; }
  check("bad input: " + label + " gives no nodes and no error", ok && nodes.length === 0);
}
const only_left_out = deep_freeze({
  cost_allocation: { operational_group_cost_rows: [{ group_id: "g4", group_name: "Dry hire", group_recovery_hours: 200, group_cost_per_hour: 50 }], operational_group_recovery_rows: [{ group_id: "g4", minimum_recoverable_rate_per_hour: 40 }] },
  business_outcome: { real_capacity: { group_real_capacity: [] } },
});
const only_nodes = N.buildWholeBusinessTraceNodes(only_left_out);
check("no included group: the hours node is still emitted, but no whole-business node (the page shows a dash)", only_nodes.length === 1 && only_nodes[0].node_id === "cost_allocation.group.g4.group_recovery_hours");
check("the frozen live values were not changed", live.cost_allocation.operational_group_cost_rows.length === 5);

// ---------- F. source checks ----------
const in_text = read("lib", "calculations", "wholeBusinessGroupInputs.js");
const node_text = read("lib", "calculation-trace", "pilot-map", "wholeBusinessTraceNodes.js");
const sel_text = read("lib", "calculation-trace", "calculationTraceSelectors.js");
const page_text = read("app", "business-modelling", "page.jsx");
check("source: new files under 600 lines", in_text.split("\n").length < 600 && node_text.split("\n").length < 600);
check("source: node file uses a relative import, no @/ alias, no hook import", node_text.includes('from "../../calculations/wholeBusinessGroupInputs.js"') && !node_text.includes('"@/') && !/hooks\//.test(node_text.replace(/hooks\/useCostAllocation\.js/g, "")));
check("source: shared file imports no hook and no @/ alias", !in_text.includes('"@/') && !/from ".*hooks/.test(in_text));
check("source: no Number(null) style conversion, no browser storage", !/Number\(\s*null/.test(node_text + in_text) && !/localStorage|sessionStorage/.test(node_text + in_text));
check("source: selectors import the builder once", count(sel_text, 'import { buildWholeBusinessTraceNodes } from "./pilot-map/wholeBusinessTraceNodes.js";') === 1);
check("source: selectors spread the builder once, after the group rate gap nodes", count(sel_text, "...buildWholeBusinessTraceNodes(liveValues),") === 1 && sel_text.indexOf("...buildGroupRateGapNodes(liveValues),") < sel_text.indexOf("...buildWholeBusinessTraceNodes(liveValues),"));
check("source: the page imports and calls the shared function once", count(page_text, 'import { calculateWholeBusinessFromContracts } from "@/lib/calculations/wholeBusinessGroupInputs";') === 1 && count(page_text, "calculateWholeBusinessFromContracts({") === 1);
const page_code = page_text.split("\n").filter((line) => !line.trim().startsWith("//")).join("\n");
check("source: the page code no longer does the per-group mapping or calls the helper itself (comments ignored)", !page_code.includes("calculateIndependentGroupBreakeven") && !page_code.includes("calculateWholeBusinessRateGap(") && !page_code.includes("capacity_by_id") && !page_code.includes("min_rate_by_id"));

console.log("");
console.log("New trace nodes for the fixture: " + all_new.length + " (4 hours + 7 whole business). Seed A has 4 earning groups, all included, so 280 + 11 = 291 is expected (the harness gives the exact figure after you approve).");
console.log("s5_whole_business_nodes: " + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
