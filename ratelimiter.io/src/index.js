const crypto = require("crypto");
const fetch = require("node-fetch");

const DEFAULT_RATELIMITER_URL =
  process.env.RATELIMITER_URL || "https://ratelimiter.io";

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

class RateLimitedError extends Error {}

function invariant(cond, message) {
  if (!cond) {
    throw new Error(message);
  }
}

/**
 * Call the ratelimiter.io service and return a result. Ensures all personal data is salted and hashed before being sent. If a salt
 * is not provided, it will be generated based on the appId.
 * @param {{quota: number; timeWindowSeconds: number; appId: string; eventName: string; entities: string[]; baseUrl?: string; salt?: string}} options Options to pass to the service
 * @returns {{ok: boolean; entities: Record<string, {total: number; remaining: number; reset: number}>}} Response from the API
 */
async function callRatelimiter(options) {
  invariant(
    typeof options.quota === "number",
    "quota option must be of type number"
  );
  invariant(
    typeof options.timeWindowSeconds === "number",
    "timeWindowSeconds option must be of type number"
  );
  invariant(
    typeof options.appId === "string",
    "appId option must be of type string"
  );
  invariant(
    typeof options.eventName === "string",
    "eventName option must be of type number"
  );
  invariant(
    Array.isArray(options.entities) &&
      options.entities.length > 0 &&
      options.entities.every((entity) => typeof entity === "string"),
    "entities option must be a non-empty array of strings"
  );

  const baseUrl = options.baseUrl || DEFAULT_RATELIMITER_URL;
  const appIdFirstSha = sha256(options.appId);
  const appId = sha256(appIdFirstSha);
  const salt = options.salt || appIdFirstSha;

  const shaToEntity = {};
  const resp = await fetch(`${baseUrl}/api/ratelimit`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      quota: options.quota,
      time_window_seconds: options.timeWindowSeconds,
      event_name: sha256(salt + options.eventName),
      app_id: appId,
      entities: options.entities.map((entity) => {
        const sha = sha256(salt + entity);
        shaToEntity[sha] = entity;
        return sha;
      }),
    }),
  });

  const { ok, entities } = await resp.json();
  const unhashedEntities = {};
  for (let k in entities) {
    unhashedEntities[shaToEntity[k]] = entities[k];
  }
  return { ok, entities: unhashedEntities };
}

/**
 * Wrapper around callRatelimiter() that throws a RateLimitedError when the rate limit is hit
 * @param {{quota: number; timeWindowSeconds: number; appId: string; eventName: string; entities: string[]; baseUrl?: string; salt?: string}} options Options to pass to the service
 */
async function throwIfRateLimited(options) {
  const { ok } = await callRatelimiter(options);
  if (!ok) {
    throw new RateLimitedError();
  }
}

module.exports = { callRatelimiter, RateLimitedError, throwIfRateLimited };
