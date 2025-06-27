// This file contains functions for analyzing text with AI

/**
 * Analyzes text content with an AI model
 * @param text The text to analyze
 * @param category The category of content being analyzed
 * @returns Array of summary sentences
 */
export async function analyzeTextWithAI(text: string, category: string): Promise<string[]> {
  try {
    // For development/testing, return mock summaries
    if (process.env.USE_MOCK_DATA === "true") {
      return [
        `This is a mock summary of ${category} content.`,
        `The content appears to be primarily informational in nature.`
      ];
    }

    // Here you would integrate with your AI service of choice:
    // - OpenAI
    // - Anthropic
    // - Cohere
    // - etc.

    // Example using a hypothetical AI client
    // const result = await aiClient.analyze({
    //   text,
    //   instructions: `Analyze this ${category} content and provide 2-3 insightful summaries.`,
    //   maxTokens: 200
    // });
    // return result.summaries;

    // Temporary placeholder - replace with actual AI call
    console.log(`Would analyze ${text.length} characters of ${category} content`);
    return [
      `Content related to ${category} with ${text.length} characters.`,
      `The analysis would normally be performed by an AI model.`
    ];
  } catch (error) {
    console.error("Error in AI analysis:", error);
    return ["Error analyzing content."];
  }
}

/**
 * Analyzes the following ${category} data for reputation signals.
 * Summarizes findings, flags risks, and provides quotes with dates and URLs.
 *
 * @param chunk - The data to analyze, containing content, date, and URL
 * @param category - The category of the data
 * @returns A summary of the analysis
 */
export async function analyzeWithOpenAI(chunk: any[], category: string) {
  try {
    // Use mock data if no OpenAI key or mock data flag is set
    if (!process.env.OPENAI_API_KEY || process.env.USE_MOCK_DATA === "true") {
      console.log(`Using mock data for ${category} analysis (OpenAI API key not available or mock data enabled)`);
      return `Mock analysis for ${category}:\n
- Content appears to be primarily informational and neutral
- No significant reputation risks identified
- Consistent tone across all entries`;
    }

    const prompt = `
Analyze the following ${category} data for reputation signals. 
Summarize findings, flag risks, and provide quotes with dates and URLs.

${chunk.map(item => `Quote: "${item.content || ''}"\nDate: ${item.date || 'Unknown'}\nURL: ${item.url || 'Unknown'}`).join('\n\n')}
`;

    console.log(`Sending request to OpenAI for ${category} analysis with ${chunk.length} items`);
    
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
      }),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`OpenAI API error (${res.status}):`, errorText);
      throw new Error(`OpenAI API error: ${res.status} ${errorText}`);
    }
    
    const data = await res.json();
    console.log(`Received OpenAI response for ${category}`);
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error(`Error in analyzeWithOpenAI for ${category}:`, error);
    // Return a basic fallback analysis
    return `Analysis for ${category} (fallback due to API error):\n
- Limited analysis available due to technical issues
- Please check the raw data for more information`;
  }
}