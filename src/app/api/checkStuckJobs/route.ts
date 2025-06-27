import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/**
 * GET /api/checkStuckJobs
 * Identifies jobs stuck in "processing" state and resets them to "pending"
 */
export async function GET() {
  console.log("Checking for stuck jobs...");
  
  try {
    // Get jobs stuck in "processing" state
    const q = query(collection(db, "jobs"), where("status", "==", "processing"));
    const jobsSnap = await getDocs(q);
    
    console.log(`Found ${jobsSnap.size} jobs in "processing" state`);
    
    let resetCount = 0;
    const timeThreshold = 60 * 60 * 1000; // 1 hour in milliseconds
    const currentTime = Date.now();
    
    for (const jobDoc of jobsSnap.docs) {
      const job = jobDoc.data();
      const jobId = jobDoc.id;
      
      // Check if job has been processing for too long
      const startedAt = job.startedAt ? new Date(job.startedAt).getTime() : 0;
      const processingTime = currentTime - startedAt;
      
      if (startedAt === 0 || processingTime > timeThreshold) {
        console.log(`Job ${jobId} appears to be stuck (processing for ${Math.round(processingTime / 60000)} minutes), resetting to pending`);
        
        // Reset job status to pending
        await updateDoc(doc(db, "jobs", jobId), { 
          status: "pending",
          error: job.error ? `${job.error} (Previously stuck in processing)` : "Previously stuck in processing",
          startedAt: null
        });
        
        resetCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      totalProcessingJobs: jobsSnap.size,
      resetCount
    });
  } catch (error) {
    console.error("Error checking stuck jobs:", error);
    return NextResponse.json({ error: "Job check failed" }, { status: 500 });
  }
}
