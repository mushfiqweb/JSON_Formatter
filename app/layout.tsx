import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JSONObject.OnLine - Encrypted JSON Sharer",
  description: "Secure, client-side, zero-knowledge JSON validator, formatter, schema validator, type generator, and sharing utility platform.",
  icons: {
    icon: "/logo-green.png",
    apple: "/logo-green.png",
  },
  keywords: [
    "json formatter",
    "json validator",
    "json repair",
    "encrypted json share",
    "zero knowledge json",
    "json to xml",
    "json to csv",
    "json to yaml",
    "jsonpath online",
    "json diff online",
    "jwt decoder",
    "json type generator",
    "typescript interface generator",
    "client side json formatter",
    "secure json formatter",
    "base64 decoder json"
  ],
  authors: [{ name: "mushfiqweb.com", url: "https://mushfiqweb.com" }],
  creator: "mushfiqweb.com",
  publisher: "mushfiqweb.com",
  alternates: {
    canonical: "https://jsonobject.online",
  },
  openGraph: {
    type: "website",
    title: "JSONObject.OnLine - Encrypted JSON Sharer",
    description: "Secure, client-side, zero-knowledge JSON validator, formatter, schema validator, type generator, and sharing utility platform.",
    url: "https://jsonobject.online",
    siteName: "JSONObject.OnLine",
    images: [
      {
        url: "https://jsonobject.online/og-image.png",
        width: 1200,
        height: 630,
        alt: "JSONObject.OnLine og-image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JSONObject.OnLine - Encrypted JSON Sharer",
    description: "Secure, client-side, zero-knowledge JSON validator, formatter, schema validator, type generator, and sharing utility platform.",
    images: ["https://jsonobject.online/twitter-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
