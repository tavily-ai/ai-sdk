import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import * as tools from "../src/index";

// Real SDK transport to a local fixture; never contacts Tavily or an LLM provider.
const ctx = { toolCallId: "research-test", messages: [] } as any;
const factories = tools as any;
const run = (tool: any, input: any) => tool.execute(input, ctx);

test("Research exports submit and status/result factories", () => {
  assert.equal(typeof factories.tavilyResearch, "function");
  assert.equal(typeof factories.tavilyGetResearch, "function");
});

test("Research submits all public controls and preserves the complete task lifecycle over HTTP", async () => {
  const requests: any[] = [];
  let status = 201;
  let reply: any = { request_id: "task-1", created_at: "2026-10-26T00:00:00Z", status: "pending", input: "Research this", model: "pro", response_time: 0.1 };
  const server = createServer(async (req, res) => {
    let data = "";
    for await (const chunk of req) data += chunk;
    requests.push({ method: req.method, url: req.url, headers: req.headers, body: data ? JSON.parse(data) : undefined });
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(reply));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as any;
  const config = { apiKey: "offline-key", apiBaseURL: `http://127.0.0.1:${address.port}`, clientName: "consumer-app", clientSource: "custom-source" };
  try {
    const submit = factories.tavilyResearch({ ...config, model: "mini", citationFormat: "apa", outputLength: "short", includeDomains: ["default.example"], timeout: 2 });
    const outputSchema = { type: "object", properties: { company_name: { type: "string" } }, required: ["company_name"] };
    const files = [{ name: "evidence.md", data: Buffer.from("public input").toString("base64"), type: "base64" }];
    const submitted = await run(submit, { input: "Research this", model: "pro", citationFormat: "chicago", includeDomains: ["example.com"], excludeDomains: ["excluded.com"], outputLength: "long", outputSchema, files });
    assert.deepEqual(requests[0].body, { input: "Research this", model: "pro", stream: false, citation_format: "chicago", include_domains: ["example.com"], exclude_domains: ["excluded.com"], output_length: "long", output_schema: outputSchema, files });
    assert.equal(requests[0].headers["x-client-name"], "consumer-app");
    assert.equal(requests[0].headers["x-client-source"], "custom-source");
    assert.equal(requests[0].headers.authorization, "Bearer offline-key");
    assert.equal(submitted.requestId, "task-1");
    assert.equal(submitted.status, "pending");
    const get = factories.tavilyGetResearch({ ...config, includeUsage: true });
    status = 202;
    reply = { request_id: "task-1", status: "in_progress", response_time: 2 };
    const pending = await run(get, { requestId: submitted.requestId, includeUsage: false });
    assert.equal(requests[1].url, "/research/task-1?include_usage=false");
    assert.deepEqual(pending, { requestId: "task-1", status: "in_progress", responseTime: 2 });
    status = 200;
    reply = { request_id: "task-1", created_at: "today", status: "completed", content: { company_name: "Example", cited_source: "[1]" }, sources: [{ title: "Example", url: "https://example.com", favicon: "https://example.com/icon", citation_number: 1 }, { title: "File", type: "file", name: "evidence.md" }], response_time: 3, usage: { credits: 0 }, metadata: { retained: true } };
    const complete = await run(get, { requestId: "task-1" });
    assert.equal(requests[2].url, "/research/task-1?include_usage=true");
    assert.equal(complete.requestId, "task-1");
    assert.equal(complete.createdAt, "today");
    assert.deepEqual(complete.content, reply.content);
    assert.deepEqual(complete.sources, reply.sources);
    assert.deepEqual(complete.usage, { credits: 0 });
    assert.deepEqual(complete.metadata, { retained: true });
    reply = { request_id: "task-1", status: "failed", error: "Task could not complete" };
    assert.deepEqual(await run(get, { requestId: "task-1" }), { requestId: "task-1", status: "failed", error: "Task could not complete" });
    for (const errorStatus of [401, 404, 429, 500]) {
      status = errorStatus; reply = { detail: { error: "Fixture request rejected" } };
      await assert.rejects(() => run(get, { requestId: "task-1" }));
      await assert.rejects(() => run(submit, { input: "Research this" }));
    }
    status = 201; reply = { request_id: "task-2", status: "pending" };
    await run(submit, { input: "Use defaults" });
    assert.deepEqual(requests.at(-1).body, { input: "Use defaults", model: "mini", citation_format: "apa", include_domains: ["default.example"], output_length: "short", stream: false });
    await run(submit, { input: "Clear domains", includeDomains: [] });
    assert.deepEqual(requests.at(-1).body.include_domains, []);
  } finally { await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve())); }
});

test("Research schemas validate files, domains, models and request identifiers", async () => {
  const submit = factories.tavilyResearch({ apiKey: "offline-key" });
  const get = factories.tavilyGetResearch({ apiKey: "offline-key" });
  const valid = { input: "question", files: [{ name: "notes.txt", data: "aGVsbG8=" }] };
  assert.equal(submit.inputSchema.safeParse(valid).success, true);
  for (const input of [
    { input: "" }, { input: "q", model: "other" }, { input: "q", outputLength: "huge" },
    { input: "q", includeDomains: Array(21).fill("example.com") },
    { input: "q", excludeDomains: Array(21).fill("example.com") },
    { input: "q", files: Array(6).fill(valid.files[0]) },
    { input: "q", files: [{ name: "notes.pdf", data: "aGVsbG8=" }] },
    { input: "q", outputSchema: {} },
    { input: "q", files: [{ name: "notes.txt", data: "not base64?" }] },
  ]) assert.equal(submit.inputSchema.safeParse(input).success, false, JSON.stringify(input));
  assert.equal(get.inputSchema.safeParse({ requestId: "" }).success, false);
  assert.equal("stream" in submit.inputSchema.shape, false);
  assert.equal("apiKey" in submit.inputSchema.shape, false);
  for (const model of ["mini", "pro", "auto"]) assert.equal(submit.inputSchema.safeParse({ input: "q", model }).success, true);
  for (const citationFormat of ["numbered", "mla", "apa", "chicago"]) assert.equal(submit.inputSchema.safeParse({ input: "q", citationFormat }).success, true);
  // Validation also runs for direct execute users and developer-provided defaults.
  await assert.rejects(() => run(factories.tavilyResearch({ apiKey: "offline-key", includeDomains: Array(21).fill("example.com") }), { input: "q" }));
  await assert.rejects(() => run(get, { requestId: "../usage" }));
});
