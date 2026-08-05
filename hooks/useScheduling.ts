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
import {
  DEFAULT_TEAM_SUGGESTIONS,
  getBusinessOpenWeekdays,
  getCostAllocationTeamSuggestions,
  uniqueCleanValues,
} from "@/hooks/scheduling/schedulingSuggestions";
import {
  clearDefaultManualDates,
  clearJobDependencyFields,
  createId,
  createScheduleRow,
  populateDefaultDependencies,
  renumberScheduleIds,
  seedTasks,
  todayInput,
} from "@/hooks/scheduling/schedulingTaskRows";
import type { FilterType, ViewMode } from "@/hooks/scheduling/schedulingTypes";

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
