// Root Layout - Custom JWT Auth (no next-auth)
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "remixicon/fonts/remixicon.css"; // Import Remix Icons locally
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/query-provider";
import { CartToast } from "@/components/ui/CartToast";
import { PageTransitionProvider } from "@/components/layout/PageTransitionProvider";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

// Generate dynamic metadata from database settings
export async function generateMetadata(): Promise<Metadata> {
  try {
    const result = await db.select().from(settings).where(eq(settings.id, 1)).limit(1)
    const settingsData = result[0]

    const websiteName = settingsData?.websiteName || 'EcoMart'
    const slogan = settingsData?.slogan || 'Premium Grocery Store'
    const faviconUrl = settingsData?.faviconUrl

    return {
      title: {
        default: `${websiteName}${slogan ? ` - ${slogan}` : ''}`,
        template: `%s | ${websiteName}`,
      },
      description: slogan || 'Your one-stop shop for fresh groceries, delivered to your doorstep.',
      keywords: ["Grocery", "Fresh Food", "Online Shopping", websiteName],
      authors: [{ name: `${websiteName} Team` }],
      icons: {
        icon: faviconUrl ? [
          { url: faviconUrl, sizes: '32x32', type: 'image/png' },
        ] : [
          { url: '/icon', sizes: '32x32', type: 'image/png' },
        ],
        apple: faviconUrl ? [
          { url: faviconUrl, sizes: '180x180', type: 'image/png' },
        ] : [
          { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
        ],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    // Fallback metadata
    return {
      title: 'EcoMart - Premium Grocery Store',
      description: 'Your one-stop shop for fresh groceries, delivered to your doorstep.',
      keywords: ["Grocery", "Fresh Food", "Online Shopping", "EcoMart"],
      authors: [{ name: "EcoMart Team" }],
      icons: {
        icon: [
          { url: '/icon', sizes: '32x32', type: 'image/png' },
        ],
        apple: [
          { url: '/apple-icon', sizes: '180x180', type: 'image/png' },
        ],
      },
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
          <Toaster />
          <CartToast />
        </QueryProvider>
      </body>
    </html>
  );
}
