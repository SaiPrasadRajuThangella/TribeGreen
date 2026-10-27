import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { Plugin, ResolvedConfig } from "vite";

import { PRODUCTS } from "../src/data/products.ts";

/*
 * WhatsApp, LinkedIn and Google read <head> tags without running JavaScript,
 * so a plain SPA shows the same preview for every link. After the build this
 * plugin writes one static HTML file per page with its own title, description
 * and share image. Vercel's cleanUrls serves /product/steel-bottle from
 * product/steel-bottle.html; everything else falls back to index.html.
 */

type PageMeta = { file: string; path: string; title: string; description: string; image?: string };

const SITE = "Tribe Green";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1510284876186-b1a84b94418f?w=1200&h=630&q=80&fm=jpg&fit=crop";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const shareImage = (url: string) => url.replace(/\?.*$/, "?w=1200&h=630&q=80&fm=jpg&fit=crop");
const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const PAGES: PageMeta[] = [
  {
    file: "catalogue.html",
    path: "/catalogue",
    title: "Catalogue",
    description:
      "Browse corporate gifts by category, occasion and budget: drinkware, apparel, work essentials and wellness, customised with your logo.",
  },
  {
    file: "enquiry.html",
    path: "/enquiry",
    title: "Request a quote",
    description:
      "Tell us about your corporate gifting needs: occasion, quantity, budget and delivery date. Our team replies within 48 hours.",
  },
  ...PRODUCTS.map((p) => ({
    file: `product/${p.id}.html`,
    path: `/product/${p.id}`,
    title: p.name,
    description: `${p.shortDescription} ${inr(p.priceMin)} – ${inr(p.priceMax)} per unit. ${p.customisations.join(", ")} available. Minimum order ${p.minOrder} units.`,
    image: shareImage(p.images[0]),
  })),
];

function applyMeta(html: string, page: PageMeta, siteUrl: string) {
  const title = escape(`${page.title} | ${SITE}`);
  const description = escape(page.description);
  const image = escape(page.image ?? DEFAULT_IMAGE);
  const url = escape(`${siteUrl}${page.path}`);

  const setContent = (attr: string, key: string, value: string) => {
    html = html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${value}$2`);
  };

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  setContent("name", "description", description);
  setContent("property", "og:title", title);
  setContent("property", "og:description", description);
  setContent("property", "og:image", image);
  setContent("property", "og:url", url);
  setContent("name", "twitter:title", title);
  setContent("name", "twitter:description", description);
  setContent("name", "twitter:image", image);
  return html;
}

export function seoPages(siteUrl: string): Plugin {
  let config: ResolvedConfig;
  return {
    name: "tribe-green-seo-pages",
    apply: "build",
    configResolved(resolved) {
      config = resolved;
    },
    async writeBundle() {
      const outDir = join(config.root, config.build.outDir);
      const template = await readFile(join(outDir, "index.html"), "utf8");
      const base = siteUrl.replace(/\/$/, "");
      // The home page keeps index.html's own tags; only og:url needs the real domain
      await writeFile(
        join(outDir, "index.html"),
        template.replace(/(<meta property="og:url" content=")[^"]*/, `$1${base}/`),
      );
      await Promise.all(
        PAGES.map(async (page) => {
          const file = join(outDir, page.file);
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, applyMeta(template, page, base));
        }),
      );
      config.logger.info(`  seo: wrote ${PAGES.length} pages with share tags`);
    },
  };
}
