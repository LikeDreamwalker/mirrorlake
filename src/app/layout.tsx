import type { Metadata } from "next";
import "./globals.css";
import { getColorAdvice } from "@/app/actions";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorProvider } from "@/provider";
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const res = await getColorAdvice("#0066FF");
  console.log(res, "?>?>?>1234");
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ColorProvider initialColor="#0066FF">
            <div className="flex justify-center">{children}</div>
            <Toaster />
          </ColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
