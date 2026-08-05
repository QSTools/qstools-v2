import type {
  GanttRow,
  ScheduleTask,
} from "@/lib/calculations/schedulingCalculations";

export type {
  GanttRow,
  ScheduleRowType,
  ScheduleTask,
} from "@/lib/calculations/schedulingCalculations";

export type ViewMode = "day" | "week" | "month";

export type GanttChartProps = {
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
    open_weekdays?: number[];
  };
  actions?: {
    updateTask?: (task_id: string, patch: Partial<ScheduleTask>) => void;
    deleteTask?: (task_id: string) => void;
    moveTask?: (task_id: string, direction: "up" | "down") => void;
    setShowNotes?: (show: boolean) => void;
  };
};

export type TimelineColumn = {
  day_offset: number;
  day_label: string;
  date_label: string;
  is_week_start: boolean;
};
