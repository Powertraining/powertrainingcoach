import { Platform } from "react-native";
import {
  FIRESTORE_DATABASE_ID,
  auth,
  db,
  storage,
} from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDownloadURL,
  listAll,
  ref,
  serverTimestamp,
  setDoc,
} from "../config/firebaseSdk.js";

const COLLECTION_NAME = "combatModel";
const FEEDBACK_COLLECTION = "feedbacks";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function getCombatModelDocPath(uid) {
  return `${COLLECTION_NAME}/${uid}`;
}

function getFirebaseProjectId() {
  return db?.app?.options?.projectId || "unknown-project";
}

function getFirestoreDatabaseId() {
  return FIRESTORE_DATABASE_ID || "default";
}

function shouldUseFirestoreRestFallback() {
  // Disabled while we validate the supported Firebase SDK path again.
  return false;
}

function getFirestoreApiKey() {
  return db?.app?.options?.apiKey || "";
}

function getFirestoreDocumentUrl(collectionName, documentId) {
  const encodedDocumentId = encodeURIComponent(documentId);
  const encodedDatabaseId = encodeURIComponent(getFirestoreDatabaseId());
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${getFirebaseProjectId()}/databases/${encodedDatabaseId}/documents/${collectionName}/${encodedDocumentId}`;
  const apiKey = getFirestoreApiKey();

  return apiKey ? `${baseUrl}?key=${apiKey}` : baseUrl;
}

async function getFirestoreRestHeaders() {
  const idToken = await auth.currentUser?.getIdToken();
  const headers = {
    "Content-Type": "application/json",
  };

  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  return headers;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue),
      },
    };
  }

  if (typeof value === "string") {
    return { stringValue: value };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [
            key,
            toFirestoreValue(nestedValue),
          ])
        ),
      },
    };
  }

  return { stringValue: String(value) };
}

function fromFirestoreValue(value) {
  if (!value || "nullValue" in value) {
    return null;
  }

  if ("stringValue" in value) {
    return value.stringValue;
  }

  if ("booleanValue" in value) {
    return value.booleanValue;
  }

  if ("integerValue" in value) {
    return Number(value.integerValue);
  }

  if ("doubleValue" in value) {
    return value.doubleValue;
  }

  if ("timestampValue" in value) {
    return value.timestampValue;
  }

  if ("arrayValue" in value) {
    return (value.arrayValue?.values || []).map(fromFirestoreValue);
  }

  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue?.fields || {}).map(([key, nestedValue]) => [
        key,
        fromFirestoreValue(nestedValue),
      ])
    );
  }

  return null;
}

function toFirestoreFields(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, toFirestoreValue(value)])
  );
}

function fromFirestoreFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)])
  );
}

async function getUserDataViaRest(uid) {
  const docPath = getCombatModelDocPath(uid);
  const url = getFirestoreDocumentUrl(COLLECTION_NAME, uid);

    console.log(
      `[dbService.getUserData] Using REST fallback for ${docPath} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
  );

  const response = await fetch(url, {
    method: "GET",
    headers: await getFirestoreRestHeaders(),
  });

  if (response.status === 404) {
    return {
      success: true,
      exists: false,
      data: null,
      fromCache: false,
      hasPendingWrites: false,
      error: null,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Firestore REST get failed (${response.status}): ${await response.text()}`
    );
  }

  const documentData = await response.json();

  console.log(
    `[dbService.getUserData] REST read succeeded for ${docPath} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
  );

  return {
    success: true,
    exists: true,
    data: fromFirestoreFields(documentData.fields || {}),
    fromCache: false,
    hasPendingWrites: false,
    error: null,
  };
}

async function saveUserDataViaRest(uid, dataToSave) {
  const docPath = getCombatModelDocPath(uid);
  const url = getFirestoreDocumentUrl(COLLECTION_NAME, uid);

  console.log(
    `[dbService.saveUserData] Using REST fallback for ${docPath} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
  );

  const response = await fetch(url, {
    method: "PATCH",
    headers: await getFirestoreRestHeaders(),
    body: JSON.stringify({
      fields: toFirestoreFields({
        ...dataToSave,
        updatedAt: new Date().toISOString(),
      }),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Firestore REST save failed (${response.status}): ${await response.text()}`
    );
  }

  console.log(
    `[dbService.saveUserData] REST save succeeded for ${docPath} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
  );

  return { success: true, error: null };
}

export function createDefaultUserData() {
  return {
    questionnaire: {},
    primaryCombatSport: "",
    sessionsPerWeek: 3,
    trainingPlan: null,
    completedDays: [],
    trainingPlanBatch: 1,
    completedWeeks: 0,
    subscription: false,
    subscriptionEndDate: null,
  };
}

async function listFilesRecursively(storageRef) {
  const { items, prefixes } = await listAll(storageRef);
  const nestedFiles = await Promise.all(prefixes.map(listFilesRecursively));
  return [...items, ...nestedFiles.flat()];
}

// User Data Management
export async function getUserData(uid) {
  if (shouldUseFirestoreRestFallback()) {
    return getUserDataViaRest(uid);
  }

  try {
    const docReference = doc(db, COLLECTION_NAME, uid);
    console.log(
      `[dbService.getUserData] Reading ${getCombatModelDocPath(uid)} from Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
    );
    const cloudDataSnapshot = await getDoc(docReference);
    const fromCache = cloudDataSnapshot.metadata?.fromCache ?? false;
    const hasPendingWrites = cloudDataSnapshot.metadata?.hasPendingWrites ?? false;

    console.log(
      `[dbService.getUserData] Snapshot metadata for ${getCombatModelDocPath(uid)}:`,
      { fromCache, hasPendingWrites }
    );

    if (cloudDataSnapshot.exists()) {
      return {
        success: true,
        exists: true,
        data: cloudDataSnapshot.data(),
        fromCache,
        hasPendingWrites,
        error: null,
      };
    } else {
      return {
        success: true,
        exists: false,
        data: null,
        fromCache,
        hasPendingWrites,
        error: null,
      };
    }
  } catch (error) {
    console.warn("DB get warning:", error);
    return {
      success: false,
      exists: false,
      data: null,
      error,
    };
  }
}

export async function saveUserData(uid, dataToSave) {
  if (shouldUseFirestoreRestFallback()) {
    return saveUserDataViaRest(uid, dataToSave);
  }

  try {
    const docReference = doc(db, COLLECTION_NAME, uid);
    console.log(
      `[dbService.saveUserData] Writing ${getCombatModelDocPath(uid)} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
    );
    await setDoc(
      docReference,
      {
        ...dataToSave,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(
      `[dbService.saveUserData] Saved ${getCombatModelDocPath(uid)} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
    );
    return { success: true, error: null };
  } catch (error) {
    console.warn("DB set warning:", error);
    return { success: false, error };
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

// Get live instructions (prompts) from Firebase Storage
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
