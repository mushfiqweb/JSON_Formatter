import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://jsonobject.online",
      lastModified: new Date("2026-06-28"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: "https://jsonobject.online/faq",
      lastModified: new Date("2026-06-28"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://jsonobject.online/privacy",
      lastModified: new Date("2026-06-28"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
