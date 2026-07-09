import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

// Condensed display face for the big stat numbers - editorial, not generic.
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
  weight: ["500", "600", "700"],
});

const description =
  "A daily higher/lower game. Two cards, one stat - tap the bigger number.";

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
  themeColor: "#0B0D10",
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
        description: "A free daily higher-or-lower guessing game.",
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
    <html lang="en" className={`${inter.variable} ${oswald.variable}`} suppressHydrationWarning>
      <head>
        {/* Apply the saved/system theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':true;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-background text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
        />
        {children}
      </body>
    </html>
  );
}
