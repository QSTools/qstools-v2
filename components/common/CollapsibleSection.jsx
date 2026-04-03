"use client";

export default function CollapsibleCard({
  title,
  summary,
  isOpen,
  onToggle,
  children,
}) {
  return (
    <div
      style={{
        border: "1px solid #2a2a2a",
        borderRadius: "14px",
        padding: "16px",
        background: "#111",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "#fff",
          textAlign: "left",
        }}
      >
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>{title}</div>
          {!isOpen && summary ? (
            <div style={{ fontSize: "12px", color: "#a3a3a3", marginTop: "4px" }}>
              {summary}
            </div>
          ) : null}
        </div>

        <div style={{ fontSize: "16px", color: "#a3a3a3" }}>
          {isOpen ? "▼" : "▶"}
        </div>
      </button>

      {isOpen ? <div style={{ marginTop: "16px" }}>{children}</div> : null}
    </div>
  );
}