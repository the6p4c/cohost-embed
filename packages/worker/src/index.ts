import EmbedJobManager from "cohost-embed-job-manager";
import process from "node:process";
import { chromium } from "playwright";
import winston from "winston";

const logger = winston.createLogger({
  format: winston.format.cli(),
  transports: [new winston.transports.Console()],
});

async function main() {
  logger.info("started");

  const jobManager = new EmbedJobManager();
  await jobManager.connect();
  logger.info("connected to redis");

  await jobManager.listenForJobs(async (id) => {
    const { projectHandle, slug } = id;

    const jobIdentifier = `[@${projectHandle} ${slug}]`;
    logger.info(`${jobIdentifier} claimed`);

    const embed = await generateEmbed(projectHandle, slug);
    logger.info(`${jobIdentifier} embed generated`);

    jobManager.completeJob(id, embed);

    logger.info(`${jobIdentifier} complete`);
  });
  logger.info("listening for jobs");

  await quit();
  logger.info("terminating");

  await jobManager.disconnect();
  logger.info("disconnected from redis");
}

function quit(): Promise<void> {
  return new Promise((resolve) => {
    process.on("SIGINT", () => resolve());
    process.on("SIGTERM", () => resolve());
  });
}

async function generateEmbed(projectHandle: string, slug: string) {
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
