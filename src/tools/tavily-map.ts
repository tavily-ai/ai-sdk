import { tool } from "ai";
import { z } from "zod";
import type { 
  TavilyMapOptions as CoreMapOptions,
  TavilyClientOptions
} from "@tavily/core";
import { createTavilyClient, requestOptions } from "../client";

type TavilyMapOptions = TavilyClientOptions & Partial<CoreMapOptions>;

/**
 * Tavily Map tool for AI SDK
 * Maps the structure of a website to discover and organize its pages and hierarchy
 */
export const tavilyMap = (options: TavilyMapOptions = {}) => {
  const client = createTavilyClient(options);
  
  const inputSchema = z.object({
    url: z
      .string()
      .describe("The base URL to start mapping from"),
    maxDepth: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe(
        "Maximum depth to map (number of link hops from the base URL, default: 1)"
      ),
    instructions: z
      .string()
      .optional()
      .describe(
        "Optional instructions to guide the mapping (e.g., 'focus on documentation pages', 'skip API references')"
      ),
    allowExternal: z
      .boolean()
      .optional()
      .describe("Whether to include external domain links in the results (default: true)"),
    maxBreadth: z
      .number()
      .int()
      .min(1)
      .max(500)
      .optional()
      .describe("Maximum links to follow per page (default: 20)"),
    limit: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe("Total number of links to process before stopping (default: 50)"),
    selectPaths: z
      .array(z.string())
      .optional()
      .describe("Regex patterns; only URLs with matching paths are mapped, e.g. '/docs/.*'"),
    selectDomains: z
      .array(z.string())
      .optional()
      .describe("Regex patterns; only matching domains are mapped"),
    excludePaths: z
      .array(z.string())
      .optional()
      .describe("Regex patterns for paths to skip"),
    excludeDomains: z
      .array(z.string())
      .optional()
      .describe("Regex patterns for domains to skip"),
    timeout: z
      .number()
      .min(10)
      .max(150)
      .optional()
      .describe("Seconds to wait for the map, 10-150 (default: 150)"),
    includeUsage: z
      .boolean()
      .optional()
      .describe("Include credit usage in the response"),
  });

  return tool({
    description:
      "Map the structure of a website starting from a base URL. Discovers pages, links, and site hierarchy without extracting full content. Ideal for understanding site architecture.",
    inputSchema,
    execute: async ({ url, ...rest }: z.infer<typeof inputSchema>) => {
      // Only keys the model supplied override the developer's defaults from `options`.
      const supplied = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      return await client.map(url, { ...requestOptions(options), ...supplied } as CoreMapOptions);
    },
  });
};
