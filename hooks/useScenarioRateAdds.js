"use client";

// V6.1bx (Business Modelling brief, Addendum 65). The scenario adds, for the places that price a scenario hire from a real staff type's rate.
// Reads mirra_scenarios_v1 through modelScenarios.js in Model mode only; baseline mode reads nothing and returns the same frozen empty list.
// State is read after mount so the first render matches the server. Writes nothing (no save effect, so no has_loaded guard is needed).

import { useEffect, useState } from "react";

import { get_mode } from "@/lib/storage/modelStorage";
import { get_scenario_adds, subscribe_to_scenarios } from "@/lib/storage/modelScenarios";

const NO_ADDS = Object.freeze([]);

export default function useScenarioRateAdds() {
  const [adds, set_adds] = useState(NO_ADDS);

  useEffect(() => {
    if (get_mode() !== "model") return undefined;

    function refresh() {
      const next = get_scenario_adds().adds;
      set_adds(Array.isArray(next) && next.length > 0 ? next : NO_ADDS);
    }

    refresh();
    return subscribe_to_scenarios(refresh);
  }, []);

  return adds;
}