import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { MobileNav } from "@/components/MobileNav";
import { CookieBanner } from "@/components/CookieBanner";
import { StripeOnboardingNudge } from "@/components/StripeOnboardingNudge";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sportsbyttet.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sportsbytte — Kjøp og selg brukt sportsutstyr",
    template: "%s | Sportsbytte",
  },
  description:
    "Norges markedsplass for brukt sportsutstyr. Kjøp og selg direkte mellom klubbmedlemmer. Trygg kortbetaling, enkel frakt med Bring.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Sportsbytte",
    title: "Sportsbytte — Kjøp og selg brukt sportsutstyr",
    description:
      "Brukt sportsutstyr fra klubbmedlemmer. Trygg kortbetaling og frakt med Bring.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sportsbytte — Brukt utstyr. Ekte kvalitet. Din klubb.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sportsbytte — Kjøp og selg brukt sportsutstyr",
    description:
      "Brukt sportsutstyr fra klubbmedlemmer. Trygg kortbetaling og frakt med Bring.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  themeColor: "#134e4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <Footer />
        <Toaster />
        <MobileNav />
        <CookieBanner />
        <StripeOnboardingNudge />
      </body>
    </html>
  );
}
