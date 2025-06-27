import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * Maps internal platform names to user-friendly display names
 */
function getPlatformDisplayName(platform: string): string {
  const platformMap: Record<string, string> = {
    'twitter': 'X (Twitter)',
    'reddit': 'Reddit',
    'youtube': 'YouTube',
    'linkedin': 'LinkedIn',
    'github': 'GitHub',
    'instagram': 'Instagram',
    'serpapi': 'Web Search',
    'perplexity': 'AI Web Search'
  };
  
  return platformMap[platform] || platform;
}

/**
 * GET /api/getAnalysisResults
 * Retrieves analysis results for a specific user from Firestore
 * Aggregates results by the 8 analysis categories instead of by platform
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  
  try {
    console.log(`Fetching analysis results for userId: ${userId}`);
    
    const q = query(collection(db, "analysisResults"), where("userId", "==", userId));
    const snap = await getDocs(q);
    
    console.log(`Found ${snap.size} analysis results from different platforms`);
    
    // Initialize the 8 analysis categories
    const categoryNames = [
      'professionalism',
      'toneAndLanguage', 
      'sentiment',
      'consistency',
      'authenticity',
      'socialRiskProfile',
      'onlineExposure',
      'positiveMarkers'
    ];
    
    const aggregatedResults: Record<string, any> = {};
    
    // Initialize each category with empty structure
    categoryNames.forEach(categoryName => {
      aggregatedResults[categoryName] = {
        summaries: [],
        flagged: [],
        platforms: []
      };
    });
    
    // Aggregate data from all platforms by category
    snap.forEach(doc => {
      const data = doc.data();
      const platformData = data.analysis;
      const platform = data.category; // e.g., "reddit", "twitter", etc.
      const displayPlatform = getPlatformDisplayName(platform);
      
      console.log(`Processing analysis from platform: ${platform} (display: ${displayPlatform})`);
      
      if (platformData?.categories) {
        // Aggregate each category's data across platforms
        categoryNames.forEach(categoryName => {
          const categoryData = platformData.categories[categoryName];
          
          if (categoryData) {
            // Add summary if it exists and isn't already added
            if (categoryData.summary && !aggregatedResults[categoryName].summaries.includes(categoryData.summary)) {
              aggregatedResults[categoryName].summaries.push(categoryData.summary);
            }
            
            // Add flagged items with platform information
            if (categoryData.flagged && Array.isArray(categoryData.flagged)) {
              categoryData.flagged.forEach((flaggedItem: any) => {
                const enhancedFlaggedItem = {
                  ...flaggedItem,
                  platform: flaggedItem.platform || displayPlatform, // Use display name
                  sourceCategory: platform // Track which platform this came from
                };
                aggregatedResults[categoryName].flagged.push(enhancedFlaggedItem);
              });
            }
            
            // Track which platforms contributed to this category (use display names)
            if (!aggregatedResults[categoryName].platforms.includes(displayPlatform)) {
              aggregatedResults[categoryName].platforms.push(displayPlatform);
            }
          }
        });
      }
    });
    
    // Create a consolidated summary for each category
    Object.keys(aggregatedResults).forEach(categoryName => {
      const categoryData = aggregatedResults[categoryName];
      
      if (categoryData.summaries.length === 0) {
        categoryData.summary = "No data available for analysis.";
      } else if (categoryData.summaries.length === 1) {
        categoryData.summary = categoryData.summaries[0];
      } else {
        // Combine multiple summaries intelligently
        categoryData.summary = `Analysis across ${categoryData.platforms.length} platforms: ${categoryData.summaries.join(' ')}`;
      }
      
      // Clean up - remove the summaries array since we have the consolidated summary
      delete categoryData.summaries;
    });
    
    console.log(`Aggregated results into ${Object.keys(aggregatedResults).length} categories`);
    
    return NextResponse.json({ results: aggregatedResults });
  } catch (error) {
    console.error("Error fetching analysis results:", error);
    return NextResponse.json({ error: "Failed to fetch analysis results" }, { status: 500 });
  }
}
