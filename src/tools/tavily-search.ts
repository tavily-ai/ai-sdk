import { tool } from "ai";
import { tavily } from "@tavily/core";
import { searchAgentInputSchema } from "@tavily/core/agent-schemas";
import type { SearchAgentInput } from "@tavily/core/agent-schemas";
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
  const client = tavily({ ...options, clientSource: "ai-sdk" } as TavilyClientOptions);

  return tool({
    description:
      "Search the web for real-time information using Tavily's AI-optimized search engine. Returns relevant sources, snippets, and optional AI-generated answers.",
    inputSchema: searchAgentInputSchema,
    execute: async ({ query, ...input }: SearchAgentInput) => {
      // Model-provided values override configured defaults; omitted fields keep them.
      const overrides = Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
      );
      return await client.search(query, { ...options, ...overrides });
    },
  });
};
