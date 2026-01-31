import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Use the existing web search with filters for scholarly sources
    const searchResponse = await fetch(
      `https://api.tavily.com/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: query,
          search_depth: "advanced",
          include_domains: [
            "scholar.google.com",
            "jstor.org",
            "arxiv.org",
            "pubmed.ncbi.nlm.nih.gov",
            "researchgate.net",
            "academia.edu",
            "sciencedirect.com",
            "springer.com",
            "wiley.com",
            "nature.com",
            "science.org",
            "ieee.org",
            "acm.org",
            "britannica.com",
            "wikipedia.org",
            "gutenberg.org",
            "archive.org"
          ],
          max_results: 10,
        }),
      }
    );

    if (!searchResponse.ok) {
      console.error("Tavily API error:", await searchResponse.text());
      return NextResponse.json(
        { error: "Search failed", results: [] },
        { status: 500 }
      );
    }

    const data = await searchResponse.json();
    
    // Format results for the frontend
    const results = (data.results || []).map((result: { 
      title: string; 
      content?: string; 
      snippet?: string; 
      url: string;
      published_date?: string;
      score?: number;
    }, index: number) => ({
      id: `S${index + 1}`,
      title: result.title,
      snippet: result.content || result.snippet || "",
      url: result.url,
      domain: new URL(result.url).hostname,
      publishedDate: result.published_date || null,
      score: result.score || 0
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Research search error:", error);
    return NextResponse.json(
      { error: "Internal server error", results: [] },
      { status: 500 }
    );
  }
}
