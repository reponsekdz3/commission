import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "../components/nav";

export const metadata: Metadata = {
  title: "Imizi — Find, book, and manage property in Rwanda",
  description: "Marketplace, maps, bookings, payments, messaging, and rental operations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
