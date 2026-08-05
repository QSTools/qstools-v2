import type {
  GanttRow,
  ScheduleRowType,
} from "@/components/scheduling/gantt/ganttTypes";

export function normaliseRowType(value: unknown): ScheduleRowType {
  const raw = String(value || "").toLowerCase();

  if (raw === "j" || raw === "project") return "J";
  if (raw === "m" || raw === "milestone") return "M";
  if (raw === "d" || raw === "delivery") return "D";
  return "T";
}

export function getRowClass(row: GanttRow): string {
  const row_type = normaliseRowType(row.row_type);

  if (row_type === "J") return "is-project-row";
  if (row_type === "M") return "is-milestone-row";
  if (row_type === "D") return "is-delivery-row";
  return "";
}

export function getBarClass(row: GanttRow, index: number): string {
  const row_type = normaliseRowType(row.row_type);
  const classes = ["schedule-bar"];

  if (row_type === "J") classes.push("is-project-bar");
  if (index >= 15) classes.push("is-future-bar");

  return classes.join(" ");
}

export function getJobWorkDays(rows: GanttRow[], rowIndex: number): number {
  const row = rows[rowIndex];

  if (!row || row.row_type !== "J") return Number(row?.work_days || 0);

  let total = 0;

  for (let index = rowIndex + 1; index < rows.length; index += 1) {
    const child = rows[index];

    if (child.row_type === "J") break;

    total += Number(child.work_days || 0);
  }

  return total;
}

export function getDependencyLabel(rows: GanttRow[], row: GanttRow, rowIndex: number): string {
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

function getOpenWeekdays(open_weekdays?: number[]): number[] {
  return open_weekdays && open_weekdays.length > 0 ? open_weekdays : [1, 2, 3, 4, 5];
}

function isOpenWeekday(date: Date, open_weekdays?: number[]): boolean {
  return getOpenWeekdays(open_weekdays).includes(date.getDay());
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function normaliseToOpenDay(value: string, open_weekdays?: number[]): string {
  if (!value) return "";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  let guard = 0;

  while (!isOpenWeekday(date, open_weekdays) && guard < 14) {
    date.setDate(date.getDate() + 1);
    guard += 1;
  }

  return formatLocalDate(date);
}

function addScheduleDays(value: string, days: number, open_weekdays?: number[]): string {
  if (!value) return "";

  const date = new Date(`${normaliseToOpenDay(value, open_weekdays)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  if (days <= 0) return formatLocalDate(date);

  let remaining = days;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);

    if (isOpenWeekday(date, open_weekdays)) {
      remaining -= 1;
    }
  }

  return formatLocalDate(date);
}

export function getCalculatedStartDate(rows: GanttRow[], row: GanttRow, open_weekdays?: number[]): string {
  if (row.manual_start_date) return row.manual_start_date;

  if (!row.dependency_id) {
    return row.auto_start_date || row.start_date || "";
  }

  const dependency = rows.find(
    (candidate) => Number(candidate.schedule_id) === Number(row.dependency_id)
  );

  if (!dependency) {
    return row.auto_start_date || row.start_date || "";
  }

  const dependencyStart = getCalculatedStartDate(rows, dependency, open_weekdays);
  const dependencyEnd = getCalculatedEndDate(rows, dependency, open_weekdays);
  const lag = Number(row.dependency_lag_days || 0);
  const connection = row.dependency_type || "FS";

  if (connection === "SS") return addScheduleDays(dependencyStart, lag, open_weekdays);
  if (connection === "FF") return addScheduleDays(dependencyEnd, lag, open_weekdays);
  if (connection === "SF") return addScheduleDays(dependencyStart, lag, open_weekdays);

  return addScheduleDays(dependencyEnd, lag + 1, open_weekdays);
}

export function getCalculatedEndDate(rows: GanttRow[], row: GanttRow, open_weekdays?: number[]): string {
  if (row.manual_end_date) return row.manual_end_date;

  const start = getCalculatedStartDate(rows, row, open_weekdays);
  if (!start) return "";

  if (row.row_type === "M" || row.row_type === "D") return start;

  const workDays = Math.max(Number(row.work_days || row.duration_days || 0), 0);
  if (workDays <= 0) return start;

  return addScheduleDays(start, workDays - 1, open_weekdays);
}

export function formatScheduleDisplayDate(value?: string): string {
  if (!value) return "";

  const parts = value.split("-");
  if (parts.length !== 3) return value;

  return `${parts[2]}/${parts[1]}`;
}

export function toInputDate(value?: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}
