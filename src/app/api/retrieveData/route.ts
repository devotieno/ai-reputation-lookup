import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { extractFaceEmbeddings, matchFaces } from "@/lib/vision";
import { retrieveData } from "@/lib/retrieveData";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout for data retrieval

/**
 * POST /api/retrieveData
 * Retrieves data from multiple sources for a user query
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, query } = await request.json();
    
    if (!userId || !query) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    
    const results: any[] = [];

    // 1. Retrieve user's stored face embeddings
    let userFaceEmbedding = null;
    try {
      const userDoc = await getDoc(doc(db, "userInputs", userId));
      userFaceEmbedding = userDoc.exists() && userDoc.data().faceEmbeddings?.[0];
    } catch (error) {
      console.error("Error retrieving user face embeddings:", error);
    }

    // Use the centralized retrieveData function from lib
    const sources = ["perplexity", "serpapi", "youtube", "reddit", "twitter", "linkedin", "github"];
    
    // Process each data source
    for (const source of sources) {
      try {
        console.log(`Retrieving data from ${source} for query: ${query}`);
        const sourceData = await retrieveData(source, query, userId);
        
        // Additional photo matching for relevant sources
        if (source === "youtube" || source === "linkedin" || source === "twitter") {
          for (const item of sourceData) {
            if (item.profileImageUrl && userFaceEmbedding) {
              try {
                const imageRes = await fetch(item.profileImageUrl);
                if (imageRes.ok) {
                  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
                  const profileEmbeddings = await extractFaceEmbeddings(imageBuffer);
                  
                  if (profileEmbeddings && profileEmbeddings.length > 0) {
                    const matchResult = matchFaces(userFaceEmbedding, profileEmbeddings, 0.7) as {face: Record<string, unknown>, similarity: number}[];
                    item.photoMatch = matchResult && matchResult.length > 0;
                    item.photoMatchScore = matchResult && matchResult.length > 0 ? matchResult[0].similarity : 0;
                  }
                }
              } catch (error) {
                console.error(`Error in photo matching for ${source}:`, error);
              }
            }
          }
        }
        
        results.push(...sourceData);
      } catch (error) {
        console.error(`Error retrieving data from ${source}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalResults: results.length,
      results
    });
  } catch (error) {
    console.error("Error in retrieveData API:", error);
    return NextResponse.json({ error: "Failed to retrieve data" }, { status: 500 });
  }
}
