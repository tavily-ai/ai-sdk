// Offline tests: axios' adapter is replaced, so nothing leaves the process and no real key is needed.
import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { tavilySearch, tavilyExtract, tavilyCrawl, tavilyMap } from "../src/index";

type Sent = { url: string; headers: Record<string, string>; body: any };
const sent: Sent[] = [];
let reply: any = {};

axios.defaults.adapter = async (config: any) => {
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(config.headers?.toJSON ? config.headers.toJSON() : config.headers)) headers[k.toLowerCase()] = String(v);
  sent.push({ url: config.url, headers, body: config.data ? JSON.parse(config.data) : undefined });
  return { data: reply, status: 200, statusText: "OK", headers: {}, config };
};

const ctx = { toolCallId: "t", messages: [] } as any;
const run = (t: any, input: any) => t.execute(input, ctx);
const KEY = { apiKey: "tvly-dummy-not-used" };
const searchReply = { query: "q", results: [], images: [], response_time: 0.1, request_id: "req-1" };

test("every tool identifies the integration with client_name and keeps the SDK's own source", async () => {
  const cases: Array<[any, any, any]> = [
    [tavilySearch(KEY), { query: "q" }, searchReply],
    [tavilyExtract(KEY), { urls: ["https://example.com"] }, { results: [], failed_results: [], response_time: 0.1, request_id: "r" }],
    [tavilyCrawl(KEY), { url: "https://example.com" }, { base_url: "x", results: [], response_time: 0.1, request_id: "r" }],
    [tavilyMap(KEY), { url: "https://example.com" }, { base_url: "x", results: [], response_time: 0.1, request_id: "r" }],
  ];
  for (const [t, input, r] of cases) {
    sent.length = 0; reply = r;
    await run(t, input);
    assert.equal(sent[0].headers["x-client-name"], "ai-sdk");
    assert.equal(sent[0].headers["x-client-source"], "tavily-js");
  }
});

test("a caller-supplied clientName or clientSource wins", async () => {
  sent.length = 0; reply = searchReply;
  await run(tavilySearch({ ...KEY, clientName: "my-app", clientSource: "my-source" }), { query: "q" });
  assert.equal(sent[0].headers["x-client-name"], "my-app");
  assert.equal(sent[0].headers["x-client-source"], "my-source");
});

test("search sends every supported option in the request body", async () => {
  sent.length = 0; reply = searchReply;
  await run(tavilySearch(KEY), {
    query: "q", searchDepth: "advanced", topic: "general", maxResults: 0, chunksPerSource: 2, timeRange: "week",
    startDate: "2026-01-01", endDate: "2026-02-01", country: "united states", includeDomains: ["example.com"],
    excludeDomains: ["bad.com"], includeDomainsMode: "restrict", language: "english", filterByLanguage: true,
    safeSearch: true, exactMatch: true, autoParameters: false, includeAnswer: "advanced", includeRawContent: "markdown",
    includeImages: true, includeImageDescriptions: true, includeFavicon: true, includePublishedDate: true,
    filterByPublishedDate: true, includeUsage: true,
  });
  assert.deepEqual(sent[0].body, {
    query: "q", search_depth: "advanced", topic: "general", max_results: 0, chunks_per_source: 2, time_range: "week",
    start_date: "2026-01-01", end_date: "2026-02-01", country: "united states", include_domains: ["example.com"],
    exclude_domains: ["bad.com"], include_domains_mode: "restrict", language: "english", filter_by_language: true,
    safe_search: true, exact_match: true, auto_parameters: false, include_answer: "advanced", include_raw_content: "markdown",
    include_images: true, include_image_descriptions: true, include_favicon: true, include_published_date: true,
    filter_by_published_date: true, include_usage: true,
  } as any);
});

test("false values from the model are sent, and the developer's defaults apply when the model omits a field", async () => {
  sent.length = 0; reply = searchReply;
  await run(tavilySearch({ ...KEY, searchDepth: "advanced", maxResults: 3 }), { query: "q", includePublishedDate: false, safeSearch: false });
  assert.equal(sent[0].body.include_published_date, false);
  assert.equal(sent[0].body.safe_search, false);
  assert.equal(sent[0].body.search_depth, "advanced");
  assert.equal(sent[0].body.max_results, 3);
  sent.length = 0;
  await run(tavilySearch({ ...KEY, maxResults: 3 }), { query: "q", maxResults: 7 });
  assert.equal(sent[0].body.max_results, 7);
});

test("search maps usage, request id, favicon and published_date from the response", async () => {
  sent.length = 0;
  reply = { query: "q", images: [], response_time: 0.2, request_id: "req-9", usage: { credits: 0 },
    results: [{ title: "t", url: "https://e.x", content: "c", score: 1, favicon: "https://e.x/f.ico", published_date: "2026-10-01" },
              { title: "u", url: "https://e.y", content: "c", score: 1, published_date: null }] };
  const out: any = await run(tavilySearch(KEY), { query: "q", includeUsage: true });
  assert.equal(out.requestId, "req-9");
  assert.deepEqual(out.usage, { credits: 0 });
  assert.equal(out.results[0].favicon, "https://e.x/f.ico");
  assert.equal(out.results[0].publishedDate, "2026-10-01");
  assert.equal(out.results[1].publishedDate, null);
});

