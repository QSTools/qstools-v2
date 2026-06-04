export default function OpeningHoursMainCard({
    opening_hours_profile_name,
    effective_from,
    standard_week_days,
    additional_closed_days,
    seasonal_shutdown_weeks,
    public_holiday_days,
    calendar_notes,
    summary_rows,
    downstream_rows,
    warnings,
    actions,
}) {
    return (
        <section className="ui-section">
            <div className="ui-panel">
                <div className="ui-split">
                    <div>
                        <p className="ui-kicker">Calendar setup</p>
                        <h2 className="ui-heading">Opening Hours</h2>
                        <p className="ui-help">
                            Set the normal operating week, shutdowns, and additional closed
                            days. These values create calendar context only.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ui-button-secondary"
                        onClick={actions.reset_module}
                    >
                        Reset
                    </button>
                </div>

                <div className="ui-stack">
                    <label className="ui-label" htmlFor="opening_hours_profile_name">
                        Profile name
                    </label>
                    <input
                        id="opening_hours_profile_name"
                        className="ui-input"
                        value={opening_hours_profile_name || ""}
                        onChange={(event) =>
                            actions.update_field(
                                "opening_hours_profile_name",
                                event.target.value
                            )
                        }
                    />

                    <label className="ui-label" htmlFor="effective_from">
                        Effective from
                    </label>
                    <input
                        id="effective_from"
                        type="date"
                        className="ui-input"
                        value={effective_from || ""}
                        onChange={(event) =>
                            actions.update_field("effective_from", event.target.value)
                        }
                    />
                </div>
            </div>

            <div className="ui-panel">
                <p className="ui-kicker">Standard week</p>
                <h3 className="ui-heading">Normal Operating Pattern</h3>

                <p className="ui-help">
                    Set the normal weekly operating pattern. This creates calendar context
                    only.
                </p>

                <div className="ui-table-wrap">
                    <table className="ui-table opening-hours-table">
                        <thead>
                            <tr>
                                <th>Day</th>
                                <th>Open</th>
                                <th>Close</th>
                                <th>Break</th>
                                <th>Open?</th>
                                <th>Hours</th>
                            </tr>
                        </thead>

                        <tbody>
                            {(standard_week_days || []).map((day) => (
                                <tr key={day.day_id}>
                                    <td>
                                        <strong>{day.day_name}</strong>
                                    </td>

                                    <td>
                                        <input
                                            type="time"
                                            className="ui-input"
                                            value={day.open_time || ""}
                                            disabled={!day.is_open}
                                            onChange={(event) =>
                                                actions.update_day(day.day_id, {
                                                    open_time: event.target.value,
                                                })
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="time"
                                            className="ui-input"
                                            value={day.close_time || ""}
                                            disabled={!day.is_open}
                                            onChange={(event) =>
                                                actions.update_day(day.day_id, {
                                                    close_time: event.target.value,
                                                })
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="number"
                                            className="ui-input"
                                            min="0"
                                            value={day.break_minutes ?? 0}
                                            disabled={!day.is_open}
                                            onChange={(event) =>
                                                actions.update_day(day.day_id, {
                                                    break_minutes: event.target.value,
                                                })
                                            }
                                        />
                                    </td>

                                    <td>
                                        <input
                                            type="checkbox"
                                            className="opening-hours-checkbox"
                                            checked={Boolean(day.is_open)}
                                            onChange={(event) =>
                                                actions.update_day(day.day_id, {
                                                    is_open: event.target.checked,
                                                })
                                            }
                                        />
                                    </td>

                                    <td>
                                        <strong>
                                            {Number(day.daily_open_hours || 0).toFixed(2)}
                                        </strong>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(standard_week_days || []).some((day) => day.invalid_time_range) && (
                    <p className="ui-help">
                        One or more days has an invalid time range. Close time must be after
                        open time.
                    </p>
                )}
            </div>

            <div className="ui-panel">
                <p className="ui-kicker">Annual calendar</p>
                <h3 className="ui-heading">Shutdowns and Holidays</h3>

                <div className="ui-grid ui-grid-2">
                    <label className="ui-stack">
                        <span className="ui-label">Seasonal shutdown weeks</span>
                        <input
                            type="number"
                            className="ui-input"
                            min="0"
                            max="52"
                            value={seasonal_shutdown_weeks ?? 0}
                            onChange={(event) =>
                                actions.update_field(
                                    "seasonal_shutdown_weeks",
                                    event.target.value
                                )
                            }
                        />
                    </label>

                    <label className="ui-stack">
                        <span className="ui-label">Public holiday days</span>
                        <input
                            type="number"
                            className="ui-input"
                            min="0"
                            value={public_holiday_days ?? 0}
                            onChange={(event) =>
                                actions.update_field("public_holiday_days", event.target.value)
                            }
                        />
                    </label>
                </div>
            </div>

            <div className="ui-panel">
                <div className="ui-split">
                    <div>
                        <p className="ui-kicker">Closed days</p>
                        <h3 className="ui-heading">Additional Closed Days</h3>
                        <p className="ui-help">
                            Use this for specific shutdowns or closures that reduce available
                            operating hours.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ui-button-secondary"
                        onClick={actions.add_closed_day}
                    >
                        Add closed day
                    </button>
                </div>

                <div className="ui-stack">
                    {(additional_closed_days || []).length === 0 && (
                        <p className="ui-help">No additional closed days entered.</p>
                    )}

                    {(additional_closed_days || []).map((closed_day) => (
                        <div key={closed_day.closed_day_id} className="ui-readonly">
                            <div className="ui-grid ui-grid-4">
                                <label className="ui-stack">
                                    <span className="ui-label">Date</span>
                                    <input
                                        type="date"
                                        className="ui-input"
                                        value={closed_day.date || ""}
                                        onChange={(event) =>
                                            actions.update_closed_day(closed_day.closed_day_id, {
                                                date: event.target.value,
                                            })
                                        }
                                    />
                                </label>

                                <label className="ui-stack">
                                    <span className="ui-label">Label</span>
                                    <input
                                        className="ui-input"
                                        value={closed_day.label || ""}
                                        onChange={(event) =>
                                            actions.update_closed_day(closed_day.closed_day_id, {
                                                label: event.target.value,
                                            })
                                        }
                                    />
                                </label>

                                <label className="ui-stack">
                                    <span className="ui-label">Closed hours</span>
                                    <input
                                        type="number"
                                        className="ui-input"
                                        min="0"
                                        value={closed_day.closed_hours ?? 0}
                                        onChange={(event) =>
                                            actions.update_closed_day(closed_day.closed_day_id, {
                                                closed_hours: event.target.value,
                                            })
                                        }
                                    />
                                </label>

                                <div className="ui-stack">
                                    <span className="ui-label">Action</span>
                                    <button
                                        type="button"
                                        className="ui-button-danger"
                                        onClick={() =>
                                            actions.remove_closed_day(closed_day.closed_day_id)
                                        }
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <label className="ui-stack">
                                <span className="ui-label">Reason</span>
                                <input
                                    className="ui-input"
                                    value={closed_day.reason || ""}
                                    onChange={(event) =>
                                        actions.update_closed_day(closed_day.closed_day_id, {
                                            reason: event.target.value,
                                        })
                                    }
                                />
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="ui-panel">
                <p className="ui-kicker">Output summary</p>
                <h3 className="ui-heading">Operating Calendar Output</h3>

                <div className="ui-grid ui-grid-2">
                    {(summary_rows || []).map((row) => (
                        <div key={row.label} className="ui-readonly">
                            <span className="ui-label">{row.label}</span>
                            <strong>{row.value}</strong>
                        </div>
                    ))}
                </div>
            </div>

            <div className="ui-panel">
                <p className="ui-kicker">Downstream use</p>
                <h3 className="ui-heading">How Opening Hours Is Used</h3>

                <div className="ui-stack">
                    {(downstream_rows || []).map((row) => (
                        <div key={row.label} className="ui-readonly">
                            <span className="ui-label">{row.label}</span>
                            <p>{row.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="ui-panel">
                <p className="ui-kicker">Review</p>
                <h3 className="ui-heading">Warnings</h3>

                {(warnings || []).length === 0 && (
                    <p className="ui-help">No opening-hours warnings.</p>
                )}

                <div className="ui-stack">
                    {(warnings || []).map((warning) => (
                        <div key={warning.warning_id} className="ui-readonly">
                            <span className="ui-label">
                                {warning.severity} — {warning.warning_id}
                            </span>
                            <p>{warning.message}</p>
                            <p className="ui-help">{warning.review_action}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="ui-panel">
                <label className="ui-stack">
                    <span className="ui-label">Calendar notes</span>
                    <textarea
                        className="ui-input"
                        rows={4}
                        value={calendar_notes || ""}
                        onChange={(event) =>
                            actions.update_field("calendar_notes", event.target.value)
                        }
                    />
                </label>
            </div>
        </section>
    );
}