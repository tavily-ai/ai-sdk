import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type {
  TavilySearchOptions as CoreSearchOptions,
  TavilyClientOptions
} from "@tavily/core";

type TavilySearchOptions = TavilyClientOptions &
  Partial<CoreSearchOptions> & {
    include_usage?: boolean;
  };

/**
 * Tavily Search tool for AI SDK
 * Performs web searches optimized for AI applications with real-time, contextual information
 */
export const tavilySearch = (options: TavilySearchOptions = {}) => {
  const client = tavily(options);
  
  const inputSchema = z.object({
    query: z
      .string()
      .describe("The search query to look up on the web"),
    searchDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .describe(
        "The depth of the search - 'basic' for quick results, 'advanced' for comprehensive search"
      ),
    timeRange: z
      .enum(["year", "month", "week", "day", "y", "m", "w", "d"])
      .optional()
      .describe("Time range for search results"),
    include_usage: z
      .boolean()
      .optional()
      .describe(
        "When true, Tavily will return a `usage` field containing the credits billed for this request (default: false)"
      ),
  });

  return tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers.",
    inputSchema,
    execute: async ({
      query,
      searchDepth: inputSearchDepth,
      timeRange: inputTimeRange,
      include_usage: inputIncludeUsage,
    }: z.infer<typeof inputSchema>) => {
      return await client.search(query, {
        ...options,
        searchDepth: inputSearchDepth ?? options.searchDepth,
        timeRange: inputTimeRange ?? options.timeRange,
        include_usage: inputIncludeUsage ?? options.include_usage,
      });
    },
  });
};
