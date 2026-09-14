"use client";

import { useRef, useState } from "react";

export default function BalanceSheetImportPanel({ onImportFile, is_importing, import_error, has_data, source_filename, imported_at }) {
  const file_input_ref = useRef(null);
  const [selected_file_name, set_selected_file_name] = useState("");
  const [last_import_warnings, set_last_import_warnings] = useState([]);
  const [last_import_message, set_last_import_message] = useState("");

  function handle_file_change(event) {
    const file = event.target.files?.[0] || null;
    set_selected_file_name(file ? file.name : "");
    set_last_import_message("");
    set_last_import_warnings([]);
  }

  async function handle_import() {
    const file = file_input_ref.current?.files?.[0] || null;

    if (!file) {
      return;
    }

    const result = await onImportFile(file);

    if (result?.success) {
      set_last_import_message(`Imported ${file.name} successfully.`);
      set_last_import_warnings(result.warnings || []);
    }
  }

  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-kicker">Balance Sheet</div>
      <div className="ui-card-title-sm">Import from Xero</div>
      <p className="ui-help">
        In Xero: Reports &rarr; Balance Sheet &rarr; Export &rarr; Excel. Upload that file here.
      </p>

      {has_data && (
        <p className="ui-help">
          Currently showing <strong>{source_filename || "an imported file"}</strong>
          {imported_at && `, imported ${new Date(imported_at).toLocaleString("en-NZ")}`}.
        </p>
      )}

      <input
        ref={file_input_ref}
        type="file"
        accept=".xlsx"
        onChange={handle_file_change}
      />

      <button
        type="button"
        className="ui-button-secondary"
        onClick={handle_import}
        disabled={!selected_file_name || is_importing}
      >
        {is_importing ? "Importing..." : "Import Balance Sheet"}
      </button>

      {import_error && (
        <p className="ui-help" style={{ color: "var(--danger)" }}>
          {import_error}
        </p>
      )}

      {last_import_message && (
        <p className="ui-help" style={{ color: "var(--success)" }}>
          {last_import_message}
        </p>
      )}

      {last_import_warnings.length > 0 && (
        <div className="ui-help" style={{ color: "var(--warning)" }}>
          <strong>{last_import_warnings.length} warning{last_import_warnings.length === 1 ? "" : "s"} during import:</strong>
          <ul>
            {last_import_warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}