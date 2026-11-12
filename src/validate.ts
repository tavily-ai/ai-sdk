/** Client-side checks for parameter combinations the Tavily API rejects, so the model gets a clear error before any request. */
type Params = Record<string, any>;

export const validateSearchParams = (p: Params) => {
  if (p.includeDomainsMode !== undefined && !p.includeDomains?.length) {
    throw new Error("tavilySearch: includeDomainsMode requires includeDomains.");
  }
  if (p.filterByLanguage !== undefined && !p.language) {
    throw new Error("tavilySearch: filterByLanguage requires language.");
  }
  if (p.chunksPerSource !== undefined && p.searchDepth === "ultra-fast") {
    throw new Error("tavilySearch: chunksPerSource does not apply when searchDepth is 'ultra-fast'.");
  }
  if (p.safeSearch === true && (p.searchDepth === "fast" || p.searchDepth === "ultra-fast")) {
    throw new Error("tavilySearch: safeSearch is not available when searchDepth is 'fast' or 'ultra-fast'.");
  }
  if (p.country !== undefined && p.topic !== undefined && p.topic !== "general") {
    throw new Error("tavilySearch: country is only available when topic is 'general'.");
  }
};

export const validateExtractParams = (p: Params) => {
  if (p.chunksPerSource !== undefined && !p.query) {
    throw new Error("tavilyExtract: chunksPerSource requires query.");
  }
};
