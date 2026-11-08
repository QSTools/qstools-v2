// R3 slice 5 item 18 test (BM brief Addendum 50). READ-ONLY: reads repo files and runs pure functions only (touches no browser storage, writes no file).
// Run: node Py\model_storage_tests\s5_breakeven_floor.test.mjs
// Checks the break-even floor: per group (true cost / covered hours), whole business (total true cost / SEAT hours), the extended gap sentence,
// the banned-words rule, the trace nodes (ids, edges, null handling), and that the page and selectors use them. Exit code 0 only if every check passes.
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
const W = await load("lib", "calculations", "wholeBusinessGapWording.js");
const F = await load("lib", "calculation-trace", "pilot-map", "breakevenFloorTraceNodes.js");
const WB = await load("lib", "calculation-trace", "pilot-map", "wholeBusinessTraceNodes.js");

function freeze(v) { if (v && typeof v === "object" && !Object.isFrozen(v)) { Object.freeze(v); Object.values(v).forEach(freeze); } return v; }
const BANNED = /\b(should|need to|must|consider|recommend\w*)\b/i;

// ---------- fixture: the four seed A groups (true costs and hours as read live, Addendum 49 item 1); revenues are synthetic and sum to 1,105,000 ----------
const groups = [
  ["G04", "Labour crew", 4242.35, 422379.94, 304050],
  ["G01", "Excavator", 1414.12, 148156.79, 160000],
  ["G02", "Small plant", 2665, 277998.96, 330000],
  ["G03", "Truck", 1414.12, 158596.90, 310950],
];
const make_live = (rows) => freeze({
  cost_allocation: {
    operational_group_cost_rows: rows.map(([id, name, h, tc]) => ({ group_id: id, group_name: name, group_recovery_hours: h, total_group_cost: tc, group_cost_per_hour: 75 })),
    operational_group_recovery_rows: rows.map(([id]) => ({ group_id: id, minimum_recoverable_rate_per_hour: 70 })),
  },
  business_outcome: {
    real_capacity: { group_real_capacity: rows.map(([id, name, h, tc, rev, covered]) => ({ group_id: id, group_name: name, modelled_revenue: rev, true_cost: tc, group_recovery_hours: covered ?? h })) },
  },
});
const lists_of = (live) => ({
  cost_rows: live.cost_allocation.operational_group_cost_rows,
  recovery_rows: live.cost_allocation.operational_group_recovery_rows,
  capacity_rows: live.business_outcome.real_capacity.group_real_capacity,
});

// ---------- A. group floor and whole-business floor on the seed A figures ----------
const live = make_live(groups);
const calc = S.calculateWholeBusinessFromContracts(lists_of(live));
const by_id = Object.fromEntries(calc.rows.map((r) => [r.group_id, r]));
check("A1 group floor G04 = 422,379.94 / 4,242.35 = 99.56", by_id.G04.breakeven_rate === 99.56, String(by_id.G04.breakeven_rate));
check("A2 group floors G01 104.77, G02 104.31, G03 112.15", by_id.G01.breakeven_rate === 104.77 && by_id.G02.breakeven_rate === 104.31 && by_id.G03.breakeven_rate === 112.15);
check("A3 total true cost 1,007,132.59", calc.whole.total_true_cost === 1007132.59, String(calc.whole.total_true_cost));
check("A4 whole-business floor = 1,007,132.59 / 9,735.59 seat hours = 103.45 (one rounding)", calc.whole.breakeven_rate === 103.45, String(calc.whole.breakeven_rate));
check("A5 revenue per seat hour 113.50 and gap 10.05 (plain subtraction of the displayed rates)", calc.whole.revenue_per_seat_hour === 113.5 && calc.whole.gap_to_breakeven_rate === 10.05, `${calc.whole.revenue_per_seat_hour} ${calc.whole.gap_to_breakeven_rate}`);
check("A1b the group floor does not move with revenue (104.3148 rounds to 104.31 whatever the revenue)", [0, 330000, 999999].every((rev) => S.calculateGroupBreakevenRate({ group_recovery_hours: 2665, true_cost: 277998.96, modelled_revenue: rev }) === 104.31) && S.calculateGroupBreakevenRate({ group_recovery_hours: 0, true_cost: 5 }) === null && S.calculateGroupBreakevenRate({ group_recovery_hours: 10, true_cost: "" }) === null && S.calculateGroupBreakevenRate({ group_recovery_hours: 10, true_cost: 0 }) === 0);
check("A6 the older whole-business figures are untouched by the new fields", calc.whole.included_group_ids.length === 4 && calc.whole.total_seat_hours > 9735 && calc.whole.excluded_groups.length === 0);

