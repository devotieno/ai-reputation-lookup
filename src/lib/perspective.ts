/**
 * Analyzes text for toxicity using the Perspective API
 * @param text Text to analyze
 * @returns Toxicity score between 0 and 1
 */
export async function analyzeToxicity(text: string): Promise<number> {
  // For development/testing, return a random low score
  if (process.env.USE_MOCK_DATA === "true") {
    console.log("[MOCK] Using mock toxicity analysis");
    return Math.random() * 0.3; // Random value between 0 and 0.3
  }

  if (!process.env.PERSPECTIVE_API_KEY) {
    console.warn("⚠️ Perspective API key not found in environment variables");
    console.log("To enable toxicity analysis:");
    console.log("1. Enable Perspective API in Google Cloud Console");
    console.log("2. Create an API key");
    console.log("3. Add PERSPECTIVE_API_KEY to .env.local");
    return 0.05; // Very low default score
  }
  
  try {
    // Truncate text if it's too long for the API (Perspective API has a 20KB limit)
    const truncatedText = text.length > 20000 ? text.substring(0, 20000) : text;
    
    if (!truncatedText.trim()) {
      console.log("Empty text provided for toxicity analysis");
      return 0.01;
    }
    
    console.log(`Analyzing toxicity for ${truncatedText.length} characters with Perspective API`);
    
    const response = await fetch(`https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: { text: truncatedText },
        languages: ['en'],
        requestedAttributes: { 
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          IDENTITY_ATTACK: {},
          INSULT: {},
          PROFANITY: {},
          THREAT: {}
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Perspective API error (${response.status}):`, errorText);
      
      // Check for common error types
      if (response.status === 400) {
        console.error("Bad request - check if Perspective API is enabled and text is valid");
      } else if (response.status === 403) {
        console.error("❌ Perspective API access denied. Please check:");
        console.error("1. API key is correct");
        console.error("2. Perspective Comment Analyzer API is enabled in Google Cloud Console");
        console.error("3. API key has proper permissions");
      } else if (response.status === 429) {
        console.error("Rate limit exceeded - consider implementing retry logic");
      }
      
      return 0.1;
    }

    const data = await response.json();
    console.log("✅ Perspective API analysis completed successfully");
    
    // Get the highest toxicity score from all attributes
    const scores = data.attributeScores || {};
    let maxScore = 0;
    
    Object.keys(scores).forEach(attribute => {
      const score = scores[attribute]?.summaryScore?.value || 0;
      maxScore = Math.max(maxScore, score);
    });
    
    console.log(`Toxicity analysis result: ${maxScore.toFixed(3)}`);
    return Math.min(maxScore, 1.0); // Ensure score doesn't exceed 1.0
    
  } catch (error) {
    console.error('❌ Error analyzing toxicity with Perspective API:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error("Network error - check internet connection");
    }
    
    return 0.1; // Default low score on error
  }
}

/**
 * Test if Perspective API is properly configured and accessible
 * @returns Promise<boolean> true if API is working
 */
export async function testPerspectiveAPI(): Promise<boolean> {
  if (!process.env.PERSPECTIVE_API_KEY) {
    console.log("❌ Perspective API key not configured");
    return false;
  }
  
  try {
    console.log("🧪 Testing Perspective API configuration...");
    
    const testText = "Hello world, this is a test.";
    const response = await fetch(`https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: { text: testText },
        languages: ['en'],
        requestedAttributes: { TOXICITY: {} }
      }),
    });

    if (response.ok) {
      console.log("✅ Perspective API is working correctly");
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Perspective API test failed (${response.status}):`, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Perspective API test error:', error);
    return false;
  }
}