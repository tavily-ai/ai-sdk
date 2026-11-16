// Copy into a clean package consumer after `npm pack` and install matching ai/OpenAI versions.
// Uses the real generateText engine and OpenAI chat adapter with a deterministic provider fetch,
// plus real HTTP to a loopback Tavily fixture. No external API/provider calls are made.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { generateText, stepCountIs } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tavilySearch, tavilyExtract, tavilyMap, tavilyCrawl, tavilyResearch, tavilyGetResearch } from "@tavily/ai-sdk";

const received = [];
let lookups = 0;
const server = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  received.push({ url: req.url, method: req.method, body: body ? JSON.parse(body) : undefined, headers: req.headers });
  res.setHeader("Content-Type", "application/json");
  if (req.method === "POST" && req.url === "/research") {
    res.statusCode = 201;
    res.end(JSON.stringify({ request_id: "task-1", created_at: "today", status: "pending", model: "mini", input: "Research example" }));
  } else if (req.method === "GET" && req.url === "/research/task-1?include_usage=true") {
    lookups++;
    res.statusCode = lookups === 1 ? 202 : 200;
    res.end(JSON.stringify(lookups === 1 ? { request_id: "task-1", status: "in_progress" } : { request_id: "task-1", status: "completed", content: { company_name: "Example" }, sources: [{ title: "Example", url: "https://example.com", favicon: "icon" }], usage: { credits: 0 } }));
  } else {
    res.statusCode = 400;
    res.end(JSON.stringify({ detail: "Unexpected fixture request" }));
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let providerCalls = 0;
const providerBodies = [];
const openai = createOpenAI({
  apiKey: "offline-provider-key",
  baseURL: "https://offline-provider.test/v1",
  fetch: async (url, init) => {
    assert.equal(String(url), "https://offline-provider.test/v1/chat/completions");
    const body = JSON.parse(init.body);
    providerBodies.push(body);
    providerCalls++;
    const args = providerCalls === 1
      ? { input: "Research example", model: "mini", outputLength: "short", outputSchema: { properties: { company_name: { type: "string", description: "Name" } }, required: ["company_name"] }, files: [{ name: "note.md", data: "aGVsbG8=" }] }
      : { requestId: "task-1", includeUsage: true };
    const message = providerCalls < 4
      ? { role: "assistant", content: null, tool_calls: [{ id: `call-${providerCalls}`, type: "function", function: { name: providerCalls === 1 ? "research" : "researchStatus", arguments: JSON.stringify(args) } }] }
      : { role: "assistant", content: "Completed report cites https://example.com." };
    return new Response(JSON.stringify({ id: `completion-${providerCalls}`, object: "chat.completion", created: 1, model: "gpt-4o-mini", choices: [{ index: 0, message, finish_reason: providerCalls < 4 ? "tool_calls" : "stop" }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } }), { headers: { "Content-Type": "application/json" } });
  },
});
try {
  const options = { apiKey: "offline-tavily-key", apiBaseURL: `http://127.0.0.1:${server.address().port}` };
  const result = await generateText({
    model: openai.chat("gpt-4o-mini"),
    prompt: "Research example, check the saved task until done, and cite its source.",
    tools: { search: tavilySearch(options), extract: tavilyExtract(options), map: tavilyMap(options), crawl: tavilyCrawl(options), research: tavilyResearch(options), researchStatus: tavilyGetResearch(options) },
    stopWhen: stepCountIs(4),
    maxRetries: 0,
  });
  assert.equal(providerCalls, 4);
  assert.equal(received.length, 3);
  assert.equal(result.steps.length, 4);
  assert.equal(result.steps[0].toolResults[0].output.requestId, "task-1");
  assert.equal(result.steps[1].toolResults[0].output.status, "in_progress");
  assert.equal(result.steps[2].toolResults[0].output.status, "completed");
  assert.deepEqual(result.steps[2].toolResults[0].output.content, { company_name: "Example" });
  assert.equal(result.steps[2].toolResults[0].output.sources[0].favicon, "icon");
  assert.equal(result.steps[2].toolResults[0].output.usage.credits, 0);
  assert.match(result.text, /https:\/\/example.com/);
  assert.equal(received[0].body.stream, false);
  assert.equal(received[0].body.output_length, "short");
  assert.deepEqual(received[0].body.files, [{ name: "note.md", data: "aGVsbG8=" }]);
  assert.equal(received[0].headers["x-client-name"], "ai-sdk");
  assert.equal(received[0].headers["x-client-source"], "tavily-js");
  const schemas = Object.fromEntries(providerBodies[0].tools.map(t => [t.function.name, t.function.parameters]));
  assert.deepEqual(Object.keys(schemas).sort(), ["crawl", "extract", "map", "research", "researchStatus", "search"]);
  assert.ok(schemas.research.properties.outputSchema);
  assert.equal(schemas.research.properties.files.maxItems, 5);
  assert.equal(schemas.research.properties.includeDomains.maxItems, 20);
  assert.equal(schemas.map.properties.maxDepth.type, "integer");
  assert.equal(schemas.search.properties.maxResults.maximum, 20);
  console.log(JSON.stringify({ status: "PASS", provider: "real OpenAI chat adapter; deterministic fetch, no live model", tavily: "real local HTTP via released core SDK", calls: received.length, agentSteps: result.steps.length, toolSchemas: Object.keys(schemas), completeContent: true, citations: true }));
} finally { await new Promise(resolve => server.close(resolve)); }
