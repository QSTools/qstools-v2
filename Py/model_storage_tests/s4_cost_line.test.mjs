// R3 slice 4 batch C3b test. READ-ONLY: reads repo files and runs pure functions only (touches no browser storage and writes no file).
// Run: node Py\model_storage_tests\s4_cost_line.test.mjs
// Checks lib/calculations/scenarioCostSummary.js (the scenario-cost line figures), scenarioRateNote.js (the Rate Builder note), the trace node file
// pilot-map/scenarioTraceNodes.js (the node exists only for a non-productive amount above zero, root input, no edges), and the source of the pieces C3b
// wires in (page, trace registration, live value, Rate Builder breakdown, banner wording). Exit code 0 only if every check passes.
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

const A = await load("lib", "calculations", "scenarioAdds.js");
const S = await load("lib", "calculations", "scenarioCostSummary.js");
const R = await load("lib", "calculations", "scenarioRateNote.js");
const T = await load("lib", "calculation-trace", "pilot-map", "scenarioTraceNodes.js");

function deep_freeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deep_freeze);
  }
  return value;
}

const office = { id: "scratch_o1", kind: "staff", name: "Office hire", is_productive: false, annual_cost: 62345.67 };
const ute = (n) => ({ id: "scratch_v" + n, kind: "asset", name: "Ute " + n, is_productive: false, annual_cost: 8123.45 });
const digger = { id: "scratch_d1", kind: "asset", name: "Digger", is_productive: true, annual_cost: 50000, productive_hours: 1000, group_id: "g1" };
const hire = { id: "scratch_h1", kind: "staff", name: "Estimator", is_productive: true, annual_cost: 85000, productive_hours: 1600, group_id: "g_gone" };
const adds = deep_freeze([office, ute(1), ute(2), ute(3), digger, hire]);
const names = deep_freeze({ g1: "Civil" });

// ---------- A. the scenario-cost summary ----------
const empty_a = S.build_scenario_cost_summary([], names);
check("summary: nothing to show gives the same frozen empty result each time", empty_a.has_any === false && empty_a.non_productive_total === 0 && empty_a.non_productive_count === 0 && empty_a.productive_items.length === 0 && empty_a === S.build_scenario_cost_summary(undefined, names) && empty_a === S.build_scenario_cost_summary(null) && Object.isFrozen(empty_a));
const sum = S.build_scenario_cost_summary(adds, names);
check("summary: office hire 62,345.67 + 3 vehicles at 8,123.45 = 86,716.02 exactly, the digger and the hire are not counted", sum.has_any === true && sum.non_productive_total === 86716.02 && sum.non_productive_count === 4, JSON.stringify(sum));
check("summary: equals the very function that feeds General Overheads (non_productive_total)", sum.non_productive_total === A.non_productive_total(adds));
check("summary: two productive items listed in order, each with its own id, kind and name", sum.productive_items.length === 2 && sum.productive_items[0].id === "scratch_d1" && sum.productive_items[1].id === "scratch_h1" && sum.productive_items[0].kind === "asset" && sum.productive_items[1].name === "Estimator");
check("summary: a productive item shows its group name, and a missing group says so", sum.productive_items[0].description.includes("Civil") && sum.productive_items[1].description.includes("Working group not found"), JSON.stringify(sum.productive_items));
check("summary: the description carries cost and hours", sum.productive_items[0].description.includes("$50,000 a year") && sum.productive_items[0].description.includes("1,000 hours a year"), sum.productive_items[0].description);
const only_prod = S.build_scenario_cost_summary([digger], names);
check("summary: only productive adds gives a zero total, zero count and the item", only_prod.has_any === true && only_prod.non_productive_total === 0 && only_prod.non_productive_count === 0 && only_prod.productive_items.length === 1);
const only_np = S.build_scenario_cost_summary([office], names);
check("summary: only non-productive adds gives the total and no productive items", only_np.has_any === true && only_np.non_productive_total === 62345.67 && only_np.productive_items.length === 0);
const junk = S.build_scenario_cost_summary([null, 5, "x", { id: "real_1", kind: "staff", name: "x", is_productive: false, annual_cost: 10 }, { id: "scratch_bad", kind: "staff", name: "", is_productive: false, annual_cost: 10 }, office], names);
check("summary: entries that fail the stored-add rules are skipped", junk.non_productive_total === 62345.67 && junk.non_productive_count === 1, JSON.stringify(junk));
check("summary: all-invalid input gives the empty result", S.build_scenario_cost_summary([null, { id: "x" }], names) === empty_a);
check("summary: the frozen input list is not changed", adds.length === 6 && adds[0] === office);
check("summary: 0.1 + 0.2 cent sum is exact", S.build_scenario_cost_summary([{ id: "scratch_a", kind: "staff", name: "a", is_productive: false, annual_cost: 0.1 }, { id: "scratch_b", kind: "staff", name: "b", is_productive: false, annual_cost: 0.2 }], {}).non_productive_total === 0.3);

// ---------- B. the Rate Builder note ----------
check("note: the wording is exactly the approved line", R.SCENARIO_HIRE_NOTE === "This group includes a scenario hire with no charge-out rate, so labour is shown as incomplete.");
check("note: the wording is plain ASCII", /^[\x20-\x7e]+$/.test(R.SCENARIO_HIRE_NOTE));
check("note: a scenario hire's own staff type is detected", R.has_scenario_hire([{ staff_type_id: "t_real" }, { staff_type_id: A.scratch_staff_type_id("scratch_h1") }]) === true);
check("note: real staff types only, no note", R.has_scenario_hire([{ staff_type_id: "t_real" }, { staff_type_id: "type_2" }]) === false);
check("note: a real id that merely contains the words is not a scenario hire", R.has_scenario_hire([{ staff_type_id: "my_scratch_type_1" }, { staff_type_id: "scratch_h1" }]) === false);
check("note: empty, missing and junk input is safe", R.has_scenario_hire([]) === false && R.has_scenario_hire(undefined) === false && R.has_scenario_hire(null) === false && R.has_scenario_hire("x") === false && R.has_scenario_hire([null, {}, { staff_type_id: 5 }]) === false);

