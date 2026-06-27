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
  deleteDoc,
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
} from "../config/firebaseSdk";
import {
  createDefaultForumProfile,
  DEFAULT_FORUM_COMMENT_LIMIT,
  DEFAULT_FORUM_FEED_LIMIT,
  MAX_FORUM_COMMENT_REPLY_DEPTH,
} from "./forumModel.js";
import { normalizeAppLogicSettings } from "../../constants/appLogicSettings.js";
import { sanitizeFirestoreData } from "../utils/firestoreData.js";
import {
  assertSafeFirestoreDocumentId,
  normalizeBoundedString,
  normalizeInteger,
} from "../utils/inputValidation.js";
import { createDefaultTrainingPerformanceState } from "../utils/trainingPerformance.js";
import { createDefaultStrengthAssessmentState } from "../utils/strengthAssessment.js";
import { createDefaultTrainingCheckInState } from "../utils/trainingCheckIn.js";

const COLLECTION_NAME = "combatModel";
const FEEDBACK_COLLECTION = "feedbacks";
const FORUM_POSTS_COLLECTION = "forumPosts";
const FORUM_COMMENTS_SUBCOLLECTION = "comments";
const FORUM_COMMENT_REPLIES_SUBCOLLECTION = "replies";
const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

function getCombatModelDocPath(uid) {
  return `${COLLECTION_NAME}/${assertSafeFirestoreDocumentId(uid, "uid")}`;
}

function getForumPostDocPath(postId) {
  return `${FORUM_POSTS_COLLECTION}/${assertSafeFirestoreDocumentId(postId, "postId")}`;
}

function getForumCommentDocPath(postId, pathSegments = []) {
  return [
    FORUM_POSTS_COLLECTION,
    postId,
    FORUM_COMMENTS_SUBCOLLECTION,
    ...pathSegments,
  ].join("/");
}

