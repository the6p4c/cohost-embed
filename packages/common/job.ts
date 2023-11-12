import { Queue, QueueEvents, Worker } from "bullmq";

export type Post = {
  themeColor: string;
  siteName: string;
  title: string;
  url: string;
  image: {
    mimeType: string;
    base64: string;
  };
};

export async function getPost(
  projectHandle: string,
  slug: string,
  options: { host: string; timeout: number }
): Promise<Post | undefined> {
  const connection = { connection: { host: options.host } };
  const queue = new Queue("get-post", connection);
  const queueEvents = new QueueEvents("get-post", connection);

  const job = await queue.add("", {}, { jobId: `${projectHandle}/${slug}` });

  const result = await new Promise<Post | undefined>((resolve) =>
    job
      .waitUntilFinished(queueEvents, options.timeout)
      .then((post) => resolve(post))
      .catch(() => resolve(undefined))
  );

  await queueEvents.close();
  await queue.close();

  return result;
}

export function getPostWorker(
  processor: (projectHandle: string, slug: string) => Promise<Post>,
  options: { host: string }
): { close: () => Promise<void> } {
  const worker = new Worker(
    "get-post",
    async (job) => {
      if (!job.id) throw "no job id";

      const [projectHandle, slug] = job.id.split("/");

      return processor(projectHandle, slug);
    },
    { connection: { host: options.host } }
  );

  const close = async () => {
    await worker.close();
  };

  return { close };
}
