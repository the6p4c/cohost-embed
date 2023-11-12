import EmbedJobManager, { EmbedData } from "cohost-embed-job-manager";

if (!process.env.TIMEOUT) {
  throw "required TIMEOUT environment variable not defined";
}

const TIMEOUT = parseInt(process.env.TIMEOUT);

if (!process.env.BASE_URL) {
  throw "required BASE_URL environment variable not defined";
}

const BASE_URL = process.env.BASE_URL;

export type Embed = {
  themeColor: string;
  siteName: string;
  title: string;
  url: string;
  imageUrl: string;
};

export async function useEmbed(
  projectHandle: string,
  slug: string,
): Promise<Embed | undefined> {
  const data = await useEmbedData(projectHandle, slug);
  if (!data) return;

  return {
    themeColor: data.themeColor,
    siteName: data.siteName,
    title: data.title,
    url: data.url,
    imageUrl: `${BASE_URL}/${projectHandle}/post/${slug}/image`,
  };
}

export type EmbedImage = {
  data: Buffer;
  mimeType: string;
};

export async function useEmbedImage(
  projectHandle: string,
  slug: string,
): Promise<EmbedImage | undefined> {
  const data = await useEmbedData(projectHandle, slug);
  if (!data) return;

  return {
    data: Buffer.from(data.image.base64, "base64"),
    mimeType: data.image.mimeType,
  };
}

async function useEmbedData(
  projectHandle: string,
  slug: string,
): Promise<EmbedData | undefined> {
  const jobManager = new EmbedJobManager();
  await jobManager.connect();
  const job = await jobManager.enqueueJob(
    {
      projectHandle,
      slug,
    },
    TIMEOUT,
  );
  await jobManager.disconnect();

  if (job.state == "complete") {
    return job.payload;
  }
}
