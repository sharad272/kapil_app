import type { Metadata, Viewport } from "next";
import { Geist, Source_Serif_4 } from "next/font/google";
import { IndiaTheme } from "@/components/india-theme";
import { SwipeBack } from "@/components/swipe-back";
import { INDIA_THEME_BOOT } from "@/lib/india-day";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kapilapp.vercel.app"),
  title: {
    default: "Team Victory — Cross Sell",
    template: "%s · Team Victory",
  },
  description: "Team Victory Cross Sell desk — APE, FRP, quality and certifications for relationship managers.",
  applicationName: "Team Victory",
  appleWebApp: {
    capable: true,
    title: "Team Victory",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1E2761",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="day"
      suppressHydrationWarning
      className={`${geistSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INDIA_THEME_BOOT }} />
      </head>
      <body className="min-h-full">
        <IndiaTheme />
        <SwipeBack />
        {children}
      </body>
    </html>
  );
}
