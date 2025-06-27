import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from "firebase/firestore";
import { NextResponse } from "next/server";
import { retrieveData } from "@/lib/retrieveData";
import { analyzeData } from "@/lib/analyzeData";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 5 minutes for long-running processing

/**
 * GET /api/processJobs
 * Background job processor that retrieves data and runs analysis for pending jobs
 */
export async function GET() {
  console.log("Processing pending jobs...");
  
  try {
    // Get only pending jobs
    const q = query(collection(db, "jobs"), where("status", "==", "pending"));
    const jobsSnap = await getDocs(q);
    
    let processed = 0;
    let errors = 0;

    console.log(`Found ${jobsSnap.size} pending jobs`);

    for (const jobDoc of jobsSnap.docs) {
      const job = jobDoc.data();
      const jobId = jobDoc.id;
      
      console.log(`Processing job ${jobId} for category: ${job.category}`);
      
      try {
        // Update job to in-progress
        await updateDoc(doc(db, "jobs", jobId), { 
          status: "processing",
          startedAt: new Date().toISOString()
        });
        
        // 1. Retrieve data based on category
        console.log(`Retrieving ${job.category} data for: ${job.query}`);
        const rawData = await retrieveData(job.category, job.query, job.userId);
        
        if (!rawData || rawData.length === 0) {
          console.log(`No data found for ${job.category}`);
          await updateDoc(doc(db, "jobs", jobId), { 
            status: "complete",
            error: "No data found",
            completedAt: new Date().toISOString()
          });
          continue;
        }
        
        // 2. Run AI analysis
        console.log(`Analyzing data for ${job.category}`);
        const analysis = await analyzeData(rawData, job.category);
        
        // 3. Store results in Firestore
        console.log(`Saving analysis results for ${job.category}`);
        await addDoc(collection(db, "analysisResults"), {
          userId: job.userId,
          jobId: jobId,
          category: job.category,
          analysis: analysis,
          createdAt: new Date().toISOString()
        });
        
        // 4. Update job status
        await updateDoc(doc(db, "jobs", jobId), { 
          status: "complete",
          completedAt: new Date().toISOString()
        });
        
        processed++;
      } catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        
        // Update job with error information
        await updateDoc(doc(db, "jobs", jobId), { 
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date().toISOString()
        });
        
        errors++;
      }
    }
    
    return NextResponse.json({
      success: true,
      processedCount: processed,
      errorCount: errors,
      totalJobs: jobsSnap.size
    });
  } catch (error) {
    console.error("Error processing jobs:", error);
    return NextResponse.json({ error: "Job processing failed" }, { status: 500 });
  }
}
