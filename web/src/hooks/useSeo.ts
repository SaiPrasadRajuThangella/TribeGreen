import { useEffect } from "react";

import { SITE_NAME, SITE_URL } from "@/lib/config";

export const DEFAULT_SHARE_IMAGE =
  "https://images.unsplash.com/photo-1510284876186-b1a84b94418f?w=1200&h=630&q=80&fm=jpg&fit=crop";

type Seo = {
  title: string;
  description: string;
  image?: string;
  path?: string;
  noindex?: boolean;
};

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/*
 * Keeps <title>, description and share tags in sync while the visitor navigates.
 * Crawlers (WhatsApp, LinkedIn) don't run JS, so scripts/prerender-meta.mjs
 * also writes these tags into static HTML for each page at build time.
 */
export function useSeo({ title, description, image = DEFAULT_SHARE_IMAGE, path, noindex }: Seo) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    document.title = fullTitle;
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
  }, [title, description, image, path, noindex]);
}

// Product photos re-cropped to the 1200x630 share size
export const shareImageFor = (photoUrl: string) =>
  photoUrl.replace(/\?.*$/, "?w=1200&h=630&q=80&fm=jpg&fit=crop");
