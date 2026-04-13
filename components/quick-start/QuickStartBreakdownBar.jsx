import styles from "@/components/quick-start/QuickStartBreakdownBar.module.css";

function build_segments({ mode_key, time_percent, product_percent, buffer_percent }) {
  const total_slots = 12;

  if (mode_key === "m2_rate" || mode_key === "labour_only") {
    return Array.from({ length: total_slots }, () => "time");
  }

  const time_slots = Math.round((time_percent / 100) * total_slots);
  const product_slots = Math.round((product_percent / 100) * total_slots);
  const buffer_slots = Math.round((buffer_percent / 100) * total_slots);

  const segments = [];

  for (let index = 0; index < time_slots; index += 1) {
    segments.push("time");
  }

  for (let index = 0; index < product_slots; index += 1) {
    segments.push("product");
  }

  for (let index = 0; index < buffer_slots; index += 1) {
    segments.push("buffer");
  }

  while (segments.length < total_slots) {
    segments.push("empty");
  }

  return segments.slice(0, total_slots);
}

export default function QuickStartBreakdownBar({ breakdown }) {
  const segments = build_segments(breakdown);

  return (
    <div className="ui-stack">
      <div className={styles.track}>
        {segments.map((segment, index) => {
          const segment_class =
            segment === "time"
              ? styles.time
              : segment === "product"
                ? styles.product
                : segment === "buffer"
                  ? styles.buffer
                  : styles.empty;

          return <div key={`${segment}-${index}`} className={segment_class} />;
        })}
      </div>

      <div className={styles.legend}>
        <span>Time</span>
        <span>Product</span>
        {breakdown.mode_key === "asset_operator" && <span>Buffer</span>}
      </div>
    </div>
  );
}