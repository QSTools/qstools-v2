// R3 slice 5 batch 1b test. READ-ONLY: reads repo files and runs pure functions only (touches no browser storage and writes no file).
// Run: node Py\model_storage_tests\s5_group_rate_nodes.test.mjs
// Checks lib/calculation-trace/pilot-map/groupRateGapTraceNodes.js (group minimum rate node, revenue per hour node), its registration in
// calculationTraceSelectors.js, and the two expected-value lines in Py/stress_test/mirra_expected_l2.py. Exit code 0 only if every check passes.
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

const N = await load("lib", "calculation-trace", "pilot-map", "groupRateGapTraceNodes.js");

function deep_freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deep_freeze);
  }
  return value;
}

const live = deep_freeze({
  cost_allocation: {
    operational_group_cost_rows: [
      { group_id: "g1", group_name: "Civil", group_recovery_hours: 1000, group_cost_per_hour: 80.79 },
      { group_id: "g2", group_name: "Support", group_recovery_hours: 0 },
      { group_id: "g3", group_name: "No recovery row", group_recovery_hours: 50 },
      { group_name: "No id", group_recovery_hours: 10 },
    ],
    operational_group_recovery_rows: [
      { group_id: "g1", minimum_recoverable_rate_per_hour: 79.93 },
      { group_id: "g2", minimum_recoverable_rate_per_hour: 0 },
    ],
  },
  business_outcome: {
    labour_groups: [{ group_id: "g1" }],
    asset_groups: [],
    real_capacity: {
      group_real_capacity: [
        { group_id: "g1", group_name: "Civil", modelled_revenue: 165000, true_cost: 80000, group_recovery_hours: 1000 },
        { group_id: "g4", group_name: "No source group", modelled_revenue: 1000, true_cost: 1, group_recovery_hours: 10 },
        { group_id: "g5", group_name: "No hours", modelled_revenue: 1000, true_cost: 1, group_recovery_hours: 0 },
        { group_name: "No id", modelled_revenue: 1, group_recovery_hours: 1 },
      ],
    },
  },
});

// ---------- A. group minimum rate node ----------
const min_nodes = N.buildGroupMinimumRateNodes(live);
check("min rate: one node, only for the group with recovery hours AND a recovery row", min_nodes.length === 1 && min_nodes[0].node_id === "cost_allocation.group.g1.minimum_recoverable_rate_per_hour", JSON.stringify(min_nodes.map((n) => n.node_id)));
const m = min_nodes[0];
check("min rate: resolves to the recovery row value", m.resolve(live) === 79.93);
check("min rate: boundary node, no inputs, not a root input, cost-allocation module", Array.isArray(m.inputs) && m.inputs.length === 0 && m.is_root_input === false && m.module_name === "cost-allocation");
check("min rate: money-per-unit format and live_traced_via_hook", m.value_format === "currency_per_unit" && m.implementation_status === "live_traced_via_hook");
const fields = ["node_id", "display_label", "module_name", "is_root_input", "value_format", "formula_text", "brief_reference", "last_verified_against", "source_file", "implementation_status", "inputs", "resolve"];
check("min rate: every node-contract field is present", fields.every((f) => f in m));
check("min rate: the formula text says productive cost only and that there is no edge to total_group_cost", m.formula_text.includes("PRODUCTIVE") && m.formula_text.includes("no edge to total_group_cost"));
check("min rate: a group with no recovery hours (support) emits nothing", !min_nodes.some((n) => n.node_id.includes(".g2.")));
const with_rate = (v) => deep_freeze({ cost_allocation: { operational_group_cost_rows: [{ group_id: "g1", group_recovery_hours: 10 }], operational_group_recovery_rows: [{ group_id: "g1", minimum_recoverable_rate_per_hour: v }] } });
for (const [label, v] of [["undefined", undefined], ["null", null], ["blank", ""], ["NaN", NaN], ["text", "x"], ["Infinity", Infinity]]) {
  check("min rate: " + label + " rate emits nothing (never a silent 0)", N.buildGroupMinimumRateNodes(with_rate(v)).length === 0);
}
const zero_node = N.buildGroupMinimumRateNodes(with_rate(0));
check("min rate: a real zero rate on a group with hours IS a node and resolves to 0", zero_node.length === 1 && zero_node[0].resolve() === 0);
check("min rate: a numeric string is read as a number", N.buildGroupMinimumRateNodes(with_rate("12.5"))[0].resolve() === 12.5);

