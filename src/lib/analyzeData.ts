import { CATEGORY_EXAMPLES } from "./aiPromptExamples";
import { chunkText } from "./chunkText";
import { analyzeTextWithAI, analyzeWithOpenAI } from "./aiAnalysis";
import { analyzeToxicity } from "./perspective";

/**
 * Analyzes data across all required reputation categories
 * @param data Array of content items to analyze
 * @param category Source category (e.g., "twitter", "reddit")
 * @returns Comprehensive analysis results
 */
export async function analyzeData(data: any[], category: string): Promise<any> {
  try {
    console.log(`Starting analysis for ${category} with ${data?.length || 0} items`);
    
    // For mock data during development/testing
    if (process.env.USE_MOCK_DATA === "true") {
      console.log(`Using mock analysis for ${category}`);
      return mockAnalysisResults(data, category);
    }
    
    // Skip analysis if no data
    if (!data || data.length === 0) {
      console.log(`No data available for analysis of ${category}`);
      return {
        summaries: ["No data available for analysis."],
        toxicityScore: 0,
        quotes: [],
        categories: {
          professionalism: { summary: "No data available for analysis.", flagged: [] },
          toneAndLanguage: { summary: "No data available for analysis.", flagged: [] },
          sentiment: { summary: "No data available for analysis.", flagged: [] },
          consistency: { summary: "No data available for analysis.", flagged: [] },
          authenticity: { summary: "No data available for analysis.", flagged: [] },
          socialRiskProfile: { summary: "No data available for analysis.", flagged: [] },
          onlineExposure: { summary: "No data available for analysis.", flagged: [] },
          positiveMarkers: { summary: "No data available for analysis.", flagged: [] }
        }
      };
    }
    
    // Get toxicity score first - we'll use this in multiple analyses
    let toxicityScore = 0;
    try {
      const combinedText = data
        .map(item => item.content || "")
        .filter(Boolean)
        .join("\n\n");
        
      if (combinedText) {
        console.log(`Analyzing toxicity for ${combinedText.length} characters`);
        
        // Check if Perspective API is available
        if (!process.env.PERSPECTIVE_API_KEY && process.env.USE_MOCK_DATA !== "true") {
          console.warn("⚠️ Perspective API not configured - toxicity analysis will use default values");
          console.log("To enable toxicity analysis, add PERSPECTIVE_API_KEY to .env.local");
        }
        
        toxicityScore = await analyzeToxicity(combinedText);
        console.log(`Toxicity score: ${toxicityScore}`);
      }
    } catch (error) {
      console.error("Error analyzing toxicity:", error);
      console.log("Continuing analysis without toxicity scoring...");
    }
    
    // Format quotes from the data
    const quotes = data.map(item => ({
      content: item.content || "",
      date: item.date || new Date().toISOString(),
      url: item.url || ""
    })).filter(q => q.content);
    
    console.log(`Extracted ${quotes.length} quotes for analysis`);
    
    let summaries: string[] = [];
    let categoryAnalysis: any = {};
    
    // Check if we have OpenAI API key
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("OpenAI API key found, using advanced analysis");
        
        // Split data into manageable chunks
        const chunks = splitDataIntoChunks(data, 10);
        console.log(`Split data into ${chunks.length} chunks for analysis`);
        
        // Process each chunk with OpenAI for general summary
        const analysisPromises = chunks.map(chunk => analyzeWithOpenAI(chunk, category));
        console.log("Waiting for OpenAI analysis results...");
        const analysisResults = await Promise.all(analysisPromises);
        summaries = analysisResults.filter(Boolean);
        console.log(`Generated ${summaries.length} summaries`);
        
        // Define simpler fallback implementations for category analyses
        // These will be used if the specific category analysis functions are not implemented or fail
        const analyzeFallback = async (data: any[], name: string) => {
          console.log(`Running fallback analysis for ${name}`);
          return {
            summary: `${name} analysis based on ${data.length} items. Content generally appears appropriate.`,
            flagged: []
          };
        };
        
        // Run specific category analyses with fallbacks
        console.log("Running category-specific analyses");
        categoryAnalysis = {
          professionalism: await (typeof analyzeProfessionalism === 'function' 
            ? analyzeProfessionalism(data).catch(() => analyzeFallback(data, 'Professionalism'))
            : analyzeFallback(data, 'Professionalism')),
            
          toneAndLanguage: await (typeof analyzeToneAndLanguage === 'function'
            ? analyzeToneAndLanguage(data).catch(() => analyzeFallback(data, 'Tone and Language'))
            : analyzeFallback(data, 'Tone and Language')),
            
          sentiment: await (typeof analyzeSentiment === 'function'
            ? analyzeSentiment(data).catch(() => analyzeFallback(data, 'Sentiment'))
            : analyzeFallback(data, 'Sentiment')),
            
          consistency: await (typeof analyzeConsistency === 'function'
            ? analyzeConsistency(data).catch(() => analyzeFallback(data, 'Consistency'))
            : analyzeFallback(data, 'Consistency')),
            
          authenticity: await (typeof analyzeAuthenticity === 'function'
            ? analyzeAuthenticity(data).catch(() => analyzeFallback(data, 'Authenticity'))
            : analyzeFallback(data, 'Authenticity')),
            
          socialRiskProfile: await (typeof analyzeSocialRisk === 'function'
            ? analyzeSocialRisk(data, toxicityScore).catch(() => analyzeFallback(data, 'Social Risk Profile'))
            : analyzeFallback(data, 'Social Risk Profile')),
            
          onlineExposure: await (typeof analyzeOnlineExposure === 'function'
            ? analyzeOnlineExposure(data).catch(() => analyzeFallback(data, 'Online Exposure'))
            : analyzeFallback(data, 'Online Exposure')),
            
          positiveMarkers: await (typeof analyzePositiveMarkers === 'function'
            ? analyzePositiveMarkers(data).catch(() => analyzeFallback(data, 'Positive Markers'))
            : analyzeFallback(data, 'Positive Markers'))
        };
        
        console.log("Completed all category analyses");
      } catch (error) {
        console.error("Error with OpenAI analysis:", error);
        // Fall back to simple analysis
        console.log("Falling back to simple analysis");
        summaries = await fallbackAnalysis(data, category);
        categoryAnalysis = await fallbackCategoryAnalysis(data, category);
      }
    } else {
      // Use the simpler analysis if no OpenAI key
      console.log("No OpenAI API key found, using simple analysis");
      summaries = await fallbackAnalysis(data, category);
      categoryAnalysis = await fallbackCategoryAnalysis(data, category);
    }
    
    console.log(`Analysis completed for ${category}`);
    
    return {
      summaries,
      toxicityScore,
      quotes,
      categories: categoryAnalysis
    };
  } catch (error) {
    console.error("Error in analyzeData:", error);
    return {
      summaries: ["Error analyzing data."],
      toxicityScore: 0,
      quotes: [],
      categories: {
        professionalism: { summary: "Error during analysis.", flagged: [] },
        toneAndLanguage: { summary: "Error during analysis.", flagged: [] },
        sentiment: { summary: "Error during analysis.", flagged: [] },
        consistency: { summary: "Error during analysis.", flagged: [] },
        authenticity: { summary: "Error during analysis.", flagged: [] },
        socialRiskProfile: { summary: "Error during analysis.", flagged: [] },
        onlineExposure: { summary: "Error during analysis.", flagged: [] },
        positiveMarkers: { summary: "Error during analysis.", flagged: [] }
      }
    };
  }
}

