import { NextRequest, NextResponse } from "next/server";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { extractFaceEmbeddings } from "@/lib/vision";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { mkdir } from "fs/promises";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/submitUserInput
 * Handles form submission with user input data and photo
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data with file uploads
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const twitter = formData.get("twitter") as string || null;
    const linkedin = formData.get("linkedin") as string || null;
    const reddit = formData.get("reddit") as string || null;
    const youtube = formData.get("youtube") as string || null;
    const instagram = formData.get("instagram") as string || null;
    const github = formData.get("github") as string || null;
    const email = formData.get("email") as string || null;
    const userId = formData.get("userId") as string || null;
    const photo = formData.get("photo") as File || null;

    console.log("Form data received:", { 
      name, twitter, linkedin, reddit, youtube, instagram, github, email, userId, photo: !!photo 
    });

    let photoUrl = null;
    let faceEmbeddings = null;

    // Process photo if it exists
    if (photo) {
      try {
        // Convert file to buffer
        const bytes = await photo.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Extract face embeddings
        faceEmbeddings = await extractFaceEmbeddings(buffer);
        console.log("Face embeddings extracted:", !!faceEmbeddings);
        
        // Upload to Firebase Storage
        if (faceEmbeddings) {
          const storageRef = ref(storage, `photos/${Date.now()}-${photo.name}`);
          await uploadBytes(storageRef, buffer);
          photoUrl = await getDownloadURL(storageRef);
          console.log("Photo uploaded successfully:", photoUrl);
        } else {
          // Save temporarily to disk if Firebase upload fails
          try {
            const filename = uuidv4() + '-' + photo.name;
            const tempDir = join(process.cwd(), 'tmp');
            await mkdir(tempDir, { recursive: true });
            const filepath = join(tempDir, filename);
            await writeFile(filepath, buffer);
            console.log("Photo saved to temp directory:", filepath);
          } catch (tempError) {
            console.error("Error saving photo to temp directory:", tempError);
          }
        }
      } catch (photoError) {
        console.error("Error processing photo:", photoError);
      }
    }

    // Save user input to Firestore
    const userInput = {
      name,
      twitter,
      linkedin,
      reddit,
      youtube,
      instagram,
      github,
      email,
      photoUrl,
      faceEmbeddings,
      userId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "userInputs"), userInput);
    console.log("User input saved with ID:", docRef.id);

    // Queue platform-specific jobs only for platforms where handles are provided
    const jobPromises = [];
    
    if (twitter) {
      console.log("Queuing Twitter job for:", twitter);
      jobPromises.push(
        addDoc(collection(db, "jobs"), {
          userId: docRef.id,
          category: "twitter",
          query: twitter,
          status: "pending",
          createdAt: new Date().toISOString(),
        })
      );
    }
    
    if (reddit) {
      console.log("Queuing Reddit job for:", reddit);
      jobPromises.push(
        addDoc(collection(db, "jobs"), {
          userId: docRef.id,
          category: "reddit", 
          query: reddit,
          status: "pending",
          createdAt: new Date().toISOString(),
        })
      );
    }
    
    if (youtube) {
      console.log("Queuing YouTube job for:", youtube);
      jobPromises.push(
        addDoc(collection(db, "jobs"), {
          userId: docRef.id,
          category: "youtube",
          query: youtube,
          status: "pending",
          createdAt: new Date().toISOString(),
        })
      );
    }
    
    if (linkedin) {
      console.log("Queuing LinkedIn job for:", linkedin);
      jobPromises.push(
        addDoc(collection(db, "jobs"), {
          userId: docRef.id,
          category: "linkedin",
          query: linkedin,
          status: "pending",
          createdAt: new Date().toISOString(),
        })
      );
    }
    
    if (instagram) {
      console.log("Queuing Instagram job for:", instagram);
      jobPromises.push(
        addDoc(collection(db, "jobs"), {
          userId: docRef.id,
          category: "instagram",
          query: instagram,
          status: "pending",
          createdAt: new Date().toISOString(),
        })
      );
    }
    
    if (github) {
      console.log("Queuing GitHub job for:", github);
      jobPromises.push(
        addDoc(collection(db, "jobs"), {
          userId: docRef.id,
          category: "github",
          query: github,
          status: "pending",
          createdAt: new Date().toISOString(),
        })
      );
    }
    
    // Execute all job creations
    if (jobPromises.length > 0) {
      await Promise.all(jobPromises);
      console.log(`Queued ${jobPromises.length} platform-specific jobs`);
    } else {
      console.log("No platform handles provided - no jobs queued");
    }

    // Return the document ID as userId for further processing
    return NextResponse.json({ 
      success: true, 
      userId: docRef.id,
      jobsQueued: jobPromises.length
    });
  } catch (error) {
    console.error("Error in submitUserInput:", error);
    return NextResponse.json({ error: "Failed to process user input" }, { status: 500 });
  }
}
