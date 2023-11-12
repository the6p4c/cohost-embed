import JobManager from "./job";

// TODO: replace with URL from docker container
const URL = "redis://172.18.0.2:6379";

export type EmbedJobId = {
  projectHandle: string;
  slug: string;
};

export type EmbedData = {
  themeColor: string;
  siteName: string;
  title: string;
  url: string;
  image: {
    mimeType: string;
    base64: string;
  };
};

export default class EmbedJobManager extends JobManager<EmbedJobId, EmbedData> {
  constructor() {
    super(URL);
  }

  protected serializeId(id: EmbedJobId): string {
    return `${id.projectHandle}/${id.slug}`;
  }

  protected deserializeId(s: string): EmbedJobId {
    const [projectHandle, slug] = s.split("/");

    return { projectHandle, slug };
  }

  protected serializePayload(payload: EmbedData): string {
    return JSON.stringify(payload);
  }

  protected deserializePayload(s: string): EmbedData {
    return JSON.parse(s);
  }
}
