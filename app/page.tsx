import { redirect } from "next/navigation";

// The home route always sends players to today's game.
export default function Home() {
  redirect("/play");
}
