// Compile in the isolated installed-package consumer for each advertised AI SDK major.
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tavilySearch, tavilyExtract, tavilyMap, tavilyCrawl, tavilyResearch, tavilyGetResearch, type TavilyResearchOptions, type TavilyResearchResult } from "@tavily/ai-sdk";
const researchOptions: TavilyResearchOptions = {
  apiKey: "offline-key", model: "pro", citationFormat: "apa", includeDomains: ["example.com"], excludeDomains: ["excluded.com"], outputLength: "long",
  outputSchema: { properties: { summary: { type: "string" } }, required: ["summary"] },
  files: [{ name: "context.txt", type: "base64", data: "aGVsbG8=" }], timeout: 15,
};
const openai = createOpenAI({ apiKey: "offline-key" });
const result = () => generateText({
  model: openai.chat("gpt-4o-mini"), prompt: "not executed",
  tools: {
    search: tavilySearch({ apiKey: "offline-key", safeSearch: false, includePublishedDate: true, filterByPublishedDate: true }),
    extract: tavilyExtract(), map: tavilyMap(), crawl: tavilyCrawl(),
    research: tavilyResearch(researchOptions), researchStatus: tavilyGetResearch({ includeUsage: true }),
  },
});
const consume = (value: TavilyResearchResult): unknown => [value.requestId, value.status, value.content, value.sources, value.usage];
void result;
void consume;
