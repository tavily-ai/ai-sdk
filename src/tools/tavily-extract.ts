import { tool } from "ai";
import { z } from "zod";
import type { 
  TavilyExtractOptions as CoreExtractOptions,
  TavilyClientOptions
} from "@tavily/core";
import { createTavilyClient, requestOptions } from "../client";
import { validateExtractParams } from "../validate";

type TavilyExtractOptions = TavilyClientOptions & Partial<CoreExtractOptions>;

/**
 * Tavily Extract tool for AI SDK
 * Extracts structured content from specified URLs with AI-optimized parsing
 */
export const tavilyExtract = (options: TavilyExtractOptions = {}) => {
  const client = createTavilyClient(options);
  
  const inputSchema = z.object({
    urls: z
      .array(z.string())
      .min(1)
      .max(20)
      .describe("URLs to extract content from (1-20 per call)"),
    extractDepth: z
      .enum(["basic", "advanced"])
      .optional()
      .describe(
        "Extraction depth - 'basic' for main content, 'advanced' for comprehensive extraction (default: 'basic')"
      ),
    query: z
      .string()
      .optional()
      .describe("User intent query for reranking extracted content chunks"),
    chunksPerSource: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional()
      .describe("Maximum relevant chunks per URL (default: 3). Requires query"),
    format: z
      .enum(["markdown", "text"])
      .optional()
      .describe("Content format (default: 'markdown')"),
    timeout: z
      .number()
      .min(1)
      .max(60)
      .optional()
      .describe("Seconds to wait for extraction, 1-60 (default: 10 for basic, 30 for advanced)"),
    includeImages: z
      .boolean()
      .optional()
      .describe("Include images found on the pages"),
    includeFavicon: z
      .boolean()
      .optional()
      .describe("Include the favicon URL for each result"),
    includeUsage: z
      .boolean()
      .optional()
      .describe("Include credit usage in the response"),
  });

  return tool({
    description:
      "Extract clean, structured content from one or more URLs. Returns parsed content in markdown or text format, optimized for AI consumption.",
    inputSchema,
    execute: async ({ urls, ...rest }: z.infer<typeof inputSchema>) => {
      // Only keys the model supplied override the developer's defaults from `options`.
      const supplied = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
      const merged: Record<string, any> = { ...requestOptions(options), ...supplied };
      validateExtractParams(merged);
      return await client.extract(urls, merged as CoreExtractOptions);
    },
  });
};
