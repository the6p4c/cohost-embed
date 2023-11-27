import process from "node:process";
import { BrowserContext, chromium } from "playwright";

import config from "@/common/config";
import { Post, PostId, getPostWorker } from "@/common/job";
import logger from "./logger";
import { extractMetadata } from "./metadata";
import { preparePage } from "./prepare";
import { processScreenshot } from "./screenshot";

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

async function quit(): Promise<void> {
  return new Promise((resolve) => {
    process.on("SIGINT", () => resolve());
    process.on("SIGTERM", () => resolve());
  });
}

main();
