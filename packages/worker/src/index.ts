import config from "cohost-embed-common/config";
import { Post, getPostWorker } from "cohost-embed-common/job";
import process from "node:process";
import { BrowserContext, chromium } from "playwright";
import winston from "winston";

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.cli(),
  transports: [new winston.transports.Console()],
});

async function retrievePost(
  browser: BrowserContext,
  projectHandle: string,
  slug: string
): Promise<Post> {
  const logPrefix = `[@${projectHandle}, ${slug}]`;

  // create a page and navigate to the post
  const url = `https://cohost.org/${projectHandle}/post/${slug}`;
  logger.debug(`${logPrefix} navigating to ${url}`);
  const page = await browser.newPage();
  await page.goto(url);

  // ensure header bar doesn't overlap with tall posts
  await page.addStyleTag({
    content: "html { scroll-padding-top: 4rem; }",
  });

  // find the post
  const post = page.locator("[data-postid] > article");
  if (!post) throw "no post";

  // remove the log in button
  const logInButton = post.locator("footer .justify-end");
  logInButton.evaluate((el) => el.remove());

  // extract basic post info
  const themeColor =
    (await page.getAttribute('meta[name="theme-color"]', "content")) || "";
  const siteName =
    (await page.getAttribute('meta[property="og:site_name"]', "content")) || "";
  const title =
    (await page.getAttribute('meta[property="og:title"]', "content")) || "";

  // get screenshot of post
  const screenshot = await post.screenshot({ type: "png" });

  // finish up
  await page.close();

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
  logger.info("worker started :o");
  const browser = await chromium.launchPersistentContext(
    "./.cache/userDataDir"
  );
  logger.info("browser launched :O");
  const worker = getPostWorker(async (projectHandle, slug) => {
    const logPrefix = `[@${projectHandle}, ${slug}]`;
    logger.info(`${logPrefix} claimed >:3`);
    const post = await retrievePost(browser, projectHandle, slug);
    logger.info(`${logPrefix} complete :3`);
    return post;
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
