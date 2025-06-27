import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * POST /api/queueJob
 * Adds a data retrieval job to the Firestore job queue
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, category, query } = await request.json();
    
    if (!userId || !category || !query) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    const jobRef = await addDoc(collection(db, "jobs"), {
      userId,
      category,
      query,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    
    return NextResponse.json({ 
      success: true, 
      jobId: jobRef.id 
    });
  } catch (error) {
    console.error("Error queueing job:", error);
    return NextResponse.json({ error: "Failed to queue job" }, { status: 500 });
  }
}
