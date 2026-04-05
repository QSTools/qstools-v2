"use client";

export default function ProfileLockNotice({ has_profile }) {
  if (has_profile) return null;

  return (
    <div className="rounded-xl border border-[var(--warning)] bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]">
      Create the labour profile first to unlock hours, pay, commercial, entitlements,
      and employer contribution inputs.
    </div>
  );
}