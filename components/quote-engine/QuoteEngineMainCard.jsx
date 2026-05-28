"use client";

const QUOTE_STATUSES = [
  "draft",
  "issued",
  "revised",
  "accepted",
  "rejected",
  "expired",
  "cancelled",
  "archived",
];

const JOB_TYPES = [
  "",
  "Residential slab",
  "Commercial slab",
  "Driveway",
  "Retaining wall",
  "Civil works",
  "Blockwork",
  "Excavation",
  "Labour-only",
  "Supply-and-place",
  "Other",
];

function quoteFieldValue(value) {
  return value === undefined || value === null ? "" : value;
}

function parseInputNumber(value) {
  const parsed = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumberInput(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const numeric_value = parseInputNumber(value);

  if (!Number.isFinite(numeric_value)) {
    return "";
  }

  return numeric_value.toLocaleString("en-NZ", {
    maximumFractionDigits: 2,
  });
}

function formatWholeNumberInput(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  const numeric_value = parseInputNumber(value);

  if (!Number.isFinite(numeric_value)) {
    return "";
  }

  return numeric_value.toLocaleString("en-NZ", {
    maximumFractionDigits: 0,
  });
}

function calculateCogSellTotal(quote_state = {}) {
  const cog_cost_total = parseInputNumber(
    quote_state.cog_cost_total || quote_state.material_cost_total
  );

  const cog_markup_percent = parseInputNumber(
    quote_state.cog_markup_percent || quote_state.material_markup_percent
  );

  return cog_cost_total * (1 + cog_markup_percent / 100);
}

function calculateLabourChargeTotal(quote_state = {}) {
  const quote_price_total = parseInputNumber(quote_state.quote_price_total);
  const cog_sell_total = calculateCogSellTotal(quote_state);

  return Math.max(0, quote_price_total - cog_sell_total);
}

function calculateLabourCostTotal(quote_state = {}) {
  const labour_hours_allowed = parseInputNumber(
    quote_state.labour_hours_allowed || quote_state.base_labour_hours_allowed
  );

  const labour_hourly_cost_rate = parseInputNumber(
    quote_state.labour_hourly_cost_rate
  );

  return labour_hours_allowed * labour_hourly_cost_rate;
}

export default function QuoteEngineMainCard({
  quote_state,
  update_field,
  saved_quote_jobs = [],
  saved_quote_versions = [],
  selected_quote_job_id = "",
  update_selected_quote_job_id,
  create_new_quote_version_from_selected_job,
  start_new_quote,
  save_current_quote,
  load_quote_version,
}) {
  const selected_versions = saved_quote_versions.filter(
    (version) =>
      !selected_quote_job_id || version.quote_job_id === selected_quote_job_id
  );

  const cog_sell_total = calculateCogSellTotal(quote_state);

  const cog_margin_total =
    cog_sell_total -
    parseInputNumber(quote_state.cog_cost_total || quote_state.material_cost_total);

  const labour_charge_total = calculateLabourChargeTotal(quote_state);
  const labour_cost_total = calculateLabourCostTotal(quote_state);
  const labour_margin_total = labour_charge_total - labour_cost_total;

  return (
    <section className="ui-section">
      <div className="ui-card ui-stack-sm">
        <div className="ui-card-title">Quote entry</div>

        <p className="ui-help">
          Enter the job, client, quote price, COG cost, COG markup, labour hours,
          and labour hourly cost. Labour charge is calculated from the quote
          balance.
        </p>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">Existing job / quote version</div>

          <div className="ui-grid-2">
            <div>
              <span className="ui-label">Select existing job</span>
              <select
                className="ui-input"
                value={selected_quote_job_id}
                onChange={(event) =>
                  update_selected_quote_job_id(event.target.value)
                }
              >
                <option value="">Select existing job</option>
                {saved_quote_jobs.map((job) => (
                  <option key={job.quote_job_id} value={job.quote_job_id}>
                    {`${job.job_number || "No job no"} - ${
                      job.job_name || "Unnamed job"
                    } - ${job.client_name || "No client"}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="ui-label">Load previous version</span>
              <select
                className="ui-input"
                value=""
                onChange={(event) => load_quote_version(event.target.value)}
              >
                <option value="">Select quote version</option>
                {selected_versions.map((version) => (
                  <option
                    key={version.quote_version_id}
                    value={version.quote_version_id}
                  >
                    {`v${version.quote_version} - ${
                      version.quote_date || "No date"
                    } - ${version.quote_status || "draft"}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-secondary"
              onClick={start_new_quote}
            >
              Start new job quote
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={create_new_quote_version_from_selected_job}
              disabled={!selected_quote_job_id}
            >
              Create new version from selected job
            </button>

            <button
              type="button"
              className="ui-button-primary"
              onClick={save_current_quote}
            >
              Save current quote
            </button>
          </div>

          <p className="ui-help">
            Creating a new version keeps previous quote versions unchanged and
            copies the selected job, client, and job type details into the new
            draft.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">Job and client identity</div>

          <div className="ui-grid-2">
            <div>
              <span className="ui-label">Job number</span>
              <input
                className="ui-input"
                value={quoteFieldValue(quote_state.job_number)}
                onChange={(event) =>
                  update_field("job_number", event.target.value)
                }
                placeholder="Job number"
              />
            </div>

            <div>
              <span className="ui-label">Job name</span>
              <input
                className="ui-input"
                value={quoteFieldValue(quote_state.job_name)}
                onChange={(event) =>
                  update_field("job_name", event.target.value)
                }
                placeholder="Job name"
              />
            </div>

            <div>
              <span className="ui-label">Client name</span>
              <input
                className="ui-input"
                value={quoteFieldValue(quote_state.client_name)}
                onChange={(event) =>
                  update_field("client_name", event.target.value)
                }
                placeholder="Client name"
              />
            </div>

            <div>
              <span className="ui-label">Client contact</span>
              <input
                className="ui-input"
                value={quoteFieldValue(quote_state.client_contact_name)}
                onChange={(event) =>
                  update_field("client_contact_name", event.target.value)
                }
                placeholder="Contact name"
              />
            </div>

            <div>
              <span className="ui-label">Client phone</span>
              <input
                className="ui-input"
                value={quoteFieldValue(quote_state.client_phone)}
                onChange={(event) =>
                  update_field("client_phone", event.target.value)
                }
                placeholder="Phone"
              />
            </div>

            <div>
              <span className="ui-label">Client email</span>
              <input
                className="ui-input"
                type="email"
                value={quoteFieldValue(quote_state.client_email)}
                onChange={(event) =>
                  update_field("client_email", event.target.value)
                }
                placeholder="Email"
              />
            </div>

            <div>
              <span className="ui-label">Job type</span>
              <select
                className="ui-input"
                value={quoteFieldValue(quote_state.job_type_name)}
                onChange={(event) =>
                  update_field("job_type_name", event.target.value)
                }
              >
                {JOB_TYPES.map((job_type) => (
                  <option key={job_type || "blank"} value={job_type}>
                    {job_type || "Select job type"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="ui-label">Quote status</span>
              <select
                className="ui-input"
                value={quoteFieldValue(quote_state.quote_status)}
                onChange={(event) =>
                  update_field("quote_status", event.target.value)
                }
              >
                {QUOTE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">Quote version</div>

          <div className="ui-grid-2">
            <div>
              <span className="ui-label">Quote name</span>
              <div className="ui-readonly">
                {quoteFieldValue(quote_state.quote_name) || "Uses job name"}
              </div>
            </div>

            <div>
              <span className="ui-label">Quote reference</span>
              <div className="ui-readonly">
                {quoteFieldValue(quote_state.quote_reference) ||
                  "Uses job number"}
              </div>
            </div>

            <div>
              <span className="ui-label">Quote date</span>
              <input
                className="ui-input"
                type="date"
                value={quoteFieldValue(quote_state.quote_date)}
                onChange={(event) =>
                  update_field("quote_date", event.target.value)
                }
              />
            </div>

            <div>
              <span className="ui-label">Quote version</span>
              <input
                className="ui-input"
                value={quoteFieldValue(quote_state.quote_version)}
                onChange={(event) =>
                  update_field("quote_version", event.target.value)
                }
                placeholder="Version"
              />
            </div>
          </div>

          <div className="ui-row-between">
            <label className="ui-label">
              <input
                type="checkbox"
                checked={Boolean(quote_state.is_winning_quote)}
                onChange={(event) =>
                  update_field("is_winning_quote", event.target.checked)
                }
              />{" "}
              Winning quote
            </label>

            <label className="ui-label">
              <input
                type="checkbox"
                checked={Boolean(quote_state.is_live_job)}
                onChange={(event) =>
                  update_field("is_live_job", event.target.checked)
                }
              />{" "}
              Converted to live job
            </label>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div className="ui-card-title-sm">Commercial quote inputs</div>

          <div className="ui-grid-2">
            <div>
              <span className="ui-label">Quote price total</span>
              <input
                className="ui-input"
                type="text"
                inputMode="decimal"
                value={formatNumberInput(quote_state.quote_price_total)}
                onChange={(event) =>
                  update_field("quote_price_total", event.target.value)
                }
                placeholder="0"
              />
            </div>

            <div>
              <span className="ui-label">COG cost total</span>
              <input
                className="ui-input"
                type="text"
                inputMode="decimal"
                value={formatNumberInput(
                  quote_state.cog_cost_total || quote_state.material_cost_total
                )}
                onChange={(event) =>
                  update_field("cog_cost_total", event.target.value)
                }
                placeholder="0"
              />
            </div>

            <div>
              <span className="ui-label">COG markup percent</span>
              <input
                className="ui-input"
                type="text"
                inputMode="decimal"
                value={formatNumberInput(
                  quote_state.cog_markup_percent ||
                    quote_state.material_markup_percent
                )}
                onChange={(event) =>
                  update_field("cog_markup_percent", event.target.value)
                }
                placeholder="0"
              />
            </div>

            <div>
              <span className="ui-label">COG sell total</span>
              <div className="ui-readonly">
                {formatNumberInput(cog_sell_total)}
              </div>
            </div>

            <div>
              <span className="ui-label">COG margin total</span>
              <div className="ui-readonly">
                {formatNumberInput(cog_margin_total)}
              </div>
            </div>

            <div>
              <span className="ui-label">Labour hours allowed</span>
              <input
                className="ui-input"
                type="text"
                inputMode="numeric"
                value={formatWholeNumberInput(
                  quote_state.labour_hours_allowed ||
                    quote_state.base_labour_hours_allowed
                )}
                onChange={(event) =>
                  update_field("labour_hours_allowed", event.target.value)
                }
                placeholder="0"
              />
            </div>

            <div>
              <span className="ui-label">Labour hourly cost rate</span>
              <input
                className="ui-input"
                type="text"
                inputMode="decimal"
                value={formatNumberInput(quote_state.labour_hourly_cost_rate)}
                onChange={(event) =>
                  update_field("labour_hourly_cost_rate", event.target.value)
                }
                placeholder="0"
              />
            </div>

            <div>
              <span className="ui-label">Labour cost total</span>
              <div className="ui-readonly">
                {formatNumberInput(labour_cost_total)}
              </div>
            </div>

            <div>
              <span className="ui-label">Labour charge total</span>
              <div className="ui-readonly">
                {formatNumberInput(labour_charge_total)}
              </div>
            </div>

            <div>
              <span className="ui-label">Labour margin total</span>
              <div className="ui-readonly">
                {formatNumberInput(labour_margin_total)}
              </div>
            </div>
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <p className="ui-help">
            Quote price less calculated COG sell total becomes the labour charge
            total. This keeps the quote balanced automatically.
          </p>

          <p className="ui-help">
            Labour cost total is calculated from labour hours allowed times
            labour hourly cost rate.
          </p>

          <div className="ui-row-between">
            <div>
              <span className="ui-label">Quote job ID</span>
              <div>{quoteFieldValue(quote_state.quote_job_id)}</div>
            </div>
            <div>
              <span className="ui-label">Quote version ID</span>
              <div>{quoteFieldValue(quote_state.quote_version_id)}</div>
            </div>
          </div>

          <div className="ui-row-between">
            <div>
              <span className="ui-label">Created</span>
              <div>{quoteFieldValue(quote_state.created_at)}</div>
            </div>
            <div>
              <span className="ui-label">Updated</span>
              <div>{quoteFieldValue(quote_state.updated_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}