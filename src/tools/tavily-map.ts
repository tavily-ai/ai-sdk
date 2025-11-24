import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type { 
  TavilyMapOptions as CoreMapOptions,
  TavilyClientOptions
} from "@tavily/core";

type TavilyMapOptions = TavilyClientOptions & Partial<CoreMapOptions>;

/**
 * Tavily Map tool for AI SDK
 * Maps the structure of a website to discover and organize its pages and hierarchy
 */
export const tavilyMap = (options: TavilyMapOptions = {}) => {
  const client = tavily(options);
  
  const inputSchema = z.object({
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
  });

  return tool({
    description:
      "Map the structure of a website starting from a base URL. Discovers pages, links, and site hierarchy without extracting full content. Ideal for understanding site architecture.",
    inputSchema,
    execute: async ({
      url,
      maxDepth: inputMaxDepth,
      instructions: inputInstructions,
      allowExternal: inputAllowExternal,
    }: z.infer<typeof inputSchema>) => {
      return await client.map(url, {
        ...options,
        maxDepth: inputMaxDepth ?? options.maxDepth,
        instructions: inputInstructions ?? options.instructions,
        allowExternal: inputAllowExternal ?? options.allowExternal,
      });
    },
  });
};
