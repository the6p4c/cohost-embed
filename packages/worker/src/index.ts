import config from "cohost-embed-common/config";
import { Post, getPostWorker } from "cohost-embed-common/job";
import process from "node:process";
import { chromium } from "playwright";
import winston from "winston";

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.cli(),
  transports: [new winston.transports.Console()],
});

async function retrievePost(
  projectHandle: string,
  slug: string
): Promise<Post> {
  const logPrefix = `[@${projectHandle}, ${slug}]`;
  logger.info(`${logPrefix} claimed >:3`);

  const browser = await chromium.launchPersistentContext(
    "./.cache/userDataDir"
  );

  const url = `https://cohost.org/${projectHandle}/post/${slug}`;
  logger.debug(`${logPrefix} navigating to ${url}`);
  const page = await browser.newPage();
  await page.goto(url);

  // ensure header bar doesn't overlap with tall posts
  await page.addStyleTag({
    content: "html { scroll-padding-top: 4rem; }",
  });

  const post = page.locator("[data-postid] > article");
  if (!post) throw "no post";

  const themeColor =
    (await page.getAttribute('meta[name="theme-color"]', "content")) || "";
  const siteName =
    (await page.getAttribute('meta[property="og:site_name"]', "content")) || "";
  const title =
    (await page.getAttribute('meta[property="og:title"]', "content")) || "";
  const screenshot = await post.screenshot({ type: "png" });

  await page.close();
  await browser.close();

  logger.info(`${logPrefix} complete :3`);

  return {
    themeColor,
    siteName,
    title,
    url,
    image: {
      base64: screenshot.toString("base64"),
      mimeType: "image/png",
    },
  };
}

async function main() {
  logger.info("worker started :O");
  const worker = getPostWorker(retrievePost);
  logger.info("processing jobs ^_^");
  await quit();
  logger.info("terminating :(");
  await worker.close();
  logger.info("worker terminated :'(");
}

async function quit(): Promise<void> {
  return new Promise((resolve) => {
    process.on("SIGINT", () => resolve());
    process.on("SIGTERM", () => resolve());
  });
}

main();
