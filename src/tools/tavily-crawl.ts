import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type { 
  TavilyCrawlOptions as CoreCrawlOptions,
  TavilyClientOptions
} from "@tavily/core";

type TavilyCrawlOptions = TavilyClientOptions & Partial<CoreCrawlOptions>;

/**
 * Tavily Crawl tool for AI SDK
 * Crawls a website starting from a base URL to discover and extract content from multiple pages
 */
export const tavilyCrawl = (options: TavilyCrawlOptions = {}) => {
  const client = tavily(options);
  
  const inputSchema = z.object({
    url: z
      .string()
      .describe("The base URL to start crawling from"),
    maxDepth: z
      .number()
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
      .describe("Whether to allow crawling external domains (default: false)"),
    query: z
      .string()
      .optional()
      .describe(
        "Query for intent-based extraction - when provided, returns content most relevant to the query"
      ),
    chunksPerSource: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "Number of top chunks to return per source when using query-based extraction (default: 3)"
      ),
  });

  return tool({
    description:
      "Crawl a website starting from a base URL to discover and extract content from multiple pages. Intelligently traverses links and extracts structured data at scale.",
    inputSchema,
    execute: async ({
      url,
      maxDepth: inputMaxDepth,
      extractDepth: inputExtractDepth,
      instructions: inputInstructions,
      allowExternal: inputAllowExternal,
      query: inputQuery,
      chunksPerSource: inputChunksPerSource,
    }: z.infer<typeof inputSchema>) => {
      return await client.crawl(url, {
        ...options,
        maxDepth: inputMaxDepth ?? options.maxDepth,
        extractDepth: inputExtractDepth ?? options.extractDepth,
        instructions: inputInstructions ?? options.instructions,
        allowExternal: inputAllowExternal ?? options.allowExternal,
        query: inputQuery ?? options.query,
        chunksPerSource: inputChunksPerSource ?? options.chunksPerSource,
      });
    },
  });
};
