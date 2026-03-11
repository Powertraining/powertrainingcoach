import { auth } from "../config/firebase";
import { db } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// To connect with google
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const provider = new GoogleAuthProvider();

// Role types
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
};

export async function loginWithEmailPassword(email, password) {
  try {
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
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update the user's displayName with the provided username
    await updateProfile(userCredential.user, { displayName: username });

    // Store user role in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: email,
      displayName: username,
      role: role,
      createdAt: new Date(),
    });

    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function logout() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

export async function loginWithGoogle() {
  try {
    const userCredential = await signInWithPopup(auth, provider);

    // Check if user exists in Firestore, if not create entry
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        role: USER_ROLES.USER,
        createdAt: new Date(),
      });
    }

    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.code };
  }
}

// In order to wrap onAuthStateChanged
export function subscribeToAuthChanges(functionACB) {
  return onAuthStateChanged(auth, functionACB);
}

// Get user role from Firestore
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
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
    await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.code };
  }
}
