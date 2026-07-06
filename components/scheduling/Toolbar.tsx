"use client";

import type { ScheduleRowType } from "@/lib/calculations/schedulingCalculations";

type ToolbarProps = {
  toolbar: {
    view_mode: "day" | "week" | "month";
    show_notes?: boolean;
  };
  actions: {
    addRow: (row_type: ScheduleRowType) => void;
    setViewMode: (mode: "day" | "week" | "month") => void;
    setFilterType?: (type: "all" | ScheduleRowType) => void;
    setShowNotes?: (show: boolean) => void;
    saveNow: () => void;
  };
};

export default function Toolbar({ toolbar, actions }: ToolbarProps) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-split">
          <div>
            <p className="ui-kicker">Programme controls</p>
            <h2>Build schedule</h2>
            <p className="ui-help">
              Add rows directly and edit the programme inline.
            </p>
          </div>

          <div className="ui-actions">
            <button className="ui-button-secondary" onClick={() => actions.addRow("J")}>
              Add job
            </button>
            <button className="ui-button-secondary" onClick={() => actions.addRow("T")}>
              Add task
            </button>
            <button className="ui-button-primary" onClick={() => actions.addRow("T")}>
              Add task
            </button>
            <button
          className="ui-button-secondary"
          onClick={() => actions.addRow("M")}
        >
          Add milestone
        </button>

        <button
          className="ui-button-secondary"
          onClick={() => actions.addRow("D")}
        >
          Add delivery
        </button>
            <button className="ui-button-secondary" onClick={actions.saveNow}>
              Save
            </button>
          </div>
        </div>

        <div className="ui-actions">
          <span className="ui-kicker">View mode</span>
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              className={
                toolbar.view_mode === mode
                  ? "ui-button-primary"
                  : "ui-button-secondary"
              }
              onClick={() => actions.setViewMode(mode)}
            >
              {mode}
            </button>
          ))}
          <span className="ui-help">Colour by project</span>
        </div>
      </div>
    </section>
  );
}



