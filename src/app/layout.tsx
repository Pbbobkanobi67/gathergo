import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "GatherGo - Group Travel Planning",
    template: "%s | GatherGo",
  },
  description: "Plan your group trips with ease. Coordinate meals, activities, expenses, and more.",
  keywords: ["travel", "group travel", "trip planning", "vacation", "cabin trip"],
  authors: [{ name: "GatherGo" }],
  creator: "GatherGo",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gathergo.app",
    siteName: "GatherGo",
    title: "GatherGo - Group Travel Planning",
    description: "Plan your group trips with ease. Coordinate meals, activities, expenses, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "GatherGo - Group Travel Planning",
    description: "Plan your group trips with ease. Coordinate meals, activities, expenses, and more.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0D6B6B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Check if Clerk is properly configured
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = clerkPublishableKey && !clerkPublishableKey.includes("your-key-here");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Wrap content with ClerkProvider only if properly configured
  const content = (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-slate-900 font-sans text-slate-100 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  if (!isClerkConfigured) {
    return content;
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#0D6B6B",
          colorBackground: "#0F172A",
          colorInputBackground: "#1E293B",
          colorInputText: "#F8FAFC",
        },
      }}
    >
      {content}
    </ClerkProvider>
  );
}
