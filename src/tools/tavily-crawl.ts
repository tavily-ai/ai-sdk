import { tool } from "ai";
import { z } from "zod";

type TavilyCrawlOptions = {
  apiKey?: string;
};

/**
 * Tavily Crawl tool for AI SDK
 * Crawls a website starting from a base URL to discover and extract content from multiple pages
 */
export const tavilyCrawl = ({ apiKey }: TavilyCrawlOptions = {}) =>
  tool({
    description:
      "Crawl a website starting from a base URL to discover and extract content from multiple pages. Intelligently traverses links and extracts structured data at scale.",
    inputSchema: z.object({
      url: z
        .string()
        .url()
        .describe("The base URL to start crawling from"),
      maxDepth: z
        .number()
        .min(1)
        .max(5)
        .optional()
        .describe(
          "Maximum depth to crawl (number of link hops from the base URL, default: 1)"
        ),
      maxBreadth: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe(
          "Maximum number of pages to crawl per depth level (default: 20)"
        ),
      limit: z
        .number()
        .min(1)
        .optional()
        .describe("Maximum total number of pages to crawl (default: 50)"),
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
      selectPaths: z
        .array(z.string())
        .optional()
        .describe("Array of path patterns to include (e.g., ['/blog/*', '/docs/*'])"),
      selectDomains: z
        .array(z.string())
        .optional()
        .describe("Array of domains to include in crawling"),
      excludePaths: z
        .array(z.string())
        .optional()
        .describe("Array of path patterns to exclude"),
      excludeDomains: z
        .array(z.string())
        .optional()
        .describe("Array of domains to exclude from crawling"),
      allowExternal: z
        .boolean()
        .optional()
        .describe("Whether to allow crawling external domains (default: false)"),
      includeImages: z
        .boolean()
        .optional()
        .describe("Whether to include images in extracted content (default: false)"),
      format: z
        .enum(["markdown", "text"])
        .optional()
        .describe("Output format for extracted content (default: 'markdown')"),
    }),
    execute: async ({
      url,
      maxDepth = 1,
      maxBreadth = 20,
      limit = 50,
      extractDepth = "basic",
      instructions,
      selectPaths,
      selectDomains,
      excludePaths,
      excludeDomains,
      allowExternal,
      includeImages,
      format = "markdown",
    }) => {
      const effectiveApiKey = apiKey || process.env.TAVILY_API_KEY;

      if (!effectiveApiKey) {
        throw new Error(
          "Tavily API key is required. Set it via options or TAVILY_API_KEY environment variable."
        );
      }

      const requestBody: Record<string, any> = {
        url,
        max_depth: maxDepth,
        max_breadth: maxBreadth,
        limit,
        extract_depth: extractDepth,
        format,
      };

      // Add optional parameters only if provided
      if (instructions) requestBody.instructions = instructions;
      if (selectPaths && selectPaths.length > 0)
        requestBody.select_paths = selectPaths;
      if (selectDomains && selectDomains.length > 0)
        requestBody.select_domains = selectDomains;
      if (excludePaths && excludePaths.length > 0)
        requestBody.exclude_paths = excludePaths;
      if (excludeDomains && excludeDomains.length > 0)
        requestBody.exclude_domains = excludeDomains;
      if (allowExternal !== undefined)
        requestBody.allow_external = allowExternal;
      if (includeImages !== undefined)
        requestBody.include_images = includeImages;

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
