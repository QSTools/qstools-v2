"use client";

// R3 slice 3, batch 3 (Business Modelling brief, Addendum 8 item 6; Addendum 18 slice 3 items 1 to 6). The overhead what-if panel: one percentage
// field per overhead category, shown ONLY in Model mode. It reads and saves nothing itself: the hook passes in `modelling`
// ({ active, nudges, by_category, set_nudge }) and set_nudge writes the difference through lib/storage/modelDiffs.js.
// Typing is debounced: the change is applied after a pause (PAUSE_MS) or when the field loses focus, never on every key press (Addendum 18 item 11).
// Shows no calculated figure of its own (the figures stay on the existing summary and Business Outcome, which already have trace nodes).
// Wording is a draft until the owner approves it in batch 5. Styling uses the existing styles/ui-system.css classes only. No inline colours.

import { useEffect, useRef, useState } from "react";
import { CATEGORY_DEFINITIONS } from "@/lib/selectors/general-overheads/generalOverheadDefinitions";

const PAUSE_MS = 600;

const NOTES = {
  orphan: "This category has no lines the change can apply to, so it has no effect.",
  baseline_changed: "The baseline was corrected after this change was set. Check that it still makes sense.",
};

function NudgeRow({ category, nudge, orphan, set_nudge }) {
  const [text, setText] = useState(nudge ? String(nudge.pct) : "");
  const [message, setMessage] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (value) => {
    clearTimeout(timer.current);
    const trimmed = String(value).trim();
    const result = set_nudge(category.key, trimmed === "" ? 0 : trimmed);
    setMessage(result.ok ? "" : result.message);
  };

  const on_change = (event) => {
    const value = event.target.value;
    setText(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(value), PAUSE_MS);
  };

  return (
    <div className="ui-stack-sm">
      <label className="ui-field">
        <span className="ui-label">{category.label} (%)</span>
        <input
          type="number"
          step="any"
          inputMode="decimal"
          className="ui-input"
          value={text}
          placeholder="0"
          onChange={on_change}
          onBlur={() => commit(text)}
        />
      </label>
      {nudge && orphan ? <p className="ui-help">{NOTES.orphan}</p> : null}
      {nudge && nudge.flag === "baseline_changed" ? <p className="ui-help">{NOTES.baseline_changed}</p> : null}
      {message ? <p className="ui-help" role="status">{message}</p> : null}
    </div>
  );
}

export default function GeneralOverheadNudgePanel({ modelling }) {
  if (!modelling || modelling.active !== true) return null;

  const nudges = modelling.nudges || {};
  const by_category = modelling.by_category || {};

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Model mode</div>
      <div className="ui-card-title-sm">Overhead what-if</div>
      <p className="ui-help">
        Enter a percentage to raise or lower a whole overhead category, for example 5 for 5 percent more or -10 for 10 percent less. Your real data and
        your baseline are not changed. Lines already split out to assets, and asset finance interest, are left as they are.
      </p>
      {CATEGORY_DEFINITIONS.map((category) => (
        <NudgeRow
          key={category.key}
          category={category}
          nudge={nudges[category.key]}
          orphan={by_category[category.key] ? by_category[category.key].orphan === true : false}
          set_nudge={modelling.set_nudge}
        />
      ))}
    </div>
  );
}