// ---------- C. the trace node ----------
const nodes = T.buildScenarioAddedCostNodes({ scenario_added_cost: 86716.02 });
check("node: exactly one node for a non-productive amount above zero", nodes.length === 1 && nodes[0].node_id === "general_overheads.scenario_added_cost");
check("node: root input, no inputs (so no edge is drawn), General Overheads module, currency", nodes[0].is_root_input === true && Array.isArray(nodes[0].inputs) && nodes[0].inputs.length === 0 && nodes[0].module_name === "general-overheads" && nodes[0].value_format === "currency");
check("node: resolves to the live amount, not a recalculation", nodes[0].resolve({}) === 86716.02 && nodes[0].resolve() === 86716.02);
check("node: carries every field the other nodes carry", ["node_id", "display_label", "module_name", "is_root_input", "value_format", "formula_text", "brief_reference", "last_verified_against", "source_file", "implementation_status", "inputs", "resolve"].every((k) => k in nodes[0]));
check("node: the formula says explain only and already inside the total", /EXPLAIN ONLY/.test(nodes[0].formula_text) && /already inside general_overheads\.total_general_overheads/.test(nodes[0].formula_text));
const none = [{ scenario_added_cost: 0 }, { scenario_added_cost: -5 }, { scenario_added_cost: null }, { scenario_added_cost: undefined }, { scenario_added_cost: "" }, { scenario_added_cost: NaN }, { scenario_added_cost: "abc" }, {}, null, undefined];
check("node: no node for zero, negative, null, missing, blank, NaN or text (never a silent 0)", none.every((live) => T.buildScenarioAddedCostNodes(live).length === 0));

// ---------- D. source of the pieces C3b wires in ----------
const page = read("app", "cost-allocation", "page.jsx");
check("page: Cost Allocation mounts the scenario-cost line exactly once, with one import", count(page, "<ScenarioCostLine />") === 1 && count(page, 'import ScenarioCostLine from "@/components/scenarios/ScenarioCostLine";') === 1);
const live = read("lib", "calculation-trace", "calculationTraceLiveValues.js");
check("live values: scenario_added_cost comes from the General Overheads hook field, exactly once", count(live, "scenario_added_cost:") === 1 && live.includes("modelling_general_overheads?.scenario_overhead_cost"));
const sel = read("lib", "calculation-trace", "calculationTraceSelectors.js");
check("selectors: the node builder is imported once and spread once", count(sel, "buildScenarioAddedCostNodes") === 2 && count(sel, "...buildScenarioAddedCostNodes(liveValues),") === 1);
const bd = read("components", "rate-builder", "line-calculator", "RateBuilderLabourBreakdown.jsx");
check("rate builder: the note is imported and shown once, from the shared wording", count(bd, "has_scenario_hire(rows)") === 1 && count(bd, "{SCENARIO_HIRE_NOTE}") === 1 && count(bd, 'from "@/lib/calculations/scenarioRateNote"') === 1);
check("rate builder: the existing incomplete line is still there", bd.includes("Labour is incomplete. {issue_message}"));
const cfg = await load("lib", "config", "modelModeRoutes.js");
check("banner: the approved wording, exactly", cfg.MODEL_MODE_TEXT.banner === "You are viewing the modelled business. Your real data is not changed. Your overhead what-if and scenario changes are kept; other edits are not saved.", cfg.MODEL_MODE_TEXT.banner);
check("banner: the stale 'not saved yet' and 'removals are kept' wording is gone", !/not saved yet/.test(cfg.MODEL_MODE_TEXT.banner) && !/removals are kept/.test(cfg.MODEL_MODE_TEXT.banner));

// ---------- E. the new files ----------
const line = read("components", "scenarios", "ScenarioCostLine.jsx");
const hook = read("hooks", "useScenarioCostSummary.js");
check("cost line: renders nothing outside Model mode or with an empty scenario", /if \(!active \|\| !summary\.has_any\) return null;/.test(line));
check("cost line and hook: no inline styles or colour codes, no direct browser storage", !/style=\{/.test(line) && !/#[0-9a-fA-F]{3,8}\b/.test(line) && !/localStorage|sessionStorage/.test(line + hook));
check("hook: read-only (no add, copy, remove or set calls, no storage writes)", !/add_scenario_add|copy_scenario_add|remove_scenario_add|setItem|removeItem/.test(hook));
check("hook: reads nothing unless Model mode is on", /get_mode\(\) === "model"/.test(hook) && /if \(!model\) return undefined;/.test(hook));
const sizes = [["components/scenarios/ScenarioCostLine.jsx", line], ["hooks/useScenarioCostSummary.js", hook], ["lib/calculations/scenarioCostSummary.js", read("lib", "calculations", "scenarioCostSummary.js")], ["lib/calculations/scenarioRateNote.js", read("lib", "calculations", "scenarioRateNote.js")], ["lib/calculation-trace/pilot-map/scenarioTraceNodes.js", read("lib", "calculation-trace", "pilot-map", "scenarioTraceNodes.js")]];
check("all new files are under 600 lines", sizes.every(([, text]) => text.split("\n").length < 600), sizes.map(([n, t]) => n + ":" + t.split("\n").length).join(" "));

console.log("SUMMARY PASS " + pass + " / FAIL " + fail);
process.exit(fail === 0 ? 0 : 1);
