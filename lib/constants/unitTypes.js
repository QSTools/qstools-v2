// ONE list of unit types for Revenue / COGS (V6.1cj piece 3). Storage, calculations,
// selectors and the card all read this. Stored values never change once saved.
export const UNIT_TYPES = [
  { value: "each", label: "Each" },
  { value: "m2", label: "m\u00b2" },
  { value: "m3", label: "m\u00b3" },
  { value: "lm", label: "Lineal metre" },
  { value: "tonne", label: "Tonne" },
  { value: "hour", label: "Hour" },
  { value: "km", label: "Kilometre" },
  { value: "litre", label: "Litre" },
  { value: "load", label: "Load" },
  { value: "cup", label: "Cup" },
  { value: "custom", label: "Custom" },
];

export const UNIT_TYPE_VALUES = UNIT_TYPES.map((unit) => unit.value);

export const UNIT_TYPE_LABELS = Object.fromEntries(
  UNIT_TYPES.map((unit) => [unit.value, unit.label])
);