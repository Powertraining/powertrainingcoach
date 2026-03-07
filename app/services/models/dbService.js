import { doc, getDoc, setDoc, addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

const COLLECTION_NAME = "combatModel";
const FEEDBACK_COLLECTION = "feedbacks";

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

// Get live instructions (Prompts) from Firestore
export async function getLiveInstructions() {
  try {
    const instructionsCol = collection(db, "instructions");
    const snapshot = await getDocs(instructionsCol);
    
    const instructionsMap = {};
    
    function extractInstructionCB(doc) {
      // id = name of the file (ex: general_rules), data().content = the text
      instructionsMap[doc.id] = doc.data().content;
    }
    
    snapshot.forEach(extractInstructionCB);
    
    if (Object.keys(instructionsMap).length === 0) return null;
    
    return instructionsMap;
  } catch (error) {
    console.error("Error fetching live instructions:", error);
    return null; 
  }
}

