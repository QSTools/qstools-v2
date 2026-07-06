"use client";

import type { KeyboardEvent } from "react";

import type {
  GanttRow,
  ScheduleRowType,
  ScheduleTask,
} from "@/lib/calculations/schedulingCalculations";

type ViewMode = "day" | "week" | "month";

type GanttChartProps = {
  gantt: {
    visible_rows: GanttRow[];
    timeline_start: string;
    timeline_end: string;
    timeline_days: number;
    view_mode: ViewMode;
    warnings: string[];
    show_notes?: boolean;
    saved_descriptions?: string[];
    saved_roles?: string[];
    saved_teams?: string[];
  };
  actions?: {
    updateTask?: (task_id: string, patch: Partial<ScheduleTask>) => void;
    deleteTask?: (task_id: string) => void;
    moveTask?: (task_id: string, direction: "up" | "down") => void;
    setShowNotes?: (show: boolean) => void;
  };
};

type TimelineColumn = {
  day_offset: number;
  day_label: string;
  date_label: string;
  is_week_start: boolean;
};

const DAY_COLUMN_WIDTH = 34;
const LEFT_TABLE_WIDTH = 1330;
const NOTES_COLUMN_WIDTH = 220;
const RESTORE_NOTES_COLUMN_WIDTH = 34;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
  });
}

function getDayLetter(date: Date): string {
  const day = date.getDay();

  if (day === 0) return "S";
  if (day === 1) return "M";
  if (day === 2) return "T";
  if (day === 3) return "W";
  if (day === 4) return "T";
  if (day === 5) return "F";
  return "S";
}

function normaliseRowType(value: unknown): ScheduleRowType {
  const raw = String(value || "").toLowerCase();

  if (raw === "j" || raw === "project") return "J";
  if (raw === "m" || raw === "milestone") return "M";
  if (raw === "d" || raw === "delivery") return "D";
  return "T";
}

function getRowClass(row: GanttRow): string {
  const row_type = normaliseRowType(row.row_type);

  if (row_type === "J") return "is-project-row";
  if (row_type === "M") return "is-milestone-row";
  if (row_type === "D") return "is-delivery-row";
  return "";
}

function getTimelineColumns(
  timeline_start: string,
  timeline_days: number,
  view_mode: ViewMode
): TimelineColumn[] {
  const start = parseDate(timeline_start);
  const columns: TimelineColumn[] = [];
  const step = view_mode === "month" ? 7 : 1;

  for (let day = 0; day <= timeline_days; day += step) {
    const current = addDays(start, day);
    const is_week_start = current.getDay() === 1;

    columns.push({
      day_offset: day,
      day_label:
        view_mode === "month"
          ? formatHeaderDate(current)
          : getDayLetter(current),
      date_label: formatHeaderDate(current),
      is_week_start,
    });
  }

  return columns;
}

function getPixelPosition(
  timeline_start: string,
  row_date: string,
  view_mode: ViewMode
): number {
  const start = parseDate(timeline_start);
  const date = parseDate(row_date);
  const step = view_mode === "month" ? 7 : 1;
  const days = Math.max(daysBetween(start, date), 0);

  return (days / step) * DAY_COLUMN_WIDTH;
}

function getPixelWidth(row: GanttRow, view_mode: ViewMode): number {
  const row_type = normaliseRowType(row.row_type);

  if (row_type === "M" || row_type === "D" || row.is_milestone) return 0;

  const step = view_mode === "month" ? 7 : 1;
  const duration = Number(row.work_days || row.duration_days || 1);

  return Math.max((duration / step) * DAY_COLUMN_WIDTH, 6);
}

function getBarClass(row: GanttRow, index: number): string {
  const row_type = normaliseRowType(row.row_type);
  const classes = ["schedule-bar"];

  if (row_type === "J") classes.push("is-project-bar");
  if (index >= 15) classes.push("is-future-bar");

  return classes.join(" ");
}

