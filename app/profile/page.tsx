import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your WhoHadMore level, streak, and lifetime stats.",
  alternates: { canonical: "/profile" },
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}
