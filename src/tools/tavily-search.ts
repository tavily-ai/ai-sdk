import { tool } from "ai";
import { z } from "zod";
import type {
  TavilySearchOptions as CoreSearchOptions,
  TavilyClientOptions
} from "@tavily/core";
import { createTavilyClient, requestOptions } from "../client";
import { validateSearchParams } from "../validate";

type TavilySearchOptions = TavilyClientOptions & Partial<CoreSearchOptions>;

/**
 * Tavily Search tool for AI SDK
 * Performs web searches optimized for AI applications with real-time, contextual information
 */
export const tavilySearch = (options: TavilySearchOptions = {}) => {
  const client = createTavilyClient(options);
  
  const inputSchema = z.object({
    query: z
      .string()
      .describe("The search query to look up on the web"),
    searchDepth: z
      .enum(["basic", "advanced", "fast", "ultra-fast"])
      .optional()
      .describe(
        "The depth of the search - 'basic' for quick results, 'advanced' for comprehensive search, 'fast' for low latency with high relevance (BETA), 'ultra-fast' prioritizes latency above all (BETA)"
      ),
    topic: z
      .enum(["general", "news", "finance"])
      .optional()
      .describe("The category of the search (default: 'general')"),
    maxResults: z
      .number()
      .int()
      .min(0)
      .max(20)
      .optional()
      .describe("Maximum number of results to return (default: 10)"),
    chunksPerSource: z
      .number()
      .int()
      .min(1)
      .max(3)
      .optional()
      .describe("Maximum relevant snippets per source for 'basic', 'advanced' and 'fast' search (default: 3)"),
    timeRange: z
      .enum(["year", "month", "week", "day", "y", "m", "w", "d"])
      .optional()
      .describe("Time range for search results"),
    startDate: z
      .string()
      .optional()
      .describe("Only return results after this date, YYYY-MM-DD"),
    endDate: z
      .string()
      .optional()
      .describe("Only return results before this date, YYYY-MM-DD"),
    country: z
      .string()
      .optional()
      .describe("Boost results from this country, lowercase name such as 'united states'. Only with topic 'general'"),
    includeDomains: z
      .array(z.string())
      .max(300)
      .optional()
      .describe("Domains to include in results"),
    excludeDomains: z
      .array(z.string())
      .max(150)
      .optional()
      .describe("Domains to exclude from results"),
    includeDomainsMode: z
      .enum(["prefer", "restrict"])
      .optional()
      .describe("With includeDomains: 'prefer' boosts those domains, 'restrict' returns only those hosts and subdomains"),
    language: z
      .string()
      .optional()
      .describe("Boost results in this language, for example 'english'"),
    filterByLanguage: z
      .boolean()
      .optional()
      .describe("Return only results in `language`. Requires language"),
    safeSearch: z
      .boolean()
      .optional()
      .describe("Filter out unsafe content. Not available with 'fast' or 'ultra-fast' depth"),
    exactMatch: z
      .boolean()
      .optional()
      .describe("Only return results containing the exact phrase(s) in quotes in your query"),
    autoParameters: z
      .boolean()
      .optional()
      .describe("Let Tavily configure search parameters from the query intent; it may choose 'advanced' depth (2 credits)"),
    includeAnswer: z
      .union([z.boolean(), z.enum(["basic", "advanced"])])
      .optional()
      .describe("Include an LLM-generated answer"),
    includeRawContent: z
      .union([z.boolean(), z.enum(["markdown", "text"])])
      .optional()
      .describe("Include cleaned page content for each result"),
    includeImages: z
      .boolean()
      .optional()
      .describe("Include query-related images"),
    includeImageDescriptions: z
      .boolean()
      .optional()
      .describe("With includeImages, also include image descriptions"),
    includeFavicon: z
      .boolean()
      .optional()
      .describe("Include the favicon URL for each result"),
    includePublishedDate: z
      .boolean()
      .optional()
      .describe("Include published_date for each result (BETA); null when undetectable; always on for topic 'news'"),
    filterByPublishedDate: z
      .boolean()
      .optional()
      .describe("Drop results outside the time range or start/end date window, including undated ones (BETA); also enables includePublishedDate"),
    includeUsage: z
      .boolean()
      .optional()
      .describe("Include credit usage in the response"),
  });

  return tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers.",
    inputSchema,
    execute: async (input: z.infer<typeof inputSchema>) => {
      const { query, includePublishedDate, filterByPublishedDate, safeSearch, ...rest } = input;
      // Only keys the model supplied override the developer's defaults from `options`.
      const supplied = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      const merged: Record<string, any> = { ...requestOptions(options), ...supplied };
      validateSearchParams({ ...merged, safeSearch });
      return await client.search(query, {
        ...merged,
        // Not named options in the SDK yet; its extra-parameter passthrough sends them as snake_case.
        ...(safeSearch !== undefined && { safe_search: safeSearch }),
        ...(includePublishedDate !== undefined && { include_published_date: includePublishedDate }),
        ...(filterByPublishedDate !== undefined && { filter_by_published_date: filterByPublishedDate }),
      } as CoreSearchOptions);
    },
  });
};
