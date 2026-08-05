export const DEFAULT_TEAM_SUGGESTIONS = [
  "Management",
  "Site crew",
  "Concrete crew",
  "Steel fixers",
  "Excavation crew",
  "Drainlayer",
  "Formwork crew",
  "Blocklayers",
  "Pump unit",
  "Truck driver",
  "Surveyor",
  "Engineer",
  "Inspector",
  "Subcontractor",
];

export function getCostAllocationTeamSuggestions(): string[] {
  if (typeof window === "undefined") return [];

  const suggestions: string[] = [];

  try {
    Object.keys(window.localStorage).forEach((key) => {
      const lower_key = key.toLowerCase();

      if (
        !lower_key.includes("cost") &&
        !lower_key.includes("allocation") &&
        !lower_key.includes("operational") &&
        !lower_key.includes("group")
      ) {
        return;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      const visit = (value: unknown) => {
        if (!value) return;

        if (Array.isArray(value)) {
          value.forEach(visit);
          return;
        }

        if (typeof value === "object") {
          const record = value as Record<string, unknown>;

          const possible_name =
            record.operational_group_name ||
            record.group_name ||
            record.team_name ||
            record.name ||
            record.label ||
            record.title;

          if (typeof possible_name === "string") {
            suggestions.push(possible_name);
          }

          Object.values(record).forEach(visit);
        }
      };

      visit(parsed);
    });
  } catch {
    return [];
  }

  return suggestions;
}

export function getBusinessOpenWeekdays(): number[] {
  const fallback = [1, 2, 3, 4, 5];

  if (typeof window === "undefined") return fallback;

  const dayIndexByName: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  function readOpenValue(value: unknown): boolean | null {
    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const lower = value.toLowerCase().trim();
      if (!lower || lower === "closed" || lower === "false" || lower === "no") return false;
      if (lower === "open" || lower === "true" || lower === "yes") return true;
    }

    if (value && typeof value === "object") {
      const item = value as Record<string, unknown>;

      if (typeof item.is_open === "boolean") return item.is_open;
      if (typeof item.open === "boolean") return item.open;
      if (typeof item.enabled === "boolean") return item.enabled;
      if (typeof item.closed === "boolean") return !item.closed;

      if (item.start || item.end || item.open_time || item.close_time) return true;
    }

    return null;
  }

  function scan(value: unknown, found: Map<number, boolean>) {
    if (!value || typeof value !== "object") return;

    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const lowerKey = key.toLowerCase();

      Object.entries(dayIndexByName).forEach(([dayName, dayIndex]) => {
        if (lowerKey === dayName || lowerKey.includes(dayName)) {
          const openValue = readOpenValue(item);
          if (openValue !== null) found.set(dayIndex, openValue);
        }
      });

      scan(item, found);
    });
  }

  const found = new Map<number, boolean>();

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;

    const lowerKey = key.toLowerCase();

    if (
      !lowerKey.includes("business") &&
      !lowerKey.includes("opening") &&
      !lowerKey.includes("hours") &&
      !lowerKey.includes("setup")
    ) {
      continue;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      scan(JSON.parse(raw), found);
    } catch {
      // Ignore non-JSON localStorage entries.
    }
  }

  const openDays = Array.from(found.entries())
    .filter(([, isOpen]) => isOpen)
    .map(([dayIndex]) => dayIndex)
    .sort((a, b) => a - b);

  return openDays.length > 0 ? openDays : fallback;
}

export function uniqueCleanValues(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter((value) => value.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
}
