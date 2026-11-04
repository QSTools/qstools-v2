// R3 slice 4, batch C3a (Business Modelling brief, Addendum 26: scratch adds; Addendum 30: the add form).
// PURE helpers for the scenario add form. No storage, no React, no imports, so they run in plain node for the tests.
// They only turn what the owner typed into the input the existing rules (scenarioAdds.js validate_add_input) expect, read the working-group list out of
// the raw Cost Allocation text, and describe an added item in one line. They decide nothing: every rule stays in scenarioAdds.js.
// ASCII only.

export const MAX_COPY_COUNT = 50;

const NO_GROUPS = Object.freeze([]);

// Typed text to a number. "85,000", "$1,234.50" and " 12 " are fine; blank, text and "12abc" give NaN (so the rules reject them, a blank is never read as 0).
export function parse_number(value) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  const cleaned = value.replace(/[\s$,]/g, "");
  if (cleaned === "") return NaN;
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

// Whole number of copies from typed text. Anything that is not whole digits gives NaN; the range (1 to 50) is checked by copy_scenario_add.
export function parse_copy_count(value) {
  if (typeof value === "number") return Number.isInteger(value) ? value : NaN;
  if (typeof value !== "string") return NaN;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return NaN;
  return Number(trimmed);
}

// fields: what the form holds (all text except is_productive). Returns the input for add_scenario_add. A non-productive item carries no hours or group.
export function build_add_input(fields) {
  const f = fields && typeof fields === "object" ? fields : {};
  const input = {
    kind: f.kind,
    name: typeof f.name === "string" ? f.name : "",
    is_productive: f.is_productive === true,
    annual_cost: parse_number(f.annual_cost),
  };
  if (input.is_productive) {
    input.productive_hours = parse_number(f.productive_hours);
    input.group_id = typeof f.group_id === "string" ? f.group_id : "";
  }
  return input;
}

// Active working groups from the RAW text of the Cost Allocation key: [{ group_id, group_name }]. Groups with no stored id or name, inactive groups and
// repeated ids are left out; an id is never invented. A missing, empty or broken text gives the same frozen empty list each time.
export function parse_group_options(raw) {
  if (typeof raw !== "string" || raw === "") return NO_GROUPS;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NO_GROUPS;
  }
  const list = parsed && Array.isArray(parsed.operational_groups) ? parsed.operational_groups : [];
  const seen = new Set();
  const options = [];
  for (const group of list) {
    if (!group || typeof group !== "object") continue;
    const group_id = typeof group.group_id === "string" ? group.group_id.trim() : "";
    const group_name = typeof group.group_name === "string" ? group.group_name.trim() : "";
    if (group_id === "" || group_name === "" || group.is_active === false || seen.has(group_id)) continue;
    seen.add(group_id);
    options.push(Object.freeze({ group_id, group_name }));
  }
  return options.length === 0 ? NO_GROUPS : Object.freeze(options);
}

export function group_name_map(options) {
  const names = {};
  for (const option of Array.isArray(options) ? options : []) {
    if (option && typeof option.group_id === "string") names[option.group_id] = option.group_name;
  }
  return names;
}

function money(value) {
  return "$" + Math.round(Number(value) || 0).toLocaleString("en-NZ");
}

// One plain line for the list of added items.
export function describe_add(add, names_by_group_id) {
  if (!add || typeof add !== "object") return "";
  const parts = [add.is_productive ? "Productive" : "Non-productive", money(add.annual_cost) + " a year"];
  if (add.is_productive) {
    parts.push((Number(add.productive_hours) || 0).toLocaleString("en-NZ") + " hours a year");
    const name = names_by_group_id && names_by_group_id[add.group_id];
    parts.push(name ? name : "Working group not found");
  }
  return parts.join(" - ");
}
