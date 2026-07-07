// ============================================================================
// Weekday themes for the Chain game - every weekday has a flavor, derived
// from the date (no schema, no admin work). Shown on the hub and start
// screen, and baked into the admin's AI prompt so generated games fit.
// ============================================================================

export interface WeekdayTheme {
  name: string;
  /** Steers the admin AI generator toward the theme. */
  hint: string;
}

/** Indexed by JS getUTCDay(): 0 = Sunday. */
export const WEEKDAY_THEMES: WeekdayTheme[] = [
  {
    name: "Surprise Sunday",
    hint: "Anything goes - pick a delightfully unexpected topic from any corner of life (science, history, everyday objects, oddball records). The surprise IS the theme.",
  },
  {
    name: "Movie Monday",
    hint: "Movies and TV: runtimes, episode counts, box office, franchise sizes, awards, famous props and budgets - screen stats of every kind.",
  },
  {
    name: "Trending Tuesday",
    hint: "The internet: search interest, followers, subscribers, streams, downloads, viral moments - online and trending numbers.",
  },
  {
    name: "World Wednesday",
    hint: "Geography: countries, cities, rivers, mountains, landmarks, distances, populations, elevations - the numbers of the map.",
  },
  {
    name: "Celebrity Thursday",
    hint: "Famous people: ages, heights, career counts, records, discographies, filmographies - celebrity stats (keep it kind, no gossip).",
  },
  {
    name: "Foodie Friday",
    hint: "Food and drink: calories, caffeine, ingredients, cook times, world consumption, menu prices, harvest numbers - everything edible.",
  },
  {
    name: "Scoreboard Saturday",
    hint: "Sports: players, teams, records, speeds, salaries, championships - stats from any sport, mainstream or obscure.",
  },
];

export function themeFor(date: string): WeekdayTheme {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return WEEKDAY_THEMES[day] ?? WEEKDAY_THEMES[0];
}
