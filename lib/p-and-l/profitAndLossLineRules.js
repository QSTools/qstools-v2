function to_number(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function has_meaningful_source_identifier(line = {}) {
  return [
    "source_line_id",
    "import_line_id",
    "external_line_id",
    "account_code",
    "account_id",
  ].some((key) => Boolean(String(line[key] ?? "").trim()));
}

export function is_empty_placeholder_line(line = {}) {
  const line_name = String(line.line_name ?? "").trim();
  const amount = to_number(line.amount);
  const category = line.category || "unassigned";
  const direct_cost_category_id = String(
    line.direct_cost_category_id ?? "",
  ).trim();

  return (
    !line_name &&
    amount === 0 &&
    category === "unassigned" &&
    !direct_cost_category_id &&
    !has_meaningful_source_identifier(line)
  );
}
