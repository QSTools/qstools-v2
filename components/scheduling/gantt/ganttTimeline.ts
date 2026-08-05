import { DAY_COLUMN_WIDTH, MS_PER_DAY } from "@/components/scheduling/gantt/ganttConstants";
import { normaliseRowType } from "@/components/scheduling/gantt/ganttRows";
import type {
  GanttRow,
  TimelineColumn,
  ViewMode,
} from "@/components/scheduling/gantt/ganttTypes";

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

export function getTimelineColumns(
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

export function getPixelPosition(
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

export function getPixelWidth(row: GanttRow, view_mode: ViewMode): number {
  const row_type = normaliseRowType(row.row_type);

  if (row_type === "M" || row_type === "D" || row.is_milestone) return 0;

  const step = view_mode === "month" ? 7 : 1;
  const duration = Number(row.work_days || row.duration_days || 1);

  return Math.max((duration / step) * DAY_COLUMN_WIDTH, 6);
}
