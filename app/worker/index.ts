import process from "node:process";
import { BrowserContext, Locator, Page, chromium } from "playwright";
import sharp from "sharp";
import winston from "winston";

import config from "@/common/config";
import { Post, getPostWorker } from "@/common/job";

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.cli(),
  transports: [new winston.transports.Console()],
});

async function retrievePost(
  browser: BrowserContext,
  projectHandle: string,
  slug: string,
): Promise<Post> {
  const logPrefix = `[@${projectHandle}, ${slug}]`;
  const url = `https://cohost.org/${projectHandle}/post/${slug}`;

  logger.debug(`${logPrefix} navigating to ${url}`);
  const page = await browser.newPage();
  await page.goto(url);

  logger.debug(`${logPrefix} looking for post`);
  const post = page.locator("[data-postid] > article");
  if (!post) throw "no post";

  logger.debug(`${logPrefix} preparing page`);
  await preparePage(page, post);

  logger.debug(`${logPrefix} extracting metadata`);
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
    if (metas.length == 0) {
      throw `no matching <meta> elements (ident=${JSON.stringify(ident)})`;
    }

    return metas[0];
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

  logger.debug(`${logPrefix} generating screenshot`);
  const rawScreenshot = await post.screenshot({ type: "png" });

  logger.debug(`${logPrefix} closing page`);
  await page.close();

  logger.debug(`${logPrefix} processing screenshot`);
  const screenshot = await processScreenshot(rawScreenshot);

  return {
    meta,
    screenshot: {
      base64: screenshot.toString("base64"),
      mimeType: "image/png",
    },
  };
}

async function preparePage(page: Page, post: Locator) {
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
  const worker = getPostWorker(async (projectHandle, slug) => {
    const logPrefix = `[@${projectHandle}, ${slug}]`;
    logger.info(`${logPrefix} claimed >:3`);
    try {
      const post = await retrievePost(browser, projectHandle, slug);
      logger.info(`${logPrefix} complete :3`);
      return post;
    } catch (e) {
      logger.error(`${logPrefix} failed: ${e}`);
      return null as unknown as Post; // TODO: not this
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