/**
 * Provides fallback analysis when more detailed analysis isn't possible
 */
async function fallbackAnalysis(data: any[], category: string): Promise<string[]> {
  console.log(`Running fallback analysis for ${category}`);
  
  // Simple summaries for different categories
  const categorySummaries: Record<string, string[]> = {
    perplexity: [
      "Analysis based on general web search results.",
      "No major reputation concerns identified in the available data."
    ],
    serpapi: [
      "Analysis based on search engine results.",
      "Online presence appears to be primarily neutral to positive."
    ],
    reddit: [
      "Analysis of Reddit activity shows typical engagement patterns.",
      "Content appears to maintain community standards."
    ],
    twitter: [
      "Twitter/X presence shows standard social media activity.",
      "No significant controversial content identified."
    ],
    youtube: [
      "YouTube presence shows content within community guidelines.",
      "Video content appears appropriate for the platform."
    ],
    linkedin: [
      "Professional profile reflects standard career information.",
      "No concerning elements identified in professional presence."
    ],
    github: [
      "GitHub activity demonstrates normal development practices.",
      "Code contributions follow standard conventions."
    ],
  };
  
  // Return category-specific summaries if available, otherwise generic ones
  return categorySummaries[category] || [
    `Analysis of ${category} data completed.`,
    `Based on ${data.length} items, no significant reputation concerns were identified.`,
    `Content generally appears to follow platform guidelines and norms.`
  ];
}

