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
      <div className="mx-auto w-full max-w-2xl px-4 pt-8" id="minigames">
        <DayOverview date={date} />
        <MinigamesPanel date={date} />
        <h2 className="mt-10 font-condensed text-2xl font-semibold uppercase tracking-wide text-ink">
          Chain editor
        </h2>
      </div>
      <div id="chain-editor">
        <DayEditor date={date} />
      </div>
    </AdminGate>
  );
}