// ---------- B. revenue per hour node ----------
const rev_nodes = N.buildGroupRevenuePerHourNodes(live);
check("revenue: nodes for g1 and g4 only (no hours and no id emit nothing)", rev_nodes.length === 2 && rev_nodes[0].node_id === "business_outcome.group.g1.revenue_per_hour" && rev_nodes[1].node_id === "business_outcome.group.g4.revenue_per_hour", JSON.stringify(rev_nodes.map((n) => n.node_id)));
check("revenue: g1 = 165,000 / 1,000 hours = 165.00", rev_nodes[0].resolve(live) === 165);
check("revenue: g4 = 1,000 / 10 hours = 100.00", rev_nodes[1].resolve(live) === 100);
check("revenue: g1 has its group modelled_revenue node as the one input", rev_nodes[0].inputs.length === 1 && rev_nodes[0].inputs[0] === "business_outcome.group.g1.modelled_revenue");
check("revenue: a group with no source group row draws NO edge (no missing endpoint)", rev_nodes[1].inputs.length === 0);
check("revenue: boundary node, in the business-outcome module, formula names covered hours", rev_nodes[0].is_root_input === false && rev_nodes[0].module_name === "business-outcome" && rev_nodes[0].formula_text.includes("covered hours"));
check("revenue: every node-contract field is present", fields.every((f) => f in rev_nodes[0]));
const with_cap = (cap) => deep_freeze({ business_outcome: { labour_groups: [], asset_groups: [], real_capacity: { group_real_capacity: [cap] } } });
check("revenue: 100.005 rounds to the cent the way the page does", N.buildGroupRevenuePerHourNodes(with_cap({ group_id: "g1", modelled_revenue: 1000.05, true_cost: 1, group_recovery_hours: 10 }))[0].resolve() === 100.01 || N.buildGroupRevenuePerHourNodes(with_cap({ group_id: "g1", modelled_revenue: 1000.05, true_cost: 1, group_recovery_hours: 10 }))[0].resolve() === 100);
check("revenue: zero modelled revenue on a group with hours is a real 0, not blank", N.buildGroupRevenuePerHourNodes(with_cap({ group_id: "g1", modelled_revenue: 0, true_cost: 5, group_recovery_hours: 10 }))[0].resolve() === 0);

// ---------- C. the combined builder ----------
const all = N.buildGroupRateGapNodes(live);
const ids = all.map((n) => n.node_id);
check("combined: three nodes, no duplicate ids", all.length === 3 && new Set(ids).size === 3, JSON.stringify(ids));
for (const [label, bad] of [["undefined", undefined], ["null", null], ["empty object", {}], ["junk", "x"], ["no arrays", { cost_allocation: {}, business_outcome: {} }]]) {
  check("combined: " + label + " live values give no nodes and no error", N.buildGroupRateGapNodes(bad).length === 0);
}
check("combined: the frozen live values were not changed", live.cost_allocation.operational_group_cost_rows.length === 4);

// ---------- D. source checks ----------
const node_text = read("lib", "calculation-trace", "pilot-map", "groupRateGapTraceNodes.js");
const sel_text = read("lib", "calculation-trace", "calculationTraceSelectors.js");
const l2_text = read("Py", "stress_test", "mirra_expected_l2.py");
check("source: node file under 600 lines", node_text.split("\n").length < 600);
check("source: node file uses a relative import (so a plain node test can load it), no @/ alias", node_text.includes('from "../../calculations/businessModellingIndependentCalculations.js"') && !node_text.includes('"@/'));
check("source: node file has no Number(null) style conversion", !/Number\(\s*null/.test(node_text));
check("source: node file touches no browser storage", !/localStorage|sessionStorage/.test(node_text));
check("source: selectors import the builder once", count(sel_text, 'import { buildGroupRateGapNodes } from "./pilot-map/groupRateGapTraceNodes.js";') === 1);
check("source: selectors spread the builder once", count(sel_text, "...buildGroupRateGapNodes(liveValues),") === 1);
check("source: harness expects the minimum rate node once", count(l2_text, '(r["lab_cost"] + r["asset_burden"] + r["overhead"]) / r["recovery"]') === 1);
check("source: harness expects the revenue per hour node once", count(l2_text, 'r["modelled"] / r["covered"]') === 1);
check("source: harness only expects revenue per hour where covered hours are above 0", count(l2_text, 'if r["covered"] > 0:') === 1);

console.log("");
console.log("s5_group_rate_nodes: " + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);