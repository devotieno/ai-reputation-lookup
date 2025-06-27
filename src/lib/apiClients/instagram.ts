export async function fetchInstagramData(query: string, accessToken?: string) {
  try {
    console.log(`[PUBLIC] Attempting Instagram data retrieval for: ${query}`);
    
    // If no access token, try SerpAPI fallback for public Instagram data
    if (!accessToken) {
      return await fetchPublicInstagramDataViaSerpAPI(query);
    }

    // Use authenticated Instagram API (when properly configured)
    console.log(`[AUTH] Fetching Instagram data for: ${query}`);
    
    // Note: This would require Instagram Basic Display API setup and app review
    // For now, fall back to SerpAPI even with access token
    return await fetchPublicInstagramDataViaSerpAPI(query);
    
  } catch (error) {
    console.error("Error fetching Instagram data:", error);
    return [];
  }
}

// Extract Instagram username from various query formats
function extractInstagramUsername(query: string): string | null {
  try {
    // Handle Instagram URLs
    if (query.includes('instagram.com/')) {
      const match = query.match(/instagram\.com\/([^\/\?]+)/);
      return match ? match[1] : null;
    }
    
    // Handle @username format
    if (query.startsWith('@')) {
      return query.substring(1);
    }
    
    // Handle simple username (no spaces, typical Instagram format)
    if (/^[a-zA-Z0-9_.]+$/.test(query.trim()) && query.length >= 1 && query.length <= 30) {
      return query.trim();
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Note: Instagram Basic Display API requires user authentication and app review
// For future implementation with proper authentication:
/*
async function fetchAuthenticatedInstagramData(accessToken: string) {
  try {
    // Get user's basic info
    const userRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
    
    if (!userRes.ok) {
      console.error(`Instagram API error: ${userRes.status}`);
      return [];
    }
    
    const userData = await userRes.json();
    
    // Get user's recent media
    const mediaRes = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=10&access_token=${accessToken}`);
    
    if (!mediaRes.ok) {
      console.error(`Instagram media API error: ${mediaRes.status}`);
      return [];
    }
    
    const mediaData = await mediaRes.json();
    
    return mediaData.data?.map((item: any) => ({
      content: item.caption || "No caption",
      sourceType: "instagram",
      platform: "Instagram",
      date: item.timestamp,
      url: item.permalink,
      author: userData.username,
      mediaType: item.media_type,
      mediaUrl: item.media_url
    })) || [];
    
  } catch (error) {
    console.error("Error fetching authenticated Instagram data:", error);
    return [];
  }
}
*/

// Public Instagram data fetching using SerpAPI fallback
async function fetchPublicInstagramDataViaSerpAPI(query: string) {
  try {
    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      console.error("SerpAPI key not found for Instagram search");
      return [{
        content: `Analysis attempted for Instagram account "${query}". Instagram has strict privacy policies and API limitations that prevent automated access to public profile data without explicit user authorization. Additionally, SerpAPI key is not configured for fallback search. To analyze Instagram content, the account owner would need to connect their Instagram account directly through Instagram's official authentication system.`,
        sourceType: "instagram",
        platform: "Instagram",
        date: new Date().toISOString(),
        url: query.includes('instagram.com/') ? query : `https://instagram.com/${query.replace('@', '')}`,
        author: extractInstagramUsername(query) || query,
        title: "Instagram Analysis - API & Search Limitations",
        isExplanation: true
      }];
    }

    const username = extractInstagramUsername(query);
    if (!username) {
      console.error("Could not extract Instagram username from query:", query);
      return [];
    }

    console.log(`Fetching Instagram data via SerpAPI for: ${username}`);
    
    // Generate Instagram-specific search strategies for SerpAPI
    const searchStrategies = generateInstagramSerpAPIStrategies(username);
    let allResults: any[] = [];
    
    for (const strategy of searchStrategies) {
      try {
        console.log(`Trying Instagram SerpAPI strategy: ${strategy.query}`);
        
        const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(strategy.query)}&api_key=${serpApiKey}&num=10`;
        const res = await fetch(searchUrl);

        if (!res.ok) {
          console.error(`Instagram SerpAPI strategy failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        
        if (data.organic_results && Array.isArray(data.organic_results)) {
          const strategyResults = data.organic_results
            .filter((result: any) => {
              const link = result.link;
              if (!link) return false;
              
              // Must be from Instagram
              return link.includes('instagram.com/') && 
                     !link.includes('/p/') && // Exclude individual posts
                     !link.includes('/reel/') && // Exclude reels
                     !link.includes('/tv/'); // Exclude IGTV
            })
            .map((result: any) => ({
              content: result.snippet || result.title || "Instagram profile information",
              sourceType: "instagram",
              platform: "Instagram",
              date: new Date().toISOString(),
              url: result.link,
              author: username,
              title: result.title || `Instagram Profile: ${username}`,
              searchStrategy: strategy.name,
              relevanceScore: calculateInstagramSerpAPIRelevanceScore(result, query, username)
            }));
          
          allResults.push(...strategyResults);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (strategyError) {
        console.error(`Error with Instagram SerpAPI strategy "${strategy.name}":`, strategyError);
        continue;
      }
    }

    if (allResults.length === 0) {
      console.log("No Instagram results found via SerpAPI");
      return [{
        content: `Analysis attempted for Instagram account "${username}". No publicly accessible profile information was found through search engines. This could be due to: (1) The account being private, (2) Limited public visibility in search results, (3) The username not matching exactly, or (4) Instagram's restrictions on data indexing. Note: This search method can only find basic profile information that's publicly indexed by Google, not actual posts or detailed content.`,
        sourceType: "instagram",
        platform: "Instagram",
        date: new Date().toISOString(),
        url: `https://instagram.com/${username}`,
        author: username,
        title: "Instagram Analysis - Limited Search Results",
        isExplanation: true,
        searchMethod: "SerpAPI fallback"
      }];
    }

    // Sort by relevance and remove duplicates
    const uniqueResults = removeDuplicateInstagramResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log(`Found ${sortedResults.length} unique Instagram results from SerpAPI`);
    
    // Add a note about limitations
    const resultsWithNote = sortedResults.slice(0, 3).map((result, index) => ({
      ...result,
      content: index === 0 ? 
        `${result.content} [Note: This information is gathered from publicly available search results. For comprehensive Instagram analysis including posts and media, connecting your Instagram account directly would provide better access.]` :
        result.content
    }));
    
    return resultsWithNote;
    
  } catch (error) {
    console.error("Error fetching Instagram data via SerpAPI:", error);
    return [{
      content: `Error occurred while searching for Instagram account "${query}". Instagram analysis requires either direct account connection or successful search engine indexing of public profile information.`,
      sourceType: "instagram",
      platform: "Instagram",
      date: new Date().toISOString(),
      url: query.includes('instagram.com/') ? query : `https://instagram.com/${query.replace('@', '')}`,
      author: extractInstagramUsername(query) || query,
      title: "Instagram Analysis - Search Error",
      isExplanation: true,
      error: true
    }];
  }
}

// Generate SerpAPI search strategies for Instagram
function generateInstagramSerpAPIStrategies(username: string) {
  const strategies = [];
  
  // Strategy 1: Direct Instagram profile search
  strategies.push({
    name: "instagram_profile_direct",
    query: `site:instagram.com/${username}`
  });
  
  // Strategy 2: Instagram username with quotes
  strategies.push({
    name: "instagram_username_quoted",
    query: `"${username}" site:instagram.com`
  });
  
  // Strategy 3: Instagram with @ symbol
  strategies.push({
    name: "instagram_handle_format",
    query: `"@${username}" site:instagram.com`
  });
  
  // Strategy 4: General Instagram search
  strategies.push({
    name: "instagram_general",
    query: `${username} instagram.com`
  });
  
  // Strategy 5: Instagram profile with bio keywords (if applicable)
  strategies.push({
    name: "instagram_bio_context",
    query: `"${username}" site:instagram.com (bio OR followers OR following)`
  });
  
  return strategies;
}

// Calculate relevance score for Instagram SerpAPI results
function calculateInstagramSerpAPIRelevanceScore(result: any, originalQuery: string, targetUsername: string): number {
  let score = 0;
  
  const title = (result.title || "").toLowerCase();
  const snippet = (result.snippet || "").toLowerCase();
  const url = (result.link || "").toLowerCase();
  const query = originalQuery.toLowerCase();
  
  // Higher score for exact profile matches
  if (url.includes(`instagram.com/${targetUsername.toLowerCase()}`)) {
    score += 10;
  }
  
  // Score for username mentions
  const target = targetUsername.toLowerCase();
  if (title.includes(target)) score += 5;
  if (snippet.includes(target)) score += 3;
  
  // Score for profile-related terms
  const profileKeywords = ['followers', 'following', 'posts', 'bio', 'profile'];
  for (const keyword of profileKeywords) {
    if (title.includes(keyword) || snippet.includes(keyword)) {
      score += 2;
    }
  }
  
  // Penalty for non-profile pages
  if (url.includes('/p/') || url.includes('/reel/') || url.includes('/tv/')) {
    score -= 5;
  }
  
  return score;
}

// Remove duplicate Instagram results
function removeDuplicateInstagramResults(results: any[]): any[] {
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