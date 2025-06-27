export async function fetchPerplexityData(query: string) {
  try {
    // For development/testing without API key
    if (process.env.USE_MOCK_DATA === "true" || !process.env.PERPLEXITY_API_KEY) {
      console.log(`[MOCK] Fetching Perplexity data for: ${query}`);
      return [
        {
          content: `Perplexity result about ${query}`,
          sourceType: "perplexity",
          date: new Date().toISOString(),
          url: "https://www.perplexity.ai",
        },
      ];
    }

    const res = await fetch("https://api.perplexity.ai/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      console.error(`Perplexity API error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    if (!data.results || !Array.isArray(data.results)) {
      console.error("Unexpected Perplexity API response format");
      return [];
    }

    return data.results.map((item: any) => ({
      content: item.snippet,
      sourceType: "perplexity",
      date: item.date || null,
      url: item.url,
    }));
  } catch (error) {
    console.error("Error fetching Perplexity data:", error);
    return [];
  }
}