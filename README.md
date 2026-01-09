# @tavily/ai-sdk

AI SDK tools for Tavily, compatible with Vercel's AI SDK v5 and v6.

## Features

- **Search**: Real-time web search optimized for AI applications
- **Extract**: Clean, structured content extraction from URLs
- **Crawl**: Intelligent website crawling at scale
- **Map**: Website structure discovery and mapping

## Installation

```bash
npm install @tavily/ai-sdk
# or
pnpm install @tavily/ai-sdk
# or
yarn add @tavily/ai-sdk
```

## Prerequisites

You need a Tavily API key to use these tools. Get one at [tavily.com](https://tavily.com).

Set your API key as an environment variable:

```bash
export TAVILY_API_KEY=tvly-your-api-key
```

Or pass it directly to the tool configuration.

## Usage

### Tavily Search

Search the web for real-time, AI-optimized information:

```typescript
import { tavilySearch } from "@tavily/ai-sdk";
import { generateText, gateway, stepCountIs } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "What are the latest developments in quantum computing?",
  tools: {
    tavilySearch: tavilySearch({
      searchDepth: "advanced",
      includeAnswer: true,
      maxResults: 5,
    }),
  },
  stopWhen: stepCountIs(3),
});
```

**Configuration Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)
- `searchDepth?: "basic" | "advanced"` - Search depth (default: "basic")
- `topic?: "general" | "news" | "finance"` - Search category (default: "general")
- `includeImages?: boolean` - Include images in results (default: false)
- `includeAnswer?: boolean` - Include AI-generated answer (default: false)
- `maxResults?: number` - Maximum results to return (default: 5)
- `includeImageDescriptions?: boolean` - Include AI-generated image descriptions
- `includeRawContent?: false | "markdown" | "text"` - Include raw content in specified format
- `includeDomains?: string[]` - List of domains to include in search
- `excludeDomains?: string[]` - List of domains to exclude from search
- `maxTokens?: number` - Maximum number of tokens in response
- `timeRange?: "year" | "month" | "week" | "day" | "y" | "m" | "w" | "d"` - Time range for results
- `chunksPerSource?: number` - Number of content chunks per source
- `country?: string` - Country code for localized results
- `startDate?: string` - Start date for results (YYYY-MM-DD format)
- `endDate?: string` - End date for results (YYYY-MM-DD format)
- `days?: number` - Number of days back to search (for news/finance topics)
- `autoParameters?: boolean` - Enable automatic parameter optimization
- `timeout?: number` - Request timeout in milliseconds
- `includeFavicon?: boolean` - Include favicon URLs in results
- `includeUsage?: boolean` - Whether to include credit usage information in the response.
- `proxies?: { http?: string, https?: string }` - HTTP/HTTPS proxy configuration
- `apiBaseURL?: string` - Custom API base URL

### Tavily Extract

Extract clean, structured content from URLs:

```typescript
import { tavilyExtract } from "@tavily/ai-sdk";
import { generateText, gateway, stepCountIs } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Extract and summarize the content from https://tavily.com",
  tools: {
    tavilyExtract: tavilyExtract(),
  },
  stopWhen: stepCountIs(3),
});
```

**Configuration Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)
- `includeImages?: boolean` - Include images in extracted content (default: false)
- `extractDepth?: "basic" | "advanced"` - Extraction depth (default: "basic")
- `format?: "markdown" | "text"` - Output format (default: "markdown")
- `timeout?: number` - Request timeout in milliseconds
- `includeFavicon?: boolean` - Include favicon URLs in results
- `includeUsage?: boolean` - Whether to include credit usage information in the response. NOTE:The value may be 0 if the total successful URL extractions has not yet reached 5 calls. See our [Credits & Pricing documentation]("https://docs.tavily.com/documentation/api-credits") for details.
- `proxies?: { http?: string, https?: string }` - HTTP/HTTPS proxy configuration
- `apiBaseURL?: string` - Custom API base URL

**Input Parameters (for AI agent):**
- `urls: string[]` - Array of URLs to extract content from (required)
- `extractDepth?: "basic" | "advanced"` - Override extraction depth per call

### Tavily Crawl

Crawl websites to discover and extract content from multiple pages:

```typescript
import { tavilyCrawl } from "@tavily/ai-sdk";
import { generateText, gateway, stepCountIs } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Crawl tavily.com and tell me about their integrations",
  tools: {
    tavilyCrawl: tavilyCrawl(),
  },
  stopWhen: stepCountIs(3),
});
```

