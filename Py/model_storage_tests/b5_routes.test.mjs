// R3 slice 1 batch 5 test. READ-ONLY, plain node. Run: node Py\model_storage_tests\b5_routes.test.mjs
// Checks the unmodelled route list and matcher, and that the wording is ASCII and non-empty.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cfg = await import(pathToFileURL(path.resolve(here, "..", "..", "lib", "config", "modelModeRoutes.js")).href);
let pass = 0, fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log("PASS: " + name); }
  else { fail++; console.log("FAIL: " + name + (detail ? " :: " + detail : "")); }
}

const unmodelled = ["/quote-engine", "/quote-checker", "/quick-start", "/labour-rate-reality-check", "/scheduling"];
check("exactly the five agreed routes are listed", JSON.stringify([...cfg.UNMODELLED_ROUTES].sort()) === JSON.stringify([...unmodelled].sort()));
check("each unmodelled route matches", unmodelled.every((r) => cfg.is_unmodelled_route(r)));
check("trailing slash, query, hash and sub-paths match", cfg.is_unmodelled_route("/scheduling/") && cfg.is_unmodelled_route("/quote-engine?x=1") && cfg.is_unmodelled_route("/quick-start#a") && cfg.is_unmodelled_route("/scheduling/week"));
const modelled = ["/", "/general-overheads", "/labour", "/assets", "/opening-hours", "/cost-allocation", "/rate-builder", "/business-outcome", "/business-modelling", "/dev/model-mode", "/imports", "/p-and-l", "/revenue-cogs", "/recovery-outcome", "/settings", "/demo-login"];
check("modelled and other routes do not match", modelled.every((r) => !cfg.is_unmodelled_route(r)), modelled.filter((r) => cfg.is_unmodelled_route(r)).join(","));
check("look-alike prefixes do not match", !cfg.is_unmodelled_route("/quote") && !cfg.is_unmodelled_route("/quote-engines") && !cfg.is_unmodelled_route("/scheduling-x") && !cfg.is_unmodelled_route("/labour-rate"));
check("empty and non-string input is safe", !cfg.is_unmodelled_route("") && !cfg.is_unmodelled_route(null) && !cfg.is_unmodelled_route(undefined) && !cfg.is_unmodelled_route(5));
const texts = Object.values(cfg.MODEL_MODE_TEXT);
check("all wording is non-empty ASCII", texts.length === 7 && texts.every((t) => typeof t === "string" && t.length > 0 && /^[\x20-\x7e]+$/.test(t)));
check("the banner says MODEL MODE and the notice says Not available in Model mode", cfg.MODEL_MODE_TEXT.banner_label === "MODEL MODE" && cfg.MODEL_MODE_TEXT.notice_title === "Not available in Model mode");

console.log("SUMMARY PASS " + pass + " / FAIL " + fail);
process.exit(fail === 0 ? 0 : 1);