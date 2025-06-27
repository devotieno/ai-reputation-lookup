export async function fetchRedditData(query: string, accessToken?: string) {
  try {
    // If no access token, use public Reddit JSON API
    if (!accessToken) {
      console.log(`[PUBLIC] Fetching Reddit data for: ${query}`);
      return await fetchPublicRedditData(query);
    }

    // Use authenticated API with access token
    console.log(`[AUTH] Fetching Reddit data for: ${query}`);
    
    // Search for posts
    const res = await fetch(
      `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "ai-reputation-lookup/0.1",
        },
      }
    );

    if (!res.ok) {
      console.error(`Reddit API error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    if (!data.data?.children || !Array.isArray(data.data.children)) {
      console.error("Unexpected Reddit API response format");
      return [];
    }

    // Get unique authors to fetch their avatars
    const authors = data.data.children
      .map((item: any) => item.data?.author)
      .filter(Boolean);

    const uniqueAuthors = [...new Set(authors)] as string[];

    // Get author avatars (where possible)
    const authorAvatars: Record<string, string> = {};

    for (const author of uniqueAuthors) {
      try {
        const profileRes = await fetch(
          `https://oauth.reddit.com/user/${author}/about`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": "ai-reputation-lookup/0.1",
            },
          }
        );

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const avatarUrl =
            profileData.data?.icon_img ||
            profileData.data?.snoovatar_img ||
            null;

          if (avatarUrl) {
            // Remove query parameters that might affect avatar URL
            authorAvatars[author] = avatarUrl.split("?")[0];
          }
        }
      } catch (error) {
        console.warn(`Error fetching avatar for Reddit user ${author}:`, error);
      }
    }

    // Map results with author avatars
    return data.data.children.map((item: any) => ({
      content:
        item.data.title + (item.data.selftext ? ` - ${item.data.selftext}` : ""),
      sourceType: "reddit",
      date: new Date(item.data.created_utc * 1000).toISOString(),
      url: `https://reddit.com${item.data.permalink}`,
      author: item.data.author,
      authorAvatarUrl: authorAvatars[item.data.author] || null,
      subreddit: item.data.subreddit,
    }));
  } catch (error) {
    console.error("Error fetching Reddit data:", error);
    return [];
  }
}

// Public Reddit data fetching (no authentication required)
async function fetchPublicRedditData(query: string) {
  try {
    // Try multiple search strategies for Reddit
    const searchStrategies = generateRedditSearchStrategies(query);
    let allResults: any[] = [];
    
    for (const strategy of searchStrategies) {
      try {
        console.log(`Trying Reddit search strategy: ${strategy.name}`);
        
        const res = await fetch(strategy.url, {
          headers: {
            "User-Agent": "ai-reputation-lookup/0.1",
          },
        });

        if (!res.ok) {
          console.error(`Reddit strategy "${strategy.name}" failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        
        if (data.data?.children && Array.isArray(data.data.children)) {
          const strategyResults = data.data.children.map((item: any) => ({
            ...item,
            searchStrategy: strategy.name,
            relevanceScore: calculateRedditRelevanceScore(item, query, strategy.targetUser)
          }));
          
          allResults.push(...strategyResults);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (strategyError) {
        console.error(`Error with Reddit search strategy "${strategy.name}":`, strategyError);
        continue;
      }
    }

    if (allResults.length === 0) {
      console.log("No Reddit results found after trying all search strategies");
      return [];
    }

    // Sort by relevance and remove duplicates
    const uniqueResults = removeDuplicateRedditResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log(`Found ${sortedResults.length} unique Reddit results from ${allResults.length} total results`);

    return sortedResults.slice(0, 10).map((item: any) => ({
      content: item.data?.title || item.data?.body || item.data?.selftext || "No content available",
      sourceType: "reddit",
      platform: "reddit",
      date: new Date(item.data?.created_utc * 1000).toISOString(),
      url: `https://reddit.com${item.data?.permalink}`,
      author: item.data?.author,
      subreddit: item.data?.subreddit,
      score: item.data?.score || 0,
      num_comments: item.data?.num_comments || 0,
      searchStrategy: item.searchStrategy,
      relevanceScore: item.relevanceScore
    }));
  } catch (error) {
    console.error("Error fetching public Reddit data:", error);
    return [];
  }
}

// Generate multiple search strategies for Reddit
function generateRedditSearchStrategies(query: string) {
  const strategies = [];
  
  // Extract username if it's a Reddit URL or username format
  let username = null;
  if (query.includes('reddit.com/u/') || query.includes('reddit.com/user/')) {
    username = query.split(/reddit\.com\/u(?:ser)?\/([^\/\?]+)/)[1]?.trim();
  } else if (query.startsWith('u/') || query.startsWith('/u/')) {
    username = query.replace(/^\/?(u\/)?/, '');
  } else if (!query.includes(' ') && query.length > 2 && /^[a-zA-Z0-9_-]+$/.test(query)) {
    username = query.trim();
  }
  
  if (username) {
    // Strategy 1: Direct user posts
    strategies.push({
      name: "user_posts",
      url: `https://www.reddit.com/user/${username}.json?limit=10`,
      targetUser: username
    });
    
    // Strategy 2: User comments  
    strategies.push({
      name: "user_comments",
      url: `https://www.reddit.com/user/${username}/comments.json?limit=10`,
      targetUser: username
    });
    
    // Strategy 3: Search mentions of username
    strategies.push({
      name: "username_mentions",
      url: `https://www.reddit.com/search.json?q="${username}"&limit=10&sort=relevance`,
      targetUser: username
    });
  } else {
    // For general searches
    const cleanQuery = query.trim();
    
    // Strategy 1: General search
    strategies.push({
      name: "general_search",
      url: `https://www.reddit.com/search.json?q=${encodeURIComponent(cleanQuery)}&limit=10&sort=relevance`,
      targetUser: null
    });
    
    // Strategy 2: Search in specific subreddits that might be relevant
    strategies.push({
      name: "targeted_subreddits",
      url: `https://www.reddit.com/search.json?q=${encodeURIComponent(cleanQuery)}&limit=10&sort=relevance&restrict_sr=false`,
      targetUser: null
    });
  }
  
  return strategies;
}

// Calculate relevance score for Reddit results
function calculateRedditRelevanceScore(result: any, originalQuery: string, targetUser: string | null): number {
  let score = 0;
  
  const title = (result.data?.title || "").toLowerCase();
  const selftext = (result.data?.selftext || "").toLowerCase();
  const author = (result.data?.author || "").toLowerCase();
  const query = originalQuery.toLowerCase();
  
  // Higher score for target user matches
  if (targetUser && author === targetUser.toLowerCase()) {
    score += 10;
  }
  
  // Score based on query terms
  const queryWords = query.replace(/[u\/]/g, '').split(/\s+/);
  for (const word of queryWords) {
    if (word.length > 2) {
      if (title.includes(word)) score += 3;
      if (selftext.includes(word)) score += 2;
      if (author.includes(word)) score += 4;
    }
  }
  
  // Bonus for popular posts
  const postScore = result.data?.score || 0;
  if (postScore > 10) score += 1;
  if (postScore > 100) score += 2;
  
  return score;
}

// Remove duplicate Reddit results
function removeDuplicateRedditResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(result => {
    const key = result.data?.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}