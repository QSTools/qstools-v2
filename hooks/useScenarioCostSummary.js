"use client";

// R3 slice 4 batch C3b (Business Modelling brief, Addendum 31). Feeds the scenario-cost line on the Cost Allocation page. READ-ONLY: it reads the scenario adds
// (get_scenario_adds, which is empty and reads no storage in baseline mode) and the working-group names (get_group_options), and writes nothing.
// State is read after mount so the first render matches the server (same pattern as useScenarioAddControls). active stays false outside Model mode.

import { useEffect, useMemo, useState } from "react";

import { get_mode } from "@/lib/storage/modelStorage";
import { get_scenario_adds, subscribe_to_scenarios } from "@/lib/storage/modelScenarios";
import { get_group_options } from "@/lib/storage/costAllocationStorage";
import { group_name_map } from "@/lib/calculations/scenarioAddForm";
import { build_scenario_cost_summary } from "@/lib/calculations/scenarioCostSummary";

const NO_ITEMS = Object.freeze([]);
const NO_GROUPS = Object.freeze([]);

export default function useScenarioCostSummary() {
  const [active, set_active] = useState(false);
  const [adds, set_adds] = useState(NO_ITEMS);
  const [groups, set_groups] = useState(NO_GROUPS);

  useEffect(() => {
    const model = get_mode() === "model";
    set_active(model);
    if (!model) return undefined;

    function refresh() {
      set_adds(get_scenario_adds().adds);
    }

    refresh();
    set_groups(get_group_options());
    return subscribe_to_scenarios(refresh);
  }, []);

  const summary = useMemo(() => build_scenario_cost_summary(adds, group_name_map(groups)), [adds, groups]);

  return { active, summary };
}
