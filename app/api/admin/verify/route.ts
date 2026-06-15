import { NextResponse } from "next/server";
import { isAdminConfigured, verifyPassword } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const configured = isAdminConfigured();
  let password = "";
  try {
    const body = (await req.json()) as { password?: string };
    password = body.password ?? "";
  } catch {
    /* empty body is fine */
  }

  return NextResponse.json({ ok: verifyPassword(password), configured });
}
