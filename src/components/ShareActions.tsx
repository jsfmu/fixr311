"use client";

import { useState } from "react";

type Props = {
  description: string;
  shareUrl: string;
  issueType: string;
};

export default function ShareActions({
  description,
  shareUrl,
  issueType,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard failed", err);
    }
  };

  const mailto = `mailto:?subject=${encodeURIComponent(
    `Fixr report: ${issueType}`,
  )}&body=${encodeURIComponent(`${description}\n\nView: ${shareUrl}`)}`;

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        {copied ? "Copied!" : "Copy report"}
      </button>
      <a
        href={mailto}
        className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        Email draft
      </a>
      <a
        href="/map"
        className="rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800 transition hover:border-indigo-300 hover:bg-indigo-100"
      >
        View on map
      </a>
    </div>
  );
}

