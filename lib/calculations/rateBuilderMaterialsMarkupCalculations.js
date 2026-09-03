function to_number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// markup% -> margin%:  margin% = markup% / (1 + markup%)
export function convert_markup_to_margin_percent(markup_percent) {
  const markup_decimal = to_number(markup_percent) / 100;
  if (markup_decimal <= -1) {
    return 0;
  }
  const margin_decimal = markup_decimal / (1 + markup_decimal);
  return margin_decimal * 100;
}

// margin% -> markup%:  markup% = margin% / (1 - margin%)
export function convert_margin_to_markup_percent(margin_percent) {
  const margin_decimal = to_number(margin_percent) / 100;
  if (margin_decimal >= 1) {
    return 0;
  }
  const markup_decimal = margin_decimal / (1 - margin_decimal);
  return markup_decimal * 100;
}

export function calculate_materials_markup_result({
  total_cogs = 0,
  materials_markup_percent = 0,
}) {
  const cogs = to_number(total_cogs);
  const markup_percent = to_number(materials_markup_percent);
  const markup_decimal = markup_percent / 100;

  const sell_revenue = cogs * (1 + markup_decimal);
  const profit = sell_revenue - cogs;
  const margin_percent = convert_markup_to_margin_percent(markup_percent);

  return {
    total_cogs: cogs,
    materials_markup_percent: markup_percent,
    materials_margin_percent: margin_percent,
    sell_revenue,
    profit,
    has_cogs: cogs > 0,
  };
}
