// Mirra v6.0 - Calculation Trace - Business Modelling Nodes
// Session 16. Traces Business Modelling's ADDITIVE model, read-only:
//   row achieved_revenue = true_cost + non_productive_share + real_capacity_net_profit
//   lever effect         = (target - start_rate) x basis   (cost rows inverted)
//   modelled_net_profit  = today's real headline net profit + sum of lever effects
// Only the real_capacity_net_profit leg of each row is a traced Business
// Outcome node; true_cost and non_productive_share are read from the same
// per_source row and are NOT separately traced here.
// Levers come from storage (readModellingLevers, read-only) - the trace page
// never writes them. The legacy Baseline/Upside/Downside tools and the
// modelled_per_source rerun (unsupported / inert cross-check) are not traced.

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fmt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : "n/a";
}

function row_node_id(row_id) {
  return `business_modelling.row.${row_id}.achieved_revenue`;
}

function lever_target_node_id(row_id) {
  return `business_modelling.lever.${row_id}.target`;
}

function lever_effect_node_id(row_id) {
  return `business_modelling.lever.${row_id}.effect`;
}

function upstream_inputs_for_row(row, live) {
  const bo = live?.business_outcome ?? {};

  if (row.kind === "materials") {
    return ["business_outcome.materials.real_capacity_net_profit"];
  }

  if (row.kind === "overhead") {
    return ["general_overheads.total_general_overheads"];
  }

  if (row.kind === "staff") {
    const prefix = `staff:${row.unit_id}:`;
    const staff_type_id = String(row.row_id).slice(prefix.length);
    return [`business_outcome.labour_source.${row.unit_id}.${staff_type_id}.real_capacity_net_profit`];
  }

  const inputs = [];
  const asset_group = (bo.asset_groups ?? []).find((g) => g?.group_id === row.unit_id);
  (asset_group?.assets ?? []).forEach((a) => {
    inputs.push(`business_outcome.asset_source.${row.unit_id}.${a.asset_id}.real_capacity_net_profit`);
  });

  if (row.kind === "unit") {
    const labour_group = (bo.labour_groups ?? []).find((g) => g?.group_id === row.unit_id);
    (labour_group?.staff ?? []).forEach((s) => {
      inputs.push(`business_outcome.labour_source.${row.unit_id}.${s.staff_type_id}.real_capacity_net_profit`);
    });
  }

  return inputs;
}

function row_formula_text(row) {
  const shared =
    `Start rate ${fmt(row.start_rate)} per ${row.basis_unit}, basis ${fmt(row.basis)} ${row.basis_unit}, status ${row.status}. ` +
    "Only the real_capacity_net_profit leg is a traced node; true_cost and non_productive_share are read from the same per_source row and are not separately traced.";

  if (row.kind === "overhead") {
    return (
      "Overhead category row: achieved_revenue = minus the category total from General Overheads (a cost row - raising it lowers net profit). " +
      "General Overheads has no per-category trace node, so the whole-overheads total is the nearest traced input. " + shared
    );
  }
  if (row.kind === "materials") {
    return "Materials row: achieved_revenue = materials true_cost; start markup is 0% (paid at cost); basis = COGS / 100. " + shared;
  }
  if (row.kind === "unit") {
    return (
      "Asset-driven unit (one all-in lever): achieved_revenue = the unit's assets plus its labour rows (true_cost + non_productive_share + real_capacity_net_profit each). " + shared
    );
  }
  if (row.kind === "assets") {
    return "Asset row (one per working unit, covered hours): achieved_revenue = sum over the unit's assets of true_cost + non_productive_share + real_capacity_net_profit. " + shared;
  }
  return "Staff row: achieved_revenue = true_cost + non_productive_share + real_capacity_net_profit (View A). " + shared;
}

