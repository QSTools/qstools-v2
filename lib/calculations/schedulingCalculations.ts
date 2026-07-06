export type ScheduleRowType = "J" | "T" | "M" | "D";

export type ScheduleStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "blocked"
  | "on_hold";

export type ScheduleTask = {
  task_id: string;
  job_id?: string;
  schedule_id: number;
  project_id?: string;
  stage_id?: string;

  project_name?: string;
  task_name: string;
  description?: string;
  notes?: string;
  role?: string;
  team?: string;
  dependency_id?: number | "";
  dependency_type?: "FS" | "SS" | "FF" | "SF" | "";
  dependency_lag_days?: number;
  manual_start_date?: string;
  manual_end_date?: string;
  milestone_date?: string;
  auto_start_date?: string;
  auto_end_date?: string;
  work_days?: number;
  percent_complete?: number;
  row_type: ScheduleRowType;

  start_date: string;
  end_date?: string;

  duration_days?: number;
  progress_percent: number;

  dependency_task_ids: string[];
  status: ScheduleStatus;

  project_index?: number;
  row_level?: number;
};

export type GanttRow = ScheduleTask & {
  duration_days: number;
  is_milestone: boolean;
  left_percent: number;
  width_percent: number;
  project_index: number;
  row_level: number;
};

export type SchedulingTimeline = {
  timeline_start: string;
  timeline_end: string;
  timeline_days: number;
};

export type SchedulingCalculationResult = {
  timeline: SchedulingTimeline;
  gantt_rows: GanttRow[];
  warnings: string[];
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDate(value?: string): Date | null {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function getTaskDateRange(tasks: ScheduleTask[]): {
  min_date: Date;
  max_date: Date;
  warnings: string[];
} {
  const warnings: string[] = [];
  const valid_dates: Date[] = [];

  tasks.forEach((task) => {
    const start = parseDate(task.start_date);
    const end = parseDate(task.end_date || task.start_date);

    if (!start) {
      warnings.push(`${task.task_name || "Untitled row"} is missing a valid start date.`);
      return;
    }

    if (!end) {
      warnings.push(`${task.task_name || "Untitled row"} has an invalid end date.`);
      return;
    }

    valid_dates.push(start);
    valid_dates.push(end);
  });

  if (valid_dates.length === 0) {
    const today = new Date();
    return {
      min_date: today,
      max_date: addDays(today, 28),
      warnings,
    };
  }

  const min_time = Math.min(...valid_dates.map((date) => date.getTime()));
  const max_time = Math.max(...valid_dates.map((date) => date.getTime()));

  return {
    min_date: new Date(min_time),
    max_date: new Date(max_time),
    warnings,
  };
}

function getProjectIndexMap(tasks: ScheduleTask[]): Map<string, number> {
  const map = new Map<string, number>();
  let index = 0;

  tasks.forEach((task) => {
    const key = task.project_id || task.project_name || task.task_id;

    if (!map.has(key)) {
      map.set(key, index);
      index += 1;
    }
  });

  return map;
}

function getRowLevel(task: ScheduleTask): number {
  if (task.row_type === "J") return 0;
  if (false) return 1;
  return 2;
}

export function calculateScheduling(tasks: ScheduleTask[]): SchedulingCalculationResult {
  const warnings: string[] = [];
  const project_index_map = getProjectIndexMap(tasks);
  const range = getTaskDateRange(tasks);

  warnings.push(...range.warnings);

  const padded_start = addDays(range.min_date, -2);
  const padded_end = addDays(range.max_date, 7);

  const timeline_days = Math.max(daysBetween(padded_start, padded_end), 1);

  const gantt_rows: GanttRow[] = tasks.map((task) => {
    const is_milestone = task.row_type === "M";
    const start = parseDate(task.start_date);
    const fallback_end = is_milestone ? task.start_date : task.end_date || task.start_date;
    const end = parseDate(fallback_end);

    const project_key = task.project_id || task.project_name || task.task_id;
    const project_index = project_index_map.get(project_key) ?? 0;

    if (!start || !end) {
      return {
        ...task,
        duration_days: 0,
        is_milestone,
        left_percent: 0,
        width_percent: is_milestone ? 0 : 2,
        project_index,
        row_level: getRowLevel(task),
        progress_percent: clampPercent(task.progress_percent),
      };
    }

    const raw_duration = is_milestone ? 0 : Math.max(daysBetween(start, end) + 1, 1);
    const left_days = Math.max(daysBetween(padded_start, start), 0);
    const width_days = is_milestone ? 0 : Math.max(raw_duration, 1);

    return {
      ...task,
      duration_days: raw_duration,
      is_milestone,
      left_percent: clampPercent((left_days / timeline_days) * 100),
      width_percent: is_milestone
        ? 0
        : Math.max((width_days / timeline_days) * 100, 1.2),
      project_index,
      row_level: getRowLevel(task),
      progress_percent: clampPercent(task.progress_percent),
    };
  });

  return {
    timeline: {
      timeline_start: toDateInputValue(padded_start),
      timeline_end: toDateInputValue(padded_end),
      timeline_days,
    },
    gantt_rows,
    warnings,
  };
}





