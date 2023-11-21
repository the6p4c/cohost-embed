import process from "node:process";
import { BrowserContext, Locator, Page, chromium } from "playwright";
import sharp from "sharp";
import winston from "winston";

import config from "@/common/config";
import { Flag, Post, PostId, getPostWorker } from "@/common/job";

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.colorize({ level: true }),
    winston.format.metadata({}),
    winston.format.printf(({ level, metadata, message }) => {
      const prefixFromId = (id: PostId) =>
        id.flags.length === 0
          ? `[@${id.projectHandle}, ${id.slug}] `
          : `[@${id.projectHandle}, ${id.slug} {${id.flags.join(" ")}}] `;
      const prefix = metadata.id ? prefixFromId(metadata.id) : "";
      return `${level}: ${prefix}${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

async function retrievePost(
  browser: BrowserContext,
  id: PostId,
): Promise<Post> {
  const url = `https://cohost.org/${id.projectHandle}/post/${id.slug}`;

  logger.debug(`navigating to ${url}`, { id });
  const page = await browser.newPage();
  await page.goto(url);

  logger.debug("looking for post", { id });
  const post = page.locator("[data-postid] > article");
  if (!post) throw "no post";

  logger.debug("preparing page", { id });
  await preparePage(page, post, id.flags);

  logger.debug("extracting metadata", { id });
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

  const meta = {
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

  logger.debug("generating screenshot", { id });
  const rawScreenshot = await post.screenshot({ type: "png" });

  logger.debug("closing page", { id });
  await page.close();

  logger.debug("processing screenshot", { id });
  const screenshot = await processScreenshot(rawScreenshot);

  return {
    meta,
    screenshot: {
      base64: screenshot.toString("base64"),
      mimeType: "image/png",
    },
  };
}

async function preparePage(page: Page, post: Locator, flags: Flag[]) {
  // mobile mode
  if (flags.includes(Flag.Mobile)) {
    const height = page.viewportSize()?.height;
    if (!height) throw "no viewport height";

    // this is what chrome's responsive dev tools uses as the width of an iPhone XR. i feel like
    // this is a decent middle ground
    await page.setViewportSize({ width: 414, height });
  }

  // light mode/dark mode
  if (flags.includes(Flag.DarkMode)) {
    await page.emulateMedia({ colorScheme: "dark" });
  }

  // useful post components
  const [header, footer] = [post.locator("header"), post.locator("footer")];

  // ensure header bar doesn't overlap with tall posts
  await page.addStyleTag({
    content: "html { scroll-padding-top: 4rem; }",
  });

  // remove rounded corners from post: the page background shines through otherwise
  await post.evaluate((el) => (el.style.borderRadius = "0"));
  await header.evaluate((el) => (el.style.borderRadius = "0"));
  await footer.evaluate((el) => (el.style.borderRadius = "0"));

  // remove the actions menu: we delete the path from inside the button svg so as to retain the
  // header height
  await header.locator("> button path").evaluate((el) => el.remove());

  // remove the log in button
  await footer.locator(".justify-end").evaluate((el) => el.remove());

  // expand 18+ content
  const notBaby = post.locator("button", { hasText: "I am 18+" });
  if ((await notBaby.count()) == 1) {
    notBaby.click();

    // hide the "hide post" button and friends
    await page
      .locator("button", { hasText: "hide post" })
      .evaluate((el) => el.parentElement?.parentElement?.remove());
  }

  // wait until the post is loaded
  // TODO: does this actually help, or even work at all?
  await page.waitForLoadState("networkidle");
}

async function processScreenshot(buffer: Buffer): Promise<Buffer> {
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height) throw "no width and/or height";

  // limit aspect ratio
  const aspectRatio = { width: 16, height: 9 * 2 };
  const newHeight = Math.min(
    height,
    Math.trunc((width * aspectRatio.height) / aspectRatio.width),
  );

  return sharp(buffer)
    .extract({ left: 0, top: 0, width, height: newHeight })
    .toBuffer();
}

async function main() {
  logger.info("worker started :o");
  const browser = await chromium.launchPersistentContext("/data/userDataDir");
  logger.info("browser launched :O");
  const worker = getPostWorker(async (id) => {
    logger.info("claimed >:3", { id });
    try {
      const post = await retrievePost(browser, id);
      logger.info("complete :3", { id });
      return post;
    } catch (e) {
      logger.error(`failed ;_; (${e})`, { id });
      throw e;
    }
  });
  logger.info("processing jobs ^_^");
  await quit();
  logger.info("terminating :(");
  await worker.close();
  try {
    // for some reason, browser.close() likes to fail with `Target page, context or browser has been
    // closed`. i can't work out why, but the processes don't hang around so it doesn't seem too
    // dangerous
    await browser.close();
  } catch (e) {
    logger.warn(`browser close failed: ${e}`);
  }
  logger.info("worker terminated :'(");
}

async function quit(): Promise<void> {
  return new Promise((resolve) => {
    process.on("SIGINT", () => resolve());
    process.on("SIGTERM", () => resolve());
  });
}

main();
