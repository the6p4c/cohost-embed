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
  const post = page.locator(".co-post-box");
  if (!post) throw "no post";

  logger.debug("preparing page", { id });
  await preparePage(page, post, id.flags);

  logger.debug("extracting metadata", { id });
  const meta = await extractMetadata(page, id.flags);

  logger.debug("generating screenshot", { id });
  const rawScreenshot = await post.screenshot({ type: "png" });

  logger.debug("closing page", { id });
  await page.close();

  logger.debug("processing screenshot", { id });
  const screenshot = await processScreenshot(rawScreenshot, id.flags);

  return {
    meta,
    screenshot: {
      base64: screenshot.toString("base64"),
      mimeType: "image/png",
    },
  };
}

async function preparePage(page: Page, post: Locator, flags: Flag[]) {
  // widescreen rendering: we don't need to set the default here as it's already set when the
  // browser is launched
  if (flags.includes(Flag.Widescreen)) {
    await page.setViewportSize(config.screenshot.widescreen.viewport);
  }

  // light mode/dark mode
  if (flags.includes(Flag.DarkMode)) {
    await page.emulateMedia({ colorScheme: "dark" });
  }

  // useful post components
  const [header, footer] = [
    post.locator(".co-thread-header"),
    post.locator(".co-thread-footer"),
  ];

  // delete header bar to ensure it doesn't overlap with tall posts
  await page.locator("header.fixed").evaluate((el) => el.remove());

  // remove rounded corners from post: the page background shines through otherwise
  await post.evaluate((el) => (el.style.borderRadius = "0"));
  await header.evaluate((el) => (el.style.borderRadius = "0"));
  await footer.evaluate((el) => (el.style.borderRadius = "0"));

  // remove the meatball menu button
  // - we delete the path from inside the svg so as to retain the header height
  // - in a reply to an ask, the ask balloon is also a .co-action-button so we take the last button
  //   (which hopefully will be the meatball menu)
  await header
    .locator(".co-action-button path")
    .last()
    .evaluate((el) => el.remove());

  // remove the log in button
  await footer.locator(".co-action-button path").evaluate((el) => el.remove());

  // expand 18+ content
  const notBaby = post.locator(".co-filled-button", { hasText: "I am 18+" });
  if ((await notBaby.count()) == 1) {
    notBaby.click();

    // hide the "hide post" button and friends
    await page
      .locator(".co-filled-button", { hasText: "hide post" })
      .evaluate((el) => el.parentElement?.parentElement?.remove());
  }

  // wait until the post is loaded
  // TODO: does this actually help, or even work at all?
  await page.waitForLoadState("networkidle");
}

async function extractMetadata(page: Page, flags: Flag[]) {
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

async function processScreenshot(
  buffer: Buffer,
  flags: Flag[],
): Promise<Buffer> {
  const { width, height } = await sharp(buffer).metadata();
  if (!width || !height) throw "no width and/or height";

  // limit aspect ratio
  const aspectRatio = flags.includes(Flag.Widescreen)
    ? config.screenshot.widescreen.aspectRatio
    : config.screenshot.widescreen.aspectRatio;
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
  const browser = await chromium.launchPersistentContext("/data/userDataDir", {
    viewport: config.screenshot.default.viewport,
    deviceScaleFactor: config.screenshot.scale,
  });
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
