import { tool } from "ai";
import { z } from "zod";

type TavilyMapOptions = {
  apiKey?: string;
  maxDepth?: number;
  maxBreadth?: number;
  limit?: number;
  selectPaths?: string[];
  selectDomains?: string[];
  excludePaths?: string[];
  excludeDomains?: string[];
  allowExternal?: boolean;
  instructions?: string;
  timeout?: number;
};

/**
 * Tavily Map tool for AI SDK
 * Maps the structure of a website to discover and organize its pages and hierarchy
 */
export const tavilyMap = ({
  apiKey,
  maxDepth = 1,
  maxBreadth = 20,
  limit = 50,
  selectPaths,
  selectDomains,
  excludePaths,
  excludeDomains,
  allowExternal,
  instructions,
  timeout = 150,
}: TavilyMapOptions = {}) =>
  tool({
    description:
      "Map the structure of a website starting from a base URL. Discovers pages, links, and site hierarchy without extracting full content. Ideal for understanding site architecture.",
    inputSchema: z.object({
      url: z
        .string()
        .describe("The base URL to start mapping from"),
      maxDepth: z
        .number()
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
        .describe("Whether to allow mapping external domains (default: false)"),
    }),
    execute: async ({
      url,
      maxDepth: inputMaxDepth,
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
      };

      // Add agent-controllable parameters if provided
      if (inputInstructions) requestBody.instructions = inputInstructions;
      else if (instructions) requestBody.instructions = instructions;
      
      if (inputAllowExternal !== undefined)
        requestBody.allow_external = inputAllowExternal;
      else if (allowExternal !== undefined)
        requestBody.allow_external = allowExternal;

      // Add developer-only parameters from closure
      if (selectPaths && selectPaths.length > 0)
        requestBody.select_paths = selectPaths;
      if (selectDomains && selectDomains.length > 0)
        requestBody.select_domains = selectDomains;
      if (excludePaths && excludePaths.length > 0)
        requestBody.exclude_paths = excludePaths;
      if (excludeDomains && excludeDomains.length > 0)
        requestBody.exclude_domains = excludeDomains;
      if (timeout !== undefined) requestBody.timeout = timeout;

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
