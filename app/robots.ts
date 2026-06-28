import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/share/",
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: "/share/",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: "/share/",
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: "/share/",
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: "/share/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: "/share/",
      },
    ],
    sitemap: "https://jsonobject.online/sitemap.xml",
  };
}
