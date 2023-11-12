import { createClient } from "redis";

export type Job<Payload = string> =
  | { state: "waiting"; claimed?: "" }
  | { state: "complete"; payload: Payload };

type RedisClient = ReturnType<typeof createClient>;

export default abstract class JobManager<JobId, Payload> {
  redis: RedisClient;
  redisPubSub: RedisClient;

  constructor(url: string) {
    const onError = async (err: any, ctx: string) => {
      console.error("redis client error", ctx, err);
      await this.disconnect();
    };

    this.redis = createClient({ url }).on("error", (err) =>
      onError(err, "redis")
    );
    this.redisPubSub = createClient({ url }).on("error", (err) =>
      onError(err, "redisPubSub")
    );
  }

  async connect() {
    await this.redis.connect();
    await this.redisPubSub.connect();
  }

  async disconnect() {
    await this.redis.disconnect();
    await this.redisPubSub.disconnect();
  }

  async enqueueJob(id: JobId, timeout: number): Promise<Job<Payload>> {
    const idStr = this.serializeId(id);

    // start listening for changes to the job
    const completed = new Promise<Job<Payload>>(async (resolve) => {
      await this.redisPubSub.pSubscribe(`__keyspace@*__:${idStr}`, async () => {
        const job = (await this.redis.hGetAll(idStr)) as Job;

        // if the job was marked as complete, resolve with it
        if (job.state == "complete") {
          resolve(this.deserializeJob(job));
        }
      });
    });

    // enqueue the job if it doesn't already exist
    // note: HSETNX won't publish a keyspace notification if the key already exists
    const [_, job] = (await this.redis
      .multi()
      .hSetNX(idStr, "state", "waiting")
      .hGetAll(idStr)
      .exec()) as [unknown, Job];

    // if the job is complete, return it immediately
    if (job.state == "complete") {
      return this.deserializeJob(job);
    }

    // if the job isn't complete, try waiting
    return await Promise.any([
      new Promise<Job<Payload>>((resolve) =>
        setTimeout(() => resolve(this.deserializeJob(job)), timeout)
      ),
      completed,
    ]);
  }

  async listenForJobs(listener: (id: JobId) => void) {
    await this.redisPubSub.pSubscribe("__keyevent@*__:hset", async (idStr) => {
      const id = this.deserializeId(idStr);

      // try to claim the job, and dispatch it if successful
      // HSETNX returns true if "the field is a new field in the hash and the value was set", i.e.,
      // if we wrote the "claimed" field and it didn't previously exist
      const claimed = await this.redis.hSetNX(idStr, "claimed", "");
      if (claimed) {
        listener(id);
      }
    });
  }

  async completeJob(id: JobId, payload: Payload) {
    const idStr = this.serializeId(id);

    const job = this.serializeJob({
      state: "complete",
      payload,
    });

    await this.redis.hSet(idStr, job);
  }

  private serializeJob(job: Job<Payload>): Job {
    if (job.state == "complete") {
      return {
        state: "complete",
        payload: this.serializePayload(job.payload),
      };
    } else {
      return job;
    }
  }

  private deserializeJob(job: Job): Job<Payload> {
    if (job.state == "complete") {
      return {
        state: "complete",
        payload: this.deserializePayload(job.payload),
      };
    } else {
      return job;
    }
  }

  protected abstract serializeId(id: JobId): string;
  protected abstract deserializeId(s: string): JobId;
  protected abstract serializePayload(payload: Payload): string;
  protected abstract deserializePayload(s: string): Payload;
}
