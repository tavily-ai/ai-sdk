import { tavily } from "@tavily/core";
import type { TavilyClientOptions } from "@tavily/core";

/** Identity sent to Tavily as X-Client-Name for every tool in this package. */
export const CLIENT_NAME = "ai-sdk";

/**
 * Creates the Tavily client used by the tools.
 *
 * `clientName` identifies this integration; `clientSource` is left to the SDK so it keeps reporting its own
 * transport (tavily-js, or tavily-js-keyless without a key). Options are spread last, so a caller can
 * supply their own `clientName` or `clientSource`.
 */
export const createTavilyClient = (options: TavilyClientOptions = {}) =>
  tavily({ clientName: CLIENT_NAME, ...options });

const CLIENT_LEVEL_KEYS = [
  "apiKey", "proxies", "apiBaseURL", "clientSource", "clientName", "projectId", "orgId", "sessionId", "humanId",
] as const;

/**
 * Returns only the per-request options. Client-level settings (API key, proxies, base URL, identity, ids) are
 * consumed by `createTavilyClient`; the SDK forwards unknown per-request keys in the request body, so they
 * must not be passed along again.
 */
export const requestOptions = <T extends Record<string, any>>(options: T) => {
  const rest: Record<string, any> = { ...options };
  for (const key of CLIENT_LEVEL_KEYS) delete rest[key];
  return rest;
};
