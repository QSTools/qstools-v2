"use client";

// R3 slice 4 batch C3a (Business Modelling brief, Addendum 30). The controls behind the scenario ADD panel on Labour and Assets: the list of added items of one
// kind, the working groups to choose from, and the add / copy / remove actions. It adds nothing to the calculation hooks (useLabour, useAssets,
// useCostAllocation already read the adds themselves), and it writes nothing itself: every write goes through modelScenarios.js, which writes only
// mirra_scenarios_v1 and only in Model mode with a locked baseline. In baseline mode it reads no storage and active stays false.
// State is read after mount so the first render matches the server (same pattern as useLabour / useAssets).

import { useEffect, useMemo, useState } from "react";

import { get_mode } from "@/lib/storage/modelStorage";
import {
  get_scenario_adds,
  add_scenario_add,
  copy_scenario_add,
  remove_scenario_add,
  subscribe_to_scenarios,
} from "@/lib/storage/modelScenarios";
import { get_group_options } from "@/lib/storage/costAllocationStorage";
import { group_name_map } from "@/lib/calculations/scenarioAddForm";

const NO_ITEMS = Object.freeze([]);
const NO_FLAGS = Object.freeze({});
const NO_GROUPS = Object.freeze([]);

export default function useScenarioAddControls(kind) {
  const [active, set_active] = useState(false);
  const [items, set_items] = useState(NO_ITEMS);
  const [flags, set_flags] = useState(NO_FLAGS);
  const [groups, set_groups] = useState(NO_GROUPS);

  useEffect(() => {
    const model = get_mode() === "model";
    set_active(model);
    if (!model) return undefined;

    function refresh() {
      const adds = get_scenario_adds();
      set_items(adds.adds.filter((add) => add.kind === kind));
      set_flags(adds.flags);
    }

    refresh();
    set_groups(get_group_options());
    return subscribe_to_scenarios(refresh);
  }, [kind]);

  const group_names = useMemo(() => group_name_map(groups), [groups]);

  return {
    active,
    items,
    flags,
    groups,
    group_names,
    add: (input) => add_scenario_add(input),
    copy: (id, n) => copy_scenario_add(id, n),
    remove: (id) => remove_scenario_add(id),
  };
}