test("invalid search combinations are rejected before any request", async () => {
  sent.length = 0; reply = searchReply;
  const t = tavilySearch(KEY);
  await assert.rejects(() => run(t, { query: "q", includeDomainsMode: "prefer" }), /requires includeDomains/);
  await assert.rejects(() => run(t, { query: "q", filterByLanguage: true }), /requires language/);
  await assert.rejects(() => run(t, { query: "q", safeSearch: true, searchDepth: "fast" }), /safeSearch is not available/);
  await assert.rejects(() => run(t, { query: "q", searchDepth: "ultra-fast", chunksPerSource: 2 }), /does not apply/);
  await assert.rejects(() => run(t, { query: "q", topic: "news", country: "france" }), /only available when topic is 'general'/);
  assert.equal(sent.length, 0);
  await run(t, { query: "q", searchDepth: "basic", chunksPerSource: 2 });
  assert.equal(sent[0].body.chunks_per_source, 2);
});

test("extract sends its options, requires query for chunks and keeps usage and failures", async () => {
  sent.length = 0;
  reply = { results: [], failed_results: [{ url: "https://bad", error: "boom" }], response_time: 0.1, request_id: "r", usage: { credits: 1 } };
  const t = tavilyExtract(KEY);
  const out: any = await run(t, { urls: ["https://example.com"], query: "pricing", chunksPerSource: 5, format: "text", timeout: 12, extractDepth: "advanced", includeImages: true, includeFavicon: true, includeUsage: true });
  assert.deepEqual(sent[0].body, { urls: ["https://example.com"], query: "pricing", chunks_per_source: 5, format: "text", timeout: 12, extract_depth: "advanced", include_images: true, include_favicon: true, include_usage: true } as any);
  assert.deepEqual(out.failedResults, [{ url: "https://bad", error: "boom" }]);
  assert.deepEqual(out.usage, { credits: 1 });
  sent.length = 0;
  await assert.rejects(() => run(t, { urls: ["https://example.com"], chunksPerSource: 2 }), /requires query/);
  assert.equal(sent.length, 0);
});

test("extract takes 1 to 20 URLs in the tool schema", () => {
  const schema: any = (tavilyExtract(KEY) as any).inputSchema;
  const parse = (urls: string[]) => schema.safeParse ? schema.safeParse({ urls }).success : schema["~standard"].validate({ urls });
  assert.equal(parse([]), false);
  assert.equal(parse(Array.from({ length: 20 }, (_, i) => `https://e.x/${i}`)), true);
  assert.equal(parse(Array.from({ length: 21 }, (_, i) => `https://e.x/${i}`)), false);
});

test("crawl sends chunks_per_source only together with instructions and maps the new options", async () => {
  sent.length = 0; reply = { base_url: "x", results: [], response_time: 0.1, request_id: "r" };
  const t = tavilyCrawl(KEY);
  await run(t, { url: "https://example.com", chunksPerSource: 4 });
  assert.equal("chunks_per_source" in sent[0].body, false);
  sent.length = 0;
  await run(t, { url: "https://example.com", instructions: "docs", chunksPerSource: 4, maxDepth: 2, maxBreadth: 10, limit: 5, selectPaths: ["/docs/.*"], selectDomains: ["^a\\.com$"], excludePaths: ["/x"], excludeDomains: ["b"], allowExternal: false, format: "text", timeout: 30, includeImages: true, includeFavicon: true, includeUsage: true });
  assert.deepEqual(sent[0].body, { url: "https://example.com", instructions: "docs", chunks_per_source: 4, max_depth: 2, max_breadth: 10, limit: 5, select_paths: ["/docs/.*"], select_domains: ["^a\\.com$"], exclude_paths: ["/x"], exclude_domains: ["b"], allow_external: false, format: "text", timeout: 30, include_images: true, include_favicon: true, include_usage: true } as any);
});

test("map sends its options", async () => {
  sent.length = 0; reply = { base_url: "x", results: [], response_time: 0.1, request_id: "r" };
  await run(tavilyMap(KEY), { url: "https://example.com", instructions: "docs", maxDepth: 3, maxBreadth: 7, limit: 9, selectPaths: ["/a"], excludeDomains: ["b"], allowExternal: false, timeout: 20, includeUsage: true });
  assert.deepEqual(sent[0].body, { url: "https://example.com", instructions: "docs", max_depth: 3, max_breadth: 7, limit: 9, select_paths: ["/a"], exclude_domains: ["b"], allow_external: false, timeout: 20, include_usage: true } as any);
});

test("client-level settings are not repeated in the request body", async () => {
  sent.length = 0;
  reply = searchReply;
  await run(tavilySearch({ ...KEY, projectId: "p1", sessionId: "s1", humanId: "h1", clientName: "x", clientSource: "y", maxResults: 2 }), { query: "q" });
  assert.deepEqual(Object.keys(sent[0].body).sort(), ["max_results", "query"]);
});

test("Search developer defaults for beta fields map to API names and explicit false wins", async () => {
  sent.length = 0; reply = searchReply;
  const t = tavilySearch({ ...KEY, safeSearch: true, includePublishedDate: true, filterByPublishedDate: true } as any);
  await run(t, { query: "q" });
  assert.equal(sent[0].body.safe_search, true);
  assert.equal(sent[0].body.include_published_date, true);
  assert.equal(sent[0].body.filter_by_published_date, true);
  assert.equal("safeSearch" in sent[0].body, false);
  assert.equal("includePublishedDate" in sent[0].body, false);
  sent.length = 0;
  await run(t, { query: "q", safeSearch: false, includePublishedDate: false, filterByPublishedDate: false });
  assert.equal(sent[0].body.safe_search, false);
  assert.equal(sent[0].body.include_published_date, false);
  assert.equal(sent[0].body.filter_by_published_date, false);
});

test("Map/Crawl traversal depth is an integer in the tool schema", () => {
  for (const factory of [tavilyMap, tavilyCrawl]) {
    const schema = factory(KEY).inputSchema as any;
    assert.equal(schema.safeParse({ url: "https://example.com", maxDepth: 1.5 }).success, false);
    assert.equal(schema.safeParse({ url: "https://example.com", maxDepth: 5 }).success, true);
  }
});
