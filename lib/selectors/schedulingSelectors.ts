import type {
  GanttRow,
  ScheduleTask,
  SchedulingCalculationResult,
} from "@/lib/calculations/schedulingCalculations";

export type SchedulingStatus = {
  task_count: number;
  project_count: number;
  milestone_count: number;
  warning_count: number;
  warnings: string[];
};

export type SchedulingToolbarModel = {
  view_mode: "day" | "week" | "month";
};

export type SchedulingGanttModel = {
  visible_rows: GanttRow[];
  timeline_start: string;
  timeline_end: string;
  timeline_days: number;
  warnings: string[];
};

export function buildSchedulingStatus(
  tasks: ScheduleTask[],
  calculation: SchedulingCalculationResult
): SchedulingStatus {
  const project_names = new Set(
    tasks
      .filter((task) => task.row_type === "J")
      .map((task) => task.project_name || task.task_name)
  );

  return {
    task_count: tasks.length,
    project_count: project_names.size,
    milestone_count: tasks.filter((task) => task.row_type === "M").length,
    warning_count: calculation.warnings.length,
    warnings: calculation.warnings,
  };
}

export function buildSchedulingGanttModel(
  calculation: SchedulingCalculationResult
): SchedulingGanttModel {
  return {
    visible_rows: calculation.gantt_rows,
    timeline_start: calculation.timeline.timeline_start,
    timeline_end: calculation.timeline.timeline_end,
    timeline_days: calculation.timeline.timeline_days,
    warnings: calculation.warnings,
  };
}
