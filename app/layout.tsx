import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SidebarProvider } from "@/components/sidebar/SidebarContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ToastContainer } from "@/lib/toast";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Taetaa - Inventory Management",
  description: "Inventory and production management system",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0 }}>
        <SidebarProvider>
          <AppLayout>{children}</AppLayout>
        </SidebarProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
