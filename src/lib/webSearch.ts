type TavilyResult = { title: string; url: string; content?: string };

export async function tavilySearch(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY!;
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: 6,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!res.ok) throw new Error(`Tavily error: ${await res.text()}`);
  const data = await res.json();
  return (data?.results ?? []).map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
  }));
}