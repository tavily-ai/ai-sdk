import { tool } from "ai";
import { z } from "zod";

type TavilyCrawlOptions = {
  apiKey?: string;
  maxDepth?: number;
  maxBreadth?: number;
  limit?: number;
  extractDepth?: "basic" | "advanced";
  format?: "markdown" | "text";
  selectPaths?: string[];
  selectDomains?: string[];
  excludePaths?: string[];
  excludeDomains?: string[];
  includeImages?: boolean;
  includeFavicon?: boolean;
  timeout?: number;
};

/**
 * Tavily Crawl tool for AI SDK
 * Crawls a website starting from a base URL to discover and extract content from multiple pages
 */
export const tavilyCrawl = ({
  apiKey,
  maxDepth = 1,
  maxBreadth = 20,
  limit = 50,
  extractDepth = "basic",
  format = "markdown",
  selectPaths,
  selectDomains,
  excludePaths,
  excludeDomains,
  includeImages = false,
  includeFavicon,
  timeout = 150,
}: TavilyCrawlOptions = {}) =>
  tool({
    description:
      "Crawl a website starting from a base URL to discover and extract content from multiple pages. Intelligently traverses links and extracts structured data at scale.",
    inputSchema: z.object({
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
    }),
    execute: async ({
      url,
      maxDepth: inputMaxDepth,
      extractDepth: inputExtractDepth,
      instructions: inputInstructions,
      allowExternal: inputAllowExternal,
    }) => {
      const effectiveApiKey = apiKey || process.env.TAVILY_API_KEY;

      if (!effectiveApiKey) {
        throw new Error(
          "Tavily API key is required. Set it via options or TAVILY_API_KEY environment variable."
        );
      }

      const requestBody: Record<string, any> = {
        url,
        max_depth: inputMaxDepth ?? maxDepth,
        max_breadth: maxBreadth,
        limit,
        extract_depth: inputExtractDepth ?? extractDepth,
        format,
        include_images: includeImages,
      };

      // Add agent-controllable parameters if provided
      if (inputInstructions) requestBody.instructions = inputInstructions;
      if (inputAllowExternal !== undefined)
        requestBody.allow_external = inputAllowExternal;

      // Add developer-only parameters from closure
      if (selectPaths && selectPaths.length > 0)
        requestBody.select_paths = selectPaths;
      if (selectDomains && selectDomains.length > 0)
        requestBody.select_domains = selectDomains;
      if (excludePaths && excludePaths.length > 0)
        requestBody.exclude_paths = excludePaths;
      if (excludeDomains && excludeDomains.length > 0)
        requestBody.exclude_domains = excludeDomains;
      if (includeFavicon !== undefined)
        requestBody.include_favicon = includeFavicon;
      if (timeout !== undefined) requestBody.timeout = timeout;

      try {
        const response = await fetch("https://api.tavily.com/crawl", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveApiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Tavily API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
          );
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to crawl with Tavily: ${error.message}`);
        }
        throw error;
      }
    },
  });
