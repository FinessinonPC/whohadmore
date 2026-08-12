// ============================================================================
// Evergreen copy for each game's permanent landing page (/games/<id>).
//
// Why this exists: the daily puzzle lives at a URL that changes every day
// (/word/2026-07-27), so Google can never accumulate ranking signal for it.
// These pages sit at a STABLE url forever, so links and authority compound in
// one place - and they carry the real, crawlable prose that a JS game can't.
//
// Written to be genuinely useful to a human first (it's the page a curious
// player lands on), keyword-honest second. No stuffing.
// ============================================================================

import type { ModeId } from "@/lib/modes";

export interface GameFaq {
  q: string;
  a: string;
}

export interface GameSeo {
  id: ModeId;
  /** <title> - what someone would actually type. */
  seoTitle: string;
  metaDescription: string;
  /** <h1> on the page. */
  heading: string;
  /** One-line positioning under the h1. */
  standfirst: string;
  /** 2-3 paragraphs: what the game is and why it's worth a minute. */
  about: string[];
  /** Numbered rules - rendered as an ordered list. */
  howToPlay: string[];
  /** Scoring explanation, in plain language. */
  scoring: string;
  /** 3-4 concrete tips - the stuff that earns links and repeat reads. */
  strategy: { title: string; body: string }[];
  faqs: GameFaq[];
}

const CHAIN: GameSeo = {
  id: "chain",
  seoTitle: "Chain - The Daily Higher or Lower Game",
  metaDescription:
    "Play Chain free every day: a higher-or-lower guessing game across sports, movies, geography and more. One new run every midnight, no download, no account needed.",
  heading: "Chain",
  standfirst: "The daily higher-or-lower run. One stat, two cards, how far can you get?",
  about: [
    "Chain is a daily higher-or-lower game. You get two cards side by side and a single statistic - points per game, box office gross, population, whatever the day's topic happens to be - and you call which one is higher. Get it right and the chain continues, with the card you just picked carrying forward against a fresh challenger.",
    "Every day is a new topic. One morning it's NBA scoring leaders, the next it's the highest-grossing films of the 2000s or the most populous countries in Africa. The format stays the same; the subject keeps you honest. You can't grind out a strategy that works forever, which is exactly what makes it worth coming back to.",
    "A full run takes about a minute. There's no timer breathing down your neck and nothing to install - open the page, make your calls, and see how far the chain goes.",
  ],
  howToPlay: [
    "You're shown two cards, each with the same kind of statistic.",
    "Tap the card you think has the higher value.",
    "Guess right and the chain continues - your pick moves on to face a new card.",
    "Guess wrong and that link breaks, but the run keeps going to the end of the deck.",
    "Your score is how many calls you got right out of the day's rounds.",
  ],
  scoring:
    "Chain scores on how many calls you got right, on the same 0-1,000 scale as the other three games, so no single game dominates your daily total. Get every call right and you bank a perfect 1,000. Your score joins the day's leaderboard and counts toward your all-time total.",
  strategy: [
    {
      title: "Anchor on the extremes",
      body: "The easiest calls are the ones near the top or bottom of a distribution. If a card is an obvious outlier - the all-time leader, the blockbuster everyone remembers - trust it and move on quickly.",
    },
    {
      title: "Beware of recency bias",
      body: "The player or film you've heard about most recently is not necessarily the one with the bigger number. Career totals in particular reward longevity, not fame.",
    },
    {
      title: "Read the stat, not the name",
      body: "The same two entities can flip depending on whether the stat is a total, an average, or a rate. Check what's actually being measured before you commit.",
    },
    {
      title: "Play the odds on unknowns",
      body: "When you genuinely don't know either card, pick the one from the larger population, longer career, or bigger market. It's not a guarantee, but it's better than a coin flip.",
    },
  ],
  faqs: [
    {
      q: "Is Chain free to play?",
      a: "Yes. Chain is completely free, plays in your browser on phone or desktop, and needs no download. You can play without an account, though a free account saves your streak and scores.",
    },
    {
      q: "How often does a new Chain puzzle come out?",
      a: "A new Chain drops every day at midnight, with a fresh topic and a new set of cards.",
    },
    {
      q: "Can I play previous Chain puzzles?",
      a: "Yes. Every past day lives in the archive with its full set of games and that day's leaderboard, and archive plays still earn points toward your career total and your level.",
    },
    {
      q: "What topics does Chain cover?",
      a: "Sports, entertainment, geography, science and current events, rotating daily. Each day's topic is announced on the card before you start.",
    },
  ],
};

