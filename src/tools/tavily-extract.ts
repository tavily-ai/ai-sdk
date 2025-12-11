import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type { 
  TavilyExtractOptions as CoreExtractOptions,
  TavilyClientOptions
} from "@tavily/core";

type TavilyExtractOptions = TavilyClientOptions & Partial<CoreExtractOptions>;

/**
 * Tavily Extract tool for AI SDK
 * Extracts structured content from specified URLs with AI-optimized parsing
 */
export const tavilyExtract = (options: TavilyExtractOptions = {}) => {
  const client = tavily(options);
  
  const inputSchema = z.object({
    urls: z
      .array(z.string())
      .describe("Array of URLs to extract content from"),
    extractDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .describe(
        "Extraction depth - 'basic' for main content, 'advanced' for comprehensive extraction (default: 'basic')"
      ),
    query: z
      .string()
      .optional()
      .describe(
        "Query for intent-based extraction - when provided, returns content most relevant to the query"
      ),
    chunksPerSource: z
      .number()
      .int()
      .min(1)
      .optional()
      .describe(
        "Number of top chunks to return per source when using query-based extraction (default: 3)"
      ),
  });

  return tool({
    description:
      "Extract clean, structured content from one or more URLs. Returns parsed content in markdown or text format, optimized for AI consumption.",
    inputSchema,
    execute: async ({
      urls,
      extractDepth: inputExtractDepth,
      query: inputQuery,
      chunksPerSource: inputChunksPerSource,
    }: z.infer<typeof inputSchema>) => {
      return await client.extract(urls, {
        ...options,
        extractDepth: inputExtractDepth ?? options.extractDepth,
        query: inputQuery ?? options.query,
        chunksPerSource: inputChunksPerSource ?? options.chunksPerSource,
      });
    },
  });
};