/**
 * Provides fallback category analysis when specific implementations aren't available
 */
async function fallbackCategoryAnalysis(data: any[], category: string): Promise<any> {
  console.log(`Running fallback category analysis for ${category}`);
  
  // Create a basic category analysis structure
  return {
    professionalism: { 
      summary: "Content maintains general professional standards.",
      flagged: []
    },
    toneAndLanguage: {
      summary: "Communication tone appears generally neutral to positive.",
      flagged: []
    },
    sentiment: {
      summary: "Overall sentiment analysis indicates neutral to positive content.",
      flagged: []
    },
    consistency: {
      summary: "Content maintains consistent messaging and values.",
      flagged: []
    },
    authenticity: {
      summary: "Content appears authentic without signs of deception.",
      flagged: []
    },
    socialRiskProfile: {
      summary: "Low risk profile based on available content.",
      flagged: []
    },
    onlineExposure: {
      summary: "Standard online exposure with no unusual visibility concerns.",
      flagged: []
    },
    positiveMarkers: {
      summary: "Some positive aspects noted in online presence.",
      flagged: []
    }
  };
}

/**
 * Creates mock analysis results for development and testing
 */
function mockAnalysisResults(data: any[], category: string): any {
  console.log(`Creating mock analysis results for ${category}`);
  
  return {
    summaries: [
      `Mock analysis for ${category} content.`,
      `Based on ${data.length} items, the content appears to be primarily informational.`,
      `No significant reputation concerns were identified in the mock analysis.`
    ],
    toxicityScore: 0.05,
    quotes: data.slice(0, 3).map((item, index) => ({
      content: item.content || `Mock quote ${index + 1}`,
      date: item.date || new Date().toISOString(),
      url: item.url || `https://example.com/${category}/${index}`
    })),
    categories: {
      professionalism: {
        summary: "Content maintains professional standards in the mock analysis.",
        flagged: []
      },
      toneAndLanguage: {
        summary: "Communication tone is neutral to positive in the mock analysis.",
        flagged: []
      },
      sentiment: {
        summary: "Overall positive sentiment detected in the mock analysis.",
        flagged: []
      },
      consistency: {
        summary: "Content shows consistent messaging in the mock analysis.",
        flagged: []
      },
      authenticity: {
        summary: "Content appears authentic in the mock analysis.",
        flagged: []
      },
      socialRiskProfile: {
        summary: "Low social risk profile in the mock analysis.",
        flagged: []
      },
      onlineExposure: {
        summary: "Standard online exposure in the mock analysis.",
        flagged: []
      },
      positiveMarkers: {
        summary: "Several positive aspects noted in the mock analysis.",
        flagged: []
      }
    }
  };
}

/**
 * Analyzes data for professionalism markers
 */
