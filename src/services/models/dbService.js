import {
  FIRESTORE_DATABASE_ID,
  auth,
  authPersistenceReady,
  db,
  storage,
} from "../config/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getDownloadURL,
  increment,
  limit,
  listAll,
  orderBy,
  query,
  ref,
  serverTimestamp,
  setDoc,
} from "../config/firebaseSdk.js";
import {
  createDefaultForumProfile,
  DEFAULT_FORUM_COMMENT_LIMIT,
  DEFAULT_FORUM_FEED_LIMIT,
} from "./forumModel.js";
import { normalizeAppLogicSettings } from "../../constants/appLogicSettings.js";
import { createDefaultTrainingPerformanceState } from "../utils/trainingPerformance.js";
import { createDefaultStrengthAssessmentState } from "../utils/strengthAssessment.js";
import { createDefaultTrainingCheckInState } from "../utils/trainingCheckIn.js";

const COLLECTION_NAME = "combatModel";
const FEEDBACK_COLLECTION = "feedbacks";
const FORUM_POSTS_COLLECTION = "forumPosts";
const FORUM_COMMENTS_SUBCOLLECTION = "comments";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function getCombatModelDocPath(uid) {
  return `${COLLECTION_NAME}/${uid}`;
}

function getForumPostDocPath(postId) {
  return `${FORUM_POSTS_COLLECTION}/${postId}`;
}

function getFirebaseProjectId() {
  return db?.app?.options?.projectId || "unknown-project";
}

function getFirestoreDatabaseId() {
  return FIRESTORE_DATABASE_ID || "(default)";
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
    questionnaire: normalizeAppLogicSettings({}),
    primaryCombatSport: "",
    sessionsPerWeek: 3,
    trainingPlan: null,
    completedDays: [],
    trainingPlanBatch: 1,
    completedWeeks: 0,
    subscription: false,
    subscriptionEndDate: null,
    trainingPerformanceState: createDefaultTrainingPerformanceState(),
    strengthAssessmentState: createDefaultStrengthAssessmentState(),
    trainingCheckInState: createDefaultTrainingCheckInState(),
    forumProfile: createDefaultForumProfile(),
  };
}

async function listFilesRecursively(storageRef) {
  const { items, prefixes } = await listAll(storageRef);
  const nestedFiles = await Promise.all(prefixes.map(listFilesRecursively));
  return [...items, ...nestedFiles.flat()];
}

async function waitForAuthHydration() {
  try {
    await authPersistenceReady;

    if (typeof auth?.authStateReady === "function") {
      await auth.authStateReady();
    }
  } catch (error) {
    console.info(
      "[dbService.waitForAuthHydration] Auth hydration was not ready before reading Storage; continuing with bundled instruction defaults.",
      error
    );
  }
}

function isStoragePermissionError(error) {
  return (
    error?.code === "storage/unauthorized" ||
    error?.code === "storage/unauthenticated"
  );
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

// Forum Management
export async function getForumPosts({
  limitCount = DEFAULT_FORUM_FEED_LIMIT,
} = {}) {
  try {
    const postsQuery = query(
      collection(db, FORUM_POSTS_COLLECTION),
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );
    const forumPostsSnapshot = await getDocs(postsQuery);

    return {
      success: true,
      data: forumPostsSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...snapshot.data(),
      })),
      error: null,
    };
  } catch (error) {
    console.error("DB forum posts error:", error);
    return { success: false, data: [], error };
  }
}

export async function getForumPost(postId) {
  try {
    const postReference = doc(db, FORUM_POSTS_COLLECTION, postId);
    const forumPostSnapshot = await getDoc(postReference);

    if (!forumPostSnapshot.exists()) {
      return { success: false, data: null, error: "forum/post-not-found" };
    }

    return {
      success: true,
      data: {
        id: forumPostSnapshot.id,
        ...forumPostSnapshot.data(),
      },
      error: null,
    };
  } catch (error) {
    console.error("DB forum post error:", error);
    return { success: false, data: null, error };
  }
}

export async function createForumPost(postData) {
  try {
    const postReference = doc(collection(db, FORUM_POSTS_COLLECTION));
    const timestamp = serverTimestamp();
    await setDoc(
      postReference,
      {
        ...postData,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    const now = new Date().toISOString();

    return {
      success: true,
      data: {
        id: postReference.id,
        ...postData,
        createdAt: now,
        updatedAt: now,
      },
      error: null,
    };
  } catch (error) {
    console.error("DB create forum post error:", error);
    return { success: false, data: null, error };
  }
}

export async function getForumComments(
  postId,
  { limitCount = DEFAULT_FORUM_COMMENT_LIMIT } = {}
) {
  try {
    const commentsQuery = query(
      collection(
        db,
        FORUM_POSTS_COLLECTION,
        postId,
        FORUM_COMMENTS_SUBCOLLECTION
      ),
      orderBy("createdAt", "asc"),
      limit(limitCount)
    );
    const forumCommentsSnapshot = await getDocs(commentsQuery);

    return {
      success: true,
      data: forumCommentsSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        postId,
        ...snapshot.data(),
      })),
      error: null,
    };
  } catch (error) {
    console.error("DB forum comments error:", error);
    return { success: false, data: [], error };
  }
}

export async function createForumComment(postId, commentData) {
  try {
    const commentReference = doc(
      collection(
        db,
        FORUM_POSTS_COLLECTION,
        postId,
        FORUM_COMMENTS_SUBCOLLECTION
      )
    );
    const timestamp = serverTimestamp();

    await setDoc(
      commentReference,
      {
        ...commentData,
        postId,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    await setDoc(
      doc(db, FORUM_POSTS_COLLECTION, postId),
      {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
        ...(commentData.isCoachVerified ?
          { coachResponseStatus: "responded" } :
          {}),
      },
      { merge: true }
    );

    const now = new Date().toISOString();

    return {
      success: true,
      data: {
        id: commentReference.id,
        postId,
        ...commentData,
        createdAt: now,
        updatedAt: now,
      },
      error: null,
    };
  } catch (error) {
    console.error("DB create forum comment error:", error);
    return { success: false, data: null, error };
  }
}

async function updateForumPostCounters(postId, patch) {
  await setDoc(
    doc(db, FORUM_POSTS_COLLECTION, postId),
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function incrementForumPostLikes(postId, delta) {
  try {
    await updateForumPostCounters(postId, {
      likesCount: increment(delta),
    });
    return { success: true, error: null };
  } catch (error) {
    console.error(
      `[dbService.incrementForumPostLikes] Could not update ${getForumPostDocPath(postId)}:`,
      error
    );
    return { success: false, error };
  }
}

export async function incrementForumPostSaves(postId, delta) {
  try {
    await updateForumPostCounters(postId, {
      savesCount: increment(delta),
    });
    return { success: true, error: null };
  } catch (error) {
    console.error(
      `[dbService.incrementForumPostSaves] Could not update ${getForumPostDocPath(postId)}:`,
      error
    );
    return { success: false, error };
  }
}

// Get live instructions (prompts) from Firebase Storage
export async function getLiveInstructions() {
  try {
    await waitForAuthHydration();

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
    if (isStoragePermissionError(error)) {
      console.info(
        "[dbService.getLiveInstructions] Firebase Storage instructions are unavailable for this session; using bundled defaults instead.",
        { code: error?.code || null }
      );
      return null;
    }

    console.error("Error fetching live instructions:", error);
    return null;
  }
}