// ---------- B. covered hours below seat hours: the denominator is pinned ----------
const live_cov = make_live([["g1", "Civil", 1000, 80000, 100000], ["g3", "Trucks", 500, 50000, 60000, 400]]);
const cov = S.calculateWholeBusinessFromContracts(lists_of(live_cov));
const cov_by = Object.fromEntries(cov.rows.map((r) => [r.group_id, r]));
check("B1 group floor is per COVERED hour: 50,000 / 400 = 125.00", cov_by.g3.breakeven_rate === 125, String(cov_by.g3.breakeven_rate));
check("B2 whole-business floor is per SEAT hour: 130,000 / 1,500 = 86.67 (not 130,000 / 1,400 = 92.86)", cov.whole.breakeven_rate === 86.67, String(cov.whole.breakeven_rate));
check("B3 covered differs is flagged and the covered total is 1,400", cov.whole.covered_differs === true && cov.whole.total_covered_hours === 1400);
check("B4 revenue minus floor is profit per seat hour: 160,000 / 1,500 = 106.67; 106.67 - 86.67 = 20.00", cov.whole.revenue_per_seat_hour === 106.67 && cov.whole.gap_to_breakeven_rate === 20, String(cov.whole.gap_to_breakeven_rate));

// ---------- C. left out, missing, empty ----------
const live_out = make_live([["g1", "Civil", 1000, 80000, 100000], ["g4", "Dry hire", 200, 10000, 0, 0]]);
const out = S.calculateWholeBusinessFromContracts(lists_of(live_out));
check("C1 a group left out (covered hours 0, no revenue figure) is out of the floor cost AND hours: 80,000 / 1,000 = 80.00", out.whole.breakeven_rate === 80 && out.whole.included_group_ids.join() === "g1", String(out.whole.breakeven_rate));
check("C2 the left-out group has no group floor (never 0)", out.rows.find((r) => r.group_id === "g4").breakeven_rate === null);
const no_cost = R.calculateWholeBusinessRateGap([
  { group_id: "a", seat_hours: 100, min_rate: 10, full_cost_rate: 12, modelled_revenue: 1500, true_cost: 1300 },
  { group_id: "b", seat_hours: 100, min_rate: 10, full_cost_rate: 12, modelled_revenue: 1500 },
]);
check("C3 one included group without a numeric true_cost: floor is null, the other figures are unchanged", no_cost.available === true && no_cost.breakeven_rate === null && no_cost.gap_to_breakeven_rate === null && no_cost.total_true_cost === null && no_cost.min_rate === 10 && no_cost.revenue_per_seat_hour === 15);
const blank = R.calculateWholeBusinessRateGap([{ group_id: "a", seat_hours: 100, min_rate: 10, full_cost_rate: 12, modelled_revenue: 1500, true_cost: "" }]);
check("C4 blank true_cost is missing, not 0", blank.breakeven_rate === null);
for (const input of [null, undefined, [], [{ group_id: "s", seat_hours: 0, min_rate: 1, full_cost_rate: 1, modelled_revenue: 1, true_cost: 1 }]]) {
  const r = R.calculateWholeBusinessRateGap(input);
  check("C5 no earning group: not available, floor null", r.available === false && r.breakeven_rate === null && r.gap_to_breakeven_rate === null);
}
const zero_cost = R.calculateWholeBusinessRateGap([{ group_id: "a", seat_hours: 100, min_rate: 10, full_cost_rate: 12, modelled_revenue: 900, true_cost: 0 }]);
check("C6 a true cost of 0 is a real number: floor 0.00, gap = revenue per hour", zero_cost.breakeven_rate === 0 && zero_cost.gap_to_breakeven_rate === 9);
const before = JSON.stringify(live);
S.calculateWholeBusinessFromContracts(lists_of(live));
check("C7 inputs are not changed", JSON.stringify(live) === before);

