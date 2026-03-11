import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "Kayise LMS - Learning Management System",
  description:
    "Kayise LMS is a free community learning platform by Kayise IT. Empowering unemployed youth with emerging technology skills to build a brighter future.",
  generator: "v0.app",
  icons: {
    icon: "/download.png",
    shortcut: "/download.png",
    apple: "/download.png",
  },
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  try {
    // Default to light on initial load; user-specific theme is applied client-side after session is known.
    document.documentElement.classList.remove('dark');
    document.body?.classList.remove('dark');
  } catch {}
})();`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
