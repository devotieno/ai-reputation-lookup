import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient();

/**
 * Extract face embeddings from an image using Google Cloud Vision API
 * @param imageBuffer Buffer containing image data
 * @returns Face annotation data including landmarks and attributes
 */
export async function extractFaceEmbeddings(imageBuffer: Buffer) {
  try {
    // For development/testing, return mock embeddings
    if (process.env.USE_MOCK_DATA === "true") {
      return [{
        detectionConfidence: 0.95,
        boundingPoly: { vertices: [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 100, y: 100 }, { x: 10, y: 100 }] },
        landmarks: [],
        rollAngle: 0,
        panAngle: 0,
        tiltAngle: 0,
        joyLikelihood: 'VERY_LIKELY',
        sorrowLikelihood: 'VERY_UNLIKELY',
        angerLikelihood: 'VERY_UNLIKELY',
        surpriseLikelihood: 'VERY_UNLIKELY',
        underExposedLikelihood: 'VERY_UNLIKELY',
        blurredLikelihood: 'VERY_UNLIKELY',
        headwearLikelihood: 'VERY_UNLIKELY',
      }];
    }
    
    const [result] = await client.faceDetection({ image: { content: imageBuffer } });
    if (!result.faceAnnotations || result.faceAnnotations.length === 0) return null;
    
    return result.faceAnnotations.map(face => ({
      boundingPoly: face.boundingPoly,
      detectionConfidence: face.detectionConfidence,
      landmarks: face.landmarks,
      rollAngle: face.rollAngle,
      panAngle: face.panAngle,
      tiltAngle: face.tiltAngle,
      joyLikelihood: face.joyLikelihood,
      sorrowLikelihood: face.sorrowLikelihood,
      angerLikelihood: face.angerLikelihood,
      surpriseLikelihood: face.surpriseLikelihood,
      underExposedLikelihood: face.underExposedLikelihood,
      blurredLikelihood: face.blurredLikelihood,
      headwearLikelihood: face.headwearLikelihood,
    }));
  } catch (error) {
    console.error("Error in face detection:", error);
    return null;
  }
}

/**
 * Calculate similarity score between two face embeddings
 * @param face1 First face embedding
 * @param face2 Second face embedding
 * @returns Similarity score between 0 and 1
 */
export function calculateFaceSimilarity(face1: any, face2: any): number {
  if (!face1 || !face2) return 0;
  
  // Calculate detection confidence similarity
  const confidenceSimilarity = 1 - Math.abs((face1.detectionConfidence || 0) - (face2.detectionConfidence || 0));
  
  // Calculate angle similarities (normalized between 0-1)
  const rollAngleSimilarity = 1 - Math.min(Math.abs((face1.rollAngle || 0) - (face2.rollAngle || 0)) / 180, 1);
  const panAngleSimilarity = 1 - Math.min(Math.abs((face1.panAngle || 0) - (face2.panAngle || 0)) / 180, 1);
  const tiltAngleSimilarity = 1 - Math.min(Math.abs((face1.tiltAngle || 0) - (face2.tiltAngle || 0)) / 180, 1);
  
  // Calculate landmark similarities if available
  let landmarkSimilarity = 0.5; // Default to neutral if no landmarks
  
  if (face1.landmarks && face2.landmarks && face1.landmarks.length > 0 && face2.landmarks.length > 0) {
    // Get matching landmarks
    const matchingLandmarks = face1.landmarks.filter((lm1: {type: string}) => 
      face2.landmarks.some((lm2: {type: string}) => lm2.type === lm1.type)
    );
    
    if (matchingLandmarks.length > 0) {
      let totalDistance = 0;
      
      matchingLandmarks.forEach((lm1: {type: string; position?: {x?: number; y?: number; z?: number}}) => {
        const lm2 = face2.landmarks.find((l: {type: string}) => l.type === lm1.type);
        if (lm1.position && lm2 && lm2.position) {
          // Calculate Euclidean distance between landmark positions
          const dx = (lm1.position.x || 0) - (lm2.position.x || 0);
          const dy = (lm1.position.y || 0) - (lm2.position.y || 0);
          const dz = (lm1.position.z || 0) - (lm2.position.z || 0);
          
          totalDistance += Math.sqrt(dx*dx + dy*dy + dz*dz);
        }
      });
      
      // Average distance normalized to similarity score (inverted)
      const avgDistance = totalDistance / matchingLandmarks.length;
      landmarkSimilarity = 1 / (1 + avgDistance); // Closer to 1 for small distances
    }
  }
  
  // Combine scores (weighted average)
  const weightedScore = 
    (confidenceSimilarity * 0.2) +
    (rollAngleSimilarity * 0.1) +
    (panAngleSimilarity * 0.1) +
    (tiltAngleSimilarity * 0.1) +
    (landmarkSimilarity * 0.5);
  
  return Math.max(0, Math.min(1, weightedScore)); // Clamp between 0-1
}

/**
 * Match a target face against a set of candidate faces
 * @param targetFace Face embedding to match
 * @param candidateFaces Array of face embeddings to match against or a single face embedding
 * @param threshold Minimum similarity score to consider a match (default: 0.7)
 * @returns Array of matches with similarity scores or a boolean if comparing just two faces
 */
