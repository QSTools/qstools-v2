"use client";

export default function BusinessSetupStatusStrip({ status }) {
  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-sm">
        <div className="ui-kicker">Setup status</div>

        <div className="ui-table-like">
          <div className="ui-row">
            <span>Setup</span>
            <strong>{status.setup_status_label}</strong>
          </div>

          <div className="ui-row">
            <span>Business name</span>
            <strong>{status.business_name_label}</strong>
          </div>

          <div className="ui-row">
            <span>Business type</span>
            <strong>{status.business_type_label}</strong>
          </div>

          <div className="ui-row">
            <span>Activity driver</span>
            <strong>{status.activity_driver_label}</strong>
          </div>

          <div className="ui-row">
            <span>Warnings</span>
            <strong>{status.warning_count}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}