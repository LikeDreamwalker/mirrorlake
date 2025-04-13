import type { Metadata } from "next";
import "./globals.css";
import { test } from "@/app/actions/test";
import { Toaster } from "@/components/ui/sonner";
import { ColorPickerProvider } from "@/components/color-picker/context";
export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const res = await test();
  console.log(res, "?>?>?>1234");
  return (
    <html lang="en">
      <body>
        <ColorPickerProvider initialColor="#0066FFFF">
          {children}
          <Toaster />
        </ColorPickerProvider>
      </body>
    </html>
  );
}
