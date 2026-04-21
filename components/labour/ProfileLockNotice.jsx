"use client";

export default function ProfileLockNotice({
  has_profile = false,
}) {
  return (
    <section className="ui-section">
      <div className="ui-panel">
        <div className="ui-stack-sm">
          <div className="ui-kicker">Identity lock</div>
          <h2 className="ui-display">
            {has_profile ? "Profile identity locked" : "Create a profile first"}
          </h2>

          {has_profile ? (
            <p className="ui-help">
              This Labour profile is now active, so the identity fields are
              locked. To change the staff identity, start a new profile or load
              another saved one.
            </p>
          ) : (
            <p className="ui-help">
              Labour inputs stay locked until a profile exists because Labour
              owns staff identity and creates the staff record first.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}