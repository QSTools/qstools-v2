import type {
  GanttChartProps,
  GanttRow,
  ScheduleRowType,
  TimelineColumn,
} from "@/components/scheduling/gantt/ganttTypes";
import { handleScheduleCellKeyDown } from "@/components/scheduling/gantt/ganttKeyboard";
import {
  formatScheduleDisplayDate,
  getBarClass,
  getCalculatedEndDate,
  getCalculatedStartDate,
  getDependencyLabel,
  getJobWorkDays,
  getRowClass,
  normaliseRowType,
  toInputDate,
} from "@/components/scheduling/gantt/ganttRows";
import {
  getPixelPosition,
  getPixelWidth,
} from "@/components/scheduling/gantt/ganttTimeline";

type GanttRowViewProps = {
  row: GanttRow;
  index: number;
  gantt: GanttChartProps["gantt"];
  actions: GanttChartProps["actions"];
  left_grid_template: string;
  timeline_columns: TimelineColumn[];
  timeline_grid_template: string;
  timeline_width: number;
};

export default function GanttRowView({
  row,
  index,
  gantt,
  actions,
  left_grid_template,
  timeline_columns,
  timeline_grid_template,
  timeline_width,
}: GanttRowViewProps) {
  const row_type = normaliseRowType(row.row_type);
  const row_class = getRowClass(row);
  const start_date = row.auto_start_date || row.start_date;

  const bar_left = getPixelPosition(
    gantt.timeline_start,
    start_date,
    gantt.view_mode
  );

  const bar_width = getPixelWidth(row, gantt.view_mode);

  return (
    <div className="schedule-row" key={row.task_id}>
      <div
        className={`schedule-left-row ${row_class}`}
        style={{ gridTemplateColumns: left_grid_template }}
      >
        <div className="schedule-cell schedule-id-cell">
          {row.schedule_id || index + 1}
        </div>

        <div className="schedule-cell schedule-type-cell">
          <select
            className="schedule-inline-select"
            data-schedule-row={index}
            data-schedule-col={0}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 0)
            }
            value={row_type}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                row_type: event.target.value as ScheduleRowType,
              })
            }
          >
            <option value="J">J</option>
            <option value="T">T</option>
            <option value="M">M</option>
            <option value="D">D</option>
          </select>
        </div>

        <div className="schedule-cell schedule-description-cell">
          <input
            className="schedule-inline-input is-description"
            list="schedule-description-options"
            data-schedule-row={index}
            data-schedule-col={1}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 1)
            }
            value={row.description ?? row.task_name ?? ""}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                description: event.target.value,
                task_name: event.target.value,
              })
            }
          />
        </div>

        {gantt.show_notes ? (
          <div className="schedule-cell schedule-notes-cell">
            <input
              className="schedule-inline-input"
              data-schedule-row={index}
              data-schedule-col={2}
              onKeyDown={(event) =>
                handleScheduleCellKeyDown(event, index, 2)
              }
              value={row.notes || ""}
              onChange={(event) =>
                actions?.updateTask?.(row.task_id, {
                  notes: event.target.value,
                })
              }
            />
          </div>
        ) : (
          <div className="schedule-cell schedule-notes-restore-cell">
            <button
              className="schedule-row-plus-button"
              type="button"
              title="Show notes column"
              onClick={() => actions?.setShowNotes?.(true)}
            >
              +
            </button>
          </div>
        )}

        <div className="schedule-cell schedule-role-cell">
          <input
            className="schedule-inline-input"
            list="schedule-role-options"
            data-schedule-row={index}
            data-schedule-col={3}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 3)
            }
            value={row.role || ""}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                role: event.target.value,
              })
            }
          />
        </div>

        <div className="schedule-cell schedule-team-cell">
          <input
            className="schedule-inline-input"
            list="schedule-team-options"
            data-schedule-row={index}
            data-schedule-col={4}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 4)
            }
            value={row.team || ""}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                team: event.target.value,
              })
            }
          />
        </div>

        <div className="schedule-cell schedule-date-cell">
          <input
            className="schedule-inline-date"
            data-schedule-row={index}
            data-schedule-col={5}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 5)
            }
            type="date"
            value={toInputDate(row.manual_start_date)}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                manual_start_date: event.target.value,
                start_date: event.target.value,
                auto_start_date: event.target.value,
                milestone_date:
                  row_type === "M" || row_type === "D"
                    ? event.target.value
                    : row.milestone_date,
              })
            }
          />
        </div>

        <div className="schedule-cell schedule-date-cell">
          <input
            className="schedule-inline-date"
            data-schedule-row={index}
            data-schedule-col={6}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 6)
            }
            type="date"
            value={row_type === "J" ? "" : toInputDate(row.manual_end_date)}
            disabled={row_type === "J"}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                manual_end_date: event.target.value,
                end_date: event.target.value,
                auto_end_date: event.target.value,
              })
            }
          />
        </div>

        <div className="schedule-cell schedule-dependency-id-cell">
          <input
            className="schedule-inline-input is-number"
            data-schedule-row={index}
            data-schedule-col={7}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 7)
            }
            type="number"
            min="0"
            value={row_type === "J" ? "" : row.dependency_id || ""}
            disabled={row_type === "J"}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                dependency_id: event.target.value === "" ? "" : Number(event.target.value),
              })
            }
          />
        </div>

        <div className="schedule-cell schedule-dependency-item-cell">
          {row_type === "J" ? "" : getDependencyLabel(gantt.visible_rows, row, index)}
        </div>

        <div className="schedule-cell schedule-dependency-conn-cell">
          <select
            className="schedule-inline-select"
            data-schedule-row={index}
            data-schedule-col={8}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 8)
            }
            value={row_type === "J" ? "" : row.dependency_type || "FS"}
            disabled={row_type === "J"}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                dependency_type: event.target.value as "FS" | "SS" | "FF" | "SF",
              })
            }
          >
            <option value=""></option>
            <option value="FS">FS</option>
            <option value="SS">SS</option>
            <option value="FF">FF</option>
            <option value="SF">SF</option>
          </select>
        </div>

        <div className="schedule-cell schedule-dependency-lag-cell">
          <input
            className="schedule-inline-input is-number"
            data-schedule-row={index}
            data-schedule-col={9}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 9)
            }
            type="number"
            value={row_type === "J" ? "" : row.dependency_lag_days ?? 0}
            disabled={row_type === "J"}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                dependency_lag_days: Number(event.target.value) || 0,
              })
            }
          />
        </div>

        <div className="schedule-cell schedule-days-cell">
          <input
            className="schedule-inline-input is-number"
            data-schedule-row={index}
            data-schedule-col={10}
            onKeyDown={(event) =>
              handleScheduleCellKeyDown(event, index, 10)
            }
            type="number"
            min="0"
            value={row_type === "J" ? getJobWorkDays(gantt.visible_rows, index) : row.work_days ?? row.duration_days ?? 0}
            disabled={row_type === "J"}
            onChange={(event) =>
              actions?.updateTask?.(row.task_id, {
                work_days: Number(event.target.value) || 0,
                duration_days: Number(event.target.value) || 0,
              })
            }
          />
        </div>

        <div className="schedule-cell schedule-date-cell">
          <span className="schedule-calculated-date">
            {formatScheduleDisplayDate(getCalculatedStartDate(gantt.visible_rows, row, gantt.open_weekdays))}
          </span>
        </div>

        <div className="schedule-cell schedule-date-cell">
          <span className="schedule-calculated-date">
            {formatScheduleDisplayDate(getCalculatedEndDate(gantt.visible_rows, row, gantt.open_weekdays))}
          </span>
        </div>
      </div>

      <div
        className={`schedule-gantt-row ${row_class}`}
        style={{ width: `${timeline_width}px` }}
      >
        <div
          className="schedule-gantt-grid"
          style={{ gridTemplateColumns: timeline_grid_template }}
        >
          {timeline_columns.map((column, columnIndex) => (
            <span
              key={`grid-${row.task_id}-${column.day_offset}-${columnIndex}`}
              className={
                column.is_week_start
                  ? "schedule-grid-cell is-week-start"
                  : "schedule-grid-cell"
              }
            />
          ))}
        </div>

        {row_type === "D" ? (
          <div
            className="schedule-delivery-marker"
            style={{ left: `${bar_left}px` }}
            title={row.description || row.task_name}
          />
        ) : row_type === "M" || row.is_milestone ? (
          <div
            className="schedule-milestone"
            style={{ left: `${bar_left}px` }}
            title={row.description || row.task_name}
          />
        ) : (
          <div
            className={getBarClass(row, index)}
            style={{
              left: `${bar_left}px`,
              width: `${bar_width}px`,
            }}
            title={row.description || row.task_name}
          />
        )}
      </div>
    </div>
  );
}