**Configuration Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)
- `maxDepth?: number` - Maximum crawl depth (1-5, default: 1)
- `maxBreadth?: number` - Maximum pages per depth level (1-100, default: 20)
- `limit?: number` - Maximum total pages to crawl (default: 50)
- `extractDepth?: "basic" | "advanced"` - Content extraction depth
- `instructions?: string` - Natural language crawling instructions
- `selectPaths?: string[]` - Path patterns to include (e.g., `["/blog/*"]`)
- `selectDomains?: string[]` - Domains to include
- `excludePaths?: string[]` - Path patterns to exclude (e.g., `["/admin/*"]`)
- `excludeDomains?: string[]` - Domains to exclude
- `allowExternal?: boolean` - Allow crawling external domains (default: false)
- `includeImages?: boolean` - Include images in extracted content
- `format?: "markdown" | "text"` - Output format (default: "markdown")
- `timeout?: number` - Request timeout in milliseconds
- `includeFavicon?: boolean` - Include favicon URLs in results
- `includeUsage?: boolean` - Whether to include credit usage information in the response. NOTE:The value may be 0 if the total use of /extract and /map have not yet reached minimum requirements. See our [Credits & Pricing documentation]("https://docs.tavily.com/documentation/api-credits") for details.
- `proxies?: { http?: string, https?: string }` - HTTP/HTTPS proxy configuration
- `apiBaseURL?: string` - Custom API base URL

**Input Parameters (for AI agent):**
- `url: string` - Base URL to start crawling from (required)
- `maxDepth?: number` - Override maximum crawl depth per call
- `extractDepth?: "basic" | "advanced"` - Override extraction depth per call
- `instructions?: string` - Override or specify crawling instructions per call
- `allowExternal?: boolean` - Override external domain crawling setting per call

### Tavily Map

Map website structure to understand site architecture:

```typescript
import { tavilyMap } from "@tavily/ai-sdk";
import { generateText, gateway, stepCountIs } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Map the structure of tavily.com",
  tools: {
    tavilyMap: tavilyMap(),
  },
  stopWhen: stepCountIs(3),
});
```

**Configuration Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)
- `maxDepth?: number` - Maximum mapping depth (1-5, default: 1)
- `maxBreadth?: number` - Maximum pages per depth level (1-100, default: 20)
- `limit?: number` - Maximum total pages to map (default: 50)
- `instructions?: string` - Natural language mapping instructions
- `selectPaths?: string[]` - Path patterns to include (e.g., `["/docs/*"]`)
- `selectDomains?: string[]` - Domains to include
- `excludePaths?: string[]` - Path patterns to exclude (e.g., `["/api/*"]`)
- `excludeDomains?: string[]` - Domains to exclude
- `allowExternal?: boolean` - Allow mapping external domains (default: false)
- `timeout?: number` - Request timeout in milliseconds
- `proxies?: { http?: string, https?: string }` - HTTP/HTTPS proxy configuration
- `apiBaseURL?: string` - Custom API base URL
- `includeUsage?: boolean` - Whether to include credit usage information in the response.NOTE:The value may be 0 if the total successful pages mapped has not yet reached 10 calls. See our [Credits & Pricing documentation]("https://docs.tavily.com/documentation/api-credits") for details.

**Input Parameters (for AI agent):**
- `url: string` - Base URL to start mapping from (required)
- `maxDepth?: number` - Override maximum mapping depth per call
- `instructions?: string` - Override or specify mapping instructions per call
- `allowExternal?: boolean` - Override external domain mapping setting per call


## Using Multiple Tools Together

You can combine multiple Tavily tools in a single AI agent:

```typescript
import { 
  tavilySearch, 
  tavilyExtract, 
  tavilyCrawl, 
  tavilyMap 
} from "@tavily/ai-sdk";
import { generateText, gateway, stepCountIs } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Research the company at tavily.com - search for news, map their site, and extract key pages",
  tools: {
    tavilySearch: tavilySearch({ searchDepth: "advanced" }),
    tavilyExtract: tavilyExtract(),
    tavilyCrawl: tavilyCrawl(),
    tavilyMap: tavilyMap(),
  },
  stopWhen: stepCountIs(3),
});
```

## Development

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```bash
TAVILY_API_KEY=tvly-your-api-key
```

## API Reference

For detailed API documentation, visit [docs.tavily.com](https://docs.tavily.com).

## License

MIT

## Support

- Documentation: [docs.tavily.com](https://docs.tavily.com)
- Support: [help.tavily.com](https://help.tavily.com)
- Issues: [GitHub Issues](https://github.com/tavily-ai/ai-sdk/issues)
