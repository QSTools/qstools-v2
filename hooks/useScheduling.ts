"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateScheduling,
  type ScheduleRowType,
  type ScheduleTask,
} from "@/lib/calculations/schedulingCalculations";
import {
  buildSchedulingGanttModel,
  buildSchedulingStatus,
} from "@/lib/selectors/schedulingSelectors";
import {
  loadScheduleTasks,
  saveScheduleTasks,
} from "@/lib/storage/schedulingStorage";

type ViewMode = "day" | "week" | "month";
type FilterType = "all" | ScheduleRowType;

const DEFAULT_TEAM_SUGGESTIONS = [
  "Management",
  "Site crew",
  "Concrete crew",
  "Steel fixers",
  "Excavation crew",
  "Drainlayer",
  "Formwork crew",
  "Blocklayers",
  "Pump unit",
  "Truck driver",
  "Surveyor",
  "Engineer",
  "Inspector",
  "Subcontractor",
];

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysInput(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}


function getCostAllocationTeamSuggestions(): string[] {
  if (typeof window === "undefined") return [];

  const suggestions: string[] = [];

  try {
    Object.keys(window.localStorage).forEach((key) => {
      const lower_key = key.toLowerCase();

      if (
        !lower_key.includes("cost") &&
        !lower_key.includes("allocation") &&
        !lower_key.includes("operational") &&
        !lower_key.includes("group")
      ) {
        return;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw);

      const visit = (value: unknown) => {
        if (!value) return;

        if (Array.isArray(value)) {
          value.forEach(visit);
          return;
        }

        if (typeof value === "object") {
          const record = value as Record<string, unknown>;

          const possible_name =
            record.operational_group_name ||
            record.group_name ||
            record.team_name ||
            record.name ||
            record.label ||
            record.title;

          if (typeof possible_name === "string") {
            suggestions.push(possible_name);
          }

          Object.values(record).forEach(visit);
        }
      };

      visit(parsed);
    });
  } catch {
    return [];
  }

  return suggestions;
}

function getBusinessOpenWeekdays(): number[] {
  const fallback = [1, 2, 3, 4, 5];

  if (typeof window === "undefined") return fallback;

  const dayIndexByName: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  function readOpenValue(value: unknown): boolean | null {
    if (typeof value === "boolean") return value;

    if (typeof value === "string") {
      const lower = value.toLowerCase().trim();
      if (!lower || lower === "closed" || lower === "false" || lower === "no") return false;
      if (lower === "open" || lower === "true" || lower === "yes") return true;
    }

    if (value && typeof value === "object") {
      const item = value as Record<string, unknown>;

      if (typeof item.is_open === "boolean") return item.is_open;
      if (typeof item.open === "boolean") return item.open;
      if (typeof item.enabled === "boolean") return item.enabled;
      if (typeof item.closed === "boolean") return !item.closed;

      if (item.start || item.end || item.open_time || item.close_time) return true;
    }

    return null;
  }

  function scan(value: unknown, found: Map<number, boolean>) {
    if (!value || typeof value !== "object") return;

    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      const lowerKey = key.toLowerCase();

      Object.entries(dayIndexByName).forEach(([dayName, dayIndex]) => {
        if (lowerKey === dayName || lowerKey.includes(dayName)) {
          const openValue = readOpenValue(item);
          if (openValue !== null) found.set(dayIndex, openValue);
        }
      });

      scan(item, found);
    });
  }

  const found = new Map<number, boolean>();

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;

    const lowerKey = key.toLowerCase();

    if (
      !lowerKey.includes("business") &&
      !lowerKey.includes("opening") &&
      !lowerKey.includes("hours") &&
      !lowerKey.includes("setup")
    ) {
      continue;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      scan(JSON.parse(raw), found);
    } catch {
      // Ignore non-JSON localStorage entries.
    }
  }

  const openDays = Array.from(found.entries())
    .filter(([, isOpen]) => isOpen)
    .map(([dayIndex]) => dayIndex)
    .sort((a, b) => a - b);

  return openDays.length > 0 ? openDays : fallback;
}

