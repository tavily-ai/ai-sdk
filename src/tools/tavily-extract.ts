import { tool } from "ai";
import { z } from "zod";
import { tavily } from "@tavily/core";
import type {
  TavilyExtractOptions as CoreExtractOptions,
  TavilyClientOptions
} from "@tavily/core";

type TavilyExtractOptions = TavilyClientOptions &
  Partial<CoreExtractOptions> & {
    include_usage?: boolean;
  };

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
    include_usage: z
      .boolean()
      .optional()
      .describe(
        "When true, Tavily will return a `usage` field containing the credits billed for this request (default: false)"
      ),
  });

  return tool({
    description:
      "Extract clean, structured content from one or more URLs. Returns parsed content in markdown or text format, optimized for AI consumption.",
    inputSchema,
    execute: async ({
      urls,
      extractDepth: inputExtractDepth,
      include_usage: inputIncludeUsage,
    }: z.infer<typeof inputSchema>) => {
      return await client.extract(urls, {
        ...options,
        extractDepth: inputExtractDepth ?? options.extractDepth,
        include_usage: inputIncludeUsage ?? options.include_usage,
      });
    },
  });
};
