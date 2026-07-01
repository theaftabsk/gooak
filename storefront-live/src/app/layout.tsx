import type { Metadata } from "next";
import "./globals.css";
import StorefrontShellDynamic from "@/components/layout/StorefrontShellDynamic";

export const metadata: Metadata = {
  title: "OakSol Store",
  description: "Your online shop",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <StorefrontShellDynamic>{children}</StorefrontShellDynamic>
      </body>
    </html>
  );
}
