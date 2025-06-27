export async function fetchLinkedInData(accessToken?: string, query?: string) {
  try {
    // If no access token, use SerpAPI to get LinkedIn data (public)
    if (!accessToken) {
      console.log(`[PUBLIC] Fetching LinkedIn data for: ${query}`);
      return await fetchPublicLinkedInData(query || "");
    }

    // Use authenticated LinkedIn API
    console.log(`[AUTH] Fetching LinkedIn data`);
    
    // Fetch basic profile information
    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileRes.ok) {
      console.error(`LinkedIn API error: ${profileRes.status}`);
      return [];
    }

    const profileData = await profileRes.json();

    // Fetch profile picture if available
    let profilePictureUrl = null;
    try {
      const pictureRes = await fetch(
        "https://api.linkedin.com/v2/me?projection=(profilePicture(displayImage~:playableStreams))",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (pictureRes.ok) {
        const pictureData = await pictureRes.json();
        const elements = pictureData.profilePicture?.["displayImage~"]?.elements;

        if (elements && elements.length > 0) {
          // Sort by width to get the highest resolution
          const sortedElements = [...elements].sort(
            (a, b) => b.width.pixels - a.width.pixels
          );
          profilePictureUrl = sortedElements[0]?.identifiers?.[0]?.identifier;
        }
      }
    } catch (error) {
      console.warn("Error fetching LinkedIn profile picture:", error);
    }

    return [
      {
        content: `${
          profileData.localizedFirstName || ""
        } ${profileData.localizedLastName || ""} - ${profileData.headline || ""}`,
        sourceType: "linkedin",
        date: null,
        url: profilePictureUrl || `https://www.linkedin.com/in/${profileData.vanityName || ""}`,
        photoMatch: undefined,
      },
    ];
  } catch (error) {
    console.error("Error fetching LinkedIn data:", error);
    return [];
  }
}

// Public LinkedIn data fetching using SerpAPI (no authentication required)
async function fetchPublicLinkedInData(query: string) {
  try {
    const serpApiKey = process.env.SERPAPI_KEY; // Fixed: use SERPAPI_KEY not SERPAPI_API_KEY
    if (!serpApiKey) {
      console.error("SerpAPI key not found for public LinkedIn search");
      return [];
    }

    // Try multiple search strategies for better coverage
    const searchStrategies = generateLinkedInSearchStrategies(query);
    let allResults: any[] = [];
    
    for (const strategy of searchStrategies) {
      try {
        console.log(`Trying LinkedIn search strategy: ${strategy.query}`);
        
        const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(strategy.query)}&api_key=${serpApiKey}&num=10`;
        const res = await fetch(searchUrl);

        if (!res.ok) {
          console.error(`LinkedIn search strategy failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        
        if (data.organic_results && Array.isArray(data.organic_results)) {
          const strategyResults = data.organic_results
            .filter((result: any) => {
              const link = result.link;
              if (!link) return false;
              
              // Must be from LinkedIn
              if (!link.includes('linkedin.com')) return false;
              
              // Skip non-profile pages
              if (link.includes('/company/') || link.includes('/school/') || 
                  link.includes('/jobs/') || link.includes('/feed/') ||
                  link.includes('/search/')) {
                return false;
              }
              
              return true;
            })
            .map((result: any) => {
              const username = extractLinkedInUsername(result.link);
              return {
                content: result.snippet || result.title || "LinkedIn profile information",
                sourceType: "linkedin",
                platform: "LinkedIn",
                date: new Date().toISOString(),
                url: result.link,
                author: username || "unknown",
                title: result.title || "",
                searchStrategy: strategy.name,
                relevanceScore: calculateLinkedInRelevanceScore(result, query, strategy.targetUsername)
              };
            });
          
          allResults.push(...strategyResults);
        }
        
        // Don't overwhelm the API - small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (strategyError) {
        console.error(`Error with LinkedIn search strategy "${strategy.name}":`, strategyError);
        continue;
      }
    }

    if (allResults.length === 0) {
      console.log("No LinkedIn results found after trying all search strategies");
      return [];
    }

    // Sort by relevance score and remove duplicates
    const uniqueResults = removeDuplicateLinkedInResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    console.log(`Found ${sortedResults.length} unique LinkedIn results from ${allResults.length} total results`);
    return sortedResults.slice(0, 5); // Return top 5 most relevant results
    
  } catch (error) {
    console.error("Error fetching public LinkedIn data:", error);
    return [];
  }
}

