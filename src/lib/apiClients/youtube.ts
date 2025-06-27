export async function fetchYouTubeData(query: string, accessToken?: string) {
  try {
    // If no access token, use YouTube Data API v3 with API key (public)
    if (!accessToken) {
      console.log(`[PUBLIC] Fetching YouTube data for: ${query}`);
      return await fetchPublicYouTubeData(query);
    }

    // Use authenticated YouTube API
    console.log(`[AUTH] Fetching YouTube data for: ${query}`);
    
    // First search for videos
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&type=video&maxResults=10`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchRes.ok) {
      console.error(`YouTube API error: ${searchRes.status}`);
      return [];
    }

    const searchData = await searchRes.json();

    if (!searchData.items || !Array.isArray(searchData.items)) {
      console.error("Unexpected YouTube API response format");
      return [];
    }

    // Extract channel IDs to get their thumbnails
    const channelIds = searchData.items
      .map((item: any) => item.snippet?.channelId)
      .filter(Boolean);

    // Get unique channel IDs
    const uniqueChannelIds = [...new Set(channelIds)];

    // Get channel details for thumbnails
    const channelData: Record<string, string> = {};

    if (uniqueChannelIds.length > 0) {
      const channelsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${uniqueChannelIds.join(
          ","
        )}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();

        if (channelsData.items && Array.isArray(channelsData.items)) {
          channelsData.items.forEach((channel: any) => {
            const thumbnailUrl =
              channel.snippet?.thumbnails?.default?.url ||
              channel.snippet?.thumbnails?.medium?.url ||
              channel.snippet?.thumbnails?.high?.url;

            if (thumbnailUrl) {
              channelData[channel.id] = thumbnailUrl;
            }
          });
        }
      }
    }

    // Map results with channel thumbnails
    return searchData.items.map((item: any) => ({
      content: item.snippet.title + " - " + item.snippet.description,
      sourceType: "youtube",
      date: item.snippet.publishedAt,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      channelThumbnailUrl: channelData[item.snippet.channelId] || null,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return [];
  }
}

// Public YouTube data fetching using YouTube Data API v3 with API key
async function fetchPublicYouTubeData(query: string) {
  try {
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    
    // If no YouTube API key, fall back to SerpAPI search
    if (!youtubeApiKey) {
      console.log("YouTube API key not found, falling back to SerpAPI search");
      return await fetchYouTubeDataViaSerpAPI(query);
    }

    // Try multiple search strategies for YouTube
    const searchStrategies = generateYouTubeSearchStrategies(query);
    let allResults: any[] = [];
    
    for (const strategy of searchStrategies) {
      try {
        console.log(`Trying YouTube search strategy: ${strategy.query}`);
        
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(strategy.query)}&type=${strategy.type}&maxResults=10&key=${youtubeApiKey}`;
        
        const searchRes = await fetch(searchUrl);

        if (!searchRes.ok) {
          console.error(`YouTube search strategy failed: ${searchRes.status}`);
          continue;
        }

        const searchData = await searchRes.json();

        if (!searchData.items || !Array.isArray(searchData.items)) {
          continue;
        }

        const strategyResults = searchData.items.map((item: any) => ({
          ...item,
          searchStrategy: strategy.name,
          relevanceScore: calculateYouTubeRelevanceScore(item, query, strategy.targetChannel)
        }));
        
        allResults.push(...strategyResults);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (strategyError) {
        console.error(`Error with YouTube search strategy "${strategy.name}":`, strategyError);
        continue;
      }
    }

    if (allResults.length === 0) {
      console.log("No YouTube results found after trying all search strategies, falling back to SerpAPI");
      return await fetchYouTubeDataViaSerpAPI(query);
    }

    // Sort by relevance and remove duplicates
    const uniqueResults = removeDuplicateYouTubeResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Extract channel IDs to get their thumbnails
    const channelIds = sortedResults
      .map((item: any) => item.snippet?.channelId)
      .filter(Boolean);

    const uniqueChannelIds = [...new Set(channelIds)];
    const channelData: Record<string, string> = {};

    // Get channel details for thumbnails
    if (uniqueChannelIds.length > 0) {
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${uniqueChannelIds.join(',')}&key=${youtubeApiKey}`
      );

      if (channelRes.ok) {
        const channelResponse = await channelRes.json();
        if (channelResponse.items && Array.isArray(channelResponse.items)) {
          channelResponse.items.forEach((channel: any) => {
            channelData[channel.id] = channel.snippet?.thumbnails?.default?.url || null;
          });
        }
      }
    }

    console.log(`Found ${sortedResults.length} unique YouTube results from ${allResults.length} total results`);
    
    return sortedResults.slice(0, 5).map((item: any) => ({
      content: item.snippet?.title || "No title available",
      description: item.snippet?.description || "",
      sourceType: "youtube",
      platform: "youtube",
      date: item.snippet?.publishedAt || new Date().toISOString(),
      url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` :
           item.id?.channelId ? `https://www.youtube.com/channel/${item.id.channelId}` :
           item.snippet?.channelId ? `https://www.youtube.com/channel/${item.snippet.channelId}` : "#",
      channelThumbnailUrl: channelData[item.snippet?.channelId] || null,
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url || null,
      searchStrategy: item.searchStrategy,
      relevanceScore: item.relevanceScore
    }));
  } catch (error) {
    console.error("Error fetching public YouTube data:", error);
    return [];
  }
}

