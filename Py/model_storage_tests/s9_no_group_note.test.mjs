// V6.1by test (BM Addendum 64 finding 6a). READ-ONLY, pure (no storage, no React). Run: node Py\model_storage_tests\s9_no_group_note.test.mjs
// Checks lib/calculations/wholeBusinessNoGroupNote.js and lib/calculation-trace/pilot-map/noGroupCostTraceNodes.js, and that the page and the
// trace selectors use them. Exit 0 only if all pass.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const load = (f) => import(pathToFileURL(path.join(root, f)).href);
const N = await load("lib/calculations/wholeBusinessNoGroupNote.js");
const T = await load("lib/calculation-trace/pilot-map/noGroupCostTraceNodes.js");
let pass = 0, fail = 0;
function check(n, ok, d) { if (ok) { pass++; console.log("PASS: " + n); } else { fail++; console.log("FAIL: " + n + (d ? " :: " + d : "")); } }
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const count = (text, needle) => text.split(needle).length - 1;

// amount
check("missing / blank / non-number give null", [undefined, null, "", "abc", NaN, Infinity, {}].every((v) => N.noGroupCostAmount(v) === null));
check("zero, negative and under half a cent give null", [0, -5, 0.004, "0"].every((v) => N.noGroupCostAmount(v) === null));
check("90000 stays 90000", N.noGroupCostAmount(90000) === 90000);
check("text number is read", N.noGroupCostAmount("6181.73") === 6181.73);
check("rounds to the cent", N.noGroupCostAmount(1234567.891) === 1234567.89 && N.noGroupCostAmount(0.005) === 0.01);

// sentence
check("nothing to say gives null", [undefined, null, 0, "", -1, 0.004].every((v) => N.buildNoGroupCostSentence(v) === null));
check("90,000 sentence exact", N.buildNoGroupCostSentence(90000) === "Cost in no working group: $90,000.00. It is not in the group cost above.");
check("6,181.73 sentence exact", N.buildNoGroupCostSentence(6181.73) === "Cost in no working group: $6,181.73. It is not in the group cost above.");
check("large amount has thousands separators and two decimals", N.buildNoGroupCostSentence(1234567.891) === "Cost in no working group: $1,234,567.89. It is not in the group cost above.");
check("one cent shows", N.buildNoGroupCostSentence(0.01) === "Cost in no working group: $0.01. It is not in the group cost above.");

// banned words: output and module source outside comment lines
const banned = /\b(should|need to|must|consider|recommend)\b/i;
check("banned words absent from the sentence", !banned.test(N.buildNoGroupCostSentence(90000)));
for (const f of ["lib/calculations/wholeBusinessNoGroupNote.js", "lib/calculation-trace/pilot-map/noGroupCostTraceNodes.js"]) {
  const code = read(f).split(/\r?\n/).filter((l) => !l.trim().startsWith("//")).join("\n");
  check("banned words absent from non-comment source of " + f, !banned.test(code));
}

// trace node
check("no node when contract missing", T.buildNoGroupCostTraceNodes(undefined).length === 0 && T.buildNoGroupCostTraceNodes({}).length === 0 && T.buildNoGroupCostTraceNodes({ cost_allocation: {} }).length === 0);
check("no node at 0, negative, blank, text", [0, -1, "", "x", null, 0.004].every((v) => T.buildNoGroupCostTraceNodes({ cost_allocation: { total_unassigned_cost: v } }).length === 0));
const nodes = T.buildNoGroupCostTraceNodes({ cost_allocation: { total_unassigned_cost: 90000 } });
check("one node above zero", nodes.length === 1);
const node = nodes[0] || {};
check("node id and module", node.node_id === "cost_allocation.total_unassigned_cost" && node.module_name === "cost-allocation");
check("node is a root input with no inputs (no edges)", node.is_root_input === true && Array.isArray(node.inputs) && node.inputs.length === 0);
check("node value equals the page amount", node.resolve() === N.noGroupCostAmount(90000) && node.resolve() === 90000);
check("node value is rounded to the cent like the page", T.buildNoGroupCostTraceNodes({ cost_allocation: { total_unassigned_cost: 6181.734 } })[0].resolve() === 6181.73);
check("node has the fields the other nodes carry", ["display_label", "value_format", "formula_text", "brief_reference", "last_verified_against", "source_file", "implementation_status"].every((k) => typeof node[k] === "string" && node[k].length > 0));
check("node id is unique among its own output", new Set(nodes.map((n) => n.node_id)).size === nodes.length);

// source wiring
const page = read("app/business-modelling/page.jsx");
check("page imports buildNoGroupCostSentence once", count(page, "buildNoGroupCostSentence } from \"@/lib/calculations/wholeBusinessNoGroupNote\"") === 1);
check("page calls it once with the contract total_unassigned_cost", count(page, "= buildNoGroupCostSentence(contract.total_unassigned_cost)") === 1);
check("page renders the sentence once", count(page, "{no_group_sentence ?") === 1);
const sel = read("lib/calculation-trace/calculationTraceSelectors.js");
check("selectors import the builder once", count(sel, "buildNoGroupCostTraceNodes } from \"./pilot-map/noGroupCostTraceNodes.js\"") === 1);
check("selectors spread the builder once", count(sel, "...buildNoGroupCostTraceNodes(liveValues),") === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
