import { notFound } from "next/navigation";
import { AdminGate } from "@/components/admin/AdminGate";
import { DayEditor } from "@/components/admin/DayEditor";
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
      <DayEditor date={date} />
      <div className="mx-auto w-full max-w-2xl px-4 pb-12">
        <MinigamesPanel date={date} />
      </div>
    </AdminGate>
  );
}
