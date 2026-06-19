"use client";

import RateBuilderMainCard from "@/components/rate-builder/RateBuilderMainCard";

export default function RateBuilderPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
            Rate Builder
          </p>

          <div className="mt-2 flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-white">
              Customer Charge Rate Builder
            </h1>

            <p className="max-w-4xl text-sm leading-6 text-slate-300">
              Define the customer charge lines, units, and rates the business
              uses. Use the calculator to test example quantities and convert
              the total charge into an effective rate against the selected
              output driver.
            </p>
          </div>
        </section>

        <RateBuilderMainCard />
      </div>
    </main>
  );
}