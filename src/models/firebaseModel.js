// To handle data persistance agnostically of firestore
import { getUserData, saveUserData } from "./dbService";

// To subscribe to the login/logout event
import { subscribeToAuthChanges } from "./authService";

export function connectToPersistance(model, sideEffectWatcherFunction) {
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
      model.trainingPlan,
      model.trainingPlanBatch,
      model.completedWeeks,
    ];
    console.log('[firebaseModel.modelDataToCheckACB] Tracked data:', {
      questionnaire: model.questionnaire ? 'exists' : 'null',
      primaryCombatSport: model.primaryCombatSport,
      sessionsPerWeek: model.sessionsPerWeek,
      subscription: model.subscription,
      subscriptionEndDate: model.subscriptionEndDate,
      trainingPlan: model.trainingPlan ? 'exists' : 'null',
      trainingPlanBatch: model.trainingPlanBatch,
      completedWeeks: model.completedWeeks,
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
        trainingPlan: model.trainingPlan,
        trainingPlanBatch: model.trainingPlanBatch,
        completedWeeks: model.completedWeeks,
      };
      console.log('[firebaseModel.saveToCloudACB] Saving to Firestore:', {
        ...data,
        trainingPlan: data.trainingPlan ? 'exists' : 'null',
      });
      try {
        await saveUserData(model.user.uid, data);
        console.log('[firebaseModel.saveToCloudACB] ✅ Successfully saved to Firestore');
      } catch (error) {
        console.error('[firebaseModel.saveToCloudACB] ❌ Error saving to Firestore:', error);
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
    const previousSubscription = model.subscription;
    const previousEndDate = model.subscriptionEndDate;
    
    model.user = user;

    if (user) {
      model.ready = false;
      try {
        const result = await getUserData(user.uid);
        console.log('[firebaseModel.onAuthStateChangedACB] User data loaded from Firestore:', result.data);
        if (result.exists) {
          model.questionnaire = result.data.questionnaire || {};
          // Load persistent questionnaire responses
          model.primaryCombatSport = result.data.primaryCombatSport || "";
          model.sessionsPerWeek = result.data.sessionsPerWeek || 3;
          // Load training plan and batch info
          model.trainingPlan = result.data.trainingPlan || null;
          model.trainingPlanBatch = result.data.trainingPlanBatch || 1;
          model.completedWeeks = result.data.completedWeeks || 0;
          console.log('[firebaseModel.onAuthStateChangedACB] ✅ Loaded questionnaire & training plan:', {
            primaryCombatSport: model.primaryCombatSport,
            sessionsPerWeek: model.sessionsPerWeek,
            trainingPlan: model.trainingPlan ? 'exists' : 'null',
            trainingPlanBatch: model.trainingPlanBatch,
            completedWeeks: model.completedWeeks,
          });
          
          // Only override subscription data if it exists in Firestore
          // This preserves subscription data that was just set in this session
          if (result.data.subscription !== undefined && result.data.subscription !== null) {
            model.subscription = result.data.subscription;
            model.subscriptionEndDate = result.data.subscriptionEndDate || null;
            console.log('[firebaseModel.onAuthStateChangedACB] ✅ Loaded subscription data from Firestore:', {
              subscription: model.subscription,
              subscriptionEndDate: model.subscriptionEndDate
            });
          } else if (previousSubscription !== null && previousSubscription !== undefined) {
            // Keep the subscription data that was set in this session
            console.log('[firebaseModel.onAuthStateChangedACB] ℹ️ Preserving subscription data from current session:', {
              subscription: previousSubscription,
              subscriptionEndDate: previousEndDate
            });
          } else {
            // No subscription in Firestore and none in current session
            model.subscription = null;
            model.subscriptionEndDate = null;
            console.log('[firebaseModel.onAuthStateChangedACB] No subscription data');
          }
        } else {
          // New user or no document yet
          model.questionnaire = model.questionnaire || {};
          model.trainingPlan = null;
          model.trainingPlanBatch = 1;
          model.completedWeeks = 0;
          // Preserve subscription data if it was set in this session
          if (previousSubscription !== null && previousSubscription !== undefined) {
            console.log('[firebaseModel.onAuthStateChangedACB] ℹ️ Preserving subscription data for new user:', {
              subscription: previousSubscription,
              subscriptionEndDate: previousEndDate
            });
          } else {
            model.subscription = null;
            model.subscriptionEndDate = null;
            console.log('[firebaseModel.onAuthStateChangedACB] New user, no subscription data');
          }
        }
      } catch (error) {
        console.error('[firebaseModel.onAuthStateChangedACB] Error loading user data:', error);
      } finally {
        model.ready = true;
      }
    } else {
      // logged out -> reset to null
      console.log('[firebaseModel.onAuthStateChangedACB] User logged out, resetting subscription data');
      model.questionnaire = null;
      model.trainingPlan = null;
      model.trainingPlanBatch = 1;
      model.completedWeeks = 0;
    }
  }

  // We get the data only when the user connects
  subscribeToAuthChanges(onAuthStateChangedACB);
}
