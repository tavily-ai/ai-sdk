import { tool, type Tool } from "ai";
import type { z } from "zod";
import { searchAgentInputSchema, searchParameterSchemas as params } from "@tavily/core/agent-schemas";
import type {
  TavilySearchOptions as CoreSearchOptions,
  TavilyClientOptions,
  TavilySearchResponse
} from "@tavily/core";
import { createTavilyClient, requestOptions } from "../client";
import { validateSearchParams } from "../validate";

type TavilySearchOptions = TavilyClientOptions & CoreSearchOptions;

/**
 * Model-facing input: the SDK's shared agent schema (query, searchDepth, timeRange, exactMatch) plus the
 * further Search parameters this tool lets the model set, built from the SDK's own field validators.
 * A description is overridden only where the model needs a constraint the SDK's wording leaves out.
 */
const inputSchema = searchAgentInputSchema.extend({
  topic: params.topic.optional(),
  maxResults: params.maxResults.optional(),
  chunksPerSource: params.chunksPerSource
    .optional()
    .describe("Maximum relevant snippets per source for 'basic', 'advanced' and 'fast' search (default: 3)"),
  startDate: params.startDate.optional(),
  endDate: params.endDate.optional(),
  country: params.country
    .optional()
    .describe("Boost results from this country, lowercase name such as 'united states'. Only with topic 'general'"),
  includeDomains: params.includeDomains.optional(),
  excludeDomains: params.excludeDomains.optional(),
  includeDomainsMode: params.includeDomainsMode
    .optional()
    .describe("With includeDomains: 'prefer' boosts those domains, 'restrict' returns only those hosts and subdomains"),
  language: params.language.optional().describe("Boost results in this language, for example 'english'"),
  filterByLanguage: params.filterByLanguage.optional().describe("Return only results in `language`. Requires language"),
  safeSearch: params.safeSearch
    .optional()
    .describe("Filter out unsafe content. Not available with 'fast' or 'ultra-fast' depth"),
  autoParameters: params.autoParameters
    .optional()
    .describe("Let Tavily configure search parameters from the query intent; it may choose 'advanced' depth (2 credits)"),
  includeAnswer: params.includeAnswer.optional(),
  includeRawContent: params.includeRawContent.optional(),
  includeImages: params.includeImages.optional(),
  includeImageDescriptions: params.includeImageDescriptions.optional(),
  includeFavicon: params.includeFavicon.optional(),
  includePublishedDate: params.includePublishedDate.optional(),
  filterByPublishedDate: params.filterByPublishedDate.optional(),
  includeUsage: params.includeUsage.optional(),
});

/**
 * Tavily Search tool for AI SDK
 * Performs web searches optimized for AI applications with real-time, contextual information
 */
export const tavilySearch = (options: TavilySearchOptions = {}): Tool<z.infer<typeof inputSchema>, TavilySearchResponse> => {
  const client = createTavilyClient(options);

  return tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers.",
    inputSchema,
    execute: async ({ query, ...rest }) => {
      // Only keys the model supplied override the developer's defaults from `options`.
      const supplied = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      const merged: CoreSearchOptions = { ...requestOptions(options), ...supplied };
      validateSearchParams(merged);
      return await client.search(query, merged);
    },
  });
};
