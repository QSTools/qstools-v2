export default function ProfitAndLossQuickImportFilePanel({
  file_input_ref,
  handle_extract_file,
  is_extracting,
  set_error_message,
  set_import_message,
  set_selected_file,
}) {
  return (
    <div className="ui-panel ui-stack-sm">
      <div className="ui-label">Upload P&amp;L file</div>

      <input
        ref={file_input_ref}
        type="file"
        accept=".xlsx,.xls,.csv,application/pdf,.pdf"
        className="ui-input"
        onChange={(event) => {
          const file = event.target.files?.[0] || null;
          set_selected_file(file);
          set_error_message("");
          set_import_message(file ? `Selected file: ${file.name}` : "");
        }}
      />

      <div className="ui-actions">
        <button
          type="button"
          className="ui-button-secondary"
          onClick={handle_extract_file}
          disabled={is_extracting}
        >
          {is_extracting ? "Extracting..." : "Extract File"}
        </button>
      </div>

      <p className="ui-help">
        The P&amp;L page uses the accounting export line names directly.
        Detailed commercial classification happens later in Revenue / COGS.
      </p>
    </div>
  );
}
