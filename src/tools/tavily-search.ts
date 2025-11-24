import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type { 
  TavilySearchOptions as CoreSearchOptions,
  TavilyClientOptions
} from "@tavily/core";

type TavilySearchOptions = TavilyClientOptions & Partial<CoreSearchOptions>;

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
    includeImages: z
      .boolean()
      .optional()
      .describe("Whether to include relevant images in the results"),
    timeRange: z
      .enum(["year", "month", "week", "day", "y", "m", "w", "d"])
      .optional()
      .describe("Time range for search results"),
    includeDomains: z
      .array(z.string())
      .optional()
      .describe("List of domains to specifically include in the search"),
    excludeDomains: z
      .array(z.string())
      .optional()
      .describe("List of domains to exclude from the search"),
    startDate: z
      .string()
      .optional()
      .describe("Start date for search results (format: YYYY-MM-DD)"),
    endDate: z
      .string()
      .optional()
      .describe("End date for search results (format: YYYY-MM-DD)"),
  });

  return tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers.",
    inputSchema,
    execute: async ({
      query,
      searchDepth: inputSearchDepth,
      includeImages: inputIncludeImages,
      timeRange: inputTimeRange,
      includeDomains: inputIncludeDomains,
      excludeDomains: inputExcludeDomains,
      startDate: inputStartDate,
      endDate: inputEndDate,
    }: z.infer<typeof inputSchema>) => {
      return await client.search(query, {
        ...options,
        searchDepth: inputSearchDepth ?? options.searchDepth,
        includeImages: inputIncludeImages ?? options.includeImages,
        includeDomains: inputIncludeDomains ?? options.includeDomains,
        excludeDomains: inputExcludeDomains ?? options.excludeDomains,
        timeRange: inputTimeRange ?? options.timeRange,
        startDate: inputStartDate ?? options.startDate,
        endDate: inputEndDate ?? options.endDate,
      });
    },
  });
};
