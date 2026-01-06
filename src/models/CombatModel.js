import { resolvePromise } from "../resolvePromise.js";
import { generatePlan } from "../generatePlan.js";

import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  logout,
  loginWithGoogle,
} from "./authService.js";
import {
  updateProfile as fbUpdateProfile,
  updatePassword,
} from "firebase/auth";
import { saveFeedback, getApiConfig } from "./dbService.js";
/** The Model keeps the state of the application (Application State). 
   It represents the current user logged in, and other global data.  
*/
export const model = {
  user: null, // firebaseModel.js handles that proprety (object User or null)
  ready: true, // to block data saving while data loading

  // Questionnaire responses (persistent across sessions)
  questionnaire: null,
  primaryCombatSport: "", // Combat sport selection from questionnaire
  sessionsPerWeek: 3, // Number of sessions per week from questionnaire
  
  trainingPlan: null,
  trainingPlanBatch: 1, // Tracks which 8-week batch user is on (1, 2, 3, etc.)
  completedWeeks: 0, // Tracks total weeks completed across all batches

  subscription: false,
  subscriptionEndDate: null,

  trainingPlanPromiseState: {},

  dailyTrainingState: null,
  lastSeenDate: null, // tracks the date when daily training state was last updated
  dateCheckIntervalId: null, // timer for background date change detection

  finishedWorkout: 0,

  // action to create an account
  async submitSignup(username, email, password) {
    const authResult = await registerWithEmailPassword(
      username,
      email,
      password
    );

    if (!authResult.success) {
      throw new Error(authResult.error);
    }
  },

  // action to login
  async submitLogin(email, password) {
    const authResult = await loginWithEmailPassword(email, password);

    if (!authResult.success) {
      throw new Error(authResult.error);
    }
  },

  // action to logout
  async submitLogout() {
    const authResult = await logout();

    if (!authResult.success) {
      throw new Error(authResult.error);
    }
  },

  // action to login with google
  async submitGoogle() {
    const authResult = await loginWithGoogle();

    if (!authResult.success) {
      throw new Error(authResult.error);
    }
  },
  async submitFeedBack(rating, comment) {
    const feedbackData = {
      rating,
      comment,
      userId: this.user.uid,
      userEmail: this.user.email,
      timestamp: new Date().toISOString(),
    };

    const result = await saveFeedback(feedbackData);

    if (!result.success) {
      throw new Error(result.error);
    }
  },

  async updateProfile({ displayName, password, isGoogleUser }) {
    try {
      // 1 Update display name
      if (displayName && displayName !== this.user.displayName) {
        await fbUpdateProfile(this.user, {
          displayName: displayName,
        });
      }

      // 2 Update password if it is not connected with google account
      if (!isGoogleUser && password && password.length > 0) {
        await updatePassword(this.user, password);
      }
    } catch (error) {
      // Erro classic of firebase
      if (error.code === "auth/requires-recent-login") {
        throw new Error("Please re-login to change sensitive information.");
      }

      throw error;
    }
  },
  ////////////////////////////////////////////////
  setFinishedWorkout(value) {
    this.finishedWorkout = value;
  },

  generateTrainingPlan(userInput) {
    const prms = generatePlan(userInput);
    resolvePromise(prms, this.trainingPlanPromiseState);
  },

  isSubscribed() {
    // Check if subscription is active and not expired
    if (!this.subscription || !this.subscriptionEndDate || this.subscription.status !== 'active') {
      return false;
    }
    
    const today = new Date();
    const endDate = new Date(this.subscriptionEndDate);
    return today <= endDate;
  },

  /**
   * Gets today's date as a string (YYYY-MM-DD format).
   * @returns {string} today's date in YYYY-MM-DD format
   */
  getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Calculates the subscription end date based on the plan type.
   * @param {string} planType - 'week', 'month', or 'year'
   * @returns {string} end date in YYYY-MM-DD format
   */
  calculateSubscriptionEndDate(planType) {
    const today = new Date();
    let endDate = new Date(today);

    switch (planType) {
      case 'starter_plan':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'pro_plan':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'expert_plan':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        throw new Error(`Invalid plan type: ${planType}`);
    }

    // Format as YYYY-MM-DD
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Sets the subscription with an end date based on the plan type.
   * If user already has active subscription, adds days to existing end date.
   * @param {string} planType - 'starter_plan', 'pro_plan', or 'expert_plan'
   */
  setSubscriptionWithPlan(planType) {
    console.log('[CombatModel.setSubscriptionWithPlan] Called with planType:', planType);
    
    // If this is a first-time subscription (no previous end date), reset progress
    const isFirstSubscription = !this.subscriptionEndDate;
    
    this.subscription = true;
    
    // Determine days to add based on plan type
    let daysToAdd = 0;
    switch (planType) {
      case 'starter_plan':
        daysToAdd = 7;
        break;
      case 'pro_plan':
        daysToAdd = 30;
        break;
      case 'expert_plan':
        daysToAdd = 365;
        break;
      default:
        throw new Error(`Invalid plan type: ${planType}`);
    }

    // Calculate new end date
    let newEndDate = new Date();
    
    // If user already has active subscription, extend from current end date
    if (this.subscriptionEndDate) {
      const existingEndDate = new Date(this.subscriptionEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      existingEndDate.setHours(0, 0, 0, 0);
      
      // If subscription is still active, extend from the end date
      if (existingEndDate >= today) {
        newEndDate = new Date(existingEndDate);
      }
    }
    
    // Add the days
    newEndDate.setDate(newEndDate.getDate() + daysToAdd);

    // Format as YYYY-MM-DD
    const year = newEndDate.getFullYear();
    const month = String(newEndDate.getMonth() + 1).padStart(2, '0');
    const day = String(newEndDate.getDate()).padStart(2, '0');
    this.subscriptionEndDate = `${year}-${month}-${day}`;
    
    // Reset training progress only on first subscription
    if (isFirstSubscription) {
      this.resetTrainingProgress();
    }
    
    console.log('[CombatModel.setSubscriptionWithPlan] Updated subscription:', {
      subscription: this.subscription,
      subscriptionEndDate: this.subscriptionEndDate,
      daysToAdd: daysToAdd
    });
  },

  /**
   * Legacy method: Sets subscription status directly.
   * Consider using setSubscriptionWithPlan() instead for date-aware subscriptions.
   */
  setSubscription(subscription) {
    this.subscription = subscription;
  },

  /**
   * Returns the subscription end date in YYYY-MM-DD format.
   * @returns {string|null} subscription end date or null if not subscribed
   */
  getSubscriptionEndDate() {
    return this.subscriptionEndDate;
  },

  /**
   * Returns days remaining in the subscription.
   * @returns {number} days remaining, or -1 if not subscribed
   */
  getDaysRemainingInSubscription() {
    if (!this.subscription || !this.subscriptionEndDate) {
      return -1;
    }

    const today = new Date();
    const endDate = new Date(this.subscriptionEndDate);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  },

  /**
   * Calculates the number of weeks for a training plan based on subscription.
   * Max 8 weeks for yearly subscription, scaled down for shorter subscriptions.
   * @returns {number} number of weeks (1-8), or 0 if not subscribed
   */
  getPlannedWeeksFromSubscription() {
    const daysRemaining = this.getDaysRemainingInSubscription();
    if (daysRemaining <= 0) {
      return 0;
    }

    // Calculate weeks from remaining days (7 days per week)
    const weeksFromDays = Math.ceil(daysRemaining / 7);

    // Cap at 8 weeks maximum
    return Math.min(weeksFromDays, 8);
  },

  /**
   * Returns the current training plan batch number (1, 2, 3, etc.)
   * Each batch contains up to 8 weeks
   * @returns {number} current batch number
   */
  getTrainingPlanBatch() {
    return this.trainingPlanBatch;
  },

  /**
   * Returns total weeks completed across all batches
   * @returns {number} total completed weeks
   */
  getCompletedWeeks() {
    return this.completedWeeks;
  },

  /**
   * Marks the current batch as complete and increments to the next batch.
   * Called when user finishes all 8 weeks (or fewer if subscription is shorter).
   * @param {number} weeksCompleted - number of weeks in the completed batch
   */
  completeCurrentBatch(weeksCompleted) {
    this.completedWeeks += weeksCompleted;
    this.trainingPlanBatch += 1;
    this.trainingPlan = null; // Clear current plan so new one can be generated
    console.log(
      '[CombatModel.completeCurrentBatch] Batch complete. ' +
      `New batch: ${this.trainingPlanBatch}, ` +
      `Total completed weeks: ${this.completedWeeks}`
    );
  },

  /**
   * Resets training plan progress (called on new subscription or plan reset)
   */
  resetTrainingProgress() {
    this.trainingPlanBatch = 1;
    this.completedWeeks = 0;
    this.trainingPlan = null;
    console.log('[CombatModel.resetTrainingProgress] Progress reset');
  },

  setDailyTrainingState(state) {
    this.dailyTrainingState = state;
  },

  /**
   * Gets today's date as a string (YYYY-MM-DD format).
   * Used to detect when a new calendar day has started.
   * @returns {string} today's date in YYYY-MM-DD format
   */
  getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },

  /**
   * Checks if the date has changed and updates daily training state.
   * Called by the background interval timer.
   */
  checkDateChange() {
    const today = this.getTodayDateString();

    // Only update if the date has changed
    if (this.lastSeenDate !== today) {
      this.lastSeenDate = today;
      // Determine if there are exercises today by checking the training plan
      const hasExercisesToday = this.hasExercisesForToday();
      this.updateDailyTrainingStateForNewDay(hasExercisesToday);
    }
  },

  /**
   * Determines if there are exercises scheduled for today.
   * Looks at the training plan and matches the current day of the week.
   * @returns {boolean} true if exercises are scheduled for today
   */
  hasExercisesForToday() {
    if (!this.trainingPlan || !this.trainingPlan.weeks) {
      return false;
    }

    // Get today's day of week (0 = Sunday, 1 = Monday, etc.)
    const todayDayOfWeek = new Date().getDay();

    // Search through all weeks and days to find exercises for today's day of week
    for (const week of this.trainingPlan.weeks) {
      for (const day of week.days) {
        // Assuming day.day represents day of week (1-7 or 0-6)
        // Adjust this logic based on your actual plan structure
        if (day.day === todayDayOfWeek || day.dayOfWeek === todayDayOfWeek) {
          return day.exercises && day.exercises.length > 0;
        }
      }
    }

    return false;
  },

  /**
   * Starts the background date change detector.
   * Checks every minute if the date has changed and updates state accordingly.
   * Should be called when the app initializes or user logs in.
   */
  startDateChangeDetector() {
    // Clear any existing interval
    if (this.dateCheckIntervalId) {
      clearInterval(this.dateCheckIntervalId);
    }

    // Check immediately
    this.checkDateChange();

    // Check every minute
    this.dateCheckIntervalId = setInterval(() => {
      this.checkDateChange();
    }, 60000); // 60000 ms = 1 minute
  },

  /**
   * Stops the background date change detector.
   * Should be called when the app unmounts or user logs out.
   */
  stopDateChangeDetector() {
    if (this.dateCheckIntervalId) {
      clearInterval(this.dateCheckIntervalId);
      this.dateCheckIntervalId = null;
    }
  },

  /**
   * Checks if a new calendar day has started and updates daily training state accordingly.
   * This runs whenever the user views a day detail, and only updates if the date has changed.
   * Logic:
   * - If current state is "undone", set to "missed" (user didn't complete yesterday's workout)
   * - If there are exercises today and state is null or "done", set to "undone"
   * - If there are no exercises today, set to "done"
   *
   * @param {boolean} hasExercisesToday - whether there are exercises scheduled for today
   */
  checkAndUpdateDailyTrainingState(hasExercisesToday) {
    const today = this.getTodayDateString();

    // Only update if the date has changed
    if (this.lastSeenDate !== today) {
      this.lastSeenDate = today;
      this.updateDailyTrainingStateForNewDay(hasExercisesToday);
    }
  },

  /**
   * Updates the daily training state when a new day starts.
   * Logic:
   * - If current state is "undone", set to "missed"
   * - If there are exercises for today and current state is null or "done", set to "undone"
   * - If there are no exercises for today, set to "done"
   *
   * @param {boolean} hasExercisesToday - whether there are exercises scheduled for today
   */
  updateDailyTrainingStateForNewDay(hasExercisesToday) {
    if (this.dailyTrainingState === "undone") {
      this.dailyTrainingState = "missed";
    } else if (hasExercisesToday) {
      if (
        this.dailyTrainingState === null ||
        this.dailyTrainingState === "done"
      ) {
        this.dailyTrainingState = "undone";
      }
    } else {
      this.dailyTrainingState = "done";
    }
  },

  onTrackWithTraining() {
    this.dailyTrainingState !== "missed";
  },
};
