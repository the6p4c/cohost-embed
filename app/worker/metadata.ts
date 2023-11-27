import { Page } from "playwright";

import { Flag } from "@/common/job";

export async function extractMetadata(page: Page, flags: Flag[]) {
  const getMetas = async (ident: { name: string } | { property: string }) => {
    const selector =
      "name" in ident
        ? `meta[name="${ident.name}"]`
        : `meta[property="${ident.property}"]`;

    const metaElements = await page.locator(selector).all();
    const content = (
      await Promise.all(metaElements.map((el) => el.getAttribute("content")))
    ).map((el) => el || "");

    return content;
  };

  const getMeta = async (ident: { name: string } | { property: string }) => {
    const metas = await getMetas(ident);
    return metas[0] || "";
  };

  return {
    themeColor: await getMeta({ name: "theme-color" }),
    siteName: await getMeta({ property: "og:site_name" }),
    title: await getMeta({ property: "og:title" }),
    description: await getMeta({ property: "og:description" }),
    publishedTime: await getMeta({ property: "article:published_time" }),
    authorUrl: await getMeta({ property: "article:author" }),
    url: await getMeta({ property: "og:url" }),
    tags: await getMetas({ property: "article:tag" }),
    imageUrl: await getMeta({ property: "og:image" }),
  };
}
