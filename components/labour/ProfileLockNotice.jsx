"use client";

export default function ProfileLockNotice({ has_profile }) {
  if (has_profile) return null;

  return (
    <div className="rounded-xl border border-amber-700 bg-amber-950 px-4 py-3 text-sm text-amber-200">
      Create the labour profile first to unlock hours, pay, commercial, entitlements,
      and employer contribution inputs.
    </div>
  );
}