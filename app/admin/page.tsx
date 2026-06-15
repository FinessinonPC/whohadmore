import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { GameCalendar } from "@/components/admin/GameCalendar";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <AdminGate>
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">
              Game Calendar
            </h1>
            <p className="mt-0.5 text-sm text-ink-secondary">
              Plan and publish the daily games.
            </p>
          </div>
          <Link
            href="/play"
            className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-ink"
          >
            View site
          </Link>
        </header>

        <GameCalendar />

        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-correct/45 bg-correct/10" /> Published
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-[#FFB300]/55 bg-[#FFB300]/10" /> Draft
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-border bg-surface/60" /> Empty
          </span>
        </div>
      </main>
    </AdminGate>
  );
}