const DUALITY: GameSeo = {
  id: "duality",
  seoTitle: "Duality - The Daily Double Meanings Word Game",
  metaDescription:
    "Play Duality free every day: eight definitions hide four pairs, and each pair is one word with two unrelated meanings. A new word puzzle every midnight.",
  heading: "Duality",
  standfirst: "Eight definitions. Four hidden pairs. Every pair is one word wearing two meanings.",
  about: [
    "Duality is a daily word puzzle built on a simple, sneaky idea: a single word can mean two completely unrelated things. \"The side of a river\" and \"a place that holds your money\" are both BANK. Your job is to find the four hidden pairs among eight shuffled definitions.",
    "What makes it hard isn't vocabulary - it's misdirection. The definitions are written so that several of them look like they belong together, and the pair you're sure about is often the one that breaks your board. Three wrong lock-ins and the round ends.",
    "It takes about a minute when it clicks and considerably longer when it doesn't. Either way it's the kind of puzzle where the answer feels obvious in hindsight, which is the whole point.",
  ],
  howToPlay: [
    "You're shown eight short definitions in a shuffled grid.",
    "Hidden among them are four pairs - each pair is two meanings of the SAME word.",
    "Tap two definitions you think belong together, then lock them in.",
    "A correct pair collapses into a banner revealing the word.",
    "Three wrong lock-ins ends the round, so guess deliberately.",
  ],
  scoring:
    "Every pair you find banks points, with a speed bonus on a full solve and a penalty for each wrong lock-in. A fast, flawless solve is worth the full 1,000. Partial progress always pays something, so finding two pairs still counts toward your daily total and the leaderboard.",
  strategy: [
    {
      title: "Start with the odd one out",
      body: "Look for the definition that seems least like the others. Unusual or specific phrasings tend to belong to the least common meaning of a word, which narrows its partner quickly.",
    },
    {
      title: "Say the definition out loud as a word",
      body: "Instead of matching definitions to each other, try converting each one into a single word first, then look for duplicates in your list. It reframes the puzzle from comparison to recall.",
    },
    {
      title: "Hold your riskiest pair for last",
      body: "With three mistakes allowed, spend them wisely. Lock in the pairs you're certain about first - each solved pair removes two decoys and makes what's left far easier.",
    },
    {
      title: "Watch for verbs hiding as nouns",
      body: "Many of the trickiest pairs use a word that works as both. If a definition describes an action, check whether the same word also names a thing.",
    },
  ],
  faqs: [
    {
      q: "What is Duality?",
      a: "Duality is a daily double meanings puzzle where eight definitions conceal four pairs. Each pair is a single word with two unrelated meanings - your job is to find all four.",
    },
    {
      q: "How many mistakes can I make in Duality?",
      a: "Three. A fourth wrong lock-in ends the round, though every pair you found still counts toward your score.",
    },
    {
      q: "Is Duality like Connections?",
      a: "They share a grid-and-grouping feel, but Duality is built on double meanings rather than categories: every pair is the same word twice, not four related items.",
    },
    {
      q: "Do I need an account to play Duality?",
      a: "No. Duality is free and playable without signing up. A free account saves your streak, stats and place on the leaderboard.",
    },
  ],
};

const WORD: GameSeo = {
  id: "word",
  seoTitle: "Word - The Free Daily 5-Letter Word Game",
  metaDescription:
    "Play Word free every day: six tries to find the five-letter word, with green and yellow letter hints. A new word every midnight, no download or signup needed.",
  heading: "Word",
  standfirst: "Six tries to find the five letters. You already know how this one works.",
  about: [
    "Word is the daily five-letter guessing game, played the way you'd expect: six attempts, colour-coded feedback after each guess, one answer per day for everyone. Green means the letter is in the right spot, yellow means it's in the word but somewhere else, grey means it isn't there at all.",
    "What's different here is that Word doesn't stand alone. It's one of four games on the day's card, and your result feeds a single combined score alongside Chain, Duality and the Mini crossword. Solving in two guesses is satisfying on its own; it's more satisfying when it moves your total.",
    "A round takes a minute or two. Even a loss pays partial credit for the letters you managed to lock in green, so a near miss is never a total wash.",
  ],
  howToPlay: [
    "Type any valid five-letter word and press enter.",
    "Green tiles mark letters that are correct and in the right position.",
    "Yellow tiles mark letters that are in the word but in a different spot.",
    "Grey tiles mark letters that don't appear in the answer at all.",
    "You have six tries to land the exact word.",
  ],
  scoring:
    "Solving in one guess is worth the full 1,000 points, dropping by 100 for each additional guess down to 500 for a sixth-try finish. A loss still pays partial credit for every letter you proved green, so a close miss keeps something on the board. Your result joins your daily total and all-time score.",
  strategy: [
    {
      title: "Open with vowel coverage",
      body: "A strong first guess tests several common vowels and consonants at once. Words like AROSE, SLATE or CRANE eliminate a large share of the alphabet in one move.",
    },
    {
      title: "Don't chase greens too early",
      body: "On your second guess it's often better to test five brand-new letters than to reshuffle the ones you've already confirmed. Information beats partial progress in the early rounds.",
    },
    {
      title: "Mind repeated letters",
      body: "Plenty of answers double a letter, and that's where most six-guess losses come from. If you're stuck with four confirmed letters and no fit, try doubling one of them.",
    },
    {
      title: "Save a safe guess for the end",
      body: "If you reach guess five with several possibilities left, pick the option that distinguishes between them rather than the one you merely hope is right.",
    },
  ],
  faqs: [
    {
      q: "Is Word free?",
      a: "Yes, completely free with no download and no account required. Signing up is optional and just saves your streak and stats.",
    },
    {
      q: "How many guesses do I get?",
      a: "Six. Green means the letter is correctly placed, yellow means it's in the word elsewhere, grey means it isn't in the word.",
    },
    {
      q: "Does everyone get the same word?",
      a: "Yes. Every player gets the same five-letter answer each day, and a new word drops at midnight.",
    },
    {
      q: "What happens if I don't solve it?",
      a: "You still score partial credit for each letter you locked in green, so an unsolved board still contributes to your daily total.",
    },
  ],
};

