import process from "node:process";
import { chromium } from "playwright";
import winston from "winston";

import { envString } from "cohost-embed-common/config";
import { Post, getPostWorker } from "cohost-embed-common/job";

const REDIS_HOST = envString("REDIS_HOST");

const logger = winston.createLogger({
  format: winston.format.cli(),
  transports: [new winston.transports.Console()],
});

async function main() {
  logger.info("started :O");

  const worker = getPostWorker(
    async (projectHandle, slug) => {
      logger.info(`[@${projectHandle}, ${slug}] claimed >:3`);

      const embed = await retrievePost(projectHandle, slug);
      logger.info(`[@${projectHandle}, ${slug}] retrieved :3`);

      return embed;
    },
    { host: REDIS_HOST }
  );

  logger.info("processing jobs ^_^");
  const quit = async () =>
    new Promise<void>((resolve) => {
      process.on("SIGINT", () => resolve());
      process.on("SIGTERM", () => resolve());
    });
  await quit();

  logger.info("terminating :(");
  await worker.close();

  logger.info("terminated :'(");
}

async function retrievePost(
  projectHandle: string,
  slug: string
): Promise<Post> {
  const url = `https://cohost.org/${projectHandle}/post/${slug}`;

  const browser = await chromium.launchPersistentContext(
    "./.cache/userDataDir"
  );

  const page = await browser.newPage();
  await page.goto(url);

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

main();
