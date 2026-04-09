import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-app-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StyleSync — Turn any website into a living design system",
    template: "%s · StyleSync",
  },
  description:
    "Paste a URL. Get a Figma-grade design system: colors, typography, spacing, components. Lock the tokens you love, edit the rest.",
  applicationName: "StyleSync",
  openGraph: {
    title: "StyleSync",
    description:
      "Paste a URL. Get a design system you can lock, edit, and export.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d14" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-surface-raised !text-foreground !border !border-border !rounded-lg",
            },
          }}
        />
      </body>
    </html>
  );
}
