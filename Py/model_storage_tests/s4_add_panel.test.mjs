// R3 slice 4 batch C3a test. READ-ONLY: reads repo files and runs pure functions only (touches no browser storage and writes no file).
// Run: node Py\model_storage_tests\s4_add_panel.test.mjs
// Checks lib/calculations/scenarioAddForm.js (typed text to numbers, the input handed to the real validate_add_input in scenarioAdds.js, copy counts,
// the working-group list parsed from raw Cost Allocation text, the one-line description) and the source of the new panel, hook and the
// get_group_options getter (read only, no inline colours, no direct storage writes, files under 600 lines). Exit code 0 only if every check passes.
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
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Line endings differ per file (the storage modules are CRLF), so read everything as LF.
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8").replace(/\r\n/g, "\n");

const F = await import(pathToFileURL(path.join(root, "lib", "calculations", "scenarioAddForm.js")).href);
const A = await import(pathToFileURL(path.join(root, "lib", "calculations", "scenarioAdds.js")).href);

// ---------- A. parse_number ----------
check("parse_number: plain, comma, dollar and spaced numbers", F.parse_number("85000") === 85000 && F.parse_number("85,000") === 85000 && F.parse_number("$1,234.50") === 1234.5 && F.parse_number(" 12 ") === 12 && F.parse_number(".5") === 0.5 && F.parse_number("12.") === 12);
check("parse_number: blank, text, mixed and negative-looking junk give NaN, a blank is never 0", Number.isNaN(F.parse_number("")) && Number.isNaN(F.parse_number("   ")) && Number.isNaN(F.parse_number("abc")) && Number.isNaN(F.parse_number("12abc")) && Number.isNaN(F.parse_number("1.2.3")) && Number.isNaN(F.parse_number(null)) && Number.isNaN(F.parse_number(undefined)) && Number.isNaN(F.parse_number({})));
check("parse_number: a real number passes through, and a minus sign is kept so the rules can reject it", F.parse_number(5) === 5 && F.parse_number("-3") === -3);

// ---------- B. parse_copy_count ----------
check("parse_copy_count: whole digits only", F.parse_copy_count("3") === 3 && F.parse_copy_count(" 7 ") === 7 && F.parse_copy_count("0") === 0 && F.parse_copy_count("51") === 51 && F.parse_copy_count(4) === 4);
check("parse_copy_count: decimals, negatives, blanks and text give NaN", ["1.5", "-2", "", "  ", "abc", "1e3", null, undefined].every((v) => Number.isNaN(F.parse_copy_count(v))) && Number.isNaN(F.parse_copy_count(1.5)));

// ---------- C. build_add_input through the REAL rules ----------
const productive = F.build_add_input({ kind: "staff", name: "  Estimator ", annual_cost: "85,000", is_productive: true, productive_hours: "1,600", group_id: "group_a" });
let v = A.validate_add_input(productive);
check("build_add_input: a productive staff add passes the real rules, name trimmed, hours and group kept", v.ok === true && v.value.name === "Estimator" && v.value.annual_cost === 85000 && v.value.productive_hours === 1600 && v.value.group_id === "group_a", JSON.stringify(v));
const office = F.build_add_input({ kind: "staff", name: "Office hire", annual_cost: "$62,345.67", is_productive: false, productive_hours: "1600", group_id: "group_a" });
check("build_add_input: a non-productive add carries no hours or group", !("productive_hours" in office) && !("group_id" in office), JSON.stringify(office));
v = A.validate_add_input(office);
check("build_add_input: a non-productive add passes the real rules with the exact cost", v.ok === true && v.value.annual_cost === 62345.67 && v.value.is_productive === false, JSON.stringify(v));
const asset = A.validate_add_input(F.build_add_input({ kind: "asset", name: "Digger", annual_cost: "30000", is_productive: true, productive_hours: "900", group_id: "group_b" }));
check("build_add_input: a productive asset add passes the real rules", asset.ok === true && asset.value.kind === "asset" && asset.value.productive_hours === 900, JSON.stringify(asset));

const reject_cases = [
  ["a blank cost", { kind: "staff", name: "X", annual_cost: "", is_productive: false }, "add_bad_cost"],
  ["a cost of text", { kind: "staff", name: "X", annual_cost: "lots", is_productive: false }, "add_bad_cost"],
  ["a negative cost", { kind: "staff", name: "X", annual_cost: "-5", is_productive: false }, "add_bad_cost"],
  ["a blank name", { kind: "staff", name: "   ", annual_cost: "5", is_productive: false }, "add_bad_name"],
  ["a missing name", { kind: "staff", annual_cost: "5", is_productive: false }, "add_bad_name"],
  ["productive with blank hours", { kind: "staff", name: "X", annual_cost: "5", is_productive: true, productive_hours: "", group_id: "g" }, "add_bad_hours"],
  ["productive with zero hours", { kind: "staff", name: "X", annual_cost: "5", is_productive: true, productive_hours: "0", group_id: "g" }, "add_bad_hours"],
  ["productive with no group", { kind: "staff", name: "X", annual_cost: "5", is_productive: true, productive_hours: "10", group_id: "" }, "add_bad_group"],
  ["a kind that is not staff or asset", { kind: "vehicle", name: "X", annual_cost: "5", is_productive: false }, "add_bad_kind"],
];
for (const [label, fields, reason] of reject_cases) {
  const r = A.validate_add_input(F.build_add_input(fields));
  check("build_add_input: " + label + " is rejected by the real rules (" + reason + ")", r.ok === false && r.reason === reason, JSON.stringify(r));
}
check("build_add_input: junk in gives an input the rules reject, not a throw", A.validate_add_input(F.build_add_input(null)).ok === false && A.validate_add_input(F.build_add_input(undefined)).ok === false);

