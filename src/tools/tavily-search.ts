import { tool } from "ai";
import { z } from "zod";

type TavilySearchOptions = {
  apiKey?: string;
  searchDepth?: "basic" | "advanced";
  topic?: "general" | "news" | "finance";
  includeImages?: boolean;
  includeAnswer?: boolean;
  maxResults?: number;
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
}: TavilySearchOptions = {}) =>
  tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers.",
    inputSchema: z.object({
      query: z
        .string()
        .describe("The search query to look up on the web"),
      searchDepth: z
        .enum(["basic", "advanced"])
        .optional()
        .describe(
          "The depth of the search - 'basic' for quick results, 'advanced' for comprehensive search"
        ),
      topic: z
        .enum(["general", "news", "finance"])
        .optional()
        .describe("The category of the search"),
      days: z
        .number()
        .optional()
        .describe("Number of days back to search (for news and finance topics)"),
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of search results to return (default: 5)"),
      includeImages: z
        .boolean()
        .optional()
        .describe("Whether to include relevant images in the results"),
      includeImageDescriptions: z
        .boolean()
        .optional()
        .describe("Whether to include AI-generated image descriptions"),
      includeAnswer: z
        .boolean()
        .optional()
        .describe("Whether to include an AI-generated answer to the query"),
      includeRawContent: z
        .enum(["markdown", "text"])
        .optional()
        .describe("Include raw content in specified format"),
      includeDomains: z
        .array(z.string())
        .optional()
        .describe("List of domains to specifically include in the search"),
      excludeDomains: z
        .array(z.string())
        .optional()
        .describe("List of domains to exclude from the search"),
      timeRange: z
        .enum(["year", "month", "week", "day", "y", "m", "w", "d"])
        .optional()
        .describe("Time range for search results"),
      country: z
        .string()
        .optional()
        .describe("Country code for localized search (e.g., 'US', 'GB')"),
    }),
    execute: async ({
      query,
      searchDepth: inputSearchDepth,
      topic: inputTopic,
      days,
      maxResults: inputMaxResults,
      includeImages: inputIncludeImages,
      includeImageDescriptions,
      includeAnswer: inputIncludeAnswer,
      includeRawContent,
      includeDomains,
      excludeDomains,
      timeRange,
      country,
    }) => {
      const effectiveApiKey = apiKey || process.env.TAVILY_API_KEY;

      if (!effectiveApiKey) {
        throw new Error(
          "Tavily API key is required. Set it via options or TAVILY_API_KEY environment variable."
        );
      }

      const requestBody: Record<string, any> = {
        query,
        search_depth: inputSearchDepth || searchDepth,
        topic: inputTopic || topic,
        max_results: inputMaxResults || maxResults,
        include_images: inputIncludeImages ?? includeImages,
        include_answer: inputIncludeAnswer ?? includeAnswer,
      };

      // Add optional parameters only if provided
      if (days !== undefined) requestBody.days = days;
      if (includeImageDescriptions !== undefined)
        requestBody.include_image_descriptions = includeImageDescriptions;
      if (includeRawContent) requestBody.include_raw_content = includeRawContent;
      if (includeDomains && includeDomains.length > 0)
        requestBody.include_domains = includeDomains;
      if (excludeDomains && excludeDomains.length > 0)
        requestBody.exclude_domains = excludeDomains;
      if (timeRange) requestBody.time_range = timeRange;
      if (country) requestBody.country = country;

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
