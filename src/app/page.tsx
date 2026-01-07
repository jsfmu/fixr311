import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="card p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Fixr · 311-style MVP
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Create, save, and share city-ready reports in under a minute.
            </h1>
            <p className="text-slate-600">
              No logins, no photo storage. If AI is unavailable, we fall back to
              a template so the demo always works.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/create"
                className="rounded-md bg-indigo-600 px-5 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
              >
                Create a report
              </Link>
              <Link
                href="/map"
                className="rounded-md border border-slate-200 px-5 py-2 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
              >
                View map
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
            <p className="font-semibold">Demo checklist</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Create → Generate → Save</li>
              <li>Share page loads with draft text</li>
              <li>Map shows the new pin</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Create",
            desc: "Drop a pin, add notes, toggle approximate location for privacy, and upload an optional (not stored) photo.",
          },
          {
            title: "Generate",
            desc: "Use AI if configured; otherwise we fall back to a template. You can edit the draft before saving.",
          },
          {
            title: "Share & Map",
            desc: "Every report has a share link. The map page fetches pins by bounding box and stays populated with seed data.",
          },
        ].map((item) => (
          <div key={item.title} className="card p-5">
            <h3 className="text-lg font-semibold text-slate-900">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
