"use client";

import GanttRowView from "@/components/scheduling/gantt/GanttRowView";
import GanttTimelineHeader from "@/components/scheduling/gantt/GanttTimelineHeader";
import {
  DAY_COLUMN_WIDTH,
  LEFT_TABLE_WIDTH,
  NOTES_COLUMN_WIDTH,
  RESTORE_NOTES_COLUMN_WIDTH,
} from "@/components/scheduling/gantt/ganttConstants";
import { getTimelineColumns } from "@/components/scheduling/gantt/ganttTimeline";
import type { GanttChartProps } from "@/components/scheduling/gantt/ganttTypes";

export default function GanttChart({ gantt, actions }: GanttChartProps) {
  const timeline_columns = getTimelineColumns(
    gantt.timeline_start,
    gantt.timeline_days,
    gantt.view_mode
  );

  const timeline_width = Math.max(
    timeline_columns.length * DAY_COLUMN_WIDTH,
    900
  );

  const timeline_grid_template = `repeat(${timeline_columns.length}, ${DAY_COLUMN_WIDTH}px)`;

  const left_table_width = gantt.show_notes
    ? LEFT_TABLE_WIDTH + NOTES_COLUMN_WIDTH
    : LEFT_TABLE_WIDTH + RESTORE_NOTES_COLUMN_WIDTH;

  const left_grid_template = gantt.show_notes
    ? `40px 48px 360px ${NOTES_COLUMN_WIDTH}px 64px 110px 86px 86px 56px 150px 64px 56px 74px 80px 80px`
    : `40px 48px 360px ${RESTORE_NOTES_COLUMN_WIDTH}px 64px 110px 86px 86px 56px 150px 64px 56px 74px 80px 80px`;

  return (
    <section className="schedule-board">
      <datalist id="schedule-description-options">
        {(gantt.saved_descriptions || []).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>

      <datalist id="schedule-role-options">
        {(gantt.saved_roles || []).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>

      <datalist id="schedule-team-options">
        {(gantt.saved_teams || []).map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>

      <div className="schedule-board-scroll">
        <div
          className="schedule-grid"
          style={{
            gridTemplateColumns: `${left_table_width}px ${timeline_width}px`,
            minWidth: `${left_table_width + timeline_width}px`,
          }}
        >
          <div
            className="schedule-left-header"
            style={{ gridTemplateColumns: left_grid_template }}
          >
            <div>ID</div>
            <div>Type</div>
            <div>Description</div>

            {gantt.show_notes ? (
              <button
                className="schedule-header-button"
                type="button"
                title="Hide notes column"
                onClick={() => actions?.setShowNotes?.(false)}
              >
                Notes
              </button>
            ) : (
              <button
                className="schedule-header-plus-button"
                type="button"
                title="Show notes column"
                onClick={() => actions?.setShowNotes?.(true)}
              >
                +
              </button>
            )}

            <div>Role</div>
            <div>Team</div>
            <div>Ind Start</div>
            <div>Ind End</div>
            <div>Depends On</div>
            <div>D. Item</div>
            <div>D. Conn</div>
            <div>D. Lag</div>
            <div>Work Days</div>
            <div>Start</div>
            <div>End</div>
          </div>

          <GanttTimelineHeader
            timeline_columns={timeline_columns}
            timeline_grid_template={timeline_grid_template}
            timeline_width={timeline_width}
          />

          {gantt.visible_rows.map((row, index) => (
            <GanttRowView
              key={row.task_id}
              row={row}
              index={index}
              gantt={gantt}
              actions={actions}
              left_grid_template={left_grid_template}
              timeline_columns={timeline_columns}
              timeline_grid_template={timeline_grid_template}
              timeline_width={timeline_width}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
