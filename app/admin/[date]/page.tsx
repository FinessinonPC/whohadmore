import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminGate } from "@/components/admin/AdminGate";
import { DayEditor } from "@/components/admin/DayEditor";
import { DayOverview } from "@/components/admin/DayOverview";
import { MinigamesPanel } from "@/components/admin/MinigamesPanel";
import { isValidISODate } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function AdminDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isValidISODate(date)) notFound();

  return (
    <AdminGate>
      {/* One page-level nav bar at the top - the games live below it, in order. */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-6" id="minigames">
        <header className="flex items-center justify-between">
          <Link href="/admin" className="text-sm font-semibold text-ink-secondary transition-colors hover:text-ink">
            ‹ Calendar
          </Link>
          <Link
            href="/admin/analytics"
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink"
          >
            Analytics
          </Link>
        </header>

        <div className="mt-6">
          <DayOverview date={date} />
          <MinigamesPanel date={date} />
        </div>
      </div>
      <div id="chain-editor">
        <DayEditor date={date} />
      </div>
    </AdminGate>
  );
}
