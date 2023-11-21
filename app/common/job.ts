import { Queue, QueueEvents, Worker } from "bullmq";

import config from "@/common/config";

export type PostId = {
  projectHandle: string;
  slug: string;
  flags: Flag[];
};

export namespace PostId {
  export function toJobId(id: PostId) {
    const { projectHandle, slug, flags } = id;

    return `${projectHandle}/${slug}/${flags.join(";")}`;
  }

  export function fromJobId(id: string) {
    const [projectHandle, slug, flags] = id.split("/");

    return {
      projectHandle,
      slug,
      flags: flags.length != 0 ? (flags.split(";") as Flag[]) : [],
    };
  }
}

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

// /!\ big warning: must not contain `;` or `/` as they are used to delimit job ids /!\
export enum Flag {
  Widescreen = "Widescreen",
  DarkMode = "DarkMode",
}

export async function getPost(id: PostId): Promise<Post | undefined> {
  const connection = { connection: { host: "redis" } };
  const queue = new Queue("get-post", connection);
  const queueEvents = new QueueEvents("get-post", connection);

  const job = await queue.add("", {}, { jobId: PostId.toJobId(id) });

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

export function getPostWorker(processor: (id: PostId) => Promise<Post>): {
  close: () => Promise<void>;
} {
  const worker = new Worker(
    "get-post",
    async (job) => {
      if (!job.id) throw "no job id";
      return processor(PostId.fromJobId(job.id));
    },
    { connection: { host: "redis" } },
  );

  const close = async () => {
    await worker.close();
  };

  return { close };
}
