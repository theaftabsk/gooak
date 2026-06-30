import type { Metadata } from "next";
import "@oaksol/shared-ui";
import "./globals.css";
import { DashboardShellDynamic } from "@/components/layout/DashboardShellDynamic";

export const metadata: Metadata = {
  title: "OakSol E-Commerce Platform",
  description: "SaaS Multi-tenant E-Commerce Platform Admin and Storefront Console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <DashboardShellDynamic>{children}</DashboardShellDynamic>
      </body>
    </html>
  );
}
