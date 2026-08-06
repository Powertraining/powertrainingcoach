// To handle data persistance agnostically of firestore
import {
  createDefaultUserData,
  getUserData,
  saveUserData,
} from "./dbService";
import {
  createDefaultForumComposer,
  createDefaultForumFilters,
} from "./forumModel";
import {
  parseGeneratedTrainingPlan,
  parsePersistedTrainingPlan,
  sanitizeTrainingPlanForQuestionnaire,
} from "../utils/trainingPlan.js";
import { requiresEmailVerification } from "../utils/emailVerification.js";
import { reload } from "../config/firebaseSdk";
import {
  buildClientPersistableUserData,
  isSameAuthenticatedUser,
} from "../utils/userPersistence.js";
import {
  applySimplePersistedFields,
  getSimplePersistedFieldValues,
  resetSimplePersistedFields,
} from "../utils/persistedFields.js";
import { hasActiveSubscriptionEntitlement } from "../utils/subscriptionState.js";

// To subscribe to the login/logout event
import {
  logout,
  subscribeToAuthChanges,
  syncUserEmailVerificationStatus,
} from "./authService";

export function connectToPersistance(model, sideEffectWatcherFunction) {
  model.ready = false;
  let authRequestSequence = 0;

  function normalizePersistedTrainingPlanHistory(value = [], questionnaire = {}) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((entry = {}) => {
        if (!entry?.plan) {
          return null;
        }

        try {
          return {
            ...entry,
            plan: sanitizeTrainingPlanForQuestionnaire(
              parseGeneratedTrainingPlan(entry.plan),
              questionnaire
            ),
            completedDays: Array.isArray(entry.completedDays)
              ? entry.completedDays
              : [],
            createdAt:
              typeof entry.createdAt === "string" ? entry.createdAt : "",
            archivedAt:
              typeof entry.archivedAt === "string" ? entry.archivedAt : "",
          };
        } catch (error) {
          console.warn(
            "[firebaseModel.applyPersistedUserData] Ignoring invalid archived training plan:",
            error
          );
          return null;
        }
      })
      .filter(Boolean);
  }

  function applyPersistedUserData(data) {
    const persistedData = {
      ...createDefaultUserData(),
      ...(data || {}),
    };
    const normalizedSubscriptionEndDate =
      persistedData.subscriptionEndDate ?? null;
    const hasActiveSubscription = hasActiveSubscriptionEntitlement({
      active: persistedData.subscription,
      endDate: normalizedSubscriptionEndDate,
    });

    if (typeof model.setQuestionnaire === "function") {
      model.setQuestionnaire(persistedData.questionnaire ?? {});
    } else {
      model.questionnaire = persistedData.questionnaire ?? {};
    }
    if (persistedData.trainingPlan) {
      try {
        model.trainingPlan = parsePersistedTrainingPlan(
          persistedData.trainingPlan
        );
        model.trainingPlan = sanitizeTrainingPlanForQuestionnaire(
          model.trainingPlan,
          model.questionnaire
        );
      } catch (error) {
        console.warn(
          "[firebaseModel.applyPersistedUserData] Ignoring invalid persisted training plan:",
          error
        );
        model.trainingPlan = null;
      }
    } else {
      model.trainingPlan = null;
    }
    model.trainingPlanHistory = normalizePersistedTrainingPlanHistory(
      persistedData.trainingPlanHistory,
      model.questionnaire
    );
    model.planRegenerationUsage = persistedData.planRegenerationUsage ?? null;
    model.subscription = hasActiveSubscription;
    model.subscriptionEndDate = normalizedSubscriptionEndDate;
    model.subscriptionStartDate = persistedData.subscriptionStartDate ?? null;
    model.subscriptionStatus = persistedData.subscriptionStatus ?? "";
    model.stripePriceLookupKey = persistedData.stripePriceLookupKey ?? "";
    const persistedSubscriptionType =
      persistedData.subscriptionType ||
      model.getSubscriptionType?.() ||
      (hasActiveSubscription ? "pro" : "");
    model.subscriptionType = hasActiveSubscription ? persistedSubscriptionType : "";

    // Every other client-owned field (see SIMPLE_PERSISTED_FIELDS) is hydrated
    // here in one pass, so adding a new one of those fields doesn't require
    // touching this function at all.
    applySimplePersistedFields(model, persistedData);

    if (typeof model.resetForumRuntimeState === "function") {
      model.resetForumRuntimeState();
    } else {
      model.forumFilters = createDefaultForumFilters();
      model.forumComposer = createDefaultForumComposer();
      model.forumFeed = [];
      model.forumComments = [];
      model.forumSelectedPost = null;
    }
  }

  function modelDataToCheckACB() {
    // ADD ALL THE DATA THAT IF THEY CHANGE, WE CALL THE SIDE EFFECT FUNCTION.
    // as the user is not in this method, the user document is created when
    // the data there changes. It is better to not include the user as it is
    // already handled by onAuthStateChangedACB
    const data = [
      model.questionnaire,
      model.subscription,
      model.subscriptionEndDate,
      model.subscriptionStartDate,
      model.subscriptionType,
      model.stripePriceLookupKey,
      model.trainingPlan,
      model.trainingPlanHistory,
      ...getSimplePersistedFieldValues(model),
    ];
    return data;
  }

  async function saveToCloudACB() {
    const saveUid = model.user?.uid || "";

    if (saveUid && model.ready) {
      // Client saves only user-owned state. Subscription fields are synced by
      // trusted server functions and are protected by Firestore rules.
      const data = buildClientPersistableUserData(model);
      try {
        if (!isSameAuthenticatedUser(model, saveUid) || !model.ready) {
          console.log(
            "[firebaseModel.saveToCloudACB] Skipping stale save for previous user:",
            saveUid
          );
          return;
        }

        const saveResult = await saveUserData(saveUid, data);
        if (!saveResult.success) {
          throw saveResult.error;
        }
      } catch (error) {
        console.warn('[firebaseModel.saveToCloudACB] Firestore save unavailable, will retry on next change:', error);
      }
    }
  }

  // When the data in modelDataToCheckACB changes, we call saveToCloudACB
  sideEffectWatcherFunction(modelDataToCheckACB, saveToCloudACB, { delay: 700 });

  async function onAuthStateChangedACB(user) {
    const authRequestId = authRequestSequence + 1;
    authRequestSequence = authRequestId;
    const isCurrentAuthRequest = () => authRequestSequence === authRequestId;

    console.log('[firebaseModel.onAuthStateChangedACB] Auth state changed, user:', user?.uid || null);

    model.ready = false;

    if (user && requiresEmailVerification(user)) {
      try {
        await reload(user);
      } catch (error) {
        console.warn(
          "[firebaseModel.onAuthStateChangedACB] Could not refresh unverified user:",
          error
        );
      }

      if (!isCurrentAuthRequest()) {
        return;
      }
    }

    if (user && requiresEmailVerification(user)) {
      console.warn(
        "[firebaseModel.onAuthStateChangedACB] Signing out unverified e-mail/password user."
      );
      model.user = null;
      model.ready = true;
      await logout();
      return;
    }

    if (!isCurrentAuthRequest()) {
      return;
    }

    model.user = user;

    if (user) {
      syncUserEmailVerificationStatus(user).catch((error) => {
        console.warn(
          "[firebaseModel.onAuthStateChangedACB] Could not persist e-mail verification status:",
          error
        );
      });

      try {
        const result = await getUserData(user.uid);

        if (!isCurrentAuthRequest()) {
          return;
        }

        if (!result?.success) {
          console.warn(
            "[firebaseModel.onAuthStateChangedACB] Firestore user data unavailable, using defaults:",
            result?.error
          );
          applyPersistedUserData(createDefaultUserData());
          return;
        }

        if (result.fromCache || result.hasPendingWrites) {
          console.warn(
            "[firebaseModel.onAuthStateChangedACB] Firestore returned cached or unsynced user data:",
            {
              fromCache: result.fromCache,
              hasPendingWrites: result.hasPendingWrites,
            }
          );
        }

        console.log('[firebaseModel.onAuthStateChangedACB] User data loaded from Firestore:', result.data);
        if (result.exists) {
          applyPersistedUserData(result.data);
          console.log('[firebaseModel.onAuthStateChangedACB] ✅ Loaded questionnaire & training plan:', {
            primaryCombatSport: model.primaryCombatSport,
            sessionsPerWeek: model.sessionsPerWeek,
            trainingPlan: model.trainingPlan ? 'exists' : 'null',
            completedDays: model.completedDays?.length || 0,
            trainingPlanBatch: model.trainingPlanBatch,
            completedWeeks: model.completedWeeks,
          });
          console.log('[firebaseModel.onAuthStateChangedACB] ✅ Loaded subscription data from Firestore:', {
            subscription: model.subscription,
            subscriptionEndDate: model.subscriptionEndDate,
            subscriptionStartDate: model.subscriptionStartDate,
            subscriptionType: model.subscriptionType,
            stripePriceLookupKey: model.stripePriceLookupKey
          });
        } else {
          // New user or no document yet - reset to defaults
          const defaultData = createDefaultUserData();
          applyPersistedUserData(defaultData);
          console.log('[firebaseModel.onAuthStateChangedACB] New user, initialized with defaults');

          const saveResult = await saveUserData(user.uid, defaultData);

          if (!isCurrentAuthRequest()) {
            return;
          }

          if (!saveResult.success) {
            console.warn(
              "[firebaseModel.onAuthStateChangedACB] Could not create initial user document:",
              saveResult.error
            );
          }
        }
      } catch (error) {
        if (!isCurrentAuthRequest()) {
          return;
        }

        console.warn('[firebaseModel.onAuthStateChangedACB] Unexpected error loading user data, using defaults:', error);
        applyPersistedUserData(createDefaultUserData());
      } finally {
        if (isCurrentAuthRequest()) {
          model.ready = true;
        }
      }
    } else {
      // logged out -> reset to null
      console.log('[firebaseModel.onAuthStateChangedACB] User logged out, resetting all user data');
      model.questionnaire = null;
      model.trainingPlan = null;
      model.trainingPlanHistory = [];
      // Reset subscription data on logout to prevent it from persisting to next user
      model.subscription = false;
      model.subscriptionEndDate = null;
      model.subscriptionStartDate = null;
      model.subscriptionType = "";
      model.stripePriceLookupKey = "";
      resetSimplePersistedFields(model);
      if (typeof model.resetForumRuntimeState === "function") {
        model.resetForumRuntimeState();
      } else {
        model.forumFilters = createDefaultForumFilters();
        model.forumComposer = createDefaultForumComposer();
        model.forumFeed = [];
        model.forumComments = [];
        model.forumSelectedPost = null;
      }
      model.ready = true;
    }
  }

  // We get the data only when the user connects
  subscribeToAuthChanges(onAuthStateChangedACB);
}

export async function persistModelImmediately(model) {
  const saveUid = model?.user?.uid || "";

  if (!saveUid || !model?.ready) {
    throw new Error("Your Program Maxes could not be saved before leaving this screen.");
  }

  if (!isSameAuthenticatedUser(model, saveUid)) {
    throw new Error("The signed-in user changed before the Program Maxes were saved.");
  }

  const saveResult = await saveUserData(
    saveUid,
    buildClientPersistableUserData(model)
  );

  if (!saveResult?.success) {
    throw saveResult?.error || new Error("Could not save your Program Maxes.");
  }

  if (!isSameAuthenticatedUser(model, saveUid)) {
    throw new Error("The signed-in user changed while the Program Maxes were saving.");
  }

  return saveResult;
}
