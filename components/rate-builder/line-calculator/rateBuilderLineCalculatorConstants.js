export const UNIT_OPTIONS = [
  { value: "each", label: "Each" },
  { value: "hr", label: "Hour" },
  { value: "day", label: "Day" },
  { value: "m3", label: "m³" },
  { value: "m2", label: "m²" },
  { value: "lm", label: "Lineal metre" },
  { value: "tonne", label: "Tonne" },
  { value: "item", label: "Item" },
  { value: "custom", label: "Custom" },
];

export const DEFAULT_CALCULATOR = {
  id: "two_inch_line_pump",
  name: "2-inch line pump calculator",
  linked_cost_allocation_group_id: "",
  lines: [
    {
      id: "setup_fee",
      name: "Setup Fee",
      unit: "each",
      rate: 135,
      quantity: 1,
      is_output_driver: false,
    },
    {
      id: "m3_rate",
      name: "m3 Rate",
      unit: "m3",
      rate: 13,
      quantity: 15,
      is_output_driver: true,
    },
    {
      id: "pump_hire_2inc",
      name: "2inc Line Pump Hire",
      unit: "hr",
      rate: 135,
      quantity: 4,
      is_output_driver: false,
    },
  ],
};

export const EMPTY_LINE = {
  name: "",
  unit: "each",
  rate: "",
  quantity: "",
};

export function get_unit_label(unit_value) {
  const match = UNIT_OPTIONS.find((unit) => unit.value === unit_value);
  return match ? match.label : unit_value || "unit";
}

export function build_id(name) {
  const base_id = String(name || "item")
    .toLowerCase()
    .trim()
    .replaceAll(" ", "_")
    .replace(/[^a-z0-9_]/g, "");

  return `${base_id || "item"}_${Date.now()}`;
}

export function get_default_calculators() {
  return [DEFAULT_CALCULATOR];
}
