import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Fixr | Fast 311 drafts",
  description:
    "Fixr helps residents draft and share city-ready 311-style reports in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <div className="min-h-screen">
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="text-lg font-semibold text-slate-900">
                Fixr
              </Link>
              <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
                <Link href="/create" className="hover:text-slate-900">
                  Create
                </Link>
                <Link href="/map" className="hover:text-slate-900">
                  Map
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-10 text-sm text-slate-500">
            Demo-only prototype. No accounts. Photos are never stored.
          </footer>
        </div>
      </body>
    </html>
  );
}