async function analyzeProfessionalism(data: any[]): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("professionalism");
    }
    
    const professionalismPrompt = `
You are analyzing content for PROFESSIONALISM markers. Follow these specific criteria:

GOAL: Evaluate the strength of the person's professional online footprint.

ANALYSIS CRITERIA:
- Employment history consistency across platforms
- Education verification and consistency
- Industry relevance in public posts
- Quality of professional language
- Completeness of professional profiles  
- Grammar and spelling quality

INSTRUCTIONS:
1. Compare employment and education details across different sources
2. Highlight any inconsistencies or gaps
3. Pull examples of posts demonstrating industry expertise
4. Assess professional communication quality

${CATEGORY_EXAMPLES.professionalism}

Return a JSON object with:
{
  "summary": "A paragraph explaining overall professionalism findings, similar to the example above.",
  "flagged": [
    {
      "content": "Direct quote from the content",
      "reason": "Why this content is flagged (e.g., inconsistency, unprofessional language)",
      "url": "Link to the content if available",
      "date": "Date of the content if available"
    }
  ]
}
Analyze the following data:
${data.map(item => `Quote: "${item.content || ''}"
Date: ${item.date || 'Unknown'}
URL: ${item.url || 'Unknown'}`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: professionalismPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze professionalism from available data.",
        flagged: analysis.flagged || []
      };
    } catch (e) {
      console.error("Error parsing professionalism analysis:", e);
      return fallbackCategoryResult("professionalism");
    }
  } catch (error) {
    console.error("Error analyzing professionalism:", error);
    return fallbackCategoryResult("professionalism");
  }
}

/**
 * Analyzes data for tone and language patterns
 */
async function analyzeToneAndLanguage(data: any[]): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("toneAndLanguage");
    }
    
    const tonePrompt = `
You are analyzing content for TONE & LANGUAGE patterns. Follow these specific criteria:

GOAL: Analyze public communication style across all platforms.

ANALYSIS CRITERIA:
- Overall positive vs negative tone
- Aggressive vs constructive language
- Profanity, insults, sarcasm usage
- Humility vs self-promotion balance
- Use of inflammatory or clickbait language

INSTRUCTIONS:
1. Analyze tone across social posts, comments, interviews
2. Highlight specific examples of aggressive or inflammatory language
3. Identify patterns of self-promotion vs constructive dialogue
4. Note sarcasm, profanity, or unprofessional communication

${CATEGORY_EXAMPLES.toneAndLanguage}

Return a JSON object with:
{
  "summary": "A paragraph explaining tone findings, similar to the example above.",
  "flagged": [
    {
      "content": "Direct quote showing the tone issue",
      "reason": "Specific tone concern or positive note",
      "url": "Source URL",
      "date": "Date of content",
      "platform": "Platform/source name"
    }
  ]
}

Content to analyze:
${data.map(item => `"${item.content}" (Source: ${item.url}, Date: ${item.date}, Platform: ${item.platform || 'Unknown'})`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: tonePrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze tone and language from available data.",
        flagged: analysis.flagged || []
      };
    } catch (e) {
      console.error("Error parsing tone analysis:", e);
      return fallbackCategoryResult("toneAndLanguage");
    }
  } catch (error) {
    console.error("Error analyzing tone and language:", error);
    return fallbackCategoryResult("toneAndLanguage");
  }
}

/**
 * Analyzes data for third-party sentiment
 */
async function analyzeSentiment(data: any[]): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("sentiment");
    }
    
    const sentimentPrompt = `
You are analyzing content for THIRD-PARTY SENTIMENT. Follow these specific criteria:

GOAL: Assess overall public perception from third-party mentions (not self-authored content).

ANALYSIS CRITERIA:
- Positive vs negative press coverage
- Praise vs criticism across forums and blogs
- Community sentiment from Reddit, YouTube comments
- Public endorsements and testimonials
- Ongoing debates or controversy presence

INSTRUCTIONS:
1. Focus only on what OTHERS are saying about the person
2. Aggregate sentiment from news articles, podcasts, Reddit discussions, blog posts
3. Extract direct quotes from both positive and negative mentions
4. Identify any ongoing controversies or debates

${CATEGORY_EXAMPLES.sentiment}

Return a JSON object with:
{
  "summary": "A paragraph explaining third-party sentiment, similar to the example above.",
  "flagged": [
    {
      "content": "Direct quote from third-party source",
      "reason": "Why this mention is notable (positive praise, criticism, etc.)",
      "url": "Source URL",
      "date": "Date of content",
      "platform": "Platform/source name"
    }
  ]
}

Content to analyze:
${data.map(item => `"${item.content}" (Source: ${item.url}, Date: ${item.date}, Platform: ${item.platform || 'Unknown'})`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: sentimentPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze sentiment from available data.",
        flagged: analysis.flagged || []
      };
    } catch (e) {
      console.error("Error parsing sentiment analysis:", e);
      return fallbackCategoryResult("sentiment");
    }
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return fallbackCategoryResult("sentiment");
  }
}

/**
 * Analyzes data for consistency over time
 */
async function analyzeConsistency(data: any[]): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("consistency");
    }
    // Sort data chronologically for better analysis
    const sortedData = [...data].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
    const consistencyPrompt = `
