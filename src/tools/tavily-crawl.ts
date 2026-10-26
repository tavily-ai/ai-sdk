import { tool } from "ai";
import { z } from "zod";
import type { 
  TavilyCrawlOptions as CoreCrawlOptions,
  TavilyClientOptions
} from "@tavily/core";
import { createTavilyClient, requestOptions } from "../client";

type TavilyCrawlOptions = TavilyClientOptions & Partial<CoreCrawlOptions>;

/**
 * Tavily Crawl tool for AI SDK
 * Crawls a website starting from a base URL to discover and extract content from multiple pages
 */
export const tavilyCrawl = (options: TavilyCrawlOptions = {}) => {
  const client = createTavilyClient(options);
  
  const inputSchema = z.object({
    url: z
      .string()
      .describe("The base URL to start crawling from"),
    maxDepth: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe(
        "Maximum depth to crawl (number of link hops from the base URL, default: 1)"
      ),
    extractDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .describe("Extraction depth for page content (default: 'basic')"),
    instructions: z
      .string()
      .optional()
      .describe(
        "Optional instructions to guide the crawler (e.g., 'only crawl blog posts', 'focus on product pages')"
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
      .describe("Regex patterns; only URLs with matching paths are crawled, e.g. '/docs/.*'"),
    selectDomains: z
      .array(z.string())
      .optional()
      .describe("Regex patterns; only matching domains are crawled"),
    excludePaths: z
      .array(z.string())
      .optional()
      .describe("Regex patterns for paths to skip"),
    excludeDomains: z
      .array(z.string())
      .optional()
      .describe("Regex patterns for domains to skip"),
    chunksPerSource: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe("Maximum relevant chunks per page (default: 3). Only applies when instructions are given"),
    format: z
      .enum(["markdown", "text"])
      .optional()
      .describe("Content format (default: 'markdown')"),
    timeout: z
      .number()
      .min(10)
      .max(150)
      .optional()
      .describe("Seconds to wait for the crawl, 10-150 (default: 150)"),
    includeImages: z
      .boolean()
      .optional()
      .describe("Include images found on the pages"),
    includeFavicon: z
      .boolean()
      .optional()
      .describe("Include the favicon URL for each result"),
    includeUsage: z
      .boolean()
      .optional()
      .describe("Include credit usage in the response"),
  });

  return tool({
    description:
      "Crawl a website starting from a base URL to discover and extract content from multiple pages. Intelligently traverses links and extracts structured data at scale.",
    inputSchema,
    execute: async ({ url, ...rest }: z.infer<typeof inputSchema>) => {
      // Only keys the model supplied override the developer's defaults from `options`.
      const supplied = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      const merged: Record<string, any> = { ...requestOptions(options), ...supplied };
      // chunksPerSource is only accepted together with instructions; the API default (3) applies otherwise.
      if (!merged.instructions) delete merged.chunksPerSource;
      return await client.crawl(url, merged as CoreCrawlOptions);
    },
  });
};
