import { tool } from "ai";
import { z } from "zod";

type TavilySearchOptions = {
  apiKey?: string;
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  includeImages?: boolean;
  includeAnswer?: boolean;
  maxResults?: number;
  includeImageDescriptions?: boolean;
  includeRawContent?: false | "markdown" | "text";
  includeDomains?: string[];
  excludeDomains?: string[];
  timeRange?: "year" | "month" | "week" | "day" | "y" | "m" | "w" | "d";
  country?: string;
  chunksPerSource?: number;
  startDate?: string;
  endDate?: string;
  autoParameters?: boolean;
  maxTokens?: number;
  includeFavicon?: boolean;
  timeout?: number;
  days?: number;
};

/**
 * Tavily Search tool for AI SDK
 * Performs web searches optimized for AI applications with real-time, contextual information
 */
export const tavilySearch = ({
  apiKey,
  searchDepth = "basic",
  topic = "general",
  includeImages = false,
  includeAnswer = false,
  maxResults = 5,
  includeImageDescriptions,
  includeRawContent,
  includeDomains,
  excludeDomains,
  timeRange,
  country,
  chunksPerSource,
  startDate,
  endDate,
  autoParameters,
  maxTokens,
  includeFavicon,
  timeout = 60,
  days,
}: TavilySearchOptions = {}) =>
  tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The search query to look up on the web"),
    }),
    execute: async ({ query }) => {
      const effectiveApiKey = apiKey || process.env.TAVILY_API_KEY;

      if (!effectiveApiKey) {
        throw new Error(
          "Tavily API key is required. Set it via options or TAVILY_API_KEY environment variable."
        );
      }

      const requestBody: Record<string, any> = {
        query,
        search_depth: searchDepth,
        topic: topic,
        max_results: maxResults,
        include_images: includeImages,
        include_answer: includeAnswer,
      };

      // Add optional parameters from initialization
      if (includeDomains && includeDomains.length > 0)
        requestBody.include_domains = includeDomains;
      if (excludeDomains && excludeDomains.length > 0)
        requestBody.exclude_domains = excludeDomains;
      if (timeRange) requestBody.time_range = timeRange;
      if (startDate) requestBody.start_date = startDate;
      if (endDate) requestBody.end_date = endDate;
      if (includeFavicon !== undefined)
        requestBody.include_favicon = includeFavicon;
      if (days !== undefined) requestBody.days = days;
      if (includeImageDescriptions !== undefined)
        requestBody.include_image_descriptions = includeImageDescriptions;
      if (includeRawContent) requestBody.include_raw_content = includeRawContent;
      if (country) requestBody.country = country;
      if (chunksPerSource !== undefined)
        requestBody.chunks_per_source = chunksPerSource;
      if (autoParameters !== undefined)
        requestBody.auto_parameters = autoParameters;
      if (maxTokens !== undefined) requestBody.max_tokens = maxTokens;
      if (timeout !== undefined) requestBody.timeout = timeout;

      try {
        const response = await fetch("https://api.tavily.com/search", {
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
          throw new Error(`Failed to search with Tavily: ${error.message}`);
        }
        throw error;
      }
    },
  });
