export async function fetchSerpApiData(query: string) {
  try {
    // For development/testing without API key
    if (process.env.USE_MOCK_DATA === "true" || !process.env.SERPAPI_KEY) {
      console.log(`[MOCK] Fetching SerpAPI data for: ${query}`);
      return [
        {
          content: `Search result about ${query}`,
          sourceType: "serpapi",
          date: new Date().toISOString(),
          url: "https://serpapi.com/search",
        }
      ];
    }

    const res = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERPAPI_KEY}`
    );

    if (!res.ok) {
      console.error(`SerpAPI error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    if (!data.organic_results || !Array.isArray(data.organic_results)) {
      console.error("Unexpected SerpAPI response format");
      return [];
    }

    return data.organic_results.map((item: any) => ({
      content: item.snippet,
      sourceType: "serpapi",
      date: item.date || null,
      url: item.link,
    }));
  } catch (error) {
    console.error("Error fetching SerpAPI data:", error);
    return [];
  }
}