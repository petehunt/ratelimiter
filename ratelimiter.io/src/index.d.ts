/**
 * Call the ratelimiter.io service and return a result. Ensures all personal data is salted and hashed before being sent. If a salt
 * is not provided, it will be generated based on the appId.
 * @param {{quota: number; timeWindowSeconds: number; appId: string; eventName: string; entities: string[]; baseUrl?: string; salt?: string}} options Options to pass to the service
 * @returns {Promise<{ok: boolean; entities: Record<string, {total: number; remaining: number; reset: number}>}>} Response from the API
 */
export function callRatelimiter(options: {
    quota: number;
    timeWindowSeconds: number;
    appId: string;
    eventName: string;
    entities: string[];
    baseUrl?: string;
    salt?: string;
}): Promise<{
    ok: boolean;
    entities: Record<string, {
        total: number;
        remaining: number;
        reset: number;
    }>;
}>;
export class RateLimitedError extends Error {
}
/**
 * Wrapper around callRatelimiter() that throws a RateLimitedError when the rate limit is hit
 * @param {{quota: number; timeWindowSeconds: number; appId: string; eventName: string; entities: string[]; baseUrl?: string; salt?: string}} options Options to pass to the service
 * @returns {Promise<void>}
 */
export function throwIfRateLimited(options: {
    quota: number;
    timeWindowSeconds: number;
    appId: string;
    eventName: string;
    entities: string[];
    baseUrl?: string;
    salt?: string;
}): Promise<void>;
//# sourceMappingURL=index.d.ts.map