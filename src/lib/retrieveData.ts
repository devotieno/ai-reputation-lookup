import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { fetchPerplexityData } from "./apiClients/perplexity";
import { fetchSerpApiData } from "./apiClients/serpapi";
import { fetchYouTubeData } from "./apiClients/youtube";
import { fetchRedditData } from "./apiClients/reddit";
import { fetchTwitterData } from "./apiClients/twitter";
import { fetchLinkedInData } from "./apiClients/linkedin";
import { fetchGithubData } from "./apiClients/github";
import { fetchInstagramData } from "./apiClients/instagram";
import { storeRawData } from "./storeRawData";

export async function retrieveData(category: string, query: string, userId?: string): Promise<any[]> {
  try {
    // For mock data during development/testing
    if (process.env.USE_MOCK_DATA === "true") {
      console.log(`[MOCK] Retrieving ${category} data for: ${query}`);
      return [
        {
          content: `This is mock ${category} data about ${query}.`,
          url: `https://example.com/${category}/1`,
          date: new Date().toISOString()
        },
        {
          content: `More mock ${category} data with some details about ${query}.`,
          url: `https://example.com/${category}/2`,
          date: new Date().toISOString()
        }
      ];
    }
    
    // Get user data if userId is provided to extract platform-specific handles
    let userDoc = null;
    let platformSpecificQuery = query;
    
    if (userId) {
      userDoc = await getDoc(doc(db, "userInputs", userId));
      const userData = userDoc?.data();
      
      // Use platform-specific handles when available
      if (userData) {
        switch(category) {
          case "twitter":
            platformSpecificQuery = userData.twitter || query;
            break;
          case "reddit":
            platformSpecificQuery = userData.reddit || query;
            break;
          case "youtube":
            platformSpecificQuery = userData.youtube || query;
            break;
          case "linkedin":
            platformSpecificQuery = userData.linkedin || query;
            break;
          case "instagram":
            platformSpecificQuery = userData.instagram || query;
            break;
          case "github":
            platformSpecificQuery = userData.github || query;
            break;
          default:
            platformSpecificQuery = query; // Use name for general searches
        }
      }
    }
    
    console.log(`Retrieving ${category} data with query: "${platformSpecificQuery}"`);
    
    let results: any[] = [];
    
    switch(category) {
      case "perplexity":
        results = await fetchPerplexityData(platformSpecificQuery);
        break;
      case "serpapi":
        results = await fetchSerpApiData(platformSpecificQuery);
        break;
      case "reddit":
        // Access tokens would be stored in user doc if available
        const redditToken = userDoc?.data()?.redditAccessToken;
        results = await fetchRedditData(platformSpecificQuery, redditToken);
        
        if (results.length === 0) {
          console.log(`No Reddit data found for: ${platformSpecificQuery}`);
          
          const isRedditUser = platformSpecificQuery.includes('reddit.com/u/') ||
                              platformSpecificQuery.includes('u/') ||
                              /^[a-zA-Z0-9_-]+$/.test(platformSpecificQuery.trim());
          
          if (isRedditUser) {
            results = [{
              content: `Analysis attempted for Reddit user "${platformSpecificQuery}". No publicly accessible data was found. This could be due to: (1) The user account being deleted or suspended, (2) Limited public posting history, (3) Privacy settings restricting content visibility, or (4) The username not matching exactly. Reddit's public API provides access to recent public posts and comments only.`,
              sourceType: "reddit", 
              platform: "Reddit",
              date: new Date().toISOString(),
              url: platformSpecificQuery.includes('reddit.com/u/') ? platformSpecificQuery : `https://reddit.com/u/${platformSpecificQuery.replace('u/', '')}`,
              author: platformSpecificQuery.replace(/.*u\//, ''),
              title: "Reddit Analysis - Limited Data Access",
              isExplanation: true
            }];
          }
        } else {
          console.log(`Successfully retrieved ${results.length} Reddit items for: ${platformSpecificQuery}`);
        }
        break;
      case "twitter":
        const twitterToken = userDoc?.data()?.twitterAccessToken;
        results = await fetchTwitterData(platformSpecificQuery, twitterToken);
        
        // If no results found, provide more detailed feedback
        if (results.length === 0) {
          console.log(`No X/Twitter data found for: ${platformSpecificQuery}`);
          
          // Instead of placeholder, let's try to provide some context
          const isHandle = platformSpecificQuery.includes('@') || 
                          platformSpecificQuery.includes('twitter.com/') || 
                          platformSpecificQuery.includes('x.com/') ||
                          /^[a-zA-Z0-9_]+$/.test(platformSpecificQuery.trim());
          
          if (isHandle) {
            results = [{
              content: `Analysis attempted for X (Twitter) handle "${platformSpecificQuery}". No publicly accessible data was found through search APIs. This could be due to: (1) Limited public visibility settings on the profile, (2) Recent changes to X's data accessibility policies, (3) The profile content not being indexed by search engines, or (4) The account being inactive or suspended. For comprehensive analysis of X content, connecting the account directly would provide better access to posts and interactions.`,
              sourceType: "twitter",
              platform: "X (Twitter)",
              date: new Date().toISOString(),
              url: `https://x.com/${platformSpecificQuery.replace('@', '')}`,
              author: platformSpecificQuery.replace('@', ''),
              title: "X/Twitter Analysis - Limited Data Access",
              isExplanation: true
            }];
          }
        } else {
          // Log successful data retrieval
          console.log(`Successfully retrieved ${results.length} X/Twitter items for: ${platformSpecificQuery}`);
        }
        break;
      case "youtube":
        const youtubeToken = userDoc?.data()?.youtubeAccessToken;
        results = await fetchYouTubeData(platformSpecificQuery, youtubeToken);
        
        if (results.length === 0) {
          console.log(`No YouTube data found for: ${platformSpecificQuery}`);
          
          const isYouTubeChannel = platformSpecificQuery.includes('youtube.com/') || 
                                  platformSpecificQuery.includes('@') ||
                                  /^[a-zA-Z0-9_-]+$/.test(platformSpecificQuery.trim());
          
          if (isYouTubeChannel) {
            // Check if we have API keys configured
            const hasYouTubeAPI = !!process.env.YOUTUBE_API_KEY;
            const hasSerpAPI = !!process.env.SERPAPI_KEY;
            
            let apiStatusMessage = "";
            if (!hasYouTubeAPI && !hasSerpAPI) {
              apiStatusMessage = " This may be due to missing YouTube Data API key and SerpAPI key configuration.";
            } else if (!hasYouTubeAPI) {
              apiStatusMessage = " Using SerpAPI fallback since YouTube Data API key is not configured.";
            }
            
            results = [{
              content: `Analysis attempted for YouTube channel "${platformSpecificQuery}". No publicly accessible data was found. This could be due to: (1) The channel being private or having limited public content, (2) API access limitations, (3) The channel being inactive or deleted, (4) The channel name not matching exactly, or (5) Content not being indexed by search engines.${apiStatusMessage} For comprehensive YouTube analysis, connecting your YouTube account would provide better access to your channel data and analytics.`,
              sourceType: "youtube",
              platform: "YouTube",
              date: new Date().toISOString(),
              url: platformSpecificQuery.includes('youtube.com/') ? platformSpecificQuery : `https://youtube.com/@${platformSpecificQuery.replace('@', '')}`,
              author: platformSpecificQuery.replace('@', ''),
              title: "YouTube Analysis - Limited Data Access", 
              isExplanation: true,
              suggestedFormats: ["@channelname", "youtube.com/@channelname", "exact channel name"],
              apiStatus: {
                youtubeAPI: hasYouTubeAPI,
                serpAPI: hasSerpAPI
              }
            }];
          }
        } else {
          console.log(`Successfully retrieved ${results.length} YouTube items for: ${platformSpecificQuery}`);
        }
        break;
      case "linkedin":
        const linkedinToken = userDoc?.data()?.linkedinAccessToken;
        results = await fetchLinkedInData(linkedinToken, platformSpecificQuery);
        
        // If no results found, provide helpful feedback
        if (results.length === 0) {
          console.log(`No LinkedIn data found for: ${platformSpecificQuery}`);
          
          const isLinkedInProfile = platformSpecificQuery.includes('linkedin.com/in/') || 
                                   /^[a-zA-Z0-9-]+$/.test(platformSpecificQuery.trim());
          
          if (isLinkedInProfile) {
            results = [{
              content: `Analysis attempted for LinkedIn profile "${platformSpecificQuery}". No publicly accessible data was found through search APIs. This could be due to: (1) Privacy settings limiting public visibility, (2) The profile not being indexed by search engines, (3) Premium LinkedIn content restrictions, or (4) The profile being inactive. For comprehensive LinkedIn analysis, connecting your LinkedIn account would provide better access to your professional network and content.`,
              sourceType: "linkedin",
              platform: "LinkedIn",
              date: new Date().toISOString(),
              url: platformSpecificQuery.includes('linkedin.com/in/') ? platformSpecificQuery : `https://linkedin.com/in/${platformSpecificQuery}`,
              author: platformSpecificQuery.replace(/.*\//, ''),
              title: "LinkedIn Analysis - Limited Data Access",
              isExplanation: true
            }];
          }
        } else {
          console.log(`Successfully retrieved ${results.length} LinkedIn items for: ${platformSpecificQuery}`);
        }
        break;
      case "github":
        results = await fetchGithubData(platformSpecificQuery);
        
        if (results.length === 0) {
          console.log(`No GitHub data found for: ${platformSpecificQuery}`);
          
          const isGitHubUser = platformSpecificQuery.includes('github.com/') || 
                              /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(platformSpecificQuery.trim());
          
          if (isGitHubUser) {
            results = [{
              content: `Analysis attempted for GitHub user "${platformSpecificQuery}". No publicly accessible data was found. This could be due to: (1) The user account not existing or being suspended, (2) All repositories being private, (3) Limited recent activity, or (4) API rate limiting. GitHub profiles and public repositories are typically accessible through the public API.`,
              sourceType: "github",
              platform: "GitHub",
              date: new Date().toISOString(),
              url: platformSpecificQuery.includes('github.com/') ? platformSpecificQuery : `https://github.com/${platformSpecificQuery}`,
              author: platformSpecificQuery.replace(/.*github\.com\//, ''),
              title: "GitHub Analysis - Limited Data Access",
              isExplanation: true
            }];
          }
        } else {
          console.log(`Successfully retrieved ${results.length} GitHub items for: ${platformSpecificQuery}`);
        }
        break;
      case "instagram":
        results = await fetchInstagramData(platformSpecificQuery);
        
        // Instagram results will include explanations when no data found or when using SerpAPI fallback
        if (results.length === 0) {
          console.log(`No Instagram data found for: ${platformSpecificQuery}`);
          
          const isInstagramUser = platformSpecificQuery.includes('instagram.com/') || 
                                  platformSpecificQuery.startsWith('@') ||
                                  /^[a-zA-Z0-9_.]+$/.test(platformSpecificQuery.trim());
          
          if (isInstagramUser) {
            // Check if we have SerpAPI configured
            const hasSerpAPI = !!process.env.SERPAPI_KEY;
            
            let searchCapabilityMessage = "";
            if (!hasSerpAPI) {
              searchCapabilityMessage = " Additionally, SerpAPI search fallback is not configured.";
            } else {
              searchCapabilityMessage = " Search through publicly indexed content was attempted but yielded no results.";
            }
            
            results = [{
              content: `Analysis attempted for Instagram account "${platformSpecificQuery}". Instagram has strict privacy policies that limit automated access to profile data.${searchCapabilityMessage} This could be due to: (1) The account being private or having limited public visibility, (2) Content not being indexed by search engines, (3) The username not matching exactly, or (4) Instagram's data access restrictions. For comprehensive analysis, connecting your Instagram account directly through official authentication would provide better results.`,
              sourceType: "instagram",
              platform: "Instagram", 
              date: new Date().toISOString(),
              url: platformSpecificQuery.includes('instagram.com/') ? platformSpecificQuery : `https://instagram.com/${platformSpecificQuery.replace('@', '')}`,
              author: platformSpecificQuery.replace('@', '').replace(/.*instagram\.com\//, ''),
              title: "Instagram Analysis - Limited Access",
              isExplanation: true,
              searchMethod: hasSerpAPI ? "SerpAPI attempted" : "No search capability",
              apiStatus: {
                serpAPI: hasSerpAPI,
                instagramAPI: false
              }
            }];
          }
        } else {
          // Check if results contain explanations or actual data
          const hasRealData = results.some(result => !result.isExplanation && !result.error);
          const hasExplanations = results.some(result => result.isExplanation);
          
          if (hasRealData) {
            console.log(`Successfully retrieved ${results.length} Instagram items for: ${platformSpecificQuery}`);
          } else if (hasExplanations) {
            console.log(`Instagram analysis returned explanatory information for: ${platformSpecificQuery}`);
          }
        }
        break;
      default:
        console.log(`Unknown category: ${category}`);
        results = [];
    }
    
    // Normalize the results and ensure platform information is consistent
    const normalizedResults = results.map(item => ({
      ...item,
      platform: item.platform || item.sourceType || category,
      sourceType: item.sourceType || category
    }));
    
    // Store the raw data
    if (userId) {
      await storeRawData(userId, category, normalizedResults);
    }
    
    return normalizedResults;
  } catch (error) {
    console.error(`Error retrieving ${category} data:`, error);
    return [];
  }
}