import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { RegisterServiceWorker } from "@/components/register-sw";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Padel Social",
  description: "Live poulefase en knock-out voor je padeltoernooi.",
  manifest: "/manifest.json",
  themeColor: "#0E1420",
  viewport: { width: "device-width", initialScale: 1 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${barlowCondensed.variable} ${inter.variable}`}>
      <body className="bg-noise-test font-body text-flood-white antialiased">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
