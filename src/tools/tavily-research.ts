import { tool } from "ai";
import { z } from "zod";
import type { TavilyClientOptions, TavilyResearchResponse } from "@tavily/core";
import { createTavilyClient } from "../client";

const researchControls = z.object({
  model: z.enum(["mini", "pro", "auto"]).optional().describe("Research model: mini for focused questions, pro for comprehensive research, or auto (default)."),
  outputSchema: z.object({
    properties: z.record(z.string(), z.unknown()),
    required: z.array(z.string()).optional(),
  }).passthrough().optional().describe("JSON Schema with a properties object for structured output. Nested schema keys are preserved."),
  citationFormat: z.enum(["numbered", "mla", "apa", "chicago"]).optional().describe("Citation style (default: numbered)."),
  includeDomains: z.array(z.string()).max(20).optional().describe("Prefer these domains and subdomains; this is not a strict allowlist. Up to 20."),
  excludeDomains: z.array(z.string()).max(20).optional().describe("Block these domains and their subdomains. Up to 20."),
  outputLength: z.enum(["short", "standard", "long"]).optional().describe("Target report length (default: standard), not a hard limit."),
  files: z.array(z.object({
    name: z.string().regex(/\.(txt|md|json)$/i).describe("Filename ending in .txt, .md or .json."),
    data: z.string().base64().describe("Base64-encoded file contents."),
    type: z.literal("base64").optional(),
  })).max(5).optional().describe("Up to five files. The service enforces the 80,000-word combined limit; files used in the report are cited."),
});

export type TavilyResearchOptions = TavilyClientOptions & z.infer<typeof researchControls> & {
  /** Submission HTTP timeout in seconds. Does not wait for the research job to finish. */
  timeout?: number;
};

/** Submit a background task. Use tavilyGetResearch with the returned requestId later. */
export const tavilyResearch = (options: TavilyResearchOptions = {}) => {
  const client = createTavilyClient(options);
  const inputSchema = researchControls.extend({
    input: z.string().min(1).describe("The research question or task to investigate."),
  });
  return tool({
    description: "Start a background Tavily Research task. Returns a requestId and initial status, not a completed report. Save the ID and use tavilyGetResearch later to check status and retrieve the report and sources; do not repeatedly submit the same task.",
    inputSchema,
    execute: async (input: z.infer<typeof inputSchema>): Promise<TavilyResearchResponse> => {
      const supplied = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
      // Parse after merging so both developer defaults and model inputs follow the public contract.
      const params = inputSchema.parse({ ...options, ...supplied });
      return await client.research(params.input, {
        model: params.model,
        outputSchema: params.outputSchema,
        citationFormat: params.citationFormat,
        // The SDK supports extra wire parameters without requiring a change to the shared SDK.
        include_domains: params.includeDomains,
        exclude_domains: params.excludeDomains,
        output_length: params.outputLength,
        files: params.files,
        stream: false,
        timeout: options.timeout ?? 60,
      }) as TavilyResearchResponse;
    },
  });
};

export type TavilyGetResearchOptions = TavilyClientOptions & { includeUsage?: boolean };
export type TavilyResearchResult = {
  requestId: string;
  status: string;
  createdAt?: string;
  responseTime?: number;
  content?: string | Record<string, unknown>;
  sources?: Array<Record<string, unknown>>;
  usage?: Record<string, unknown>;
  [key: string]: unknown;
};

/** One status/result lookup. Scheduling retries belongs to the caller, not an unbounded agent tool. */
export const tavilyGetResearch = (options: TavilyGetResearchOptions = {}) => {
  const client = createTavilyClient(options);
  const inputSchema = z.object({
    requestId: z.string().regex(/^[a-zA-Z0-9_-]+$/).describe("The requestId returned by tavilyResearch."),
    includeUsage: z.boolean().optional().describe("Include credit usage when available."),
  });
  return tool({
    description: "Check one existing Tavily Research task. Pending/in_progress is not a finished report: retain the requestId and check later. Completed results include content and sources/citations; a failed task retains its error details. Never report a pending or failed task as completed.",
    inputSchema,
    execute: async (input: z.infer<typeof inputSchema>): Promise<TavilyResearchResult> => {
      const params = inputSchema.parse(input);
      const response = await client.getResearch(params.requestId, { includeUsage: params.includeUsage ?? options.includeUsage });
      // @tavily/core 0.7.14 returns raw API keys here despite its camelCase types.
      // Normalize known envelope keys only; keep structured output and source metadata intact.
      const { request_id, created_at, response_time, ...rest } = response as unknown as Record<string, unknown>;
      return {
        ...rest,
        ...(request_id !== undefined && { requestId: request_id }),
        ...(created_at !== undefined && { createdAt: created_at }),
        ...(response_time !== undefined && { responseTime: response_time }),
      } as TavilyResearchResult;
    },
  });
};