function getDependencyLabel(rows: GanttRow[], row: GanttRow, rowIndex: number): string {
  const dependency_id = Number(row.dependency_id || 0);
  if (!dependency_id) return "";

  const dependency_index = rows.findIndex(
    (candidate) => Number(candidate.schedule_id) === dependency_id
  );

  if (dependency_index < 0) return "";

  const dependency = rows[dependency_index];
  const arrow = dependency_index < rowIndex ? "↑" : dependency_index > rowIndex ? "↓" : "→";
  const conn = row.dependency_type || "FS";
  const label = dependency.description || dependency.task_name || "Row";

  return `${arrow} ${conn} ${label.slice(0, 18)}`;
}

function toInputDate(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

function focusScheduleCell(rowIndex: number, colIndex: number): void {
  const selector = `[data-schedule-row="${rowIndex}"][data-schedule-col="${colIndex}"]`;
  const target = document.querySelector<HTMLElement>(selector);

  if (!target) return;

  target.focus();

  if (target instanceof HTMLInputElement) {
    target.select();
  }
}

function handleScheduleCellKeyDown(
  event: KeyboardEvent<HTMLElement>,
  rowIndex: number,
  colIndex: number
): void {
  if (
    event.key !== "Enter" &&
    event.key !== "ArrowUp" &&
    event.key !== "ArrowDown" &&
    event.key !== "ArrowLeft" &&
    event.key !== "ArrowRight"
  ) {
    return;
  }

  event.preventDefault();

  let nextRow = rowIndex;
  let nextCol = colIndex;

  if (event.key === "Enter" || event.key === "ArrowDown") nextRow += 1;
  if (event.key === "ArrowUp") nextRow -= 1;
  if (event.key === "ArrowRight") nextCol += 1;
  if (event.key === "ArrowLeft") nextCol -= 1;

  window.requestAnimationFrame(() => {
    focusScheduleCell(nextRow, nextCol);
  });
}

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

          <div
            className="schedule-right-header"
            style={{ width: `${timeline_width}px` }}
          >
            <div
              className="schedule-calendar-dates"
              style={{ gridTemplateColumns: timeline_grid_template }}
            >
              {timeline_columns.map((column, index) => (
                <div
                  key={`date-${column.day_offset}-${index}`}
                  className={
                    column.is_week_start
                      ? "schedule-calendar-date is-week-start"
                      : "schedule-calendar-date"
                  }
                >
                  <span className="schedule-calendar-date-text">
                    {column.date_label}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="schedule-calendar-days"
              style={{ gridTemplateColumns: timeline_grid_template }}
            >
              {timeline_columns.map((column, index) => (
                <div
                  key={`day-${column.day_offset}-${index}`}
                  className={
                    column.is_week_start
                      ? "schedule-calendar-day is-week-start"
                      : "schedule-calendar-day"
                  }
                >
                  {column.day_label}
                </div>
              ))}
            </div>
          </div>

          {gantt.visible_rows.map((row, index) => {
            const row_type = normaliseRowType(row.row_type);
            const row_class = getRowClass(row);
            const start_date = row.auto_start_date || row.start_date;
            const end_date = row.auto_end_date || row.end_date || row.start_date;

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
                      value={row.work_days ?? row.duration_days ?? 0}
                      onChange={(event) =>
                        actions?.updateTask?.(row.task_id, {
                          work_days: Number(event.target.value) || 0,
                          duration_days: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  <div className="schedule-cell schedule-date-cell">
                    <input
                      className="schedule-inline-date"
                      data-schedule-row={index}
                      data-schedule-col={11}
                      onKeyDown={(event) =>
                        handleScheduleCellKeyDown(event, index, 11)
                      }
                      type="date"
                      value={toInputDate(row.auto_start_date || row.start_date)}
                      onChange={(event) =>
                        actions?.updateTask?.(row.task_id, {
                          start_date: event.target.value,
                          manual_start_date: event.target.value,
                          auto_start_date: event.target.value,
                          milestone_date:
                            row_type === "M"
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
                      data-schedule-col={12}
                      onKeyDown={(event) =>
                        handleScheduleCellKeyDown(event, index, 12)
                      }
                      type="date"
                      value={toInputDate(row.auto_end_date || row.end_date)}
                      onChange={(event) =>
                        actions?.updateTask?.(row.task_id, {
                          end_date: event.target.value,
                          manual_end_date: event.target.value,
                          auto_end_date: event.target.value,
                        })
                      }
                    />
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
          })}
        </div>
      </div>
    </section>
  );
}






