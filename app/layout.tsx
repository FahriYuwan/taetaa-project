import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ToastContainer } from "@/lib/toast";

export const metadata: Metadata = {
  title: "Taetaa - Inventory Management",
  description: "Inventory and production management system",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0 }}>
        {/* Desktop: sidebar 224px fixed, content offset. Mobile: no offset, topbar handles nav */}
        <div style={{ display: 'flex', height: '100vh' }}>
          <Sidebar />
          {/* lg: margin for fixed sidebar. Below lg: padding-top for mobile topbar */}
          <div
            className="flex-1 flex flex-col overflow-hidden pt-14 lg:pt-0 lg:ml-56"
          >
            {children}
          </div>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}