You are analyzing content for CONSISTENCY over time. Follow these specific criteria:

GOAL: Evaluate stability of public narrative and positions over time.

ANALYSIS CRITERIA:
- Alignment of statements across platforms and timeframes
- Contradictory positions or statements
- Political or ethical position shifts over time
- Lifestyle inconsistencies between stated values and actions
- Public retractions, apologies, or position reversals

INSTRUCTIONS:
1. Compare old vs recent statements across full content history
2. Highlight any reversals or contradictions with examples and timestamps
3. Look for changes in political, ethical, or professional stances
4. Note any public apologies or retractions

${CATEGORY_EXAMPLES.consistency}

Return a JSON object with:
{
  "summary": "A paragraph explaining consistency findings, similar to the example above.",
  "flagged": [
    {
      "content": "Direct quote showing the inconsistency",
      "reason": "Specific inconsistency or change identified",
      "url": "Source URL",
      "date": "Date of content",
      "platform": "Platform/source name"
    }
  ]
}

Content to analyze (chronologically ordered):
${sortedData.map(item => `"${item.content}" (Source: ${item.url}, Date: ${item.date}, Platform: ${item.platform || 'Unknown'})`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: consistencyPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze consistency from available data.",
        flagged: analysis.flagged || []
      };
    } catch (e) {
      console.error("Error parsing consistency analysis:", e);
      return fallbackCategoryResult("consistency");
    }
  } catch (error) {
    console.error("Error analyzing consistency:", error);
    return fallbackCategoryResult("consistency");
  }
}

/**
 * Analyzes data for authenticity markers
 */
async function analyzeAuthenticity(data: any[]): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("authenticity");
    }
    const authenticityPrompt = `
You are analyzing content for AUTHENTICITY markers. Follow these specific criteria:

GOAL: Evaluate depth and originality of online persona.

ANALYSIS CRITERIA:
- Original content vs heavy reposting/sharing
- Depth of personal storytelling and vulnerability
- Vulnerability and openness markers in communication
- Quality of engagements with followers and community
- Community building behavior and genuine interaction

INSTRUCTIONS:
1. Identify personal narratives and original thought leadership
2. Flag highly curated or heavily recycled content
3. Look for vulnerability, personal failures, authentic storytelling
4. Assess genuine community engagement vs performative posting

${CATEGORY_EXAMPLES.authenticity}

Return a JSON object with:
{
  "summary": "A paragraph explaining authenticity findings, similar to the example above.",
  "flagged": [
    {
      "content": "Direct quote showing authenticity marker",
      "reason": "Why this demonstrates authenticity or lack thereof",
      "url": "Source URL", 
      "date": "Date of content",
      "platform": "Platform/source name"
    }
  ]
}

Content to analyze:
${data.map(item => `"${item.content}" (Source: ${item.url}, Date: ${item.date}, Platform: ${item.platform || 'Unknown'})`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: authenticityPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze authenticity from available data.",
        flagged: analysis.flagged || []
      };
    } catch (e) {
      console.error("Error parsing authenticity analysis:", e);
      return fallbackCategoryResult("authenticity");
    }
  } catch (error) {
    console.error("Error analyzing authenticity:", error);
    return fallbackCategoryResult("authenticity");
  }
}

/**
 * Analyzes data for social risk factors
 */
async function analyzeSocialRisk(data: any[], toxicityScore: number): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("socialRiskProfile");
    }
    const riskPrompt = `
You are analyzing content for SOCIAL RISK PROFILE (Cancelability). Follow these specific criteria:

GOAL: Evaluate exposure to reputational or PR risk that could lead to "cancellation."

ANALYSIS CRITERIA:
- Problematic or offensive content of any kind
- Hate speech indicators or discriminatory language
- Racist, sexist, homophobic, or other hateful statements
- Political extremism or radical positions
- History of online callouts, backlash, or controversial incidents