function uniqueCleanValues(values: Array<string | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter((value) => value.length > 0)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function clearJobDependencyFields(tasks: ScheduleTask[]): ScheduleTask[] {
  return tasks.map((task) =>
    task.row_type === "J"
      ? {
          ...task,
          dependency_id: "",
          dependency_type: "",
          dependency_lag_days: 0,
          manual_end_date: "",
        }
      : task
  );
}

function populateDefaultDependencies(tasks: ScheduleTask[]): ScheduleTask[] {
  return tasks.map((task, index) => {
    if (task.row_type === "J") {
      return {
        ...task,
        dependency_id: "",
        dependency_type: "",
        dependency_lag_days: 0,
      };
    }

    if (task.dependency_id) return task;

    const previous = [...tasks]
      .slice(0, index)
      .reverse()
      .find((row) => row.row_type !== "J");

    return {
      ...task,
      dependency_id: previous ? Number(previous.schedule_id) || "" : "",
      dependency_type: task.dependency_type || "FS",
      dependency_lag_days: task.dependency_lag_days ?? 0,
    };
  });
}

function clearDefaultManualDates(tasks: ScheduleTask[]): ScheduleTask[] {
  return tasks.map((task) => ({
    ...task,
    manual_start_date:
      task.manual_start_date === task.start_date ||
      task.manual_start_date === task.auto_start_date
        ? ""
        : task.manual_start_date,
    manual_end_date:
      task.manual_end_date === task.end_date ||
      task.manual_end_date === task.auto_end_date
        ? ""
        : task.manual_end_date,
  }));
}

function renumberScheduleIds(tasks: ScheduleTask[]): ScheduleTask[] {
  return tasks.map((task, index) => ({
    ...task,
    schedule_id: index + 1,
  }));
}

function getNextScheduleId(tasks: ScheduleTask[]): number {
  return tasks.reduce((max, task) => Math.max(max, Number(task.schedule_id) || 0), 0) + 1;
}

function getDefaultDependencyId(row_type: ScheduleRowType, existing: ScheduleTask[]): number | "" {
  if (row_type === "J") return "";

  const previous = [...existing].reverse().find((task) => task.row_type !== "J");

  if (!previous) return "";

  return Number(previous.schedule_id) || "";
}

function getDefaultDescription(row_type: ScheduleRowType): string {
  if (row_type === "J") return "New job";
  if (row_type === "M") return "New milestone";
  if (row_type === "D") return "New delivery";
  return "New task";
}

function createScheduleRow(row_type: ScheduleRowType, existing: ScheduleTask[]): ScheduleTask {
  const today = todayInput();
  const first_job = existing.find((task) => task.row_type === "J");

  const job_id = row_type === "J" ? createId("job") : first_job?.project_id || createId("job");
  const job_name =
    row_type === "J"
      ? `Job ${existing.filter((task) => task.row_type === "J").length + 1}`
      : first_job?.project_name || first_job?.task_name || "Job 1";

  const description = getDefaultDescription(row_type);
  const end_date = row_type === "M" || row_type === "D" ? today : addDaysInput(today, row_type === "J" ? 20 : 4);
  const work_days = row_type === "M" || row_type === "D" ? 0 : row_type === "J" ? 21 : 5;

  return {
    task_id: createId("schedule_task"),
    schedule_id: getNextScheduleId(existing),
    project_id: job_id,
    stage_id: row_type === "T" ? createId("task_group") : undefined,
    project_name: job_name,
    task_name: description,
    description,
    notes: "",
    role: "",
    team: "",
    row_type,
    start_date: today,
    end_date,
    manual_start_date: "",
    manual_end_date: "",
    milestone_date: row_type === "M" || row_type === "D" ? today : "",
    auto_start_date: today,
    auto_end_date: end_date,
    duration_days: work_days,
    work_days,
    progress_percent: 0,
    percent_complete: 0,
    dependency_task_ids: [],
    dependency_id: "",
    dependency_type: "FS",
    dependency_lag_days: 0,
    status: "not_started",
    project_index: 0,
    row_level: row_type === "J" ? 0 : 1,
  };
}

function seedTasks(): ScheduleTask[] {
  const start = new Date().toISOString().slice(0, 10);
  const jobId = createId("schedule_job");

  return [
    {
      task_id: createId("schedule_task"),
      schedule_id: 1,
      job_id: jobId,
      stage_id: "",
      project_id: jobId,
      project_name: "Trial Job",
      task_name: "Trial Job",
      description: "Trial Job",
      notes: "",
      role: "",
      team: "",
      row_type: "J",
      start_date: start,
      end_date: addDaysInput(start, 28),
      auto_start_date: start,
      auto_end_date: addDaysInput(start, 28),
      manual_start_date: "",
      manual_end_date: "",
      milestone_date: "",
      work_days: 21,
      duration_days: 21,
      percent_complete: 0,
      progress_percent: 0,
      dependency_id: "",
      dependency_type: "",
      dependency_lag_days: 0,
      dependency_task_ids: [],
      status: "not_started",
      project_index: 0,
      row_level: 0,
    },
    {
      task_id: createId("schedule_task"),
      schedule_id: 2,
      job_id: jobId,
      stage_id: createId("schedule_stage"),
      project_id: jobId,
      project_name: "Trial Job",
      task_name: "Site establishment",
      description: "Site establishment",
      notes: "",
      role: "Foreman",
      team: "Internal Crew",
      row_type: "T",
      start_date: start,
      end_date: addDaysInput(start, 4),
      auto_start_date: start,
      auto_end_date: addDaysInput(start, 4),
      manual_start_date: "",
      manual_end_date: "",
      milestone_date: "",
      work_days: 5,
      duration_days: 5,
      percent_complete: 0,
      progress_percent: 0,
      dependency_id: "",
      dependency_type: "FS",
      dependency_lag_days: 0,
      dependency_task_ids: [],
      status: "not_started",
      project_index: 0,
      row_level: 1,
    },
    {
      task_id: createId("schedule_task"),
      schedule_id: 3,
      job_id: jobId,
      stage_id: createId("schedule_stage"),
      project_id: jobId,
      project_name: "Trial Job",
      task_name: "Set out and site setup",
      description: "Set out and site setup",
      notes: "",
      role: "Supervisor",
      team: "Internal Crew",
      row_type: "T",
      start_date: addDaysInput(start, 5),
      end_date: addDaysInput(start, 7),
      auto_start_date: addDaysInput(start, 5),
      auto_end_date: addDaysInput(start, 7),
      manual_start_date: "",
      manual_end_date: "",
      milestone_date: "",
      work_days: 3,
      duration_days: 3,
      percent_complete: 0,
      progress_percent: 0,
      dependency_id: 2,
      dependency_type: "FS",
      dependency_lag_days: 0,
      dependency_task_ids: [],
      status: "not_started",
      project_index: 0,
      row_level: 1,
    },
    {
      task_id: createId("schedule_task"),
      schedule_id: 4,
      job_id: jobId,
      stage_id: "",
      project_id: jobId,
      project_name: "Trial Job",
      task_name: "Site establishment complete",
      description: "Site establishment complete",
      notes: "",
      role: "",
      team: "",
      row_type: "M",
      start_date: addDaysInput(start, 8),
      end_date: addDaysInput(start, 8),
      auto_start_date: addDaysInput(start, 8),
      auto_end_date: addDaysInput(start, 8),
      manual_start_date: "",
      manual_end_date: "",
      milestone_date: addDaysInput(start, 8),
      work_days: 0,
      duration_days: 0,
      percent_complete: 0,
      progress_percent: 0,
      dependency_id: 3,
      dependency_type: "FS",
      dependency_lag_days: 0,
      dependency_task_ids: [],
      status: "not_started",
      project_index: 0,
      row_level: 1,
    },
  ];
}

export default function useScheduling() {
  const [tasks, setTasks] = useState<ScheduleTask[]>([]);
  const [view_mode, setViewMode] = useState<ViewMode>("week");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showNotes, setShowNotes] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadScheduleTasks();
    setTasks(clearJobDependencyFields(populateDefaultDependencies(clearDefaultManualDates(renumberScheduleIds(saved.length > 0 ? saved : seedTasks())))));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveScheduleTasks(tasks);
  }, [tasks, loaded]);

  const calculation = useMemo(() => calculateScheduling(tasks), [tasks]);

  const status = useMemo(
    () => buildSchedulingStatus(tasks, calculation),
    [tasks, calculation]
  );

  const gantt = useMemo(
    () => buildSchedulingGanttModel(calculation),
    [calculation]
  );

  const filtered_visible_rows =
    filterType === "all"
      ? gantt.visible_rows
      : gantt.visible_rows.filter((row) => row.row_type === filterType);

  const saved_descriptions = loaded
    ? uniqueCleanValues(tasks.map((task) => task.description || task.task_name))
    : [];
  const saved_roles = loaded
    ? uniqueCleanValues(tasks.map((task) => task.role))
    : [];
  const saved_teams = loaded
    ? uniqueCleanValues([
        ...DEFAULT_TEAM_SUGGESTIONS,
        ...getCostAllocationTeamSuggestions(),
        ...tasks.map((task) => task.team),
      ])
    : [];

  const filtered_gantt = {
    ...gantt,
    view_mode,
    visible_rows: filtered_visible_rows,
    filter_type: filterType,
    show_notes: showNotes,
    saved_descriptions,
    saved_roles,
    saved_teams,
    open_weekdays: loaded ? getBusinessOpenWeekdays() : [1, 2, 3, 4, 5],
};

  function addRow(row_type: ScheduleRowType) {
    setTasks((current) => renumberScheduleIds([...current, createScheduleRow(row_type, current)]));
  }

  function updateTask(task_id: string, patch: Partial<ScheduleTask>) {
    setTasks((current) =>
      current.map((task, index) => {
        if (task.task_id !== task_id) return task;

        const previous_job = [...current]
          .slice(0, index)
          .reverse()
          .find((row) => row.row_type === "J");

        const row_type = patch.row_type || task.row_type;

        const next: ScheduleTask = {
          ...task,
          ...patch,
        };

        if (patch.description !== undefined) {
          next.task_name = patch.description ?? task.task_name;
        }

        if (patch.row_type !== undefined) {
          if (row_type === "J") {
            const job_id = task.project_id || createId("job");
            const job_name =
              next.description ||
              next.task_name ||
              `Job ${current.filter((row) => row.row_type === "J").length + 1}`;

            next.project_id = job_id;
            next.stage_id = undefined;
            next.project_name = job_name;
            next.task_name = job_name;
            next.description = job_name;
            next.row_level = 0;
            next.dependency_id = "";
            next.dependency_type = "";
            next.dependency_lag_days = 0;
            next.manual_end_date = "";

            next.dependency_id = "";
            next.dependency_type = "";
            next.dependency_lag_days = 0;
            next.manual_end_date = "";

            if (!next.manual_start_date) next.manual_start_date = next.start_date;
            if (!next.manual_end_date) next.manual_end_date = next.end_date || next.start_date;
            if (!next.auto_start_date) next.auto_start_date = next.manual_start_date || next.start_date;
            if (!next.auto_end_date) next.auto_end_date = next.manual_end_date || next.end_date || next.start_date;
            if (!next.work_days) next.work_days = next.duration_days || 1;
          }

          if (row_type === "T") {
            const job_id = previous_job?.project_id || task.project_id || createId("job");
            const job_name =
              previous_job?.project_name ||
              previous_job?.task_name ||
              task.project_name ||
              "Job 1";

            next.project_id = job_id;
            next.stage_id = next.stage_id || createId("task_group");
            next.project_name = job_name;
            next.row_level = 1;

            if (!next.description || next.description === "New job" || next.description === "New milestone") {
              next.description = "New task";
              next.task_name = "New task";
            }

            if (!next.work_days || next.work_days < 1) next.work_days = 1;
            if (!next.duration_days || next.duration_days < 1) next.duration_days = next.work_days;
          }

          if (row_type === "M" || row_type === "D") {
            const job_id = previous_job?.project_id || task.project_id || createId("job");
            const job_name =
              previous_job?.project_name ||
              previous_job?.task_name ||
              task.project_name ||
              "Job 1";

            next.project_id = job_id;
            next.stage_id = next.stage_id || createId("task_group");
            next.project_name = job_name;
            next.row_level = 1;

            if (!next.description || next.description === "New job" || next.description === "New task" || next.description === "New milestone") {
              next.description = row_type === "D" ? "New delivery" : "New milestone";
              next.task_name = next.description;
            }

            const milestone_date =
              next.milestone_date ||
              next.manual_start_date ||
              next.start_date ||
              todayInput();

            next.start_date = milestone_date;
            next.end_date = milestone_date;
            next.manual_start_date = milestone_date;
            next.manual_end_date = milestone_date;
            next.auto_start_date = milestone_date;
            next.auto_end_date = milestone_date;
            next.milestone_date = milestone_date;
            next.duration_days = 0;
            next.work_days = 0;
          }
        }

        if (row_type === "M" || row_type === "D") {
          const milestone_date =
            patch.start_date ||
            patch.manual_start_date ||
            patch.milestone_date ||
            next.milestone_date ||
            next.start_date;

          next.start_date = milestone_date;
          next.end_date = milestone_date;
          next.manual_start_date = milestone_date;
          next.manual_end_date = milestone_date;
          next.auto_start_date = milestone_date;
          next.auto_end_date = milestone_date;
          next.milestone_date = milestone_date;
          next.duration_days = 0;
          next.work_days = 0;
        }

        return next;
      })
    );
  }
  function deleteTask(task_id: string) {
    setTasks((current) => renumberScheduleIds(current.filter((task) => task.task_id !== task_id)));
  }

  function moveTask(task_id: string, direction: "up" | "down") {
    setTasks((current) => {
      const index = current.findIndex((task) => task.task_id === task_id);
      if (index < 0) return current;

      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return renumberScheduleIds(next);
    });
  }

  function saveNow() {
    saveScheduleTasks(tasks);
  }

  function resetSchedule() {
    const next = seedTasks();
    setTasks(next);
    saveScheduleTasks(next);
  }

  return {
    status,
    toolbar: {
      view_mode,
      filter_type: filterType,
      show_notes: showNotes,
    saved_descriptions,
    saved_roles,
    saved_teams,
    open_weekdays: loaded ? getBusinessOpenWeekdays() : [1, 2, 3, 4, 5],
},
    gantt: filtered_gantt,
    actions: {
      addRow,
      updateTask,
      deleteTask,
      moveTask,
      setViewMode,
      setFilterType,
      setShowNotes,
      saveNow,
      resetSchedule,
    },
    output_contract: {
      schedule_tasks: tasks,
      visible_schedule_tasks: filtered_visible_rows,
      schedule_ready: tasks.length > 0,
      schedule_task_count: tasks.length,
    },
  };
}

