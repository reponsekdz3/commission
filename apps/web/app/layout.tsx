import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "../components/nav";
import { Providers } from "../components/providers";
import { MobileNav } from "../components/shell/mobile-nav";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Imizi — Rwanda property marketplace", template: "%s · Imizi" },
  description: "Verified property discovery, viewings, booking, payments and property operations across Rwanda.",
  openGraph: {
    title: "Imizi — Rwanda property marketplace",
    description: "Discover, compare and transact on verified Rwanda property.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Providers>
          <Nav />
          <div id="main-content">{children}</div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