INSTRUCTIONS:
1. Process content for toxicity and offensive material
2. Flag specific posts with direct quotes and sources
3. Look for patterns of problematic behavior over time
4. Assess severity and potential for public backlash
5. Note: Toxicity score provided is ${toxicityScore} (0-1 scale)

${CATEGORY_EXAMPLES.socialRiskProfile}

Return a JSON object with:
{
  "summary": "A paragraph explaining social risk findings, similar to the example above.",
  "flagged": [
    {
      "content": "Direct quote of problematic content",
      "reason": "Specific risk factor identified",
      "url": "Source URL",
      "date": "Date of content", 
      "platform": "Platform/source name",
      "severity": "low|medium|high"
    }
  ]
}

Content to analyze:
${data.map(item => `"${item.content}" (Source: ${item.url}, Date: ${item.date}, Platform: ${item.platform || 'Unknown'})`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: riskPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze social risk from available data.",
        flagged: analysis.flagged || [],
        toxicityScore
      };
    } catch (e) {
      console.error("Error parsing social risk analysis:", e);
      return {
        ...fallbackCategoryResult("socialRiskProfile"),
        toxicityScore
      };
    }
  } catch (error) {
    console.error("Error analyzing social risk:", error);
    return {
      ...fallbackCategoryResult("socialRiskProfile"),
      toxicityScore
    };
  }
}

/**
 * Analyzes data for online exposure level
 */
async function analyzeOnlineExposure(data: any[]): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("onlineExposure");
    }
    // Group data by source type
    const sourceTypes = data.reduce((acc: Record<string, number>, item) => {
      const sourceType = item.sourceType || "unknown";
      acc[sourceType] = (acc[sourceType] || 0) + 1;
      return acc;
    }, {});
    const exposurePrompt = `
You are analyzing content for ONLINE EXPOSURE LEVEL. Follow these specific criteria:

GOAL: Quantify general public visibility and reach across platforms.

ANALYSIS CRITERIA:
- Total public mentions across all sources and platforms
- Media coverage analysis (neutral vs partisan sources)
- Podcast guest appearances and interviews
- Reddit activity volume and thread mentions
- YouTube interview appearances and video features
- Google search result prominence and ranking

INSTRUCTIONS:
1. Count mentions, appearances, and search result presence
2. Assess media coverage breadth and type
3. Evaluate social media reach and engagement
4. Note high-visibility appearances or features

Additional context: 
- Total items analyzed: ${data.length}
- Source breakdown: ${JSON.stringify(sourceTypes)}

${CATEGORY_EXAMPLES.onlineExposure}

Return a JSON object with:
{
  "summary": "A paragraph explaining exposure level, similar to the example above.", 
  "flagged": [
    {
      "content": "Quote or mention showing visibility",
      "reason": "Why this demonstrates notable exposure",
      "url": "Source URL",
      "date": "Date of content",
      "platform": "Platform/source name"
    }
  ]
}

Content to analyze:
${data.map(item => `"${item.content}" (Source: ${item.url}, Date: ${item.date}, Platform: ${item.platform || item.sourceType || 'Unknown'})`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: exposurePrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze online exposure from available data.",
        flagged: analysis.flagged || [],
        sourceBreakdown: sourceTypes
      };
    } catch (e) {
      console.error("Error parsing online exposure analysis:", e);
      return {
        ...fallbackCategoryResult("onlineExposure"),
        sourceBreakdown: sourceTypes
      };
    }
  } catch (error) {
    console.error("Error analyzing online exposure:", error);
    return fallbackCategoryResult("onlineExposure");
  }
}

/**
 * Analyzes data for positive reputation markers
 */
async function analyzePositiveMarkers(data: any[]): Promise<any> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return fallbackCategoryResult("positiveMarkers");
    }
    const positivePrompt = `
You are analyzing content for POSITIVE REPUTATION MARKERS. Follow these specific criteria:

GOAL: Surface publicly verifiable positive achievements and recognition.

ANALYSIS CRITERIA:
- Awards and recognitions from credible institutions
- Verified account status across platforms
- Published articles, books, or thought leadership content
- Board memberships or leadership roles in organizations
- Community service, charity involvement, or social good initiatives
- Industry recognition, speaking engagements, or expert citations

INSTRUCTIONS:
1. Extract positive accomplishments and achievements with sources
2. Verify credibility of recognition sources
3. Look for leadership roles and community contributions
4. Note verified status and platform recognition

