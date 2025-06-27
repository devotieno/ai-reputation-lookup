export async function fetchTwitterData(query: string, accessToken?: string) {
  try {
    // If no access token, use SerpAPI to get Twitter data (public)
    if (!accessToken) {
      console.log(`[PUBLIC] Fetching Twitter data for: ${query}`);
      return await fetchPublicTwitterData(query);
    }

    // Use authenticated Twitter API
    console.log(`[AUTH] Fetching Twitter data for: ${query}`);
    
    // Search for tweets with user expansions to get profile images
    const res = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(
        query
      )}&tweet.fields=created_at&expansions=author_id&user.fields=profile_image_url`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      console.error(`Twitter API error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    if (!data.data || !Array.isArray(data.data)) {
      console.error("Unexpected Twitter API response format");
      return [];
    }

    // Create a map of user IDs to profile image URLs
    const userMap: Record<string, any> = {};

    if (data.includes?.users && Array.isArray(data.includes.users)) {
      data.includes.users.forEach((user: any) => {
        userMap[user.id] = {
          username: user.username,
          profileImageUrl: user.profile_image_url,
        };
      });
    }

    // Map results with author profile images
    return data.data.map((item: any) => ({
      content: item.text,
      sourceType: "twitter",
      date: item.created_at,
      url: `https://twitter.com/i/web/status/${item.id}`,
      author: userMap[item.author_id]?.username || null,
      authorProfileImageUrl: userMap[item.author_id]?.profileImageUrl || null,
    }));
  } catch (error) {
    console.error("Error fetching Twitter data:", error);
    return [];
  }
}

// Public Twitter data fetching using SerpAPI (no authentication required)
async function fetchPublicTwitterData(query: string) {
  try {
    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      console.error("SerpAPI key not found for public Twitter search");
      return [];
    }

    // Try multiple search strategies for better coverage
    const searchStrategies = generateSearchStrategies(query);
    let allResults: any[] = [];
    
    for (const strategy of searchStrategies) {
      try {
        console.log(`Trying search strategy: ${strategy.query}`);
        
        const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(strategy.query)}&api_key=${serpApiKey}&num=10`;
        const res = await fetch(searchUrl);

        if (!res.ok) {
          console.error(`Search strategy failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        
        if (data.organic_results && Array.isArray(data.organic_results)) {
          const strategyResults = data.organic_results
            .filter((result: any) => {
              const link = result.link;
              if (!link) return false;
              
              // Must be from X.com or Twitter.com
              if (!link.includes('x.com') && !link.includes('twitter.com')) return false;
              
              // Skip general pages like home, search, settings, etc.
              if (link.includes('/search') || link.includes('/home') || link.includes('/settings') || 
                  link.includes('/notifications') || link.includes('/messages') || link.includes('/explore')) {
                return false;
              }
              
              return true;
            })
            .map((result: any) => {
              const username = extractUsernameFromUrl(result.link);
              return {
                content: result.snippet || result.title || "No content available",
                sourceType: "twitter",
                platform: "X (Twitter)",
                date: new Date().toISOString(),
                url: result.link,
                author: username || "unknown",
                title: result.title || "",
                searchStrategy: strategy.name,
                relevanceScore: calculateRelevanceScore(result, query, strategy.targetUsername)
              };
            });
          
          allResults.push(...strategyResults);
        }
        
        // Don't overwhelm the API - small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (strategyError) {
        console.error(`Error with search strategy "${strategy.name}":`, strategyError);
        continue;
      }
    }

    if (allResults.length === 0) {
      console.log("No X/Twitter results found after trying all search strategies");
      return [];
    }

    // Sort by relevance score and remove duplicates
    const uniqueResults = removeDuplicateResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    console.log(`Found ${sortedResults.length} unique X/Twitter results from ${allResults.length} total results`);
    return sortedResults.slice(0, 10); // Return top 10 most relevant results
    
  } catch (error) {
    console.error("Error fetching public Twitter data:", error);
    return [];
  }
}

// Generate multiple search strategies for better coverage
function generateSearchStrategies(query: string) {
  const strategies = [];
  
  // Extract username if it's a handle or URL
  let username = null;
  if (query.includes('@')) {
    username = query.replace('@', '').trim();
  } else if (query.includes('twitter.com/') || query.includes('x.com/')) {
    username = query.split(/(?:twitter\.com\/|x\.com\/)/)[1]?.split('/')[0]?.trim();
  } else if (/^[a-zA-Z0-9_]+$/.test(query.trim()) && !query.includes(' ')) {
    username = query.trim();
  }
  
  if (username) {
    // Strategy 1: Direct profile search with exact URL
    strategies.push({
      name: "direct_profile_exact",
      query: `site:x.com/${username} OR site:twitter.com/${username}`,
      targetUsername: username
    });
    
    // Strategy 2: Username with broader site search
    strategies.push({
      name: "username_broad_site", 
      query: `"${username}" (site:x.com OR site:twitter.com)`,
      targetUsername: username
    });
    
    // Strategy 3: Username without site restriction (but filtered later)
    strategies.push({
      name: "username_general",
      query: `"${username}" x.com OR "${username}" twitter.com`,
      targetUsername: username
    });
    
    // Strategy 4: Username with profile-related terms
    strategies.push({
      name: "username_with_profile",
      query: `"${username}" (profile OR bio) site:x.com`,
      targetUsername: username
    });
    
    // Strategy 5: Handle-specific search (for @handles)
    if (query.includes('@')) {
      strategies.push({
        name: "handle_search",
        query: `"@${username}" OR "${username}" site:x.com`,
        targetUsername: username
      });
    }
  } else {
    // For name searches, try different approaches
    const cleanName = query.trim();
    
    // Strategy 1: Exact name in quotes
    strategies.push({
      name: "exact_name",
      query: `"${cleanName}" site:x.com`,
      targetUsername: null
    });
    
    // Strategy 2: Name without quotes
    strategies.push({
      name: "loose_name", 
      query: `${cleanName} site:x.com -search -home -settings`,
      targetUsername: null
    });
    
    // Strategy 3: Add profile-related terms
    strategies.push({
      name: "profile_enhanced",
      query: `"${cleanName}" site:x.com (profile OR bio OR about)`,
      targetUsername: null
    });
  }
  
  return strategies;
}

// Calculate relevance score for search results
function calculateRelevanceScore(result: any, originalQuery: string, targetUsername: string | null): number {
  let score = 0;
  
  const title = (result.title || "").toLowerCase();
  const snippet = (result.snippet || "").toLowerCase();
  const url = (result.link || "").toLowerCase();
  const query = originalQuery.toLowerCase();
  
  // Higher score for profile pages vs individual tweets
  if (url.includes('/status/')) {
    score += 2; // Individual tweet
  } else {
    score += 5; // Likely profile page
  }
  
  // Score based on username match in URL
  if (targetUsername) {
    if (url.includes(`/${targetUsername.toLowerCase()}`)) {
      score += 10;
    }
  }
  
  // Score based on query terms in title/snippet
  const queryWords = query.split(/\s+/);
  for (const word of queryWords) {
    if (word.length > 2) { // Skip very short words
      if (title.includes(word)) score += 3;
      if (snippet.includes(word)) score += 2;
    }
  }
  
  return score;
}

// Remove duplicate results based on URL
function removeDuplicateResults(results: any[]): any[] {
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

// Helper function to extract username from X.com or Twitter URL
function extractUsernameFromUrl(url: string): string | null {
  try {
    const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}