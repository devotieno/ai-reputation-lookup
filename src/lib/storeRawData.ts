import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

export async function storeRawData(userId: string, source: string, data: any) {
  try {
    await addDoc(collection(db, "rawData"), {
      userId,
      source,
      data,
      createdAt: new Date().toISOString(),
    });
    console.log(`Stored raw ${source} data for user ${userId}`);
  } catch (error) {
    console.error(`Error storing ${source} data:`, error);
  }
}