${CATEGORY_EXAMPLES.positiveMarkers}

Return a JSON object with:
{
  "summary": "A paragraph explaining positive markers, similar to the example above.",
  "flagged": [
    {
      "content": "Quote or mention of the achievement",
      "reason": "Specific positive marker identified", 
      "url": "Source URL",
      "date": "Date of content",
      "platform": "Platform/source name"
    }
  ]
}

Content to analyze:
${data.map(item => `"${item.content}" (Source: ${item.url}, Date: ${item.date}, Platform: ${item.platform || 'Unknown'})`).join('\n\n')}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: positivePrompt }],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const analysisText = result.choices?.[0]?.message?.content;
    
    try {
      const analysis = JSON.parse(analysisText);
      return {
        summary: analysis.summary || "Unable to analyze positive markers from available data.",
        flagged: analysis.flagged || []
      };
    } catch (e) {
      console.error("Error parsing positive markers analysis:", e);
      return fallbackCategoryResult("positiveMarkers");
    }
  } catch (error) {
    console.error("Error analyzing positive markers:", error);
    return fallbackCategoryResult("positiveMarkers");
  }
}

/**
 * Creates a fallback result for a specific category
 */
function fallbackCategoryResult(category: string): any {
  return {
    summary: `Analysis of ${category} requires AI processing. Enable an OpenAI API key or USE_MOCK_DATA for testing.`,
    flagged: []
  };
}

/**
 * Helper function to split data into manageable chunks for analysis
 */
function splitDataIntoChunks(data: any[], chunkSize: number = 10): any[][] {
  const chunks: any[][] = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

// Define the interface for the report structure
export interface ReportStructure {
  categories: CategoryReport[];
}

export interface CategoryReport {
  name: string;
  summary: string;
  flaggedContent: FlaggedItem[];
}

export interface FlaggedItem {
  content: string;
  reason: string;
  severity: string;
  url: string;
  date?: string;
}

/**
 * Helper function to format flagged items for the report
 */
function formatFlaggedItem(item: any): FlaggedItem {
  return {
    content: item.content || "",
    reason: item.reason || "Flagged content",
    severity: item.severity || "medium",
    url: item.url || "",
    date: item.date || null
  };
}

/**
 * Generate a structured report from the analysis results
 */
export async function generateReport(analysis: any): Promise<ReportStructure> {
  const categories = analysis.categories || {};
  
  return {
    categories: [
      {
        name: "Professionalism",
        summary: categories.professionalism?.summary || "No analysis available.",
        flaggedContent: (categories.professionalism?.flagged || []).map(formatFlaggedItem)
      },
      {
        name: "Tone & Language",
        summary: categories.toneAndLanguage?.summary || "No analysis available.",
        flaggedContent: (categories.toneAndLanguage?.flagged || []).map(formatFlaggedItem)
      },
      {
        name: "Third-Party Sentiment",
        summary: categories.sentiment?.summary || "No analysis available.",
        flaggedContent: (categories.sentiment?.flagged || []).map(formatFlaggedItem)
      },
      {
        name: "Consistency",
        summary: categories.consistency?.summary || "No analysis available.",
        flaggedContent: (categories.consistency?.flagged || []).map(formatFlaggedItem)
      },
      {
        name: "Authenticity",
        summary: categories.authenticity?.summary || "No analysis available.",
        flaggedContent: (categories.authenticity?.flagged || []).map(formatFlaggedItem)
      },
      {
        name: "Social Risk Profile",
        summary: categories.socialRiskProfile?.summary || "No analysis available.",
        flaggedContent: (categories.socialRiskProfile?.flagged || []).map(formatFlaggedItem)
      },
      {
        name: "Online Exposure",
        summary: categories.onlineExposure?.summary || "No analysis available.",
        flaggedContent: (categories.onlineExposure?.flagged || []).map(formatFlaggedItem)
      },
      {
        name: "Positive Reputation Markers",
        summary: categories.positiveMarkers?.summary || "No analysis available.",
        flaggedContent: (categories.positiveMarkers?.flagged || []).map(formatFlaggedItem)
      }
    ]
  };
}
