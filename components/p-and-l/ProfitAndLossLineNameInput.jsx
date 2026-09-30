"use client";

import { useState } from "react";

// Holds the name as a local draft while typing and only commits (and so
// reclassifies) on blur / Enter. Prevents the row moving group mid-typing.
export default function ProfitAndLossLineNameInput({
  line,
  handle_line_name_change,
  placeholder = "Enter line name",
}) {
  const stored_name = line.line_name ?? "";
  const [is_editing, set_is_editing] = useState(false);
  const [draft_name, set_draft_name] = useState(stored_name);

  function commit_name() {
    set_is_editing(false);
    if (draft_name !== stored_name) {
      handle_line_name_change(line, draft_name);
    }
  }

  return (
    <input
      className="ui-input"
      value={is_editing ? draft_name : stored_name}
      placeholder={placeholder}
      onFocus={() => {
        set_draft_name(stored_name);
        set_is_editing(true);
      }}
      onChange={(event) => set_draft_name(event.target.value)}
      onBlur={commit_name}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
    />
  );
}