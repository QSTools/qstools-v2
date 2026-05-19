export default function RecoverySummaryModelSelectorBlock({
  recovery_model,
  on_recovery_model_change,
}) {
  const normalised_recovery_model =
    recovery_model === "labour_only" ? "labour_led" : recovery_model;

  const recovery_model_detail = get_recovery_model_detail(
    normalised_recovery_model
  );

  return (
    <div className="ui-panel">
      <div className="ui-stack">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Recovery model selector
          </h3>

          <p className="ui-help">
            Choose the recovery strategy that Cost Allocation will test next.
            This does not change the Business Setup type. It defines how the
            starting recovery model should be interpreted.
          </p>
        </div>

        <div className="recovery-summary-interactive is-active">
          <div className="recovery-summary-note-button">
            <div className="ui-stack-sm">
              <p className="ui-kicker">Change recovery strategy</p>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                  Primary recovery strategy
                </span>

                <select
                  value={normalised_recovery_model}
                  onChange={(event) =>
                    on_recovery_model_change(event.target.value)
                  }
                  className="ui-input"
                >
                  <option value="labour_led">Labour-led recovery</option>
                  <option value="asset_led">Asset-led recovery</option>
                  <option value="material_led">
                    Materials / products-led recovery
                  </option>
                  <option value="hybrid">Hybrid recovery</option>
                </select>
              </label>

              <p className="ui-help">
                Change this if the suggested recovery model does not match how
                the business actually expects to earn and recover margin.
              </p>
            </div>
          </div>
        </div>

        <div className="ui-readonly">
          <div className="ui-stack-sm">
            <p className="ui-kicker">Selected strategy</p>

            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              {recovery_model_detail.title}
            </h4>

            <p className="text-sm font-medium text-[var(--text-primary)]">
              {recovery_model_detail.description}
            </p>

            <p className="ui-help">{recovery_model_detail.why}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function get_recovery_model_detail(recovery_model) {
  const detail_map = {
    labour_led: {
      title: "Labour-led recovery",
      description:
        "Use this when the business mainly recovers its cost burden through people’s productive time.",
      why:
        "Select this when recovery hours are the clearest way to test whether the business can carry its overheads and operating cost burden.",
    },

    asset_led: {
      title: "Asset-led recovery",
      description:
        "Use this when productive assets carry a major part of the recovery burden. Support assets stay in the cost burden, but do not automatically carry asset recovery.",
      why:
        "Select this when productive asset usage, machine time, plant time, vehicle time, or equipment utilisation is central to how the business earns margin.",
    },

    material_led: {
      title: "Materials / products-led recovery",
      description:
        "Use this when a meaningful share of recovery is expected to come from materials, supplied goods, products, resale margin, or product margin.",
      why:
        "Select this when the business relies heavily on materials, products, resale, or supplied goods as part of the recovery model.",
    },

    hybrid: {
      title: "Hybrid recovery",
      description:
        "Use this when recovery is expected to come from a mix of labour, productive assets, and materials / products rather than one clear driver.",
      why:
        "Select this when the business model is mixed and Cost Allocation needs to test more than one recovery path.",
    },
  };

  return detail_map[recovery_model] ?? detail_map.labour_led;
}