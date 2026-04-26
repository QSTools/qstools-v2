"use client";

export default function SetupNextButton({
  label = "Next",
  can_continue = true,
  gating_enabled = false,
  blocked_message = "Resolve required items before continuing.",
  on_click,
}) {
  const is_blocked = gating_enabled && !can_continue;

  return (
    <div className="ui-stack-sm">
      <button
        type="button"
        className="ui-button-secondary"
        disabled={is_blocked}
        onClick={on_click}
      >
        {label}
      </button>

      {is_blocked ? (
        <div className="ui-help theme-danger">{blocked_message}</div>
      ) : null}
    </div>
  );
}