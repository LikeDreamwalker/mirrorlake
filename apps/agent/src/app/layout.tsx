import type React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorStoreProvider } from "@/provider";
import { Analytics } from "@vercel/analytics/next";
import { Suspense } from "react";

export const viewport: Viewport = {
  themeColor: "#0066FF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | Mirrorlake",
    default: "Mirrorlake - AI-Powered Color Selection Tool",
  },
  description:
    "An aggregated color agent with LLM, Engineering and AI capabilities for selecting colors and building themes.",
  keywords: [
    "color picker",
    "color agent",
    "AI color tool",
    "theme builder",
    "color palette",
    "DeepSeek",
    "color accessibility",
  ],
  authors: [{ name: "LikeDreamwalker" }],
  creator: "LikeDreamwalker",
  publisher: "LikeDreamwalker",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mirrorlake.ldwid.com",
    title: "Mirrorlake - AI-Powered Color Selection Tool",
    description:
      "An aggregated color agent with LLM, Engineering and AI capabilities for selecting colors and building themes.",
    siteName: "Mirrorlake",
    images: [
      {
        url: "https://mirrorlake.ldwid.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mirrorlake Interface",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirrorlake - AI-Powered Color Selection Tool",
    description:
      "An aggregated color agent with LLM, Engineering and AI capabilities for selecting colors and building themes.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://mirrorlake.ldwid.com",
  },
};

export default async function RootLayout({
  children,
  searchParams,
}: Readonly<{
  children: React.ReactNode;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const resolvedSearchParams = await searchParams;
  const colorParam =
    typeof resolvedSearchParams?.color === "string"
      ? resolvedSearchParams.color
      : Array.isArray(resolvedSearchParams?.color)
        ? resolvedSearchParams.color[0]
        : undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ColorStoreProvider initialColor={colorParam}>
            <Suspense>
              <div className="flex justify-center h-screen w-screen">
                {children}
                <Analytics />
              </div>
            </Suspense>
            <Toaster />
          </ColorStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
