import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LetsHelp - Patient Tech Support & Scam Protection for Seniors",
    template: "%s | LetsHelp",
  },
  description:
    "AI-powered tech help and scam protection for seniors. An assistant that sees your screen and guides you step-by-step — plus Pause & Check, which helps you spot scam texts, calls, and pop-ups before you click, call, or pay. Available 24/7.",
  keywords: [
    "senior tech support",
    "elderly tech help",
    "AI tech support",
    "senior computer help",
    "scam protection for seniors",
    "scam detection",
    "senior scam prevention",
    "patient tech support",
    "screen sharing support",
    "senior-friendly technology",
    "aging in place tech",
  ],
  authors: [{ name: "LetsHelp" }],
  creator: "LetsHelp",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "LetsHelp",
    title: "LetsHelp - Patient Tech Support & Scam Protection for Seniors",
    description:
      "AI-powered tech help that sees your screen and guides you step-by-step — plus Pause & Check to help seniors spot scams before they click, call, or pay.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LetsHelp - Senior Tech Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LetsHelp - Patient Tech Support & Scam Protection for Seniors",
    description:
      "AI tech help that sees your screen and guides you step-by-step, plus Pause & Check scam protection. Available 24/7 for seniors.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LetsHelp",
  description:
    "AI-powered tech help and scam protection for seniors. An assistant that sees your screen and guides you step-by-step, plus Pause & Check to help spot scam texts, calls, and pop-ups before you click, call, or pay.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "20",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "20",
      priceCurrency: "USD",
      billingDuration: "P1M",
    },
  },
  audience: {
    "@type": "PeopleAudience",
    suggestedGender: ["female", "male"],
    suggestedMinAge: 65,
  },
  featureList: [
    "Screen sharing support",
    "Voice-guided instructions",
    "24/7 availability",
    "Patient, personalized assistance",
    "Scam-safety checks",
  ],
  provider: {
    "@type": "Organization",
    name: "LetsHelp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${plusJakartaSans.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
            <Toaster richColors position="top-right" />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
