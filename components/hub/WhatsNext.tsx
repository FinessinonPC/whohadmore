"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSessionId } from "@/lib/playStore";
import { getRun, startRun } from "@/lib/runStore";
import { useCountdown } from "@/hooks/useCountdown";
import { trackEvent } from "@/lib/clientTrack";
import type { DealtCard } from "@/app/api/archive/random/route";

// ============================================================================
// What to do once the card is finished. Two shapes, one idea: name the dead
// time, then offer something to fill it.
//
//   Today  -> the countdown to tomorrow's card, then a deal.
//   Archive -> the next card, NAMED before you commit, so a run is a series of
//              choices rather than a treadmill.
// ============================================================================

/** Deal a card the player hasn't finished. `exclude` keeps a run from handing
 *  back the card just played. Null when the archive is exhausted. */
async function deal(exclude: string[] = []): Promise<DealtCard | null> {
  try {
    const params = new URLSearchParams({ session: getSessionId() });
    if (exclude.length) params.set("exclude", exclude.join(","));
    const res = await fetch(`/api/archive/random?${params}`);
    const data = (await res.json()) as { card?: DealtCard; none?: boolean };
    return data.card ?? null;
  } catch {
    return null;
  }
}

const goldButton =
  "ink-fix wonky flex w-full items-center justify-center border-2 border-ink bg-[#F8E6A2] px-4 py-3.5 text-[15px] font-bold text-ink ink-shadow-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";
const quietButton =
  "wonky flex w-full items-center justify-center border-2 border-ink bg-surface px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-border/30";

/** Today's card is done: here's the wait, and here's how to skip it. */
export function WhatsNextToday() {
  const countdown = useCountdown();
  const [remaining, setRemaining] = useState<number | null>(null);

  // Only used for the copy - the actual deal happens on /random so the button
  // is a plain link that works before this resolves (or if it never does).
  useEffect(() => {
    let cancelled = false;
    void deal().then((c) => {
      if (!cancelled && c) setRemaining(c.remaining + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="card-ink tilt-r px-5 pb-4 pt-4">
      <div className="flex items-baseline justify-between">
        <span className="small-caps text-[10px] font-bold text-ink-secondary">Next card in</span>
        <span className="tabular font-condensed text-[26px] font-semibold leading-none text-ink">
          {countdown || "—"}
        </span>
      </div>

      <div className="my-3.5 border-t-2 border-dashed border-border" />

      <p className="font-condensed text-[20px] font-semibold leading-tight text-ink">
        Don&apos;t just sit there.
      </p>
      <p className="mt-1 text-[12px] leading-snug text-ink-secondary">
        {remaining === null
          ? "Deal yourself a card from the archive and keep going as long as you like."
          : remaining === 0
            ? "You've played every card in the archive. Genuinely - well done."
            : `${remaining.toLocaleString()} ${remaining === 1 ? "card" : "cards"} you haven't played. Deal one at random and keep going as long as you like.`}
      </p>

      {remaining !== 0 && (
        <Link
          href="/random"
          onClick={() => trackEvent("deal_click", { surface: "hub_today" })}
          className={`${goldButton} mt-3`}
        >
          Deal me a card →
        </Link>
      )}
      <Link
        href="/archive"
        onClick={() => trackEvent("past_card_click", { surface: "hub_today" })}
        className={`${quietButton} mt-2`}
      >
        Browse the archive
      </Link>
    </div>
  );
}

/**
 * An archived card is done: hand off to the next one. The card is named and
 * fetched up front so the player is choosing a topic, not pulling a lever -
 * and "deal a different one" means an unappealing topic doesn't end the run.
 */
export function NextCardInRun({ date }: { date: string }) {
  const router = useRouter();
  const [card, setCard] = useState<DealtCard | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  const load = (exclude: string[]) => {
    setState("loading");
    void deal(exclude).then((c) => {
      setCard(c);
      setState(c ? "ready" : "empty");
    });
  };

  useEffect(() => {
    const run = getRun();
    load([date, ...(run?.dates ?? [])]);
    // Re-dealing on every render would reshuffle the card under the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  if (state === "empty") {
    return (
      <div className="card-ink tilt-r px-5 py-4 text-center">
        <p className="font-condensed text-[20px] font-semibold leading-tight text-ink">
          That&apos;s the whole archive.
        </p>
        <p className="mt-1 text-[12px] leading-snug text-ink-secondary">
          Every published card is played. A new one lands at midnight.
        </p>
        <Link href="/" className={`${goldButton} mt-3`}>
          Back to today&apos;s card
        </Link>
      </div>
    );
  }

  return (
    <div className="card-ink tilt-r px-5 pb-4 pt-4">
      <span className="small-caps text-[10px] font-bold text-ink-secondary">Up next</span>
      <p className="mt-1 min-h-[26px] font-condensed text-[22px] font-semibold leading-tight text-ink">
        {card ? `No. ${card.gameNumber} · ${card.topicLabel}` : "Dealing…"}
      </p>
      <p className="mt-1 text-[12px] leading-snug text-ink-secondary">
        {card && card.remaining > 0
          ? `Dealt from the ${card.remaining.toLocaleString()} you still haven't played.`
          : "The last one you haven't played."}
      </p>

      <button
        disabled={!card}
        onClick={() => {
          if (!card) return;
          startRun();
          trackEvent("deal_click", { surface: "run_next" });
          router.push(`/day/${card.date}`);
        }}
        className={`${goldButton} mt-3 disabled:opacity-50`}
      >
        Play it →
      </button>
      <button
        onClick={() => {
          const run = getRun();
          load([date, ...(card ? [card.date] : []), ...(run?.dates ?? [])]);
        }}
        className={`${quietButton} mt-2`}
      >
        Deal a different one
      </button>
    </div>
  );
}
