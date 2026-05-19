import { auth, authPersistenceReady } from "../config/firebase";
import { db } from "../config/firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  doc,
  getDoc,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithCredential,
  signOut,
  setDoc,
  updateProfile,
} from "../config/firebaseSdk.js";
import { clearGoogleCredentialState } from "../auth/googleIdentity";
import { createDefaultUserData, saveUserData } from "./dbService.js";
import {
  assertSafeFirestoreDocumentId,
  normalizeBoundedString,
} from "../utils/inputValidation.js";

// Role types
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

const BOOTSTRAP_WAIT_MS = 3000;

async function ensureAuthPersistenceReady() {
  await authPersistenceReady;
}

function persistUserBootstrapData(user, role = USER_ROLES.USER) {
  const safeUid = assertSafeFirestoreDocumentId(user.uid, "uid");
  const safeRole = Object.values(USER_ROLES).includes(role) ?
    role :
    USER_ROLES.USER;
  const createdAt = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime)
    : new Date();

  const profilePromise = setDoc(
    doc(db, "users", safeUid),
    {
      uid: safeUid,
      email: normalizeBoundedString(user.email, 254),
      displayName: normalizeBoundedString(user.displayName, 60),
      role: safeRole,
      createdAt,
    },
    { merge: true },
  );

  const combatModelPromise = saveUserData(
    safeUid,
    createDefaultUserData()
  ).then((result) => {
    if (!result.success) {
      throw (
        result.error ||
        new Error(
          "Could not create initial combatModel document during auth bootstrap."
        )
      );
    }
  });

  return Promise.all([profilePromise, combatModelPromise]);
}

async function ensureBootstrapDataEventually(user, role = USER_ROLES.USER) {
  let timeoutId;

  const bootstrapPromise = persistUserBootstrapData(user, role)
    .catch((error) => {
      console.warn("Could not fully persist user bootstrap data:", error);
    })
    .finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });

  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(
        `Timed out after ${BOOTSTRAP_WAIT_MS}ms waiting for Firestore bootstrap writes for user ${user.uid}.`
      );
      resolve();
    }, BOOTSTRAP_WAIT_MS);
  });

  await Promise.race([bootstrapPromise, timeoutPromise]);
}

export async function loginWithEmailPassword(email, password) {
  try {
    await ensureAuthPersistenceReady();
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function registerWithEmailPassword(
  username,
  email,
  password,
  role = USER_ROLES.USER
) {
  try {
    await ensureAuthPersistenceReady();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update the user's displayName with the provided username
    await updateProfile(userCredential.user, {
      displayName: normalizeBoundedString(username, 60),
    });

    await ensureBootstrapDataEventually(
      {
        ...userCredential.user,
        email,
        displayName: username,
      },
      role
    );

    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function logout() {
  try {
    await ensureAuthPersistenceReady();
    await signOut(auth);

    try {
      await clearGoogleCredentialState();
    } catch (error) {
      console.warn("Could not clear native Google credential state:", error);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function resetPassword(email) {
  try {
    await ensureAuthPersistenceReady();
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

async function ensureUserDocument(user, role = USER_ROLES.USER) {
  await ensureBootstrapDataEventually(user, role);
}

export async function loginWithGoogle(idToken = null) {
  try {
    await ensureAuthPersistenceReady();

    if (!idToken) {
      throw new Error("missing-google-id-token");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);

    await ensureUserDocument(userCredential.user);

    return { success: true, user: userCredential.user };
  } catch (error) {
    if (error?.message === "missing-google-id-token") {
      return {
        success: false,
        error: "Google sign-in could not be completed on this device.",
      };
    }

    return {
      success: false,
      error: error?.code || error?.message || "auth/google-sign-in-failed",
    };
  }
}

// In order to wrap onAuthStateChanged
export function subscribeToAuthChanges(functionACB) {
  let isActive = true;
  let unsubscribe = () => {};

  const attachListener = async () => {
    if (!isActive) {
      return;
    }

    await ensureAuthPersistenceReady();
    unsubscribe = onAuthStateChanged(auth, functionACB);
  };

  const authReadyPromise =
    typeof auth.authStateReady === "function" ?
      auth.authStateReady() :
      Promise.resolve();

  authReadyPromise
    .catch((error) => {
      console.warn(
        "Firebase auth hydration failed, attaching auth listener anyway:",
        error
      );
    })
    .finally(() => {
      attachListener().catch((error) => {
        console.warn("Could not attach Firebase auth listener:", error);
      });
    });

  return () => {
    isActive = false;
    unsubscribe();
  };
}

// Get user role from Firestore
export async function getUserRole(uid) {
  try {
    const safeUid = assertSafeFirestoreDocumentId(uid, "uid");
    const userDoc = await getDoc(doc(db, "users", safeUid));
    if (userDoc.exists()) {
      return userDoc.data().role;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

// Check if user is admin
export async function isUserAdmin(uid) {
  const role = await getUserRole(uid);
  return role === USER_ROLES.ADMIN;
}

// Update user role (admin only)
export async function updateUserRole(uid, newRole) {
  try {
    const safeUid = assertSafeFirestoreDocumentId(uid, "uid");
    const safeRole = Object.values(USER_ROLES).includes(newRole) ?
      newRole :
      USER_ROLES.USER;
    await setDoc(doc(db, "users", safeUid), { role: safeRole }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}
