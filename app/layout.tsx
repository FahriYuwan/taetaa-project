import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ToastContainer } from "@/lib/toast";

export const metadata: Metadata = {
  title: "Taetaa - Inventory Management",
  description: "Inventory and production management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{ display: 'flex', height: '100vh' }}>
          <Sidebar />
          <div style={{ marginLeft: '224px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
        <ToastContainer />
      </body>
    </html>
  );
}

