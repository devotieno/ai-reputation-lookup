import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export async function storeAnalysis(userId: string, category: string, analysis: any) {
  await addDoc(collection(db, "analysisResults"), {
    userId,
    category,
    analysis,
    createdAt: new Date().toISOString(),
  });
}