"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { buildSourceRows } from "@/lib/calculations/businessModellingSourceRows";
import { applyAdditiveLevers } from "@/lib/calculations/businessModellingAdditiveModel";
import {
  readModellingLevers,
  writeModellingLevers,
  clearModellingLevers,
} from "@/lib/storage/businessModellingLeverStorage";

// Business Modelling levers (v6.0 redesign, step 2). Owns lever STATE only;
// all maths lives in the two pure calculation files. Takes per_source as a
// parameter (from useBusinessModelling) so there is no extra call to the
// large Business Outcome hook. Modelled net profit = today's real headline
// + the additive effect of only the rows touched (decision D-view).
//
// Persistence: levers are read in the lazy initial state (see below), so the
// first save can never overwrite stored levers with an empty object. Stale row ids (a row that no longer
// exists) are ignored in the calculation and dropped from storage once the
// row list is known.
export default function useBusinessModellingLevers(per_source) {
  // Lazy initial state: storage is read synchronously before the first save
  // can run, so the empty initial state can never overwrite stored levers.
  // Server render gets {} (no window); the page shows a placeholder until
  // mounted, so nothing rendered can mismatch.
  const [levers, set_levers] = useState(() => readModellingLevers());

  const source = useMemo(() => buildSourceRows(per_source), [per_source]);

  // Stable string so the save effect does not re-run on every render.
  const row_ids_key = source.available ? source.rows.map((r) => r.row_id).join("|") : "";

  const effective_levers = useMemo(() => {
    if (!source.available) return {};
    const ids = new Set(source.rows.map((r) => r.row_id));
    const out = {};
    Object.entries(levers).forEach(([key, value]) => {
      if (ids.has(key)) out[key] = value;
    });
    return out;
  }, [levers, source]);

  useEffect(() => {
    if (row_ids_key === "") {
      writeModellingLevers(levers);
      return;
    }
    const ids = new Set(row_ids_key.split("|"));
    const pruned = {};
    Object.entries(levers).forEach(([key, value]) => {
      if (ids.has(key)) pruned[key] = value;
    });
    writeModellingLevers(pruned);
  }, [levers, row_ids_key]);

  const model = useMemo(
    () =>
      source.available
        ? applyAdditiveLevers(source.rows, effective_levers, source.today_net_profit)
        : null,
    [source, effective_levers]
  );

  const setLever = useCallback((row_id, value) => {
    const text = String(value ?? "");
    set_levers((previous) => {
      const next = { ...previous };
      if (text.trim() === "") {
        delete next[row_id];
      } else {
        next[row_id] = text;
      }
      return next;
    });
  }, []);

  const clearLever = useCallback((row_id) => {
    set_levers((previous) => {
      const next = { ...previous };
      delete next[row_id];
      return next;
    });
  }, []);

  const resetLevers = useCallback(() => {
    set_levers({});
    clearModellingLevers();
  }, []);

  return {
    available: source.available === true,
    rows: source.rows,
    real_revenue: source.real_revenue ?? null,
    achieved_total: source.achieved_total ?? null,
    levers: effective_levers,
    effects: model?.effects ?? {},
    ignored: model?.ignored ?? [],
    today_net_profit: model?.today_net_profit ?? null,
    total_effect: model?.total_effect ?? 0,
    modelled_net_profit: model?.modelled_net_profit ?? null,
    setLever,
    clearLever,
    resetLevers,
  };
}