function getForumRepliesCollection(postId, parentPathSegments = []) {
  const safePostId = assertSafeFirestoreDocumentId(postId, "postId");

  if (!Array.isArray(parentPathSegments) || parentPathSegments.length === 0) {
    throw new Error("A valid parent comment path is required to create a reply.");
  }

  const safeParentPathSegments = parentPathSegments.map((segment, index) => {
    if (index % 2 === 1) {
      return segment;
    }

    return assertSafeFirestoreDocumentId(segment, "commentId");
  });

  return collection(
    db,
    FORUM_POSTS_COLLECTION,
    safePostId,
    FORUM_COMMENTS_SUBCOLLECTION,
    ...safeParentPathSegments,
    FORUM_COMMENT_REPLIES_SUBCOLLECTION
  );
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
  const sanitizedDataToSave = sanitizeFirestoreData(dataToSave);

  console.log(
    `[dbService.saveUserData] Using REST fallback for ${docPath} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
  );

  const response = await fetch(url, {
    method: "PATCH",
    headers: await getFirestoreRestHeaders(),
    body: JSON.stringify({
      fields: toFirestoreFields({
        ...sanitizedDataToSave,
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
    trainingPlanHistory: [],
    completedDays: [],
    trainingPlanBatch: 1,
    completedWeeks: 0,
    subscription: false,
    subscriptionEndDate: null,
    subscriptionStartDate: null,
    subscriptionType: "",
    subscriptionStatus: "",
    stripePriceLookupKey: "",
    planRegenerationUsage: null,
    trainingPerformanceState: createDefaultTrainingPerformanceState(),
    strengthAssessmentState: createDefaultStrengthAssessmentState(),
    trainingCheckInState: createDefaultTrainingCheckInState(),
    activeSessionProgressByKey: {},
    completedSessionProgressByKey: {},
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
  const safeUid = assertSafeFirestoreDocumentId(uid, "uid");

  if (shouldUseFirestoreRestFallback()) {
    return getUserDataViaRest(safeUid);
  }

  try {
    const docReference = doc(db, COLLECTION_NAME, safeUid);
    console.log(
      `[dbService.getUserData] Reading ${getCombatModelDocPath(safeUid)} from Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
    );
    const cloudDataSnapshot = await getDoc(docReference);
    const fromCache = cloudDataSnapshot.metadata?.fromCache ?? false;
    const hasPendingWrites = cloudDataSnapshot.metadata?.hasPendingWrites ?? false;

    console.log(
      `[dbService.getUserData] Snapshot metadata for ${getCombatModelDocPath(safeUid)}:`,
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
  const safeUid = assertSafeFirestoreDocumentId(uid, "uid");

  if (shouldUseFirestoreRestFallback()) {
    return saveUserDataViaRest(safeUid, dataToSave);
  }

  try {
    const docReference = doc(db, COLLECTION_NAME, safeUid);
    const sanitizedDataToSave = sanitizeFirestoreData(dataToSave);
    console.log(
      `[dbService.saveUserData] Writing ${getCombatModelDocPath(safeUid)} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
    );
    await setDoc(
      docReference,
      {
        ...sanitizedDataToSave,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(
      `[dbService.saveUserData] Saved ${getCombatModelDocPath(safeUid)} in Firebase project ${getFirebaseProjectId()} / database ${getFirestoreDatabaseId()}`
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
    const rating = normalizeInteger(feedbackData?.rating, {
      fallback: 0,
      min: 1,
      max: 10,
    });

    if (rating < 1) {
      throw new Error("Feedback needs a rating from 1 to 10.");
    }

    const sanitizedFeedbackData = {
      rating,
      comment: normalizeBoundedString(feedbackData?.comment, 2000),
      userId: assertSafeFirestoreDocumentId(feedbackData?.userId, "userId"),
      userEmail: normalizeBoundedString(feedbackData?.userEmail, 254),
      timestamp:
        typeof feedbackData?.timestamp === "string" ?
          normalizeBoundedString(feedbackData.timestamp, 40) :
          new Date().toISOString(),
    };

    await addDoc(collection(db, FEEDBACK_COLLECTION), sanitizedFeedbackData);
    return { success: true };
  } catch (error) {
    console.error("DB feedback error:", error);
    return { success: false, error: error.message };
  }
}

// Forum Management
function assertAuthenticatedForumAccess() {
  if (!auth.currentUser?.uid) {
    throw new Error("You need to be logged in to use the forum.");
  }
}

export async function getForumPosts({
  limitCount = DEFAULT_FORUM_FEED_LIMIT,
} = {}) {
  try {
    assertAuthenticatedForumAccess();

    const postsQuery = query(
      collection(db, FORUM_POSTS_COLLECTION),
      orderBy("updatedAt", "desc"),
      limit(normalizeInteger(limitCount, {
        fallback: DEFAULT_FORUM_FEED_LIMIT,
        min: 1,
        max: 100,
      }))
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
    assertAuthenticatedForumAccess();

    const safePostId = assertSafeFirestoreDocumentId(postId, "postId");
    const postReference = doc(db, FORUM_POSTS_COLLECTION, safePostId);
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
    assertAuthenticatedForumAccess();

    const postReference = doc(collection(db, FORUM_POSTS_COLLECTION));
    const timestamp = serverTimestamp();
    const sanitizedPostData = sanitizeFirestoreData(postData);
    await setDoc(
      postReference,
      {
        ...sanitizedPostData,
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
        ...sanitizedPostData,
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

export async function deleteForumPost(postId) {
  try {
    assertAuthenticatedForumAccess();

    const safePostId = assertSafeFirestoreDocumentId(postId, "postId");
    await deleteDoc(doc(db, FORUM_POSTS_COLLECTION, safePostId));

    return { success: true, error: null };
  } catch (error) {
    console.error(
      `[dbService.deleteForumPost] Could not delete ${getForumPostDocPath(postId)}:`,
      error
    );
    return { success: false, error };
  }
}

export async function getForumComments(
  postId,
  { limitCount = DEFAULT_FORUM_COMMENT_LIMIT } = {}
) {
  try {
    assertAuthenticatedForumAccess();
    const safePostId = assertSafeFirestoreDocumentId(postId, "postId");

    const commentsQuery = query(
      collection(
        db,
        FORUM_POSTS_COLLECTION,
        safePostId,
        FORUM_COMMENTS_SUBCOLLECTION
      ),
      orderBy("createdAt", "asc"),
      limit(normalizeInteger(limitCount, {
        fallback: DEFAULT_FORUM_COMMENT_LIMIT,
        min: 1,
        max: 100,
      }))
    );
    const forumCommentsSnapshot = await getDocs(commentsQuery);

    async function loadForumCommentBranch(
      snapshot,
      {
        currentDocPathSegments = [snapshot.id],
        parentCommentId = "",
        rootCommentId = snapshot.id,
        depth = 0,
      } = {}
    ) {
      let replies = [];

      if (depth < MAX_FORUM_COMMENT_REPLY_DEPTH) {
        const repliesQuery = query(
          collection(
            db,
            FORUM_POSTS_COLLECTION,
            safePostId,
            FORUM_COMMENTS_SUBCOLLECTION,
            ...currentDocPathSegments,
            FORUM_COMMENT_REPLIES_SUBCOLLECTION
          ),
          orderBy("createdAt", "asc")
        );
        const repliesSnapshot = await getDocs(repliesQuery);

        replies = await Promise.all(
          repliesSnapshot.docs.map((replySnapshot) =>
            loadForumCommentBranch(replySnapshot, {
              currentDocPathSegments: [
                ...currentDocPathSegments,
                FORUM_COMMENT_REPLIES_SUBCOLLECTION,
                replySnapshot.id,
              ],
              parentCommentId: snapshot.id,
              rootCommentId,
              depth: depth + 1,
            })
          )
        );
      }

      return {
        id: snapshot.id,
        postId: safePostId,
        ...snapshot.data(),
        parentCommentId,
        rootCommentId,
        depth,
        replies,
        replyCount: replies.length,
      };
    }

    const comments = await Promise.all(
      forumCommentsSnapshot.docs.map((snapshot) => loadForumCommentBranch(snapshot))
    );

    return {
      success: true,
      data: comments,
      error: null,
    };
  } catch (error) {
    console.error("DB forum comments error:", error);
    return { success: false, data: [], error };
  }
}

export async function createForumComment(postId, commentData) {
  try {
    assertAuthenticatedForumAccess();
    const safePostId = assertSafeFirestoreDocumentId(postId, "postId");
    const sanitizedCommentData = sanitizeFirestoreData(commentData);

    const commentReference = doc(
      collection(
        db,
        FORUM_POSTS_COLLECTION,
        safePostId,
        FORUM_COMMENTS_SUBCOLLECTION
      )
    );
    const timestamp = serverTimestamp();

    await setDoc(
      commentReference,
      {
        ...sanitizedCommentData,
        postId: safePostId,
        parentCommentId: "",
        rootCommentId: commentReference.id,
        depth: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    await setDoc(
      doc(db, FORUM_POSTS_COLLECTION, safePostId),
      {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
        ...(sanitizedCommentData.isCoachVerified ?
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
        postId: safePostId,
        ...sanitizedCommentData,
        parentCommentId: "",
        rootCommentId: commentReference.id,
        depth: 0,
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

export async function createForumReply(
  postId,
  replyData,
  {
    parentCommentId = "",
    rootCommentId = "",
    depth = 1,
    parentPathSegments = [],
  } = {}
) {
  try {
    assertAuthenticatedForumAccess();
    const safePostId = assertSafeFirestoreDocumentId(postId, "postId");
    const safeParentCommentId = assertSafeFirestoreDocumentId(
      parentCommentId,
      "parentCommentId"
    );
    const safeRootCommentId = rootCommentId ?
      assertSafeFirestoreDocumentId(rootCommentId, "rootCommentId") :
      safeParentCommentId;
    const sanitizedReplyData = sanitizeFirestoreData(replyData);

    if (
      !Number.isInteger(depth) ||
      depth < 1 ||
      depth > MAX_FORUM_COMMENT_REPLY_DEPTH
    ) {
      throw new Error(
        `Replies cannot go deeper than ${MAX_FORUM_COMMENT_REPLY_DEPTH} levels.`
      );
    }

    const replyReference = doc(
      getForumRepliesCollection(safePostId, parentPathSegments)
    );
    const timestamp = serverTimestamp();

    await setDoc(
      replyReference,
      {
        ...sanitizedReplyData,
        postId: safePostId,
        parentCommentId: safeParentCommentId,
        rootCommentId: safeRootCommentId,
        depth,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      { merge: true }
    );

    await setDoc(
      doc(db, FORUM_POSTS_COLLECTION, safePostId),
      {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
        ...(sanitizedReplyData.isCoachVerified ?
          { coachResponseStatus: "responded" } :
          {}),
      },
      { merge: true }
    );

    const now = new Date().toISOString();

    return {
      success: true,
      data: {
        id: replyReference.id,
        postId: safePostId,
        ...sanitizedReplyData,
        parentCommentId: safeParentCommentId,
        rootCommentId: safeRootCommentId,
        depth,
        createdAt: now,
        updatedAt: now,
      },
      error: null,
    };
  } catch (error) {
    console.error(
      `[dbService.createForumReply] Could not create reply in ${getForumCommentDocPath(postId, parentPathSegments)}:`,
      error
    );
    return { success: false, data: null, error };
  }
}

async function updateForumPostCounters(postId, patch) {
  const safePostId = assertSafeFirestoreDocumentId(postId, "postId");

  await setDoc(
    doc(db, FORUM_POSTS_COLLECTION, safePostId),
    {
      ...patch,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function incrementForumPostLikes(postId, delta) {
  try {
    assertAuthenticatedForumAccess();
    const safeDelta = delta > 0 ? 1 : -1;

    await updateForumPostCounters(postId, {
      likesCount: increment(safeDelta),
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
    assertAuthenticatedForumAccess();
    const safeDelta = delta > 0 ? 1 : -1;

    await updateForumPostCounters(postId, {
      savesCount: increment(safeDelta),
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
