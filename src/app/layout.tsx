import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";

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
    default: "Sportsbyttet — Kjøp og selg brukt sportsutstyr",
    template: "%s | Sportsbyttet",
  },
  description:
    "Norges markedsplass for brukt sportsutstyr. Kjøp og selg direkte mellom klubbmedlemmer. Trygg betaling med Vipps, enkel frakt med Bring.",
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "Sportsbyttet",
    title: "Sportsbyttet — Kjøp og selg brukt sportsutstyr",
    description:
      "Brukt sportsutstyr fra klubbmedlemmer. Trygg handel med Vipps og Bring.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sportsbyttet — Brukt utstyr. Ekte kvalitet. Din klubb.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sportsbyttet — Kjøp og selg brukt sportsutstyr",
    description:
      "Brukt sportsutstyr fra klubbmedlemmer. Trygg handel med Vipps og Bring.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
