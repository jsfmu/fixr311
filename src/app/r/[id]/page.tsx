import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import ShareActions from "@/components/ShareActions";
import { getReportsCollection } from "@/lib/db";
import { toReportResponse } from "@/lib/reports";
import type { ReportResponse } from "@/lib/types";

const StaticMap = dynamic(() => import("@/components/map/StaticMap"), {
  ssr: false,
});

export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReport(params.id);
  if (!report) {
    notFound();
  }

  const createdLabel = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(report.createdAt));

  const shareUrl = `/r/${report.id}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Share report
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">
            {report.issueType.replace("_", " ")} · {report.severity}
          </h1>
          <p className="text-sm text-slate-600">Created {createdLabel}</p>
        </div>
        <Link
          href="/create"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          Create another
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card space-y-3 p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Report text</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              Approx pin: {report.approxLocation ? "yes" : "no"}
            </span>
          </div>
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {report.descriptionFinal}
          </p>
          {report.descriptionUser ? (
            <p className="text-xs text-slate-500">
              Reporter notes: {report.descriptionUser}
            </p>
          ) : null}
        </div>

        <div className="card space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Location</h3>
          </div>
          <div className="text-sm text-slate-700">
            <p>
              Lat/Lng: {report.location.lat.toFixed(5)},{" "}
              {report.location.lng.toFixed(5)}
            </p>
            <p>Share URL: {shareUrl}</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <StaticMap location={report.location} />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-lg font-semibold text-slate-900">Share</h3>
        <p className="text-sm text-slate-600">
          Copy the draft or email it. No automatic portal submission in this MVP.
        </p>
        <div className="mt-3">
          <ShareActions
            description={report.descriptionFinal}
            shareUrl={shareUrl}
            issueType={report.issueType}
          />
        </div>
      </div>
    </div>
  );
}

async function getReport(id: string): Promise<ReportResponse | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await getReportsCollection();
  const doc = await collection.findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toReportResponse(doc);
}