// ---------- D. extended gap sentence (arithmetic only) ----------
const words = W.buildWholeBusinessGapWording;
const whole3 = (gm, gf, gb, extra = {}) => ({ available: true, gap_to_min_rate: gm, gap_to_full_cost_rate: gf, gap_to_breakeven_rate: gb, excluded_groups: [], covered_differs: false, ...extra });
check("D1 three-part sentence, above all", words(whole3(20, 14, 10.05)).two_rate_sentence === "Revenue per hour is $20.00 above the group minimum rate, $14.00 above the full cost rate and $10.05 above the break-even rate.");
check("D2 mixed above and below", words(whole3(20, -14, -3.5)).two_rate_sentence === "Revenue per hour is $20.00 above the group minimum rate, $14.00 below the full cost rate and $3.50 below the break-even rate.");
check("D3 equal to the break-even rate", words(whole3(1, 1, 0)).two_rate_sentence === "Revenue per hour is $1.00 above the group minimum rate, $1.00 above the full cost rate and equal to the break-even rate.");
check("D4 no floor gap: the sentence is the old two-rate sentence", words({ available: true, gap_to_min_rate: 20, gap_to_full_cost_rate: -14, excluded_groups: [] }).two_rate_sentence === "Revenue per hour is $20.00 above the group minimum rate and $14.00 below the full cost rate.");
check("D5 floor gap null (missing true cost): the old sentence", words({ ...whole3(20, -14, null) }).two_rate_sentence === "Revenue per hour is $20.00 above the group minimum rate and $14.00 below the full cost rate.");
check("D6 thousands separator and two decimals", words(whole3(1234.5, 1, -1000)).two_rate_sentence.includes("$1,000.00 below the break-even rate"));
check("D7 sentence amounts equal the helper's gaps on real helper output", (() => {
  const w = words(cov.whole).two_rate_sentence;
  return w === "Revenue per hour is $" + cov.whole.gap_to_min_rate.toFixed(2) + " above the group minimum rate, $" + cov.whole.gap_to_full_cost_rate.toFixed(2) + " above the full cost rate and $20.00 above the break-even rate.";
})(), words(cov.whole).two_rate_sentence);
const cases = [
  whole3(20, 14, 10.05), whole3(20, -14, -3.5), whole3(-3.5, -9.25, -12), whole3(0, 0, 0), whole3(1234.5, 5, 7),
  { ...cov.whole }, { ...calc.whole }, { ...out.whole }, { available: false }, null, whole3(1, 1, 1, { covered_differs: true }),
  whole3(1, 1, 1, { excluded_groups: [{ group_id: "g", group_name: "G03 Dry hire", reason: "missing revenue" }] }),
];
check("D8 banned words never appear (should, need to, must, consider, recommend) across 12 cases", cases.every((c) => {
  const r = words(c);
  return [r.two_rate_sentence, r.left_out_sentence, r.no_earning_sentence].every((s) => s === null || !BANNED.test(s));
}));
check("D9 no minus or plus sign in a sentence amount", cases.every((c) => { const s = words(c).two_rate_sentence; return s === null || !/[-+]/.test(s.replace("Revenue per hour is", "").replaceAll("break-even", "")); }));
check("D10 the banned-word test would catch advice (self-test)", ["You should raise it", "you need to charge", "must", "consider this", "we recommend it"].every((s) => BANNED.test(s)));