export function buildBusinessModellingNodes(live) {
  const bm = live?.business_modelling;
  if (!bm?.available) {
    return [];
  }

  const bo = live?.business_outcome ?? {};
  const rows = Array.isArray(bm.rows) ? bm.rows : [];
  const levers = bm.levers ?? {};
  const effects = bm.effects ?? {};
  const nodes = [];

  const common = {
    module_name: "business-modelling",
    brief_reference: "BusinessModelling brief (v6.0 additive lever model)",
    last_verified_against: "Session 16, calculation trace Business Modelling extension",
    implementation_status: "live_traced_via_hook",
  };

  rows.forEach((row) => {
    nodes.push({
      ...common,
      node_id: row_node_id(row.row_id),
      display_label: `${row.label} - Achieved Revenue (Business Modelling)`,
      is_root_input: false,
      value_format: "currency",
      formula_text: row_formula_text(row),
      source_file: "lib/calculations/businessModellingSourceRows.js",
      inputs: upstream_inputs_for_row(row, live),
      resolve: () => safeNumber(row.achieved_revenue),
    });
  });

  const effect_node_ids = [];

  rows.forEach((row) => {
    if (!Object.prototype.hasOwnProperty.call(effects, row.row_id)) {
      return;
    }

    nodes.push({
      ...common,
      node_id: lever_target_node_id(row.row_id),
      display_label: `${row.label} - Lever Target (your saved input)`,
      is_root_input: true,
      value_format:
        row.kind === "materials" ? "number" : row.kind === "overhead" ? "currency" : "currency_per_unit",
      formula_text:
        "User-entered lever target read from storage (qs_tools_business_modelling_levers_v1), read-only. " +
        (row.kind === "materials" ? "Value is a markup percent on COGS." : "Value is a rate per basis unit (a total dollar amount for overhead rows)."),
      source_file: "lib/storage/businessModellingLeverStorage.js",
      inputs: [],
      resolve: () => safeNumber(levers[row.row_id]),
    });

    nodes.push({
      ...common,
      node_id: lever_effect_node_id(row.row_id),
      display_label: `${row.label} - Lever Effect on Net Profit`,
      is_root_input: false,
      value_format: "currency",
      formula_text: row.is_cost_row
        ? `Cost row: effect = (start_rate - target) x basis = (${fmt(row.start_rate)} - target) x ${fmt(row.basis)}. Raising the total lowers net profit.`
        : `effect = (target - start_rate) x basis = (target - ${fmt(row.start_rate)}) x ${fmt(row.basis)} ${row.basis_unit}.`,
      source_file: "lib/calculations/businessModellingAdditiveModel.js",
      inputs: [lever_target_node_id(row.row_id), row_node_id(row.row_id)],
      resolve: () => safeNumber(effects[row.row_id]),
    });

    effect_node_ids.push(lever_effect_node_id(row.row_id));
  });

  nodes.push({
    ...common,
    node_id: "business_modelling.total_effect",
    display_label: "Total Lever Effect (Business Modelling)",
    is_root_input: false,
    value_format: "currency",
    formula_text:
      "Sum of every applied lever effect. With no levers set this is 0 (no incoming edges) and modelled net profit equals today's net profit. Levers on rows with no covered hours or a non-numeric value are ignored, not summed.",
    source_file: "lib/calculations/businessModellingAdditiveModel.js",
    inputs: effect_node_ids,
    resolve: () => safeNumber(bm.total_effect),
  });

  const group_real_capacity = Array.isArray(bo?.real_capacity?.group_real_capacity)
    ? bo.real_capacity.group_real_capacity
    : [];
  const today_inputs = group_real_capacity
    .filter((g) => g?.group_id && g.group_id !== "materials")
    .map((g) => `business_outcome.group.${g.group_id}.real_capacity_net_profit`);
  if (bo?.materials) {
    today_inputs.push("business_outcome.materials.real_capacity_net_profit");
  }

  nodes.push({
    ...common,
    node_id: "business_modelling.today_net_profit",
    display_label: "Today's Net Profit (Business Modelling base)",
    is_root_input: false,
    value_format: "currency",
    formula_text:
      "Read from per_source.headline_real_capacity.total_net_profit (View A, real capacity). The inputs listed are the View A group results plus floored materials that it aggregates; the sum is checked against this value in the snapshot, not re-derived here.",
    source_file: "lib/calculations/businessModellingSourceRows.js",
    inputs: today_inputs,
    resolve: () => safeNumber(bm.today_net_profit),
  });

  nodes.push({
    ...common,
    node_id: "business_modelling.modelled_net_profit",
    display_label: "Modelled Net Profit (Business Modelling)",
    is_root_input: false,
    value_format: "currency",
    formula_text:
      "modelled_net_profit = today_net_profit + total_effect (additive model: only rows you touched move; untouched rows stay at today's achieved figures).",
    source_file: "lib/calculations/businessModellingAdditiveModel.js",
    inputs: ["business_modelling.today_net_profit", "business_modelling.total_effect"],
    resolve: () => safeNumber(bm.modelled_net_profit),
  });

  return nodes;
}