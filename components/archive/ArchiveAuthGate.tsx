"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";

export function ArchiveAuthGate({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !profile?.username) {
      router.replace("/profile");
    }
  }, [loading, profile, router]);

  if (loading || !profile?.username) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-ink"></div>
      </div>
    );
  }

  return <>{children}</>;
}
