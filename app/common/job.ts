import { Queue, QueueEvents, Worker } from "bullmq";

import config from "@/common/config";

export type Post = {
  meta: {
    // <meta name="theme-color" content="...">
    themeColor: string;
    // <meta property="og:site_name" content="...">
    siteName: string;
    // <meta property="og:title" content="...">
    title: string;
    // <meta property="og:description" content="...">
    description: string;
    // <meta property="article:published_time" content="...">
    publishedTime: string;
    // <meta property="article:author" content="...">
    authorUrl: string;
    // <meta property="og:url" content="...">
    url: string;
    // <meta property="article:tag" content="...">
    tags: string[];
    // <meta property="og:image" content="...">
    imageUrl: string;
  };
  screenshot: {
    mimeType: string;
    base64: string;
  };
};

export async function getPost(
  projectHandle: string,
  slug: string,
): Promise<Post | undefined> {
  const connection = { connection: { host: config.redisHost } };
  const queue = new Queue("get-post", connection);
  const queueEvents = new QueueEvents("get-post", connection);

  const job = await queue.add("", {}, { jobId: `${projectHandle}/${slug}` });

  const result = await new Promise<Post | undefined>((resolve) =>
    job
      .waitUntilFinished(queueEvents, config.timeout)
      .then((post) => resolve(post))
      .catch(() => resolve(undefined)),
  );

  await queueEvents.close();
  await queue.close();

  return result;
}

export function getPostWorker(
  processor: (projectHandle: string, slug: string) => Promise<Post>,
): { close: () => Promise<void> } {
  const worker = new Worker(
    "get-post",
    async (job) => {
      if (!job.id) throw "no job id";

      const [projectHandle, slug] = job.id.split("/");

      return processor(projectHandle, slug);
    },
    { connection: { host: config.redisHost } },
  );

  const close = async () => {
    await worker.close();
  };

  return { close };
}
