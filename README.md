# @tavily/ai-sdk

AI SDK tools for Tavily, built for Vercel's AI SDK v5.

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
import { generateText, gateway } from "ai";

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
});
```

**Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)
- `searchDepth?: "basic" | "advanced"` - Search depth (default: "basic")
- `topic?: "general" | "news" | "finance"` - Search category (default: "general")
- `includeImages?: boolean` - Include images in results (default: false)
- `includeAnswer?: boolean` - Include AI-generated answer (default: false)
- `maxResults?: number` - Maximum results to return (default: 5)

**Input Parameters:**
All tool options can be overridden per call, plus:
- `days?: number` - Days back to search (for news/finance)
- `includeImageDescriptions?: boolean` - Include AI image descriptions
- `includeRawContent?: "markdown" | "text"` - Include raw content
- `includeDomains?: string[]` - Domains to include
- `excludeDomains?: string[]` - Domains to exclude
- `timeRange?: "year" | "month" | "week" | "day"` - Time range filter
- `country?: string` - Country code for localized search

### Tavily Extract

Extract clean, structured content from URLs:

```typescript
import { tavilyExtract } from "@tavily/ai-sdk";
import { generateText, gateway } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Extract and summarize the content from https://tavily.com",
  tools: {
    tavilyExtract: tavilyExtract(),
  },
});
```

**Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)

**Input Parameters:**
- `urls: string[]` - Array of URLs to extract content from
- `includeImages?: boolean` - Include images (default: false)
- `extractDepth?: "basic" | "advanced"` - Extraction depth (default: "basic")
- `format?: "markdown" | "text"` - Output format (default: "markdown")

### Tavily Crawl

Crawl websites to discover and extract content from multiple pages:

```typescript
import { tavilyCrawl } from "@tavily/ai-sdk";
import { generateText, gateway } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Crawl tavily.com and tell me about their integrations",
  tools: {
    tavilyCrawl: tavilyCrawl(),
  },
});
```

**Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)

**Input Parameters:**
- `url: string` - Base URL to start crawling from
- `maxDepth?: number` - Maximum crawl depth (1-5, default: 1)
- `maxBreadth?: number` - Max pages per depth level (1-100, default: 20)
- `limit?: number` - Maximum total pages to crawl (default: 50)
- `extractDepth?: "basic" | "advanced"` - Content extraction depth
- `instructions?: string` - Optional crawling instructions
- `selectPaths?: string[]` - Path patterns to include
- `selectDomains?: string[]` - Domains to include
- `excludePaths?: string[]` - Path patterns to exclude
- `excludeDomains?: string[]` - Domains to exclude
- `allowExternal?: boolean` - Allow external domain crawling
- `includeImages?: boolean` - Include images in content
- `format?: "markdown" | "text"` - Output format

### Tavily Map

Map website structure to understand site architecture:

```typescript
import { tavilyMap } from "@tavily/ai-sdk";
import { generateText, gateway } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Map the structure of tavily.com",
  tools: {
    tavilyMap: tavilyMap(),
  },
});
```

**Options:**
- `apiKey?: string` - Tavily API key (defaults to `TAVILY_API_KEY` env var)

**Input Parameters:**
- `url: string` - Base URL to start mapping from
- `maxDepth?: number` - Maximum mapping depth (1-5, default: 1)
- `maxBreadth?: number` - Max pages per depth level (1-100, default: 20)
- `limit?: number` - Maximum total pages to map (default: 50)
- `instructions?: string` - Optional mapping instructions
- `selectPaths?: string[]` - Path patterns to include
- `selectDomains?: string[]` - Domains to include
- `excludePaths?: string[]` - Path patterns to exclude
- `excludeDomains?: string[]` - Domains to exclude
- `allowExternal?: boolean` - Allow external domain mapping

## Using Multiple Tools Together

You can combine multiple Tavily tools in a single AI agent:

```typescript
import { 
  tavilySearch, 
  tavilyExtract, 
  tavilyCrawl, 
  tavilyMap 
} from "@tavily/ai-sdk";
import { generateText, gateway } from "ai";

const result = await generateText({
  model: gateway("openai/gpt-5-mini"),
  prompt: "Research the company at tavily.com - search for news, map their site, and extract key pages",
  tools: {
    tavilySearch: tavilySearch({ searchDepth: "advanced" }),
    tavilyExtract: tavilyExtract(),
    tavilyCrawl: tavilyCrawl(),
    tavilyMap: tavilyMap(),
  },
});
```

## Development

### Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file:

```bash
TAVILY_API_KEY=tvly-your-api-key
VERCEL_AI_GATEWAY_URL=your-gateway-url
```

## API Reference

For detailed API documentation, visit [docs.tavily.com](https://docs.tavily.com).

## License

MIT

## Support

- Documentation: [docs.tavily.com](https://docs.tavily.com)
- Support: [help.tavily.com](https://help.tavily.com)
- Issues: [GitHub Issues](https://github.com/tavily-ai/ai-sdk/issues)
