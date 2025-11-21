import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { tavilySearch, tavilyExtract, tavilyCrawl, tavilyMap } from "./index";

async function testSearch() {
  console.log("\n=== Testing Tavily Search ===\n");
  
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "Write a report about the latest developments in AI in 2024?",
    tools: {
      tavilySearch: tavilySearch(),
    },
    stopWhen: stepCountIs(5),
  });
  console.log(result.content);
}

async function testExtract() {
  console.log("\n=== Testing Tavily Extract ===\n");
  
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "Extract and summarize the content from https://tavily.com",
    tools: {
      tavilyExtract: tavilyExtract(),
    },
    stopWhen: stepCountIs(5),
  });

  console.log("\n✅ Answer:");
  console.log(result.text);
  console.log("\n");
}

async function testCrawl() {
  console.log("\n=== Testing Tavily Crawl ===\n");
  
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "Crawl the Tavily website and tell me about their main features",
    tools: {
      tavilyCrawl: tavilyCrawl(),
    },
    stopWhen: stepCountIs(5),
  });

  console.log("\n✅ Answer:");
  console.log(result.text);
  console.log("\n");
}

async function testMap() {
  console.log("\n=== Testing Tavily Map ===\n");
  
  const result = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "Map the structure of tavily.com and describe its main sections",
    tools: {
      tavilyMap: tavilyMap(),
    },
    stopWhen: stepCountIs(5),
  });

  console.log("\n✅ Answer:");
  console.log(result.text);
  console.log("\n");
}

async function main() {
  // Run one test at a time
  //await testSearch();
  await testExtract();
  // await testCrawl();
  // await testMap();
}

main().catch(console.error);
