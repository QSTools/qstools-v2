"use client";

import useScheduling from "@/hooks/useScheduling";
import GanttChart from "@/components/scheduling/GanttChart";
import Toolbar from "@/components/scheduling/Toolbar";

function formatDate(value?: string): string {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

export default function SchedulingPage() {
  const { status, toolbar, gantt, actions } = useScheduling();

  return (
    <main className="scheduling-page">
      <div className="scheduling-page-stack">
        <section className="schedule-title-band">
          <div className="schedule-title-main">
            <span>Scheduling v4.0</span>
            <strong>Job programme</strong>
          </div>

          <div className="schedule-title-meta">
            <span>Project Timespan</span>
            <strong>
              {formatDate(gantt.timeline_start)} - {formatDate(gantt.timeline_end)}
            </strong>
          </div>

          <div className="schedule-title-meta">
            <span>Rows</span>
            <strong>{status.task_count}</strong>
          </div>

          <div className="schedule-title-meta">
            <span>Milestones</span>
            <strong>{status.milestone_count}</strong>
          </div>
        </section>

        {status.warnings.length > 0 ? (
          <section className="schedule-warning-band">
            <strong>{status.warning_count} schedule warning(s)</strong>
            <div>
              {status.warnings.map((warning, index) => (
                <span key={`${warning}-${index}`}>{warning}</span>
              ))}
            </div>
          </section>
        ) : null}

        <Toolbar toolbar={toolbar} actions={actions} />

        <GanttChart gantt={gantt} actions={actions} />
      </div>
    </main>
  );
}

