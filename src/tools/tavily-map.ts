import { tool } from "ai";
import { z } from "zod";

type TavilyMapOptions = {
  apiKey?: string;
};

/**
 * Tavily Map tool for AI SDK
 * Maps the structure of a website to discover and organize its pages and hierarchy
 */
export const tavilyMap = ({ apiKey }: TavilyMapOptions = {}) =>
  tool({
    description:
      "Map the structure of a website starting from a base URL. Discovers pages, links, and site hierarchy without extracting full content. Ideal for understanding site architecture.",
    inputSchema: z.object({
      url: z
        .string()
        .url()
        .describe("The base URL to start mapping from"),
      maxDepth: z
        .number()
        .min(1)
        .max(5)
        .optional()
        .describe(
          "Maximum depth to map (number of link hops from the base URL, default: 1)"
        ),
      maxBreadth: z
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe(
          "Maximum number of pages to map per depth level (default: 20)"
        ),
      limit: z
        .number()
        .min(1)
        .optional()
        .describe("Maximum total number of pages to map (default: 50)"),
      instructions: z
        .string()
        .optional()
        .describe(
          "Optional instructions to guide the mapping (e.g., 'focus on documentation pages', 'skip API references')"
        ),
      selectPaths: z
        .array(z.string())
        .optional()
        .describe("Array of path patterns to include (e.g., ['/blog/*', '/docs/*'])"),
      selectDomains: z
        .array(z.string())
        .optional()
        .describe("Array of domains to include in mapping"),
      excludePaths: z
        .array(z.string())
        .optional()
        .describe("Array of path patterns to exclude"),
      excludeDomains: z
        .array(z.string())
        .optional()
        .describe("Array of domains to exclude from mapping"),
      allowExternal: z
        .boolean()
        .optional()
        .describe("Whether to allow mapping external domains (default: false)"),
    }),
    execute: async ({
      url,
      maxDepth = 1,
      maxBreadth = 20,
      limit = 50,
      instructions,
      selectPaths,
      selectDomains,
      excludePaths,
      excludeDomains,
      allowExternal,
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

      try {
        const response = await fetch("https://api.tavily.com/map", {
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
          throw new Error(`Failed to map with Tavily: ${error.message}`);
        }
        throw error;
      }
    },
  });
