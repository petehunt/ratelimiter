import RateLimiter from "async-ratelimiter";
import Redis from "ioredis";
import { NextApiRequest, NextApiResponse } from "next";
import invariant from "tiny-invariant";
import { z } from "zod";
import crypto from "crypto";

const REDIS_URL = process.env.REDIS_URL;
invariant(REDIS_URL, "no REDIS_URL env var found");

const SALT = process.env.SALT;
invariant(SALT, "no SALT env var found");

const MAX_TIME_WINDOW_SECONDS = 2 * 7 * 24 * 60 * 60;
const MIN_TIME_WINDOW_SECONDS = 5;

const db = new Redis(REDIS_URL);

const reqSchema = z.object({
  quota: z.number().min(1),
  time_window_seconds: z
    .number()
    .max(MAX_TIME_WINDOW_SECONDS)
    .min(MIN_TIME_WINDOW_SECONDS),
  app_id: z.string(),
  event_name: z.string(),
  entities: z.array(z.string()).nonempty(),
});

function sha256(s: string) {
  return crypto
    .createHash("sha256")
    .update(SALT! + s, "utf-8")
    .digest("hex");
}

export default async function ratelimit(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    invariant(req.method === "POST", "only POST requests are supported");
    const params = reqSchema.parse(req.body);
    invariant(
      params.entities.length <= 16,
      "cannot pass more than 16 entities"
    );

    const rateLimiter = new RateLimiter({
      db,
      namespace: sha256(params.app_id + ":" + params.event_name),
    });

    const entities = Object.fromEntries(
      await Promise.all(
        params.entities.map(async (entity) => {
          const result = await rateLimiter.get({
            duration: params.time_window_seconds * 1000,
            max: params.quota,
            id: sha256(params.app_id + entity),
          });
          return [entity, result] as const;
        })
      )
    );

    const ok = Object.values(entities).every((item) => item.remaining > 0);
    res.json({ ok, entities });
  } catch (e: any) {
    res.status(400).json({ error: e.message || e.toString() });
  }
}
