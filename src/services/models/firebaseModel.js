// To handle data persistance agnostically of firestore
import {
  createDefaultUserData,
  getUserData,
  saveUserData,
} from "./dbService";
import {
  createDefaultForumComposer,
  createDefaultForumFilters,
  normalizeForumProfile,
} from "./forumModel";
import {
  parseGeneratedTrainingPlan,
  sanitizeTrainingPlanForQuestionnaire,
} from "../utils/trainingPlan.js";
import { normalizeTrainingPerformanceState } from "../utils/trainingPerformance.js";
import { normalizeStrengthAssessmentState } from "../utils/strengthAssessment.js";
import { normalizeTrainingCheckInState } from "../utils/trainingCheckIn.js";

// To subscribe to the login/logout event
import { subscribeToAuthChanges } from "./authService";

export function connectToPersistance(model, sideEffectWatcherFunction) {
  model.ready = false;

  function applyPersistedUserData(data) {
    const persistedData = {
      ...createDefaultUserData(),
      ...(data || {}),
    };
    const normalizedSubscriptionEndDate =
      persistedData.subscriptionEndDate ?? null;
    const hasActiveSubscription = Boolean(
      normalizedSubscriptionEndDate &&
      new Date(normalizedSubscriptionEndDate) >= new Date(new Date().setHours(0, 0, 0, 0))
    );

    if (typeof model.setQuestionnaire === "function") {
      model.setQuestionnaire(persistedData.questionnaire ?? {});
    } else {
      model.questionnaire = persistedData.questionnaire ?? {};
    }
    model.primaryCombatSport = persistedData.primaryCombatSport ?? "";
    model.sessionsPerWeek = persistedData.sessionsPerWeek ?? 3;
    if (persistedData.trainingPlan) {
      try {
        model.trainingPlan = parseGeneratedTrainingPlan(
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
    model.completedDays = persistedData.completedDays ?? [];
    model.trainingPlanBatch = persistedData.trainingPlanBatch ?? 1;
    model.completedWeeks = persistedData.completedWeeks ?? 0;
    model.subscription = hasActiveSubscription;
    model.subscriptionEndDate = normalizedSubscriptionEndDate;
    model.subscriptionStartDate = persistedData.subscriptionStartDate ?? null;
    model.stripePriceLookupKey = persistedData.stripePriceLookupKey ?? "";
    const persistedSubscriptionType =
      persistedData.subscriptionType ||
      model.getSubscriptionType?.() ||
      (hasActiveSubscription ? "pro" : "");
    model.subscriptionType = hasActiveSubscription ? persistedSubscriptionType : "";
    model.trainingPerformanceState = normalizeTrainingPerformanceState(
      persistedData.trainingPerformanceState
    );
    model.strengthAssessmentState = normalizeStrengthAssessmentState(
      persistedData.strengthAssessmentState
    );
    model.trainingCheckInState = normalizeTrainingCheckInState(
      persistedData.trainingCheckInState
    );
    model.forumProfile = normalizeForumProfile(persistedData.forumProfile);
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
      model.primaryCombatSport,
      model.sessionsPerWeek,
      model.subscription,
      model.subscriptionEndDate,
      model.subscriptionStartDate,
      model.subscriptionType,
      model.stripePriceLookupKey,
      model.trainingPlan,
      model.completedDays,
      model.trainingPlanBatch,
      model.completedWeeks,
      model.trainingPerformanceState,
      model.strengthAssessmentState,
      model.trainingCheckInState,
      model.forumProfile,
    ];
    console.log('[firebaseModel.modelDataToCheckACB] Tracked data:', {
      questionnaire: model.questionnaire ? 'exists' : 'null',
      primaryCombatSport: model.primaryCombatSport,
      sessionsPerWeek: model.sessionsPerWeek,
      subscription: model.subscription,
      subscriptionEndDate: model.subscriptionEndDate,
      subscriptionStartDate: model.subscriptionStartDate,
      subscriptionType: model.subscriptionType,
      stripePriceLookupKey: model.stripePriceLookupKey,
      trainingPlan: model.trainingPlan ? 'exists' : 'null',
      trainingPlanBatch: model.trainingPlanBatch,
      completedWeeks: model.completedWeeks,
      forumProfile: model.forumProfile,
    });
    return data;
  }

  async function saveToCloudACB() {
    if (model.user && model.ready) {
      // ADD ALL THE DATA WE WANT TO SAVE IN data
      const data = {
        questionnaire: model.questionnaire,
        primaryCombatSport: model.primaryCombatSport,
        sessionsPerWeek: model.sessionsPerWeek,
        subscription: model.subscription,
        subscriptionEndDate: model.subscriptionEndDate,
        subscriptionStartDate: model.subscriptionStartDate,
        subscriptionType: model.subscriptionType,
        stripePriceLookupKey: model.stripePriceLookupKey,
        trainingPlan: model.trainingPlan,
        completedDays: Array.from(model.completedDays || []),
        trainingPlanBatch: model.trainingPlanBatch,
        completedWeeks: model.completedWeeks,
        trainingPerformanceState: model.trainingPerformanceState,
        strengthAssessmentState: model.strengthAssessmentState,
        trainingCheckInState: model.trainingCheckInState,
        forumProfile: normalizeForumProfile(model.forumProfile),
      };
      console.log('[firebaseModel.saveToCloudACB] Saving to Firestore:', {
        ...data,
        trainingPlan: data.trainingPlan ? 'exists' : 'null',
      });
      try {
        const saveResult = await saveUserData(model.user.uid, data);
        if (!saveResult.success) {
          throw saveResult.error;
        }
        console.log('[firebaseModel.saveToCloudACB] ✅ Successfully saved to Firestore');
      } catch (error) {
        console.warn('[firebaseModel.saveToCloudACB] Firestore save unavailable, will retry on next change:', error);
      }
    } else {
      console.log('[firebaseModel.saveToCloudACB] Skipping save - user:', !!model.user, 'ready:', model.ready);
    }
  }

  // When the data in modelDataToCheckACB changes, we call saveToCloudACB
  console.log('[firebaseModel] Setting up MobX reaction to watch for subscription changes');
  sideEffectWatcherFunction(modelDataToCheckACB, saveToCloudACB);

  async function onAuthStateChangedACB(user) {
    console.log('[firebaseModel.onAuthStateChangedACB] Auth state changed, user:', user?.uid || null);

    model.ready = false;
    model.user = user;

    if (user) {
      try {
        const result = await getUserData(user.uid);
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
          if (!saveResult.success) {
            console.warn(
              "[firebaseModel.onAuthStateChangedACB] Could not create initial user document:",
              saveResult.error
            );
          }
        }
      } catch (error) {
        console.warn('[firebaseModel.onAuthStateChangedACB] Unexpected error loading user data, using defaults:', error);
        applyPersistedUserData(createDefaultUserData());
      } finally {
        model.ready = true;
      }
    } else {
      // logged out -> reset to null
      console.log('[firebaseModel.onAuthStateChangedACB] User logged out, resetting all user data');
      model.questionnaire = null;
      model.trainingPlan = null;
      model.completedDays = [];
      model.trainingPlanBatch = 1;
      model.completedWeeks = 0;
      // Reset subscription data on logout to prevent it from persisting to next user
      model.subscription = false;
      model.subscriptionEndDate = null;
      model.subscriptionStartDate = null;
      model.subscriptionType = "";
      model.stripePriceLookupKey = "";
      model.primaryCombatSport = "";
      model.sessionsPerWeek = 3;
      model.trainingPerformanceState = normalizeTrainingPerformanceState();
      model.strengthAssessmentState = normalizeStrengthAssessmentState();
      model.trainingCheckInState = normalizeTrainingCheckInState();
      model.forumProfile = normalizeForumProfile();
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