// ---------- E. trace nodes ----------
const nodes = F.buildBreakevenFloorTraceNodes(live);
const ids = nodes.map((n) => n.node_id);
check("E1 seed A shape: 4 group floor nodes + 3 whole-business nodes = 7", nodes.length === 7 && ids.filter((i) => i.startsWith("business_outcome.group.")).length === 4);
check("E2 node ids are unique", new Set(ids).size === ids.length);
const val = (id) => nodes.find((n) => n.node_id === id).resolve();
check("E3 group node values equal the page rows", val("business_outcome.group.G04.breakeven_rate_per_hour") === by_id.G04.breakeven_rate && val("business_outcome.group.G03.breakeven_rate_per_hour") === 112.15);
check("E4 whole-business node values equal the page result", val("business_modelling.whole_business.breakeven_rate") === calc.whole.breakeven_rate && val("business_modelling.whole_business.gap_to_breakeven_rate") === calc.whole.gap_to_breakeven_rate && val("business_modelling.whole_business.total_true_cost") === calc.whole.total_true_cost);
// The full graph imports "@/" aliases that plain Node cannot resolve (as in s5_whole_business_nodes), so integrity is checked on the nodes this feature touches.
const combined = [...WB.buildWholeBusinessTraceNodes(live), ...nodes];
const combined_ids = combined.map((n) => n.node_id);
check("E5 combined whole-business + floor nodes: no duplicate ids", new Set(combined_ids).size === combined_ids.length);
check("E6 every input of a floor node is a node in that set (no missing endpoint)", nodes.every((n) => (n.inputs || []).every((i) => combined_ids.includes(i))));
check("E7 the whole-business floor node draws edges from total_true_cost and total_seat_hours only", JSON.stringify(nodes.find((n) => n.node_id === "business_modelling.whole_business.breakeven_rate").inputs) === JSON.stringify(["business_modelling.whole_business.total_true_cost", "business_modelling.whole_business.total_seat_hours"]));
check("E8 the formula text states SEAT hours", /SEAT hours/.test(nodes.find((n) => n.node_id === "business_modelling.whole_business.breakeven_rate").formula_text));
check("E9 labels say break-even, including its share of support cost", nodes.filter((n) => n.node_id.startsWith("business_outcome.group.")).every((n) => /Break-Even/.test(n.display_label) && /support cost/.test(n.display_label)));
check("E10 group nodes: a left-out group (no breakeven result) emits none", F.buildBreakevenFloorTraceNodes(make_live([["g1", "Civil", 1000, 80000, 100000], ["g4", "Dry hire", 200, 10000, 0, 0]])).map((n) => n.node_id).join() === "business_outcome.group.g1.breakeven_rate_per_hour,business_modelling.whole_business.total_true_cost,business_modelling.whole_business.breakeven_rate,business_modelling.whole_business.gap_to_breakeven_rate");
check("E11 no earning group: no whole-business floor nodes; bad input gives [] and no error", F.buildBreakevenFloorTraceNodes(null).length === 0 && F.buildBreakevenFloorTraceNodes({}).length === 0 && F.buildBreakevenFloorTraceNodes(make_live([["s", "Support", 0, 5000, 0, 0]])).length === 0);
check("E12 the existing whole-business node set is unchanged (still 4 hours + 7 whole business)", WB.buildWholeBusinessTraceNodes(live).length === 4 + 7);

// ---------- F. source checks ----------
const node_text = read("lib", "calculation-trace", "pilot-map", "breakevenFloorTraceNodes.js");
const sel_text = read("lib", "calculation-trace", "calculationTraceSelectors.js");
const page_text = read("app", "business-modelling", "page.jsx");
const rate_text = read("lib", "calculations", "wholeBusinessRateGap.js");
check("F1 selectors import the builder once and call it once", count(sel_text, 'import { buildBreakevenFloorTraceNodes } from "./pilot-map/breakevenFloorTraceNodes.js";') === 1 && count(sel_text, "...buildBreakevenFloorTraceNodes(liveValues),") === 1);
check("F2 node file: relative imports only, no @/ alias, no hook import", !node_text.includes('"@/') && !/from ".*hooks/.test(node_text) && count(node_text, 'from "../../calculations/wholeBusinessGroupInputs.js"') === 1);
check("F3 no browser storage in any new or changed file", ![node_text, rate_text, read("lib", "calculations", "wholeBusinessGroupInputs.js"), read("lib", "calculations", "wholeBusinessGapWording.js")].some((t) => /localStorage|sessionStorage|indexedDB/.test(t)));
check("F4 the page shows the break-even column and still calls the shared function once", count(page_text, "Break-even rate /hr") === 1 && count(page_text, "calculateWholeBusinessFromContracts({") === 1 && count(page_text, "r.breakeven_rate") >= 1 && count(page_text, "whole.breakeven_rate") >= 2);
check("F5 the page holds no floor arithmetic of its own", !/true_cost\s*\//.test(page_text) && !/breakeven_rate\s*=[^=]/.test(page_text));
check("F6 the page labels: full cost rate is this group alone; break-even includes its share of the support cost", /cost of this group alone/.test(page_text) && /share of the support cost/.test(page_text));
check("F7 the new files stay under 600 lines", node_text.split("\n").length < 600 && rate_text.split("\n").length < 600);

console.log(`\ns5_breakeven_floor: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
