import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

const description =
  "A daily higher/lower game. Two cards, one stat — tap the bigger number.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-background text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