// Generate multiple search strategies for YouTube
function generateYouTubeSearchStrategies(query: string) {
  const strategies = [];
  
  // Extract channel name if it's a YouTube URL
  let channelName = null;
  if (query.includes('youtube.com/')) {
    if (query.includes('/channel/')) {
      channelName = query.split('/channel/')[1]?.split('/')[0]?.trim();
    } else if (query.includes('/@')) {
      channelName = query.split('/@')[1]?.split('/')[0]?.trim();
    } else if (query.includes('/c/')) {
      channelName = query.split('/c/')[1]?.split('/')[0]?.trim();
    }
  } else if (query.startsWith('@')) {
    channelName = query.substring(1);
  } else if (/^[a-zA-Z0-9_-]+$/.test(query.trim())) {
    channelName = query.trim();
  }
  
  if (channelName) {
    // Strategy 1: Search for channels with exact name
    strategies.push({
      name: "channel_exact",
      query: channelName,
      type: "channel",
      targetChannel: channelName
    });
    
    // Strategy 2: Search for channels with @handle format
    strategies.push({
      name: "channel_handle",
      query: `@${channelName}`,
      type: "channel", 
      targetChannel: channelName
    });
    
    // Strategy 3: Search for videos from this channel
    strategies.push({
      name: "channel_videos",
      query: `channel:${channelName}`,
      type: "video",
      targetChannel: channelName
    });
    
    // Strategy 4: Search videos with channel name in title
    strategies.push({
      name: "channel_content",
      query: `"${channelName}"`,
      type: "video", 
      targetChannel: channelName
    });
    
    // Strategy 5: Search for common variations (spaces, underscores)
    const variations = [
      channelName.replace(/[-_]/g, ' '),  // Replace dashes/underscores with spaces
      channelName.replace(/\s+/g, ''),   // Remove spaces
      channelName.toLowerCase(),
      channelName.toUpperCase()
    ].filter(v => v !== channelName && v.length > 0);
    
    variations.forEach((variation, index) => {
      strategies.push({
        name: `channel_variation_${index}`,
        query: variation,
        type: "channel",
        targetChannel: channelName
      });
    });
    
  } else {
    // For general searches or names
    const cleanQuery = query.trim();
    
    // Strategy 1: Search channels
    strategies.push({
      name: "general_channels",
      query: cleanQuery,
      type: "channel",
      targetChannel: null
    });
    
    // Strategy 2: Search videos
    strategies.push({
      name: "general_videos",
      query: cleanQuery,
      type: "video",
      targetChannel: null
    });
    
    // Strategy 3: If it looks like a name, try with software/tech keywords
    if (cleanQuery.includes(' ')) {
      strategies.push({
        name: "name_with_context",
        query: `"${cleanQuery}" software OR programming OR tech`,
        type: "channel",
        targetChannel: null
      });
    }
  }
  
  return strategies;
}

