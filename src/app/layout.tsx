import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LetsHelp - Patient Tech Support for Seniors",
    template: "%s | LetsHelp",
  },
  description:
    "AI-powered tech support for seniors. An assistant that sees your screen, hears your voice, and guides you step-by-step through any tech problem. Available 24/7.",
  keywords: [
    "senior tech support",
    "elderly tech help",
    "AI tech support",
    "senior computer help",
    "elderly assistance",
    "senior living technology",
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
    title: "LetsHelp - Patient Tech Support for Seniors",
    description:
      "AI-powered tech support that sees your screen and guides you step-by-step. Perfect for seniors who need patient, on-demand help with technology.",
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
    title: "LetsHelp - Patient Tech Support for Seniors",
    description:
      "AI-powered tech support that sees your screen and guides you step-by-step. Available 24/7 for seniors.",
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
    "AI-powered tech support for seniors. An assistant that sees your screen, hears your voice, and guides you step-by-step through any tech problem.",
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
    "Human volunteer backup",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