// ---------- D. parse_group_options ----------
const raw = JSON.stringify({
  operational_groups: [
    { group_id: "g1", group_name: " Site Crew ", is_active: true },
    { group_id: "g2", group_name: "Plant" },
    { group_id: "g3", group_name: "Retired group", is_active: false },
    { group_id: "", group_name: "No id" },
    { group_name: "Missing id" },
    { group_id: "g4", group_name: "   " },
    { group_id: "g1", group_name: "Repeated id" },
    null,
    "junk",
  ],
});
const options = F.parse_group_options(raw);
check("parse_group_options: keeps active groups with an id and a name, in order, names trimmed", same(options, [{ group_id: "g1", group_name: "Site Crew" }, { group_id: "g2", group_name: "Plant" }]), JSON.stringify(options));
check("parse_group_options: a group with no stored id is left out, never given a made-up one", !options.some((o) => o.group_name === "Missing id" || o.group_name === "No id"));
check("parse_group_options: the list is frozen", Object.isFrozen(options) && options.every((o) => Object.isFrozen(o)));
const empty = F.parse_group_options(null);
check("parse_group_options: null, empty, broken text and no groups all give the same frozen empty list", empty.length === 0 && Object.isFrozen(empty) && F.parse_group_options("") === empty && F.parse_group_options("{not json") === empty && F.parse_group_options("{}") === empty && F.parse_group_options('{"operational_groups":"x"}') === empty && F.parse_group_options(5) === empty);
check("group_name_map: id to name, and junk is ignored", same(F.group_name_map(options), { g1: "Site Crew", g2: "Plant" }) && same(F.group_name_map(null), {}) && same(F.group_name_map([null, {}, { group_id: 5 }]), {}));

// ---------- E. describe_add ----------
const names = F.group_name_map(options);
check("describe_add: productive line has cost, hours and the group name", F.describe_add({ is_productive: true, annual_cost: 85000, productive_hours: 1600, group_id: "g1" }, names) === "Productive - $85,000 a year - 1,600 hours a year - Site Crew", F.describe_add({ is_productive: true, annual_cost: 85000, productive_hours: 1600, group_id: "g1" }, names));
check("describe_add: non-productive line has only the cost", F.describe_add({ is_productive: false, annual_cost: 62345.67 }, names) === "Non-productive - $62,346 a year");
check("describe_add: a group that no longer exists is said plainly", F.describe_add({ is_productive: true, annual_cost: 1, productive_hours: 2, group_id: "gone" }, names) === "Productive - $1 a year - 2 hours a year - Working group not found");
check("describe_add: junk in gives an empty line", F.describe_add(null, names) === "" && F.describe_add(undefined) === "");

// ---------- F. the source of the new files and the getter ----------
const form_src = read("lib", "calculations", "scenarioAddForm.js");
const hook_src = read("hooks", "useScenarioAddControls.js");
const panel_src = read("components", "scenarios", "ScenarioAddPanel.jsx");
const ca_src = read("lib", "storage", "costAllocationStorage.js");
for (const [name, src] of [["scenarioAddForm.js", form_src], ["useScenarioAddControls.js", hook_src], ["ScenarioAddPanel.jsx", panel_src]]) {
  check(name + ": under 600 lines", src.split("\n").length < 600, String(src.split("\n").length));
  check(name + ": no direct browser storage use", !/localStorage|sessionStorage/.test(src));
}
check("scenarioAddForm.js: pure (no imports) and ASCII only", !/^\s*import\s/m.test(form_src) && /^[\x00-\x7F]*$/.test(form_src));
check("ScenarioAddPanel.jsx: no inline styles and no colour codes (existing ui-system classes only)", !/style=/.test(panel_src) && !/#[0-9a-fA-F]{3,8}\b/.test(panel_src) && !/rgb\(|hsl\(/.test(panel_src));
check("ScenarioAddPanel.jsx: renders nothing outside Model mode", /if \(!controls\.active\) return null;/.test(panel_src));
check("useScenarioAddControls.js: goes through the three modelScenarios add functions only", /add_scenario_add/.test(hook_src) && /copy_scenario_add/.test(hook_src) && /remove_scenario_add/.test(hook_src) && !/set_scenario_removal/.test(hook_src));
check("useScenarioAddControls.js: reads nothing unless Model mode is on", /get_mode\(\) === "model"/.test(hook_src) && /if \(!model\) return undefined;/.test(hook_src));
const getter = (ca_src.match(/export function get_group_options\(\) \{[\s\S]*?\n\}\n/) || [""])[0];
check("costAllocationStorage.js: get_group_options exists, reads through model_storage and never writes", getter !== "" && /model_storage\.getItem\(STORAGE_KEY\)/.test(getter) && !/setItem|removeItem/.test(getter), getter.slice(0, 80));
check("costAllocationStorage.js: still imports the group parser from the pure file", /scenarioAddForm\.js/.test(ca_src));

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail === 0 ? 0 : 1);
