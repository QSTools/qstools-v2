"use client";

function BusinessTypeOption({ option, onSelect }) {
  const option_classes = option.is_selected
    ? "ui-panel ui-stack-sm business-setup-option business-setup-option--selected"
    : "ui-panel ui-stack-sm business-setup-option";

  const badge_classes = option.is_selected
    ? "business-setup-option__badge business-setup-option__badge--selected"
    : "business-setup-option__badge";

  return (
    <button
      type="button"
      className={option_classes}
      onClick={() => onSelect(option.value)}
      aria-pressed={option.is_selected}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="ui-stack-sm">
          <div className="ui-card-title-sm">{option.label}</div>
          <p className="ui-help">{option.helper}</p>
          <p className="ui-help">{option.examples}</p>
          <div className="ui-kicker">{option.driver_label}</div>
        </div>

        <div className={badge_classes}>
          {option.is_selected ? "Selected" : "Select"}
        </div>
      </div>
    </button>
  );
}

function getSelectedBusinessType(card) {
  return (
    card.business_type_options.find((option) => option.is_selected) ||
    card.business_type_options[0]
  );
}

export default function BusinessSetupMainCard({
  card,
  setup_completed,
  updateBusinessSetupField,
  saveBusinessSetup,
  resetBusinessSetup,
  continueToNextStep,
}) {
  const selected_business_type = getSelectedBusinessType(card);

  return (
    <section className="ui-section">
      <div className="ui-panel ui-stack-md">
        <div>
          <div className="ui-kicker">Business profile</div>
          <div className="ui-card-title-sm">Create your business profile</div>
          <p className="ui-help">
            Start by naming the business. Then choose the recovery driver that
            best matches how the business earns revenue.
          </p>
        </div>

        <div className="ui-panel ui-stack-sm business-setup-name-panel">
          <div>
            <div className="ui-kicker">Step 1</div>
            <div className="ui-card-title-sm">Name your business</div>
            <p className="ui-help">
              This is the first setup step. Enter the business name that should
              appear across summaries, modelling pages, and future dashboards.
            </p>
          </div>

          <label className="form-field ui-stack-sm">
            <span className="text-base font-semibold">Business name</span>
            <input
              className="ui-input text-lg font-semibold"
              type="text"
              value={card.business_name}
              placeholder="Example: QS Tools Ltd"
              onChange={(event) =>
                updateBusinessSetupField("business_name", event.target.value)
              }
            />
          </label>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div>
            <div className="ui-kicker">Step 2</div>
            <div className="ui-card-title-sm">Choose your recovery driver</div>
            <p className="ui-help">
              Choose how the business mainly sells output. This controls
              whether later pages calculate recovery through productive hours or
              units sold.
            </p>
          </div>

          <div className="ui-panel ui-stack-sm business-setup-name-panel">
            <div className="ui-kicker">Current selected business type</div>
            <strong>{selected_business_type.label}</strong>
            <p className="ui-help">{selected_business_type.driver_label}</p>
            <p className="ui-help">
              You can switch this during testing, then click Save business
              profile to persist the mode.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {card.business_type_options.map((option) => (
              <BusinessTypeOption
                key={option.value}
                option={option}
                onSelect={(value) =>
                  updateBusinessSetupField("business_type", value)
                }
              />
            ))}
          </div>
        </div>

        <div className="ui-panel ui-stack-sm">
          <div>
            <div className="ui-kicker">Current setup</div>
            <div className="ui-card-title-sm">Save your business profile</div>
            <p className="ui-help">
              During development, this page stays editable so you can switch
              between labour-based and product-based mode while testing. Later
              this will move into Settings.
            </p>
          </div>

          {setup_completed ? (
            <div className="ui-panel ui-stack-sm business-setup-name-panel">
              <div className="ui-kicker">Profile saved</div>
              <strong>Your current business setup is saved.</strong>
              <p className="ui-help">
                Saved mode: {selected_business_type.label}. You can change the
                business type above and save again while we build the mode-aware
                pages.
              </p>
              <p className="ui-help">
                You can now continue to Labour. The first thing we will do is
                enter your staff and their pay rates so QS Tools can work out
                the true labour cost, productive labour cost rate, and
                charge-out recovery position.
              </p>

              <div className="ui-actions">
                <button
                  type="button"
                  className="ui-button-primary"
                  onClick={continueToNextStep}
                >
                  Continue to Labour
                </button>
              </div>
            </div>
          ) : (
            <div className="ui-panel ui-stack-sm">
              <div className="ui-kicker">Not saved yet</div>
              <strong>Save the business profile to continue.</strong>
              <p className="ui-help">
                Enter a business name and choose a recovery driver before
                moving to the Labour page.
              </p>
            </div>
          )}

          <div className="ui-actions">
            <button
              type="button"
              className="ui-button-primary"
              onClick={saveBusinessSetup}
            >
              Save business profile
            </button>

            <button
              type="button"
              className="ui-button-secondary"
              onClick={resetBusinessSetup}
            >
              Reset Setup
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}