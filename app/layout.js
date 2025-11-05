import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SEO_DEFAULTS } from "@/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: SEO_DEFAULTS.TITLE,
  description: SEO_DEFAULTS.DESCRIPTION,
  keywords: SEO_DEFAULTS.KEYWORDS.join(", "),
  openGraph: {
    title: SEO_DEFAULTS.TITLE,
    description: SEO_DEFAULTS.DESCRIPTION,
    type: "website",
    images: [
      {
        url: SEO_DEFAULTS.OG_IMAGE,
        width: 1200,
        height: 630,
        alt: SEO_DEFAULTS.TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_DEFAULTS.TITLE,
    description: SEO_DEFAULTS.DESCRIPTION,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
