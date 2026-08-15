import type { Metadata } from "next";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "BookGloss", template: "%s · BookGloss" },
  description: "A quiet place for the words you meet while reading.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider><Header />{children}</ThemeProvider></body></html>;
}
