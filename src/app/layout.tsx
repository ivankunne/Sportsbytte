import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { MobileNav } from "@/components/MobileNav";
import { InstallBanner } from "@/components/InstallBanner";
import { CookieBanner } from "@/components/CookieBanner";
import { StripeOnboardingNudge } from "@/components/StripeOnboardingNudge";
import { OnboardingNudge } from "@/components/OnboardingNudge";

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
    "Norges markedsplass for brukt sportsutstyr. Kjøp og selg direkte mellom klubbmedlemmer. Trygg kortbetaling og kjøperbeskyttelse.",
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
      "Brukt sportsutstyr fra klubbmedlemmer. Trygg kortbetaling og kjøperbeskyttelse.",
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
      "Brukt sportsutstyr fra klubbmedlemmer. Trygg kortbetaling og kjøperbeskyttelse.",
    images: ["/opengraph-image"],
  },
  alternates: {
    languages: {
      "nb": "https://sportsbytte.no",
      "x-default": "https://sportsbytte.no",
    },
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
      lang="nb"
      className={`${fraunces.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5BRFN8K9');` }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5BRFN8K9" height="0" width="0" style={{ display: "none", visibility: "hidden" }} /></noscript>
        <Header />
        <OnboardingNudge />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster />
        <InstallBanner />
        <MobileNav />
        <CookieBanner />
        <StripeOnboardingNudge />
      </body>
    </html>
  );
}
