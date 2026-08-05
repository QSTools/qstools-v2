import type {
  ScheduleRowType,
  ScheduleTask,
} from "@/lib/calculations/schedulingCalculations";

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysInput(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function clearJobDependencyFields(tasks: ScheduleTask[]): ScheduleTask[] {
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

export function populateDefaultDependencies(tasks: ScheduleTask[]): ScheduleTask[] {
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

export function clearDefaultManualDates(tasks: ScheduleTask[]): ScheduleTask[] {
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

export function renumberScheduleIds(tasks: ScheduleTask[]): ScheduleTask[] {
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

export function createScheduleRow(row_type: ScheduleRowType, existing: ScheduleTask[]): ScheduleTask {
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

export function seedTasks(): ScheduleTask[] {
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
