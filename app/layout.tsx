import type { Metadata } from "next";
import { Barlow_Condensed, Inter, Plus_Jakarta_Sans } from "next/font/google";
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

// Design 6A trial only (see components/mint/) — not used anywhere else yet.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const DEFAULT_DESCRIPTION = "Volg live de standen, je baanindeling en de knock-out.";

export const metadata: Metadata = {
  metadataBase: new URL("https://event.padelsocial.nl"),
  title: "Padel Social",
  description: DEFAULT_DESCRIPTION,
  manifest: "/manifest.json",
  themeColor: "#0E1420",
  viewport: { width: "device-width", initialScale: 1 },
  // Fallback link-preview card — pages with their own event context (the landing
  // page, /[slug]) override title/description via generateMetadata but inherit
  // this image and card type unless they say otherwise.
  openGraph: {
    title: "Padel Social",
    description: DEFAULT_DESCRIPTION,
    images: ["/social/padel-social-og-thumb-whatsapp.png"],
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Padel Social",
    description: DEFAULT_DESCRIPTION,
    images: ["/social/padel-social-og-thumb-whatsapp.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${barlowCondensed.variable} ${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="bg-noise-test font-body text-flood-white antialiased">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