export function matchFaces(targetFace: any, candidateFaces: any[] | any, threshold: number = 0.7): {face: any, similarity: number}[] | boolean {
  // Case 1: Simple comparison between two face embeddings
  if (!Array.isArray(candidateFaces)) {
    const embeddingB = candidateFaces;
    if (!targetFace || !embeddingB) return false;

    // Check if detection confidence is high for both
    if (
      targetFace.detectionConfidence > 0.7 &&
      embeddingB.detectionConfidence > 0.7
    ) {
      // Compare basic confidence - for more accuracy, use the similarity calculation
      return calculateFaceSimilarity(targetFace, embeddingB) >= threshold;
    }
    return false;
  }
  
  // Case 2: Match against multiple candidates
  if (!targetFace || !candidateFaces || candidateFaces.length === 0) return [];
  
  return candidateFaces
    .map(face => ({
      face,
      similarity: calculateFaceSimilarity(targetFace, face)
    }))
    .filter(match => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Detect and analyze faces in an image URL
 * @param imageUrl URL of the image to analyze
 * @returns Face annotation data
 */
export async function analyzeFaceFromUrl(imageUrl: string) {
  try {
    // For development/testing, return mock data
    if (process.env.USE_MOCK_DATA === "true") {
      console.log(`[MOCK] Analyzing face from URL: ${imageUrl}`);
      return [{
        detectionConfidence: 0.95,
        boundingPoly: { vertices: [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 100, y: 100 }, { x: 10, y: 100 }] },
        landmarks: [],
        rollAngle: 0,
        panAngle: 0,
        tiltAngle: 0,
        joyLikelihood: 'VERY_LIKELY',
        sorrowLikelihood: 'VERY_UNLIKELY',
        angerLikelihood: 'VERY_UNLIKELY',
        surpriseLikelihood: 'VERY_UNLIKELY',
        underExposedLikelihood: 'VERY_UNLIKELY',
        blurredLikelihood: 'VERY_UNLIKELY',
        headwearLikelihood: 'VERY_UNLIKELY',
      }];
    }
    
    console.log(`Analyzing face from URL: ${imageUrl}`);
    const [result] = await client.faceDetection({ image: { source: { imageUri: imageUrl } } });
    
    if (!result.faceAnnotations || result.faceAnnotations.length === 0) {
      console.log(`No faces detected in: ${imageUrl}`);
      return null;
    }
    
    console.log(`Detected ${result.faceAnnotations.length} faces in: ${imageUrl}`);
    return result.faceAnnotations.map(face => ({
      boundingPoly: face.boundingPoly,
      detectionConfidence: face.detectionConfidence,
      landmarks: face.landmarks,
      rollAngle: face.rollAngle,
      panAngle: face.panAngle,
      tiltAngle: face.tiltAngle,
      joyLikelihood: face.joyLikelihood,
      sorrowLikelihood: face.sorrowLikelihood,
      angerLikelihood: face.angerLikelihood,
      surpriseLikelihood: face.surpriseLikelihood,
      underExposedLikelihood: face.underExposedLikelihood,
      blurredLikelihood: face.blurredLikelihood,
      headwearLikelihood: face.headwearLikelihood,
    }));
  } catch (error) {
    console.error("Error analyzing face from URL:", error);
    return null;
  }
}

/**
 * Match profile photos across multiple platforms using face detection
 * @param targetImageUrl URL of the target image
 * @param candidateImageUrls URLs of potential matches
 * @param threshold Minimum similarity score to consider a match
 * @returns Matches with similarity scores and image URLs
 */
export async function matchProfilePhotos(
  targetImageUrl: string, 
  candidateImageUrls: string[], 
  threshold: number = 0.7
): Promise<Array<{imageUrl: string; similarity: number}>> {
  try {
    // For development/testing, return mock matches
    if (process.env.USE_MOCK_DATA === "true") {
      console.log(`[MOCK] Matching profile photos: ${targetImageUrl} against ${candidateImageUrls.length} candidates`);
      return candidateImageUrls.map((url, index) => ({
        imageUrl: url,
        similarity: 0.9 - (index * 0.1) // Mock decreasing similarity scores
      })).filter(match => match.similarity >= threshold);
    }
    
    console.log(`Matching profile photo across ${candidateImageUrls.length} candidates`);
    
    // Extract face from target image
    const targetFaces = await analyzeFaceFromUrl(targetImageUrl);
    if (!targetFaces || targetFaces.length === 0) {
      console.log("No faces detected in target image");
      return [];
    }
    
    const targetFace = targetFaces[0]; // Use primary face in target image
    
    // Process each candidate image
    const matchPromises = candidateImageUrls.map(async (imageUrl) => {
      try {
        const candidateFaces = await analyzeFaceFromUrl(imageUrl);
        if (!candidateFaces || candidateFaces.length === 0) return null;
        
        // Calculate best match among all detected faces in this image
        const faceMatches = candidateFaces
          .map(face => ({ 
            face, 
            similarity: calculateFaceSimilarity(targetFace, face)
          }));
        
        const bestMatch = faceMatches.length > 0 
          ? faceMatches.reduce((best, current) => 
              current.similarity > best.similarity ? current : best
            )
          : { face: null, similarity: 0 };
        
        return {
          imageUrl,
          similarity: bestMatch.similarity
        };
      } catch (error) {
        console.error(`Error processing candidate image ${imageUrl}:`, error);
        return null;
      }
    });
    
    // Wait for all matching to complete
    const results = await Promise.all(matchPromises);
    
    // Filter valid results above threshold and sort by similarity
    return results
      .filter((result): result is {imageUrl: string; similarity: number} => 
        result !== null && result.similarity >= threshold
      )
      .sort((a, b) => b.similarity - a.similarity);
  } catch (error) {
    console.error("Error matching profile photos:", error);
    return [];
  }
}