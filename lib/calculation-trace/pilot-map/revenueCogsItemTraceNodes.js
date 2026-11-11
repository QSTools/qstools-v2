// Mirra v6.1 - Calculation Trace - Revenue / COGS item nodes (V6.1cj piece 3).
// One ROOT INPUT node per item row for the typed buy price (buy_price_per_unit).
// Sold rows come from revenue_cogs.unit_driver_rows, purchased items (buy price only, for
// example a hired truck per load) from revenue_cogs.purchased_items. Both are fields of the
// Revenue / COGS output contract, so the node reads the same value the page shows and never
// recalculates. A buy price that is not set stays null (blank), never 0.
// Nothing consumes the buy price yet (the expected cost of sales line is a later piece), so these
// nodes have no outgoing edges; they are listed so the typed input is visible and checked.

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildRevenueCogsItemNodes(live) {
  const revenue_cogs = live?.revenue_cogs ?? {};
  const sold_rows = Array.isArray(revenue_cogs.unit_driver_rows)
    ? revenue_cogs.unit_driver_rows
    : [];
  const purchased_rows = Array.isArray(revenue_cogs.purchased_items)
    ? revenue_cogs.purchased_items
    : [];

  return [...sold_rows, ...purchased_rows].flatMap((row) => {
    const row_id = row?.id;

    if (!row_id) {
      return [];
    }

    const label = row?.unit_label || row_id;
    const kind = row?.is_purchased_item ? "purchased item" : "sold item";

    return [
      {
        node_id: `revenue_cogs.items.${row_id}.buy_price_per_unit`,
        display_label: `${label} - Buy Price per Unit`,
        module_name: "revenue-cogs",
        is_root_input: true,
        value_format: "currency_per_unit",
        formula_text: `Typed buy price per unit for this ${kind} (blank when not set). Input only: not yet used in any total.`,
        brief_reference: "REVENUE_COGS_BRIEF Addendum 7 (combined items list)",
        last_verified_against: "V6.1cj piece 3 batch 3",
        source_file: "lib/storage/revenueCogsStorage.js",
        implementation_status: "live_verified_field",
        inputs: [],
        resolve: () => nullableNumber(row?.buy_price_per_unit),
      },
    ];
  });
}