// Calculate relevance score for YouTube results
function calculateYouTubeRelevanceScore(result: any, originalQuery: string, targetChannel: string | null): number {
  let score = 0;
  
  const title = (result.snippet?.title || "").toLowerCase();
  const description = (result.snippet?.description || "").toLowerCase();
  const channelTitle = (result.snippet?.channelTitle || "").toLowerCase();
  const query = originalQuery.toLowerCase();
  
  // Higher score for channel matches
  if (targetChannel) {
    const target = targetChannel.toLowerCase();
    if (channelTitle.includes(target)) score += 10;
    if (title.includes(target)) score += 5;
  }
  
  // Score based on query terms
  const queryWords = query.replace(/[@#]/g, '').split(/\s+/);
  for (const word of queryWords) {
    if (word.length > 2) {
      if (title.includes(word)) score += 3;
      if (description.includes(word)) score += 2;
      if (channelTitle.includes(word)) score += 4;
    }
  }
  
  return score;
}

// Remove duplicate YouTube results
function removeDuplicateYouTubeResults(results: any[]): any[] {
  const seen = new Set();
  return results.filter(result => {
    const key = result.id?.videoId || result.id?.channelId || result.snippet?.channelId;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// Fallback YouTube data fetching using SerpAPI when YouTube Data API is not available
async function fetchYouTubeDataViaSerpAPI(query: string) {
  try {
    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      console.error("Neither YouTube API key nor SerpAPI key found for YouTube search");
      return [];
    }

    console.log(`Fetching YouTube data via SerpAPI for: ${query}`);
    
    // Generate YouTube-specific search strategies for SerpAPI
    const searchStrategies = generateYouTubeSerpAPIStrategies(query);
    let allResults: any[] = [];
    
    for (const strategy of searchStrategies) {
      try {
        console.log(`Trying YouTube SerpAPI strategy: ${strategy.query}`);
        
        const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(strategy.query)}&api_key=${serpApiKey}&num=10`;
        const res = await fetch(searchUrl);

        if (!res.ok) {
          console.error(`YouTube SerpAPI strategy failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        
        if (data.organic_results && Array.isArray(data.organic_results)) {
          const strategyResults = data.organic_results
            .filter((result: any) => {
              const link = result.link;
              if (!link) return false;
              
              // Must be from YouTube
              return link.includes('youtube.com/watch') || 
                     link.includes('youtube.com/channel') || 
                     link.includes('youtube.com/@') ||
                     link.includes('youtube.com/c/');
            })
            .map((result: any) => ({
              content: result.title || "YouTube content",
              description: result.snippet || "",
              sourceType: "youtube",
              platform: "YouTube",
              date: new Date().toISOString(),
              url: result.link,
              title: result.title,
              searchStrategy: strategy.name,
              relevanceScore: calculateYouTubeSerpAPIRelevanceScore(result, query, strategy.targetChannel)
            }));
          
          allResults.push(...strategyResults);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (strategyError) {
        console.error(`Error with YouTube SerpAPI strategy "${strategy.name}":`, strategyError);
        continue;
      }
    }

    if (allResults.length === 0) {
      console.log("No YouTube results found via SerpAPI either");
      return [];
    }

    // Sort by relevance and remove duplicates
    const uniqueResults = removeDuplicateYouTubeSerpAPIResults(allResults);
    const sortedResults = uniqueResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    console.log(`Found ${sortedResults.length} unique YouTube results from SerpAPI`);
    return sortedResults.slice(0, 5);
    
  } catch (error) {
    console.error("Error fetching YouTube data via SerpAPI:", error);
    return [];
  }
}

// Generate SerpAPI search strategies for YouTube
function generateYouTubeSerpAPIStrategies(query: string) {
  const strategies = [];
  
  // Extract potential channel name
  let channelName = null;
  if (query.includes('youtube.com/')) {
    if (query.includes('/@')) {
      channelName = query.split('/@')[1]?.split('/')[0]?.trim();
    } else if (query.includes('/c/')) {
      channelName = query.split('/c/')[1]?.split('/')[0]?.trim();
    }
  } else if (query.startsWith('@')) {
    channelName = query.substring(1);
  } else if (/^[a-zA-Z0-9_\s-]+$/.test(query.trim())) {
    channelName = query.trim();
  }
  
  if (channelName) {
    // Strategy 1: Direct channel search
    strategies.push({
      name: "serpapi_channel_direct",
      query: `site:youtube.com "@${channelName}"`,
      targetChannel: channelName
    });
    
    // Strategy 2: Channel name with YouTube
    strategies.push({
      name: "serpapi_channel_name",
      query: `"${channelName}" site:youtube.com`,
      targetChannel: channelName
    });
    
    // Strategy 3: Channel with software/tech context (for your case)
    strategies.push({
      name: "serpapi_channel_context",
      query: `"${channelName}" site:youtube.com (software OR programming OR SaaS OR tech)`,
      targetChannel: channelName
    });
  } else {
    // For general searches
    strategies.push({
      name: "serpapi_general",
      query: `"${query}" site:youtube.com`,
      targetChannel: null
    });
  }
  
  return strategies;
}

// Calculate relevance score for SerpAPI YouTube results
function calculateYouTubeSerpAPIRelevanceScore(result: any, originalQuery: string, targetChannel: string | null): number {
  let score = 0;
  
  const title = (result.title || "").toLowerCase();
  const snippet = (result.snippet || "").toLowerCase();
  const url = (result.link || "").toLowerCase();
  const query = originalQuery.toLowerCase();
  
  // Higher score for channel pages
  if (url.includes('/channel/') || url.includes('/@')) {
    score += 8;
  }
  
  // Score based on target channel match
  if (targetChannel) {
    const target = targetChannel.toLowerCase();
    if (title.includes(target) || snippet.includes(target) || url.includes(target)) {
      score += 10;
    }
  }
  
  // Score based on query terms
  const queryWords = query.replace(/[@#]/g, '').split(/\s+/);
  for (const word of queryWords) {
    if (word.length > 2) {
      if (title.includes(word)) score += 3;
      if (snippet.includes(word)) score += 2;
    }
  }
  
  // Bonus for tech/software keywords (relevant for your channel)
  const techKeywords = ['software', 'programming', 'saas', 'tech', 'developer', 'coding', 'forex'];
  for (const keyword of techKeywords) {
    if (title.includes(keyword) || snippet.includes(keyword)) {
      score += 2;
    }
  }
  
  return score;
}

// Remove duplicate YouTube SerpAPI results
function removeDuplicateYouTubeSerpAPIResults(results: any[]): any[] {
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