import { NextRequest, NextResponse } from "next/server";
import { chunkText } from "@/lib/chunkText";
import { analyzeTextWithAI } from "@/lib/aiAnalysis";
import { analyzeToxicity } from "@/lib/perspective";
import { storeAnalysis } from "@/lib/storeAnalysis";

export const dynamic = 'force-dynamic';

/**
 * POST /api/analyzeData
 * Analyzes content data using AI and Perspective API
 */
export async function POST(request: NextRequest) {
  const { userId, category, items } = await request.json();

  // For mock data during development
  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({
      analysis: {
        summaries: [
          `This is a summary of ${items.length} items from ${category}.`,
          `The data contains information about the subject with predominantly neutral sentiment.`
        ],
        toxicityScore: Math.random() * 0.3,
        quotes: items.map((item: {content?: string; date?: string; url?: string}) => ({
          content: item.content,
          date: item.date || new Date().toISOString(),
          url: item.url || "https://example.com"
        }))
      }
    });
  }

  // Skip analysis if no data
  if (!items || items.length === 0) {
    return NextResponse.json({
      analysis: {
        summaries: ["No data available for analysis."],
        toxicityScore: 0,
        quotes: []
      }
    });
  }

  try {
    // Combine all text for analysis
    const combinedText = items
      .map((item: {content?: string; date?: string; url?: string}) => item.content || "")
      .filter(Boolean)
      .join("\n\n");

    // Chunk text if it's too large
    const chunks = chunkText(combinedText, 4000);

    // Get toxicity score
    let toxicityScore = 0;
    try {
      toxicityScore = await analyzeToxicity(combinedText);
    } catch (error) {
      console.error("Error analyzing toxicity:", error);
    }

    // Analyze chunks with AI
    const summariesPromises = chunks.map(chunk =>
      analyzeTextWithAI(chunk, category)
    );
    const summaries = await Promise.all(summariesPromises);

    // Prepare quotes for the analysis
    const quotes = items.map((item: Record<string, unknown>) => ({
      content: item.content || "",
      date: item.date || new Date().toISOString(),
      url: item.url || ""
    })).filter((q: Record<string, unknown>) => q.content);

    const analysis = {
      summaries: summaries.filter(Boolean),
      toxicityScore,
      quotes
    };

    // Store the analysis results if userId is provided
    if (userId) {
      await storeAnalysis(userId, category, analysis);
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Error in analysis:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
