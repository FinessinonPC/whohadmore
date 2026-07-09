import { isFuture } from "@/lib/date";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

/** 
 * Enforces that future dates cannot be accessed publicly.
 * Allows access only if the admin preview cookie is set.
 */
export async function requireDateAccess(date: string): Promise<void> {
  if (isFuture(date)) {
    const ck = await cookies();
    if (ck.get("whohadmore_admin_preview")?.value !== "1") {
      notFound();
    }
  }
}