const MINI: GameSeo = {
  id: "mini",
  // Written against Search Console rather than guessed. "mini crosswords free"
  // converted at 2 clicks from 2 impressions - every single person who saw it
  // clicked - while bare "mini crossword" took 3 from 46 at an average
  // position of 54. The volume is on the head term and the intent is on the
  // qualified one, and "free, no account" is the half NYT structurally cannot
  // say. So the title leads with free and the description spends its words on
  // no account, no app, no subscription.
  seoTitle: "Free Mini Crossword - Daily 5x5, No Account Needed",
  metaDescription:
    "A free daily mini crossword: 5x5 grid, quick clues, about a minute to solve. No account, no app, no subscription - just open it and play. New puzzle every midnight.",
  heading: "Mini",
  standfirst: "A five-by-five crossword, sized for a coffee break.",
  about: [
    "Mini is a daily 5x5 crossword: ten short answers, clean fill, and clues written to be solvable rather than punishing. It's built for the gap between things - the queue, the bus, the first coffee - and most people finish in a minute or two.",
    "The grid is small enough that every letter matters. A single crossing you're sure about will often unlock two more answers, which is what makes a mini feel quick even when the clues aren't obvious. If you get truly stuck, Check will confirm the letters you've placed, at a small cost to your score.",
    "Like the rest of the card, it's free, needs no account, and refreshes at midnight with a brand new grid and clues.",
  ],
  howToPlay: [
    "Tap any square to start filling in an answer; tap again to switch between across and down.",
    "Type letters to fill the grid - the cursor advances automatically.",
    "Use the clue bar to move between entries, or press enter to jump to the next unfilled one.",
    "Hit Check to verify the letters you've placed if you get stuck.",
    "The puzzle completes itself the moment every square is correct.",
  ],
  scoring:
    "The Mini scores from a solve base plus a speed bonus, minus a penalty for each Check you use. A clean solve inside par earns the full 1,000. Revealing the grid pays partial credit for the letters you had right, always below a genuine solve.",
  strategy: [
    {
      title: "Fill the short answers first",
      body: "Three-letter entries have far fewer possibilities than five-letter ones. Lock those in and the crossings will hand you most of the longer answers for free.",
    },
    {
      title: "Use the crossings, not the clue",
      body: "When a clue leaves you blank, ignore it and solve the words that cross it. Two or three confirmed letters usually make the answer obvious without ever parsing the clue.",
    },
    {
      title: "Watch for plural and tense hints",
      body: "A clue phrased in the plural almost always wants an S at the end, and a past-tense clue usually wants ED. In a 5x5, that single letter can crack the whole corner.",
    },
    {
      title: "Solve clean if you're chasing points",
      body: "Each Check costs you points, so it's worth sitting with a tough crossing for a few extra seconds before reaching for it. Speed matters, but a clean solve matters more.",
    },
  ],
  faqs: [
    {
      q: "Is the Mini crossword free?",
      a: "Yes. The Mini is free to play in your browser with no download and no account required.",
    },
    {
      q: "How big is the grid?",
      a: "Five by five, with around ten answers across and down. Most players finish in a minute or two.",
    },
    {
      q: "Is there a new mini crossword every day?",
      a: "Yes, a brand new grid and clue set every day at midnight, alongside the other three games.",
    },
    {
      q: "What does the Check button do?",
      a: "Check confirms whether the letters you've filled in are correct. It's there when you're stuck, but each use costs you some points.",
    },
  ],
};

const BY_ID: Record<ModeId, GameSeo> = {
  chain: CHAIN,
  duality: DUALITY,
  word: WORD,
  mini: MINI,
};

export const GAME_SEO: GameSeo[] = [CHAIN, DUALITY, WORD, MINI];

export function gameSeo(id: string): GameSeo | undefined {
  return BY_ID[id as ModeId];
}
