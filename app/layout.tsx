import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Patrick_Hand, Permanent_Marker } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// The scorecard is filled in BY HAND: Patrick Hand (a real person's print) is
// the handwriting every label, clue and sentence is written in; Permanent
// Marker is the fat pen for scores, game names and crossword letters; Oswald
// stays as the PRINTED masthead type (the brand name, page titles).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
  weight: ["500", "600", "700"],
});

const hand = Patrick_Hand({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
  weight: "400",
});

const marker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-marker",
  display: "swap",
  weight: "400",
});

const description =
  "A free set of 4 quick daily puzzles: Chain, Duality, Word, and Mini.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "WhoHadMore", template: "%s · WhoHadMore" },
  description,
  applicationName: "WhoHadMore",
  appleWebApp: { capable: true, title: "WhoHadMore", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: "WhoHadMore",
    title: "WhoHadMore",
    description,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "WhoHadMore", description },
};

export const viewport: Viewport = {
  themeColor: "#EAE3D2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteUrl = getSiteUrl();
  const siteLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "WhoHadMore",
        description: "A free set of 4 quick daily puzzles: Chain, Duality, Word, and Mini.",
        publisher: { "@id": `${siteUrl}/#org` },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#org`,
        name: "WhoHadMore",
        url: siteUrl,
        logo: `${siteUrl}/icon.svg`,
      },
      {
        "@type": "WebApplication",
        name: "WhoHadMore",
        url: siteUrl,
        applicationCategory: "GameApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable} ${hand.variable} ${marker.variable}`} suppressHydrationWarning>
      <head>
        {/* Paper-first: light is the flagship look; dark only when chosen. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-background text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
