import { auth, authPersistenceReady } from "../config/firebase";
import { db } from "../config/firebase";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  doc,
  getDoc,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
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
  getPasswordValidationError,
  normalizeBoundedString,
} from "../utils/inputValidation.js";
import { requiresEmailVerification } from "../utils/emailVerification.js";

// Role types
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

const BOOTSTRAP_WAIT_MS = 3000;
// Keep auth failures generic so the UI does not disclose which account states exist.
export const GENERIC_LOGIN_ERROR = "auth/invalid-login";
export const GENERIC_SIGNUP_ERROR = "auth/signup-unavailable";

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
      emailVerified: user.emailVerified === true,
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

export async function syncUserEmailVerificationStatus(user) {
  if (!user?.uid) {
    return;
  }

  const safeUid = assertSafeFirestoreDocumentId(user.uid, "uid");
  await setDoc(
    doc(db, "users", safeUid),
    {
      email: normalizeBoundedString(user.email, 254),
      emailVerified: user.emailVerified === true,
    },
    { merge: true },
  );
}

async function refreshUser(user) {
  try {
    await reload(user);
  } catch (error) {
    console.warn("Could not refresh Firebase user verification status:", error);
  }

  return auth.currentUser || user;
}

async function sendVerificationEmail(user) {
  await sendEmailVerification(user);
}

async function signOutIfCurrentUser(user) {
  if (auth.currentUser?.uid === user?.uid) {
    await signOut(auth);
  }
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
    const refreshedUser = await refreshUser(userCredential.user);

    if (requiresEmailVerification(refreshedUser)) {
      await signOutIfCurrentUser(refreshedUser);
      return { success: false, error: GENERIC_LOGIN_ERROR };
    }

    await syncUserEmailVerificationStatus(refreshedUser).catch((error) => {
      console.warn("Could not persist e-mail verification status:", error);
    });

    return { success: true, user: refreshedUser };
  } catch (error) {
    return { success: false, error: GENERIC_LOGIN_ERROR };
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
    const passwordValidationError = getPasswordValidationError(password);

    if (passwordValidationError) {
      return { success: false, error: passwordValidationError };
    }

    const safeUsername = normalizeBoundedString(username, 60);

    if (!safeUsername) {
      return { success: false, error: "Username is required." };
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update the user's displayName with the provided username
    await updateProfile(userCredential.user, {
      displayName: safeUsername,
    });

    await ensureBootstrapDataEventually(
      {
        ...userCredential.user,
        email,
        displayName: safeUsername,
      },
      role
    );

    let verificationEmailSent = false;
    let verificationEmailError = null;

    try {
      await sendVerificationEmail(userCredential.user);
      verificationEmailSent = true;
    } catch (error) {
      console.warn("Could not send verification e-mail:", error);
      verificationEmailError = error?.code || error?.message || "unknown";
    }

    await signOutIfCurrentUser(userCredential.user);

    return {
      success: true,
      user: userCredential.user,
      requiresEmailVerification: true,
      verificationEmailSent,
      verificationEmailError,
    };
  } catch (error) {
    if (error?.code === "auth/email-already-in-use") {
      return {
        success: true,
        requiresEmailVerification: true,
        verificationEmailSent: true,
        genericAccepted: true,
      };
    }

    if (
      error?.code === "auth/invalid-email" ||
      error?.code === "auth/missing-email"
    ) {
      return { success: false, error: "Enter a valid e-mail address." };
    }

    return { success: false, error: GENERIC_SIGNUP_ERROR };
  }
}

export async function resendEmailVerification(email, password) {
  let signedInUser = null;

  try {
    await ensureAuthPersistenceReady();
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    signedInUser = await refreshUser(userCredential.user);

    if (!requiresEmailVerification(signedInUser)) {
      await syncUserEmailVerificationStatus(signedInUser).catch((error) => {
        console.warn("Could not persist e-mail verification status:", error);
      });

      return { success: true, alreadyVerified: true };
    }

    await sendVerificationEmail(signedInUser);
    return { success: true, alreadyVerified: false };
  } catch {
    console.warn("Could not complete verification resend request.");
    return { success: true, genericAccepted: true };
  } finally {
    if (signedInUser) {
      await signOutIfCurrentUser(signedInUser).catch((error) => {
        console.warn("Could not sign out after verification resend:", error);
      });
    }
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
