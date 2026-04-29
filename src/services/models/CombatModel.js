import { resolvePromise } from "../../core/resolvePromise.js";
import {
  adjustTrainingDayForMissedSession,
  generatePlan,
} from "../../core/generatePlan.js";

import {
  getUserRole,
  loginWithEmailPassword,
  registerWithEmailPassword,
  logout,
  loginWithGoogle,
  resetPassword as requestPasswordReset,
  USER_ROLES,
} from "./authService.js";
import {
  updateProfile as fbUpdateProfile,
  updatePassword,
} from "../config/firebaseSdk.js";
import {
  createForumComment as persistForumComment,
  createForumPost as persistForumPost,
  createForumReply as persistForumReply,
  getForumComments,
  getForumPost,
  getForumPosts,
  incrementForumPostLikes,
  incrementForumPostSaves,
  saveFeedback,
} from "./dbService.js";
import {
  appendForumReply,
  applyForumFilters,
  buildForumCommentPayload,
  buildForumPostPayload,
  createDefaultForumComposer,
  createDefaultForumFilters,
  createDefaultForumProfile,
  findForumCommentNode,
  flattenForumComments,
  MAX_FORUM_COMMENT_REPLY_DEPTH,
  normalizeForumComment,
  normalizeForumPost,
  normalizeForumProfile,
} from "./forumModel.js";
import {
  getSportLoadMultiplier,
  normalizeAppLogicSettings,
} from "../../constants/appLogicSettings.js";
import {
  getNormalizedSessionDuration,
  getSessionDurationMinutes,
  mergeTrainingPreferences,
} from "../../constants/trainingPreferences.js";
import { getNormalizedWeekday, getWeekdayNameFromIndex } from "../../constants/weekdays.js";
import {
  applySportLoadLevelToPlanWeek,
  deriveSportLoadLevelFromCompletedWeek,
  isTrainingWeekCompleted,
} from "../utils/sportLoad.js";
import {
  applyMissedSessionAdjustment,
  countTrackableTrainingDays,
  getCurrentTrainingDay,
  getTrainingDayPreferredWeekday,
  replaceTrainingPlanDay,
  replaceTrainingPlanExercise,
  sanitizeTrainingPlanForQuestionnaire,
} from "../utils/trainingPlan.js";
import {
  createDefaultStrengthAssessmentState,
  createStrengthAssessmentEntry,
  getStrengthAssessmentLiftKey,
  getStrengthAssessmentSessionResults,
  getStrengthAssessmentSummary,
  normalizeStrengthAssessmentConfig,
  normalizeStrengthAssessmentState,
  upsertStrengthAssessmentSessionResults,
} from "../utils/strengthAssessment.js";
import {
  createDefaultTrainingPerformanceState,
  createTrainingPerformanceEntry,
  getTrainingPerformanceSessionResults,
  getTrainingPerformanceSummary,
  normalizePerformanceTarget,
  normalizeTrainingPerformanceState,
  upsertTrainingPerformanceSessionResults,
} from "../utils/trainingPerformance.js";
import {
  applyTrainingCheckInAction,
  buildTrainingCheckInObjectiveSummary,
  buildTrainingCheckInRecommendation,
  createDefaultTrainingCheckInState,
  createTrainingCheckInHistoryEntry,
  getPendingTrainingCheckIn,
  normalizeTrainingCheckInState,
} from "../utils/trainingCheckIn.js";
/** The Model keeps the state of the application (Application State). 
   It represents the current user logged in, and other global data.  
*/
export const model = {
  user: null, // firebaseModel.js handles that proprety (object User or null)
  ready: false, // stays false until the first auth state/bootstrap completes

  // Questionnaire responses (persistent across sessions)
  questionnaire: null,
  primaryCombatSport: "", // Combat sport selection from questionnaire
  sessionsPerWeek: 3, // Number of sessions per week from questionnaire
  
  trainingPlan: null,
  // Stores completed day identifiers as ['1-1', '1-2'] for persistence
  completedDays: [],
  trainingPlanBatch: 1, // Tracks which 8-week batch user is on (1, 2, 3, etc.)
  completedWeeks: 0, // Tracks total weeks completed across all batches

  subscription: false,
  subscriptionEndDate: null,
  trainingPerformanceState: createDefaultTrainingPerformanceState(),
  strengthAssessmentState: createDefaultStrengthAssessmentState(),
  trainingCheckInState: createDefaultTrainingCheckInState(),

  trainingPlanPromiseState: {},

  forumProfile: createDefaultForumProfile(),
  forumFilters: createDefaultForumFilters(),
  forumComposer: createDefaultForumComposer(),
  forumFeed: [],
  forumSelectedPost: null,
  forumComments: [],
  forumOverlayVisible: false,
  forumTabBarHidden: false,
  forumOverlayDismissCount: 0,
  forumFeedPromiseState: {},
  forumSelectedPostPromiseState: {},
  forumCommentsPromiseState: {},

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
  async submitGoogle(idToken = null) {
    const authResult = await loginWithGoogle(idToken);

    if (!authResult.success) {
      throw new Error(authResult.error);
    }
  },

  async submitPasswordReset(email) {
    const authResult = await requestPasswordReset(email);

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

  getNormalizedForumProfile() {
    return normalizeForumProfile(this.forumProfile);
  },

  resetForumRuntimeState() {
    this.forumFilters = createDefaultForumFilters();
    this.forumComposer = createDefaultForumComposer();
    this.forumFeed = [];
    this.forumSelectedPost = null;
    this.forumComments = [];
    this.forumOverlayVisible = false;
    this.forumTabBarHidden = false;
    this.forumOverlayDismissCount = 0;
    this.forumFeedPromiseState = {};
    this.forumSelectedPostPromiseState = {};
    this.forumCommentsPromiseState = {};
  },

  setForumOverlayVisible(value) {
    this.forumOverlayVisible = Boolean(value);
  },

  setForumTabBarHidden(value) {
    this.forumTabBarHidden = Boolean(value);
  },

  requestForumOverlayDismiss() {
    this.forumOverlayDismissCount += 1;
  },

  setForumFilters(nextFilters = {}) {
    this.forumFilters = {
      ...createDefaultForumFilters(),
      ...this.forumFilters,
      ...(nextFilters || {}),
    };
  },

  resetForumFilters() {
    this.forumFilters = createDefaultForumFilters();
  },

  updateForumComposer(patch = {}) {
    this.forumComposer = {
      ...createDefaultForumComposer(),
      ...this.forumComposer,
      ...(patch || {}),
    };
  },

  resetForumComposer() {
    this.forumComposer = createDefaultForumComposer();
  },

  patchForumPostState(postId, patch) {
    const applyPatch = (post) => {
      if (!post || post.id !== postId) {
        return post;
      }

      const nextPatch = typeof patch === "function" ? patch(post) : patch;
      return normalizeForumPost(
        {
          ...post,
          ...(nextPatch || {}),
        },
        this.getNormalizedForumProfile()
      );
    };

    this.forumFeed = this.forumFeed.map(applyPatch);
    this.forumSelectedPost = applyPatch(this.forumSelectedPost);
  },

  isForumPostLiked(postId) {
    return this.getNormalizedForumProfile().likedPostIds.includes(postId);
  },

  isForumPostSaved(postId) {
    return this.getNormalizedForumProfile().savedPostIds.includes(postId);
  },

  isFollowingForumUser(userId) {
    return this.getNormalizedForumProfile().followedUserIds.includes(userId);
  },

  updateForumProfile(patch = {}) {
    this.forumProfile = normalizeForumProfile({
      ...this.getNormalizedForumProfile(),
      ...(patch || {}),
    });

    const normalizedProfile = this.getNormalizedForumProfile();
    this.forumFeed = this.forumFeed.map((post) =>
      normalizeForumPost(post, normalizedProfile)
    );

    if (this.forumSelectedPost) {
      this.forumSelectedPost = normalizeForumPost(
        this.forumSelectedPost,
        normalizedProfile
      );
    }
  },

  toggleFollowedForumUser(userId) {
    if (!userId || userId === this.user?.uid) {
      return false;
    }

    const forumProfile = this.getNormalizedForumProfile();
    const followedUserIds = new Set(forumProfile.followedUserIds);

    if (followedUserIds.has(userId)) {
      followedUserIds.delete(userId);
    } else {
      followedUserIds.add(userId);
    }

    this.updateForumProfile({
      followedUserIds: Array.from(followedUserIds),
    });

    return followedUserIds.has(userId);
  },

  async getForumAuthorMeta() {
    if (!this.user?.uid) {
      throw new Error("You need to be logged in to use the forum.");
    }

    const role = (await getUserRole(this.user.uid)) || USER_ROLES.USER;

    return {
      role,
      isCoachVerified: role === USER_ROLES.ADMIN,
    };
  },

  async loadForumFeed(filterOverrides = {}) {
    const nextFilters = {
      ...this.forumFilters,
      ...(filterOverrides || {}),
    };
    this.setForumFilters(nextFilters);

    const prms = getForumPosts({
      limitCount: Math.max((nextFilters.limit || 25) * 2, 25),
    }).then((result) => {
      if (!result.success) {
        throw result.error || new Error("Could not load forum posts.");
      }

      const normalizedPosts = applyForumFilters(
        result.data,
        nextFilters,
        this.getNormalizedForumProfile()
      );

      this.forumFeed = normalizedPosts;
      return normalizedPosts;
    });

    resolvePromise(prms, this.forumFeedPromiseState);
    return prms;
  },

  async loadForumPost(postId) {
    const prms = getForumPost(postId).then((result) => {
      if (!result.success || !result.data) {
        throw result.error || new Error("Could not load the selected post.");
      }

      const normalizedPost = normalizeForumPost(
        result.data,
        this.getNormalizedForumProfile()
      );
      this.forumSelectedPost = normalizedPost;
      return normalizedPost;
    });

    resolvePromise(prms, this.forumSelectedPostPromiseState);
    return prms;
  },

  async loadForumComments(
    postId,
    { limitCount = 50 } = {}
  ) {
    const prms = getForumComments(postId, { limitCount }).then((result) => {
      if (!result.success) {
        throw result.error || new Error("Could not load forum comments.");
      }

      const normalizedComments = result.data.map(normalizeForumComment);
      this.forumComments = normalizedComments;
      return normalizedComments;
    });

    resolvePromise(prms, this.forumCommentsPromiseState);
    return prms;
  },

  getForumCommentNode(commentId) {
    if (!commentId) {
      return null;
    }

    return findForumCommentNode(this.forumComments, commentId);
  },

  getFlattenedForumComments() {
    return flattenForumComments(this.forumComments);
  },

  async loadForumPostThread(postId, options = {}) {
    const [post, comments] = await Promise.all([
      this.loadForumPost(postId),
      this.loadForumComments(postId, options),
    ]);

    return { post, comments };
  },

  async createForumPost(draftOverrides = {}) {
    const authorMeta = await this.getForumAuthorMeta();
    const payload = buildForumPostPayload({
      draft: {
        ...this.forumComposer,
        ...(draftOverrides || {}),
      },
      author: this.user,
      authorRole: authorMeta.role,
      isCoachVerified: authorMeta.isCoachVerified,
    });
    const result = await persistForumPost(payload);

    if (!result.success || !result.data) {
      throw result.error || new Error("Could not create the forum post.");
    }

    const normalizedPost = normalizeForumPost(
      result.data,
      this.getNormalizedForumProfile()
    );

    this.forumFeed = [normalizedPost, ...this.forumFeed].slice(
      0,
      this.forumFilters.limit || 25
    );
    this.forumSelectedPost = normalizedPost;
    this.forumComments = [];
    this.resetForumComposer();

    return normalizedPost;
  },

  async addForumComment(postId, body) {
    const authorMeta = await this.getForumAuthorMeta();
    const payload = buildForumCommentPayload({
      body,
      author: this.user,
      authorRole: authorMeta.role,
      isCoachVerified: authorMeta.isCoachVerified,
    });
    const result = await persistForumComment(postId, payload);

    if (!result.success || !result.data) {
      throw result.error || new Error("Could not create the forum comment.");
    }

    const normalizedComment = normalizeForumComment(result.data);
    this.forumComments = [...this.forumComments, normalizedComment];
    this.patchForumPostState(postId, (post) => ({
      commentsCount: (post.commentsCount || 0) + 1,
      coachResponseStatus:
        normalizedComment.isCoachVerified ? "responded" : post.coachResponseStatus,
    }));

    return normalizedComment;
  },

  async addForumReply(postId, parentCommentId, body) {
    const parentNode = this.getForumCommentNode(parentCommentId);

    if (!parentNode?.comment) {
      throw new Error("Could not find the comment you are replying to.");
    }

    const parentCommentDepth = Number(parentNode.comment.depth) || 0;

    if (parentCommentDepth >= MAX_FORUM_COMMENT_REPLY_DEPTH) {
      throw new Error(
        `Replies cannot go deeper than ${MAX_FORUM_COMMENT_REPLY_DEPTH} levels.`
      );
    }

    const authorMeta = await this.getForumAuthorMeta();
    const payload = buildForumCommentPayload({
      body,
      author: this.user,
      authorRole: authorMeta.role,
      isCoachVerified: authorMeta.isCoachVerified,
    });
    const result = await persistForumReply(postId, payload, {
      parentCommentId: parentNode.comment.id,
      rootCommentId:
        parentNode.comment.rootCommentId || parentNode.comment.id,
      depth: parentCommentDepth + 1,
      parentPathSegments: parentNode.pathSegments,
    });

    if (!result.success || !result.data) {
      throw result.error || new Error("Could not create the forum reply.");
    }

    const normalizedReply = normalizeForumComment(
      result.data,
      parentCommentDepth + 1
    );
    this.forumComments = appendForumReply(
      this.forumComments,
      parentCommentId,
      normalizedReply
    );
    this.patchForumPostState(postId, (post) => ({
      commentsCount: (post.commentsCount || 0) + 1,
      coachResponseStatus:
        normalizedReply.isCoachVerified ? "responded" : post.coachResponseStatus,
    }));

    return normalizedReply;
  },

  async toggleForumPostLike(postId) {
    const forumProfile = this.getNormalizedForumProfile();
    const likedPostIds = new Set(forumProfile.likedPostIds);
    const isLiked = likedPostIds.has(postId);
    const delta = isLiked ? -1 : 1;

    if (isLiked) {
      likedPostIds.delete(postId);
    } else {
      likedPostIds.add(postId);
    }

    this.updateForumProfile({
      likedPostIds: Array.from(likedPostIds),
    });
    this.patchForumPostState(postId, (post) => ({
      likesCount: Math.max(0, (post.likesCount || 0) + delta),
    }));

    const result = await incrementForumPostLikes(postId, delta);

    if (!result.success) {
      this.updateForumProfile({
        likedPostIds: forumProfile.likedPostIds,
      });
      this.patchForumPostState(postId, (post) => ({
        likesCount: Math.max(0, (post.likesCount || 0) - delta),
      }));
      throw result.error || new Error("Could not update the forum like.");
    }

    return !isLiked;
  },

  async toggleForumPostSave(postId) {
    const forumProfile = this.getNormalizedForumProfile();
    const savedPostIds = new Set(forumProfile.savedPostIds);
    const isSaved = savedPostIds.has(postId);
    const delta = isSaved ? -1 : 1;

    if (isSaved) {
      savedPostIds.delete(postId);
    } else {
      savedPostIds.add(postId);
    }

    this.updateForumProfile({
      savedPostIds: Array.from(savedPostIds),
    });
    this.patchForumPostState(postId, (post) => ({
      savesCount: Math.max(0, (post.savesCount || 0) + delta),
    }));

    const result = await incrementForumPostSaves(postId, delta);

    if (!result.success) {
      this.updateForumProfile({
        savedPostIds: forumProfile.savedPostIds,
      });
      this.patchForumPostState(postId, (post) => ({
        savesCount: Math.max(0, (post.savesCount || 0) - delta),
      }));
      throw result.error || new Error("Could not update the forum save.");
    }

    return !isSaved;
  },
  ////////////////////////////////////////////////
  setFinishedWorkout(value) {
    this.finishedWorkout = value;
  },

  setQuestionnaire(questionnaire = {}) {
    this.questionnaire = mergeTrainingPreferences({}, questionnaire);

    if (this.trainingPlan) {
      this.trainingPlan = sanitizeTrainingPlanForQuestionnaire(
        this.trainingPlan,
        this.questionnaire
      );
    }
  },

  getStrengthAssessmentSessionKey(weekNumber, dayNumber) {
    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const parsedDayNumber = Number.parseInt(dayNumber, 10);

    if (!Number.isFinite(parsedWeekNumber) || !Number.isFinite(parsedDayNumber)) {
      return "";
    }

    return `${parsedWeekNumber}-${parsedDayNumber}`;
  },

  getStrengthAssessmentSessionResults(weekNumber, dayNumber) {
    return getStrengthAssessmentSessionResults(
      this.strengthAssessmentState,
      this.getStrengthAssessmentSessionKey(weekNumber, dayNumber)
    );
  },

  getStrengthAssessmentSummary() {
    return getStrengthAssessmentSummary(this.strengthAssessmentState);
  },

  getTrainingPerformanceSessionResults(weekNumber, dayNumber) {
    return getTrainingPerformanceSessionResults(
      this.trainingPerformanceState,
      this.getStrengthAssessmentSessionKey(weekNumber, dayNumber)
    );
  },

  getTrainingPerformanceSummary() {
    return getTrainingPerformanceSummary(this.trainingPerformanceState);
  },

  saveTrainingPerformanceResults({
    weekNumber,
    dayNumber,
    exercises = [],
    results = [],
    performedAt = new Date().toISOString(),
  } = {}) {
    const sessionKey = this.getStrengthAssessmentSessionKey(weekNumber, dayNumber);

    if (!sessionKey) {
      return createDefaultTrainingPerformanceState();
    }

    const nextEntries = Array.isArray(results) ?
      results
        .map((result) => {
          const exerciseIndex = Number.parseInt(result?.exerciseIndex, 10);
          const exercise = Array.isArray(exercises) ? exercises[exerciseIndex] : null;
          const performanceTarget = normalizePerformanceTarget(
            exercise?.performanceTarget,
            exercise?.name,
            exercise
          );

          if (!performanceTarget) {
            return null;
          }

          return createTrainingPerformanceEntry({
            metadata: performanceTarget,
            result,
            sessionKey,
            weekNumber,
            dayNumber,
            exerciseIndex,
            sourceExerciseName: exercise?.name,
            performedAt,
          });
        })
        .filter(Boolean) :
      [];

    this.trainingPerformanceState = upsertTrainingPerformanceSessionResults(
      this.trainingPerformanceState,
      sessionKey,
      nextEntries
    );

    return this.trainingPerformanceState;
  },

  getNormalizedTrainingCheckInState() {
    return normalizeTrainingCheckInState(this.trainingCheckInState);
  },

  getPendingTrainingCheckIn() {
    const prompt = getPendingTrainingCheckIn({
      plan: this.trainingPlan,
      completedDays: this.completedDays,
      questionnaire: this.questionnaire,
      trainingCheckInState: this.trainingCheckInState,
    });

    if (!prompt) {
      return null;
    }

    return {
      ...prompt,
      objectiveSummary: buildTrainingCheckInObjectiveSummary({
        plan: this.trainingPlan,
        completedDays: this.completedDays,
        prompt,
        trainingPerformanceState: this.trainingPerformanceState,
        strengthAssessmentState: this.strengthAssessmentState,
      }),
    };
  },

  previewTrainingCheckInRecommendation({
    prompt = this.getPendingTrainingCheckIn(),
    answers = {},
  } = {}) {
    if (!prompt) {
      return null;
    }

    return buildTrainingCheckInRecommendation({
      prompt,
      questionnaire: this.questionnaire,
      plan: this.trainingPlan,
      completedDays: this.completedDays,
      answers,
      objectiveSummary: prompt.objectiveSummary,
    });
  },

  completeTrainingCheckIn({
    prompt = this.getPendingTrainingCheckIn(),
    answers = {},
    action = {},
  } = {}) {
    if (!prompt) {
      return null;
    }

    const recommendation = this.previewTrainingCheckInRecommendation({
      prompt,
      answers,
    });

    if (!recommendation) {
      return null;
    }

    const normalizedAction =
      action && typeof action === "object" && action.type ?
        action :
        recommendation.recommendedAction;
    const adjustmentResult = applyTrainingCheckInAction({
      plan: this.trainingPlan,
      completedDays: this.completedDays,
      action: normalizedAction,
    });

    this.trainingPlan = sanitizeTrainingPlanForQuestionnaire(
      adjustmentResult.plan,
      this.questionnaire
    );

    if (normalizedAction?.type === "change_scheme" && normalizedAction?.targetLoadingStrategy) {
      this.setQuestionnaire?.(
        mergeTrainingPreferences(this.questionnaire, {
          loadingStrategy: normalizedAction.targetLoadingStrategy,
        })
      );
    }

    const historyEntry = createTrainingCheckInHistoryEntry({
      prompt,
      answers: recommendation.answers,
      objectiveSummary: prompt.objectiveSummary,
      recommendation: recommendation.recommendedAction,
      appliedAction: normalizedAction,
      resultSummary: adjustmentResult.resultSummary,
    });

    this.trainingCheckInState = normalizeTrainingCheckInState({
      history: [
        ...this.getNormalizedTrainingCheckInState().history,
        ...(historyEntry ? [historyEntry] : []),
      ],
    });

    return {
      entry: historyEntry,
      resultSummary: adjustmentResult.resultSummary,
      plan: this.trainingPlan,
    };
  },

  saveStrengthAssessmentResults({
    weekNumber,
    dayNumber,
    exercises = [],
    results = [],
    performedAt = new Date().toISOString(),
  } = {}) {
    const sessionKey = this.getStrengthAssessmentSessionKey(weekNumber, dayNumber);
    if (!sessionKey) {
      return createDefaultStrengthAssessmentState();
    }

    const baseStrengthAssessmentState = upsertStrengthAssessmentSessionResults(
      this.strengthAssessmentState,
      sessionKey,
      []
    );
    const latestByLift = normalizeStrengthAssessmentState(
      baseStrengthAssessmentState
    ).latestByLift;
    const nextEntries = Array.isArray(results)
      ? results
          .map((result) => {
            const exerciseIndex = Number.parseInt(result?.exerciseIndex, 10);
            const exercise = Array.isArray(exercises) ? exercises[exerciseIndex] : null;
            const normalizedStrengthAssessment = normalizeStrengthAssessmentConfig(
              exercise?.strengthAssessment,
              exercise?.name
            );

            if (!normalizedStrengthAssessment) {
              return null;
            }

            const previousTrainingMaxKg =
              latestByLift[
                getStrengthAssessmentLiftKey(normalizedStrengthAssessment.liftName)
              ]?.trainingMaxKg ?? null;

            return createStrengthAssessmentEntry({
              metadata: normalizedStrengthAssessment,
              result,
              previousTrainingMaxKg,
              sessionKey,
              weekNumber,
              dayNumber,
              exerciseIndex,
              sourceExerciseName: exercise?.name,
              performedAt,
            });
          })
          .filter(Boolean)
      : [];

    this.strengthAssessmentState = upsertStrengthAssessmentSessionResults(
      baseStrengthAssessmentState,
      sessionKey,
      nextEntries
    );

    return this.strengthAssessmentState;
  },

  applySportLoadSettingToFollowingWeek() {
    if (!this.trainingPlan) {
      return null;
    }

    const currentWeekNumber =
      this.getCurrentTrainingDay?.(this.completedDays)?.week ||
      this.trainingPlan?.weeks?.[0]?.week ||
      1;
    const nextWeekNumber = currentWeekNumber + 1;

    if (!this.trainingPlan.weeks?.some((week) => week.week === nextWeekNumber)) {
      return this.trainingPlan;
    }

    this.trainingPlan = applySportLoadLevelToPlanWeek(
      this.trainingPlan,
      nextWeekNumber,
      this.questionnaire?.sportLoadLevel,
      {
        completedDays: this.completedDays,
        skipCompletedDays: false,
      }
    );

    return this.trainingPlan;
  },

  updateSportLoadAfterWeekCompletion(weekNumber) {
    if (
      !this.trainingPlan ||
      !isTrainingWeekCompleted({
        plan: this.trainingPlan,
        weekNumber,
        completedDays: this.completedDays,
      })
    ) {
      return null;
    }

    const derivedSportLoadLevel = deriveSportLoadLevelFromCompletedWeek({
      plan: this.trainingPlan,
      weekNumber,
      completedDays: this.completedDays,
      sessionsPerWeek: this.sessionsPerWeek,
    });

    if (!derivedSportLoadLevel) {
      return null;
    }

    this.setQuestionnaire?.(
      mergeTrainingPreferences(this.questionnaire, {
        sportLoadLevel: derivedSportLoadLevel,
      })
    );

    this.trainingPlan = applySportLoadLevelToPlanWeek(
      this.trainingPlan,
      weekNumber + 1,
      derivedSportLoadLevel,
      {
        completedDays: this.completedDays,
        skipCompletedDays: false,
      }
    );

    return {
      sportLoadLevel: derivedSportLoadLevel,
      nextWeekNumber: weekNumber + 1,
    };
  },

  buildTrainingPlanInput(questionnaire = this.questionnaire) {
    const source =
      questionnaire && typeof questionnaire === "object" ? questionnaire : {};
    const normalizedAppLogicSettings = normalizeAppLogicSettings(source);
    const parsedDaysPerWeek = Number.parseInt(source.daysPerWeek, 10);
    const parsedSessionsPerWeek = Number.parseInt(source.sessionsPerWeek, 10);
    const fallbackSessionsPerWeek = Number.parseInt(this.sessionsPerWeek, 10);
    const parsedNumWeeks = Number.parseInt(source.numWeeks, 10);
    const parsedTrainingPlanBatch = Number.parseInt(source.trainingPlanBatch, 10);

    const daysPerWeek =
      Number.isFinite(parsedDaysPerWeek) && parsedDaysPerWeek > 0 ?
        parsedDaysPerWeek :
        Number.isFinite(parsedSessionsPerWeek) && parsedSessionsPerWeek > 0 ?
          parsedSessionsPerWeek :
          Number.isFinite(fallbackSessionsPerWeek) && fallbackSessionsPerWeek > 0 ?
            fallbackSessionsPerWeek :
            3;

    const focusEmphasis =
      typeof source.focusEmphasis === "string" && source.focusEmphasis ?
        source.focusEmphasis :
        Array.isArray(source.preferences) &&
            typeof source.preferences[0] === "string" &&
            source.preferences[0] ?
          source.preferences[0] :
          "mixed";

    const weeksFromSubscription = this.getPlannedWeeksFromSubscription?.() || 0;
    const rawPreferredWeekdays = Array.isArray(source.preferredWeekdays) ?
      source.preferredWeekdays :
      [];
    const preferredWeekdays = Array.from({ length: daysPerWeek }, (_, index) =>
      getNormalizedWeekday(rawPreferredWeekdays[index])
    );
    const sessionDuration = getNormalizedSessionDuration(source);
    const sessionDurationMinutes = getSessionDurationMinutes(sessionDuration);
    const equipment =
      typeof source.equipment === "string" && source.equipment ?
        source.equipment :
        "full_gym";
    const {
      primaryStyle: _primaryStyle,
      weightClass: _weightClass,
      ...trainingPlanSource
    } = source;

    return {
      ...trainingPlanSource,
      ...normalizedAppLogicSettings,
      sportLoadMultiplier: getSportLoadMultiplier(
        normalizedAppLogicSettings.sportLoadLevel
      ),
      primaryCombatSport: source.primaryCombatSport || this.primaryCombatSport || "",
      sessionsPerWeek:
        Number.isFinite(parsedSessionsPerWeek) && parsedSessionsPerWeek > 0 ?
          parsedSessionsPerWeek :
          daysPerWeek,
      daysPerWeek,
      preferredWeekdays,
      sessionDuration,
      sessionDurationMinutes,
      equipment,
      focusEmphasis,
      preferences:
        Array.isArray(source.preferences) && source.preferences.length > 0 ?
          source.preferences.filter(Boolean) :
          [focusEmphasis].filter(Boolean),
      injuries: Array.isArray(source.injuries) ? source.injuries.filter(Boolean) : [],
      competitionPeriod:
        source.competitionPeriod ||
        (normalizedAppLogicSettings.trainingPhase === "in_camp" ?
          "fight_camp" :
          "off_season"),
      trainingPerformanceSummary: this.getTrainingPerformanceSummary(),
      strengthAssessmentSummary: this.getStrengthAssessmentSummary(),
      numWeeks:
        Number.isFinite(weeksFromSubscription) && weeksFromSubscription > 0 ?
          weeksFromSubscription :
          Number.isFinite(parsedNumWeeks) && parsedNumWeeks > 0 ?
            parsedNumWeeks :
            4,
      trainingPlanBatch:
        Number.isFinite(parsedTrainingPlanBatch) && parsedTrainingPlanBatch > 0 ?
          parsedTrainingPlanBatch :
          this.getTrainingPlanBatch?.() || 1,
    };
  },

  async generateTrainingPlan(userInput = this.buildTrainingPlanInput()) {
    if (!userInput || typeof userInput !== "object") {
      throw new Error(
        "Please complete the onboarding questions before generating a training plan."
      );
    }

    const prms = generatePlan(userInput).then((plan) => {
      if (this.trainingPlanPromiseState.promise === prms) {
        this.trainingPlan = sanitizeTrainingPlanForQuestionnaire(
          applySportLoadLevelToPlanWeek(
            plan,
            1,
            userInput?.sportLoadLevel,
            {
              completedDays: [],
              skipCompletedDays: false,
            }
          ),
          userInput
        );
        this.completedDays = [];
      }

      return this.trainingPlanPromiseState.promise === prms ? this.trainingPlan : plan;
    });

    resolvePromise(prms, this.trainingPlanPromiseState);
    return prms;
  },

  replaceTrainingPlanExercise(weekNumber, dayNumber, exerciseIndex, substitutionId) {
    if (!this.trainingPlan) {
      return;
    }

    this.trainingPlan = replaceTrainingPlanExercise(
      this.trainingPlan,
      weekNumber,
      dayNumber,
      exerciseIndex,
      substitutionId
    );
  },

  getCurrentTrainingDay(completedDays = this.completedDays) {
    return getCurrentTrainingDay(this.trainingPlan, completedDays);
  },

  getTrackableTrainingDayCount() {
    return countTrackableTrainingDays(this.trainingPlan);
  },

  async reportMissedSession({
    weekNumber,
    dayNumber,
    reason = "schedule_travel",
    daysUnavailable = 0,
  } = {}) {
    if (!this.trainingPlan) {
      return null;
    }

    const questionnaire =
      this.questionnaire && typeof this.questionnaire === "object" ?
        this.questionnaire :
        {};
    const adjustment = applyMissedSessionAdjustment(this.trainingPlan, {
      completedDays: this.completedDays,
      weekNumber,
      dayNumber,
      reason,
      daysUnavailable,
      trainingPhase: questionnaire.trainingPhase,
      competitionTimeline: questionnaire.competitionTimeline,
    });

    let nextPlan = adjustment.plan;
    const nextCompletedDays = Array.isArray(adjustment.completedDays) ?
      adjustment.completedDays :
      Array.from(this.completedDays || []);

    if (adjustment.aiAdjustment) {
      try {
        const rewrittenDay = await adjustTrainingDayForMissedSession({
          questionnaire,
          currentPlan: nextPlan,
          currentWeek: adjustment.aiAdjustment.currentWeek,
          sourceDay: adjustment.aiAdjustment.sourceDay,
          targetDay: adjustment.aiAdjustment.targetDay,
          mode: adjustment.aiAdjustment.mode,
          reason: adjustment.aiAdjustment.reason,
          missedSessionCount: adjustment.aiAdjustment.missedSessionCount,
        });

        nextPlan = replaceTrainingPlanDay(
          nextPlan,
          adjustment.aiAdjustment.weekNumber,
          adjustment.aiAdjustment.dayNumber,
          rewrittenDay
        );
      } catch (error) {
        console.warn(
          "[CombatModel.reportMissedSession] AI rescue rewrite failed, keeping the local fallback adjustment:",
          error
        );
      }
    }

    this.trainingPlan = sanitizeTrainingPlanForQuestionnaire(
      nextPlan,
      questionnaire
    );
    this.completedDays = nextCompletedDays;

    return {
      action: adjustment.action || "skip_session",
      plan: this.trainingPlan,
      completedDays: nextCompletedDays,
    };
  },

  isSubscribed() {
    if (!this.subscriptionEndDate) {
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(this.subscriptionEndDate);
    endDate.setHours(0, 0, 0, 0);
    return today <= endDate;
  },

  /**
   * Applies server-verified subscription state directly.
   * @param {object} nextState
   * @param {boolean} nextState.subscription
   * @param {string|null} nextState.subscriptionEndDate
   */
  applySubscriptionState({ subscription, subscriptionEndDate }) {
    const normalizedSubscriptionEndDate = subscriptionEndDate || null;
    const hasActiveSubscription = Boolean(
      normalizedSubscriptionEndDate &&
      new Date(normalizedSubscriptionEndDate) >= new Date(new Date().setHours(0, 0, 0, 0))
    );
    const shouldResetTrainingProgress =
      hasActiveSubscription &&
      !this.subscriptionEndDate;

    this.subscription = Boolean(subscription) || hasActiveSubscription;
    this.subscriptionEndDate = normalizedSubscriptionEndDate;

    if (shouldResetTrainingProgress) {
      this.resetTrainingProgress();
    }
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
    if (!this.subscriptionEndDate) {
      return -1;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(this.subscriptionEndDate);
    endDate.setHours(0, 0, 0, 0);
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
    this.completedDays = [];
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
    this.completedDays = [];
    this.trainingPerformanceState = createDefaultTrainingPerformanceState();
    this.trainingCheckInState = createDefaultTrainingCheckInState();
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

    const todayWeekday = getWeekdayNameFromIndex(new Date().getDay());

    if (!todayWeekday) {
      return false;
    }

    for (const week of this.trainingPlan.weeks) {
      for (const day of week.days) {
        if (getTrainingDayPreferredWeekday(day) === todayWeekday) {
          return Array.isArray(day.exercises) && day.exercises.length > 0;
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

  getDefaultForumPostDraft() {
    const normalizedTopic =
      typeof this.primaryCombatSport === "string" &&
      this.primaryCombatSport.trim() ?
        this.primaryCombatSport.trim().toLowerCase() :
        "general";

    return {
      title: "New training question",
      body: "What would you adjust here based on my current training week?",
      topic: normalizedTopic,
      coachResponseRequested: false,
    };
  },

  onTrackWithTraining() {
    this.dailyTrainingState !== "missed";
  },
};
