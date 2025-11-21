import { tool } from "ai";
import { z } from "zod";

type TavilyExtractOptions = {
  apiKey?: string;
  includeImages?: boolean;
  includeFavicon?: boolean;
  extractDepth?: "basic" | "advanced";
  format?: "markdown" | "text";
  timeout?: number;
};

/**
 * Tavily Extract tool for AI SDK
 * Extracts structured content from specified URLs with AI-optimized parsing
 */
export const tavilyExtract = ({
  apiKey,
  includeImages = false,
  includeFavicon,
  extractDepth = "basic",
  format = "markdown",
  timeout = 30,
}: TavilyExtractOptions = {}) =>
  tool({
    description:
      "Extract clean, structured content from one or more URLs. Returns parsed content in markdown or text format, optimized for AI consumption.",
    inputSchema: z.object({
      urls: z
        .array(z.string())
        .describe("Array of URLs to extract content from"),
      extractDepth: z
        .enum(["basic", "advanced"])
        .optional()
        .describe(
          "Extraction depth - 'basic' for main content, 'advanced' for comprehensive extraction (default: 'basic')"
        ),
    }),
    execute: async ({
      urls,
      extractDepth: inputExtractDepth,
    }) => {
      const effectiveApiKey = apiKey || process.env.TAVILY_API_KEY;

      if (!effectiveApiKey) {
        throw new Error(
          "Tavily API key is required. Set it via options or TAVILY_API_KEY environment variable."
        );
      }

      const requestBody: Record<string, any> = {
        urls,
        include_images: includeImages,
        extract_depth: inputExtractDepth ?? extractDepth,
        format,
      };

      // Add optional parameters only if provided
      if (includeFavicon !== undefined)
        requestBody.include_favicon = includeFavicon;
      if (timeout !== undefined) requestBody.timeout = timeout;

      try {
        const response = await fetch("https://api.tavily.com/extract", {
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
          throw new Error(`Failed to extract with Tavily: ${error.message}`);
        }
        throw error;
      }
    },
  });
