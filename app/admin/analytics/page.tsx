import { AdminGate } from "@/components/admin/AdminGate";
import { AnalyticsView } from "@/components/admin/AnalyticsView";

export const dynamic = "force-dynamic";

export default function AdminAnalyticsPage() {
  return (
    <AdminGate>
      <AnalyticsView />
    </AdminGate>
  );
}
