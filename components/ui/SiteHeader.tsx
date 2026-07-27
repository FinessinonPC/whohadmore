import { TopNav } from "@/components/ui/TopNav";

/**
 * The site header, rendered OUTSIDE each page's content container.
 *
 * Why it exists: TopNav used to be dropped inside whatever container a page
 * happened to use, and those ranged from max-w-game (540px) to max-w-4xl
 * (896px) with px-4 or px-5 padding. The result was a nav bar that visibly
 * changed width and alignment every time you moved between pages.
 *
 * Now the nav lives in its own fixed-width shell, so it renders identically on
 * every page while each page keeps whatever content width its layout needs
 * (the game boards stay deliberately narrow, the archive stays wide).
 */
export function SiteHeader() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 pt-5">
      <TopNav />
    </div>
  );
}