// Generate multiple search strategies for LinkedIn profiles
function generateLinkedInSearchStrategies(query: string) {
  const strategies = [];
  
  // Extract username if it's a LinkedIn URL
  let username = null;
  if (query.includes('linkedin.com/in/')) {
    username = query.split(/linkedin\.com\/in\//)[1]?.split('/')[0]?.trim();
  } else if (/^[a-zA-Z0-9-]+$/.test(query.trim()) && !query.includes(' ')) {
    username = query.trim();
  }
  
  if (username) {
    // Strategy 1: Direct profile search with exact URL
    strategies.push({
      name: "direct_profile_exact",
      query: `site:linkedin.com/in/${username}`,
      targetUsername: username
    });
    
    // Strategy 2: Username with broader site search
    strategies.push({
      name: "username_broad_site", 
      query: `"${username}" site:linkedin.com/in/`,
      targetUsername: username
    });
    
    // Strategy 3: Username without site restriction
    strategies.push({
      name: "username_general",
      query: `"${username}" linkedin.com/in/`,
      targetUsername: username
    });
    
    // Strategy 4: Professional context search
    strategies.push({
      name: "username_professional",
      query: `"${username}" site:linkedin.com (experience OR skills OR education)`,
      targetUsername: username
    });
  } else {
    // For name searches, try different approaches
    const cleanName = query.trim();
    
    // Strategy 1: Exact name in quotes
    strategies.push({
      name: "exact_name",
      query: `"${cleanName}" site:linkedin.com/in/`,
      targetUsername: null
    });
    
    // Strategy 2: Name with professional terms
    strategies.push({
      name: "name_professional", 
      query: `"${cleanName}" site:linkedin.com (developer OR engineer OR analyst OR manager)`,
      targetUsername: null
    });
    
    // Strategy 3: Name with location context (if visible in your profile)
    strategies.push({
      name: "name_contextual",
      query: `"${cleanName}" linkedin.com/in/ (Kenya OR Nairobi OR "software developer")`,
      targetUsername: null
    });
  }
  
  return strategies;
}

// Calculate relevance score for LinkedIn search results
function calculateLinkedInRelevanceScore(result: any, originalQuery: string, targetUsername: string | null): number {
  let score = 0;
  
  const title = (result.title || "").toLowerCase();
  const snippet = (result.snippet || "").toLowerCase();
  const url = (result.link || "").toLowerCase();
  const query = originalQuery.toLowerCase();
  
  // Higher score for profile pages
  if (url.includes('/in/')) {
    score += 8; // LinkedIn profile page
  }
  
  // Score based on username match in URL
  if (targetUsername) {
    if (url.includes(`/in/${targetUsername.toLowerCase()}`)) {
      score += 10;
    }
  }
  
  // Score based on query terms in title/snippet
  const queryWords = query.split(/\s+/);
  for (const word of queryWords) {
    if (word.length > 2) {
      if (title.includes(word)) score += 3;
      if (snippet.includes(word)) score += 2;
    }
  }
  
  // Bonus for professional keywords
  const professionalKeywords = ['developer', 'engineer', 'analyst', 'manager', 'software', 'technical'];
  for (const keyword of professionalKeywords) {
    if (title.includes(keyword) || snippet.includes(keyword)) {
      score += 1;
    }
  }
  
  return score;
}

// Remove duplicate LinkedIn results based on URL
function removeDuplicateLinkedInResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(result => {
    const key = result.url;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Helper function to extract username from LinkedIn URL
function extractLinkedInUsername(url: string): string | null {
  try {
    const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}