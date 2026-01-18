import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const _inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "IconCanvas AI | Draw. Discover. Design.",
  description: "Revolutionary AI-powered icon discovery platform. Sketch your ideas, let AI find the perfect icons.",
  keywords: ["icons", "AI", "design", "canvas", "drawing", "iconify", "creative tools", "hackathon"],
  authors: [{ name: "IconCanvas AI Team" }],
  creator: "IconCanvas AI",
  openGraph: {
    title: "IconCanvas AI | Draw. Discover. Design.",
    description: "Revolutionary AI-powered icon discovery platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IconCanvas AI | Draw. Discover. Design.",
    description: "Revolutionary AI-powered icon discovery platform",
  },
  generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d12" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500;700&family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Lobster&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased overflow-hidden">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
