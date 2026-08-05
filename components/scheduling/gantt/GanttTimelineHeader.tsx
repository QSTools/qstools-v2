import type { TimelineColumn } from "@/components/scheduling/gantt/ganttTypes";

type GanttTimelineHeaderProps = {
  timeline_columns: TimelineColumn[];
  timeline_grid_template: string;
  timeline_width: number;
};

export default function GanttTimelineHeader({
  timeline_columns,
  timeline_grid_template,
  timeline_width,
}: GanttTimelineHeaderProps) {
  return (
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
  );
}
