import { db, storage } from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDownloadURL,
  listAll,
  ref,
  setDoc,
} from "../config/firebaseSdk.js";

const COLLECTION_NAME = "combatModel";
const FEEDBACK_COLLECTION = "feedbacks";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

async function listFilesRecursively(storageRef) {
  const { items, prefixes } = await listAll(storageRef);
  const nestedFiles = await Promise.all(prefixes.map(listFilesRecursively));
  return [...items, ...nestedFiles.flat()];
}

// User Data Management
export async function getUserData(uid) {
  try {
    const docReference = doc(db, COLLECTION_NAME, uid);
    const cloudDataSnapshot = await getDoc(docReference);
    if (cloudDataSnapshot.exists()) {
      return { exists: true, data: cloudDataSnapshot.data() };
    } else {
      return { exists: false, data: null };
    }
  } catch (error) {
    console.error("DB get error:", error);
  }
}

export async function saveUserData(uid, dataToSave) {
  try {
    const docReference = doc(db, COLLECTION_NAME, uid);
    await setDoc(docReference, dataToSave, { merge: true });
  } catch (error) {
    console.error("DB set error:", error);
  }
}

// Feedback Management
export async function saveFeedback(feedbackData) {
  try {
    await addDoc(collection(db, FEEDBACK_COLLECTION), feedbackData);
    return { success: true };
  } catch (error) {
    console.error("DB feedback error:", error);
    return { success: false, error: error.message };
  }
}

// API Config and Instructions Management

// Get API configuration from Firestore
export async function getApiConfig() {
  try {
    const docRef = doc(db, "config", "secrets");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data(); // return { openai_key: "..." }
    } else {
      console.warn("No API config found in DB.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching API config:", error);
    return null;
  }
}

// Get live instructions (Prompts) from Firebase Storage
export async function getLiveInstructions() {
  try {
    const instructionsRef = ref(storage, "instructions");
    const files = await listFilesRecursively(instructionsRef);

    const markdownFiles = files
      .filter((itemRef) => itemRef.name.toLowerCase().endsWith(".md"))
      .sort((left, right) => left.name.localeCompare(right.name));

    const imageFiles = files
      .filter((itemRef) => IMAGE_EXTENSIONS.some((extension) => itemRef.name.toLowerCase().endsWith(extension)))
      .sort((left, right) => left.fullPath.localeCompare(right.fullPath));

    const instructionEntries = await Promise.all(
      markdownFiles.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch instruction file: ${itemRef.name}`);
        }

        const content = await response.text();
        const key = itemRef.name.replace(/\.md$/i, "");

        return [key, content];
      })
    );

    const instructionsMap = Object.fromEntries(instructionEntries);
    const instructionImages = await Promise.all(
      imageFiles.map(async (itemRef) => ({
        name: itemRef.name,
        path: itemRef.fullPath,
        url: await getDownloadURL(itemRef)
      }))
    );

    if (instructionImages.length > 0) {
      instructionsMap.__images = instructionImages;
    }

    if (Object.keys(instructionsMap).length === 0) return null;

    return instructionsMap;
  } catch (error) {
    console.error("Error fetching live instructions:", error);
    return null;
  }
}
