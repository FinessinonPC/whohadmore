import { redirect } from "next/navigation";

// Today's game lives at the root now; keep /play working for old links.
export default function PlayPage() {
  redirect("/");
}
