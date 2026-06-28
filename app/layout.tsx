import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Online JSON Formatter & Validator | JSONObject & Share with Encryption",
  description: "Format, validate, and auto-repair your JSON instantly. JSONObject Online is a fast, secure JSON beautifier featuring encrypted sharing, YAML, and XML tools.",
  icons: {
    icon: "/logo-green.png",
    apple: "/logo-green.png",
  },
  keywords: [
    "modern JSON formatter",
    "ultra-fast JSON beautifier",
    "smart JSON parser",
    "clean JSON online",
    "JSON tree explorer",
    "JSON payload formatter",
    "next-gen JSON tool",
    "beautiful JSON viewer",
    "developer JSON toolkit",
    "seamless JSON parsing",
    "fix broken JSON instantly",
    "auto-repair JSON online",
    "validate JSON payloads",
    "minify JSON fast",
    "JSON to YAML wizard",
    "instant JSON cleaner",
    "JWT decoder online",
    "format JSON string",
    "parse JSON effortlessly",
    "debug JSON payloads",
    "encrypted JSON sharing",
    "secure JSON link",
    "zero-log JSON formatter",
    "private JSON bin",
    "safe JSON validator",
    "share JSON securely",
    "end-to-end encrypted JSON",
    "private payload sharing",
    "secure JWT parser"
  ],
  authors: [{ name: "mushfiqweb.com", url: "https://mushfiqweb.com" }],
  creator: "mushfiqweb.com",
  publisher: "mushfiqweb.com",
  alternates: {
    canonical: "https://jsonobject.online",
  },
  openGraph: {
    type: "website",
    title: "Free Online JSON Formatter & Validator | JSONObject & Share with Encryption",
    description: "Format, validate, and auto-repair your JSON instantly. JSONObject Online is a fast, secure JSON beautifier featuring encrypted sharing, YAML, and XML tools.",
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
    title: "Free Online JSON Formatter & Validator | JSONObject & Share with Encryption",
    description: "Format, validate, and auto-repair your JSON instantly. JSONObject Online is a fast, secure JSON beautifier featuring encrypted sharing, YAML, and XML tools.",
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
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
