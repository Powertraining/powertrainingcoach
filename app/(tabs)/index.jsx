import {
  useState,
  useEffect,
  useRef } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams,
  useRouter } from "expo-router";
import {
  Animated,
  Easing,
  useWindowDimensions,
  View,
  StyleSheet,
} from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

import StartView from "../../src/screens/home/StartView.jsx";
import QuestionnaireSportView from "../../src/screens/questionnaire/QuestionnaireSportView.jsx";
import QuestionnaireFrequencyView from "../../src/screens/questionnaire/QuestionnaireFrequencyView.jsx";
import InputFormView from "../../src/screens/InputFormView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ErrorView from "../../src/screens/ErrorView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import WhiteBottomMenu from "../../src/components/profileComponents/WhiteBottomMenu.jsx";
import BlackGradient from "../../src/components/colorComponents/BlackGradient.jsx";
import { refreshSubscriptionStatus } from "../../src/services/utils/stripeClient.js";
import { PRIMARY_COMBAT_SPORT_OPTIONS } from "../../src/constants/combatSports.js";
import { getClosestActiveTrainingDay } from "../../src/services/utils/trainingPlan.js";
import { getParamValue } from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const STEPS = Object.freeze({
  START: "start",
  Q_SPORT: "questionnaireSport",
  Q_FREQ: "questionnaireFrequency",
  INPUT: "input",
});

function getPlanGenerationErrorMessage(error) {
  const message = error?.message || "";

  if (/substitution option \d+ must be an object/i.test(message)) {
    return (
      "The generated plan had an invalid exercise substitution. Please try again."
    );
  }

  if (/failed to generate training plan/i.test(message)) {
    return "Could not generate your personalized training plan. Please try again.";
  }

  return message || "Could not generate your personalized training plan.";
}

function RightSlideQuestionnaireStep({ step, children }) {
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(width || 360)).current;
  const opacity = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateX]);

  return (
    <Animated.View
      key={step}
      style={[
        styles.questionnaireStep,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const HomeScreen = observer(function HomeScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [step, setStep] = useState(STEPS.START);
  const [questionnaireResumeStep, setQuestionnaireResumeStep] = useState(STEPS.Q_SPORT);
  const [questionnaireDraft, setQuestionnaireDraft] = useState({});
  const [inputActiveStep, setInputActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushingBackSession, setPushingBackSession] = useState(false);
  const [pushBackConfirmVisible, setPushBackConfirmVisible] = useState(false);
  const [error, setError] = useState(null);
  const subscriptionRefreshAttemptedRef = useRef("");

  function getSafeResumeStep() {
    const resume = getParamValue(params.resume);
    const allowedSteps = new Set([
      STEPS.START,
      STEPS.Q_SPORT,
      STEPS.Q_FREQ,
      STEPS.INPUT,
    ]);

    if (typeof resume !== "string" || !allowedSteps.has(resume)) {
      return "";
    }

    return resume;
  }

  const resumeStep = getSafeResumeStep();

  function setQuestionnaireStep(nextStep) {
    setStep(nextStep);

    if (nextStep !== STEPS.START) {
      setQuestionnaireResumeStep(nextStep);
    }
  }

  function resetQuestionnaireProgress() {
    setStep(STEPS.START);
    setQuestionnaireResumeStep(STEPS.Q_SPORT);
    setQuestionnaireDraft({});
    setInputActiveStep(0);
  }

  useEffect(() => {
    if (model.trainingPlan) {
      resetQuestionnaireProgress();
      return;
    }

    if (resumeStep) {
      setQuestionnaireStep(resumeStep);
      return;
    }

    if (model.questionnaire?.pendingCycleReview) {
      setQuestionnaireStep(STEPS.Q_SPORT);
    }
  }, [model.questionnaire, model.trainingPlan, resumeStep]);

  useEffect(() => {
    if (!model.user?.uid) {
      subscriptionRefreshAttemptedRef.current = "";
      return;
    }

    if (subscriptionRefreshAttemptedRef.current === model.user.uid) {
      return;
    }

    if (model.isSubscribed?.()) {
      return;
    }

    const refreshUid = model.user.uid;
    subscriptionRefreshAttemptedRef.current = refreshUid;

    refreshSubscriptionStatus()
      .then((result) => {
        if (!result?.refreshed || model.user?.uid !== refreshUid) {
          return;
        }

        model.applySubscriptionState?.({
          subscription: result.active,
          subscriptionEndDate: result.subscriptionEndDate,
          subscriptionStartDate: result.subscriptionStartDate,
          subscriptionType: result.subscriptionType,
          subscriptionStatus: result.subscriptionStatus,
          lookupKey: result.lookupKey,
        });
      })
      .catch((error) => {
        console.warn("Could not refresh Stripe subscription status:", error);
      });
  }, [model, model.ready, model.user, router]);

  useEffect(() => {
    model.setPlanGenerationTabBarHidden?.(loading);

    return () => {
      model.setPlanGenerationTabBarHidden?.(false);
    };
  }, [loading, model]);

  if (!model.ready) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  // Check auth
  if (!model.user) {
    return (
      <AuthGateView
        onLogin={() => router.push("/(auth)/login")}
        onSignup={() => router.push("/(auth)/signup")}
      />
    );
  }

  function goBack() {
    switch (step) {
      case STEPS.Q_SPORT:
        setStep(STEPS.START);
        break;
      case STEPS.Q_FREQ:
        setQuestionnaireStep(STEPS.Q_SPORT);
        break;
      case STEPS.INPUT:
        setQuestionnaireStep(STEPS.Q_FREQ);
        break;
      default:
        setStep(STEPS.START);
    }
  }

  function closeQuestionnaire() {
    setStep(STEPS.START);
  }

  useAndroidBackHandler(() => {
    if (pushBackConfirmVisible) {
      closePushBackConfirm();
      return;
    }

    if (step === STEPS.Q_SPORT || step === STEPS.Q_FREQ) {
      goBack();
      return;
    }

    return false;
  }, [pushBackConfirmVisible, step, inputActiveStep]);

  function buildQuestionnairePayload(input, pendingPlanGeneration) {
    return {
      ...input,
      daysPerWeek: model.sessionsPerWeek,
      primaryCombatSport: model.primaryCombatSport,
      sessionsPerWeek: model.sessionsPerWeek,
      parentCycleWeeks:
        input.parentCycleWeeks || model.questionnaire?.parentCycleWeeks,
      trainingPlanBatch: model.getTrainingPlanBatch?.() || 1,
      pendingPlanGeneration,
      pendingCycleReview: false,
    };
  }

  async function generatePlanFromQuestionnaire(questionnaire) {
    setLoading(true);
    setError(null);

    try {
      const normalizedQuestionnaire =
        model.buildTrainingPlanInput?.(questionnaire) || questionnaire;
      const generatedPlan = await model.generateTrainingPlan?.(normalizedQuestionnaire);
      model.setQuestionnaire?.({
        ...questionnaire,
        parentCycleWeeks: normalizedQuestionnaire.parentCycleWeeks,
        generatedBlockWeeks: normalizedQuestionnaire.generatedBlockWeeks,
        blockStartWeek: normalizedQuestionnaire.blockStartWeek,
        blockEndWeek: normalizedQuestionnaire.blockEndWeek,
        pendingPlanGeneration: false,
        pendingCycleReview: false,
      });
      resetQuestionnaireProgress();

      const currentTrainingDay =
        getClosestActiveTrainingDay(generatedPlan || model.trainingPlan, []) ||
        model.getCurrentTrainingDay?.([]);
      const weekNumber = Number.parseInt(currentTrainingDay?.week, 10);
      const dayNumber = Number.parseInt(currentTrainingDay?.day, 10);

      if (Number.isFinite(weekNumber) && Number.isFinite(dayNumber)) {
        router.replace({
          pathname: "/(tabs)/overview",
          params: {
            week: String(weekNumber),
            day: String(dayNumber),
            returnTo: "/(tabs)",
          },
        });
        return;
      }

      router.replace("/(tabs)/overview");
    } catch (e) {
      console.error("Error generating training plan:", e);
      const message = getPlanGenerationErrorMessage(e);
      setError(message);
      model.showError?.(e, "Could not generate your personalized training plan. Please try again.");
      setStep(STEPS.INPUT);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuestionnaireSubmit(input) {
    const requiresSubscription = !model.isSubscribed?.();
    const questionnaire = buildQuestionnairePayload(
      input,
      requiresSubscription
    );

    model.setQuestionnaire?.(questionnaire);

    if (requiresSubscription) {
      router.push({
        pathname: "/(tabs)/subscription",
        params: { returnTo: "/(tabs)?resume=input" },
      });
      return;
    }

    await generatePlanFromQuestionnaire(questionnaire);
  }

  function getCurrentSession() {
    const pointer =
      getClosestActiveTrainingDay(model.trainingPlan, model.completedDays) ||
      model.getCurrentTrainingDay?.(model.completedDays);
    const weekNumber = Number.parseInt(pointer?.week, 10);
    const dayNumber = Number.parseInt(pointer?.day, 10);

    if (!model.trainingPlan || !Number.isFinite(weekNumber) || !Number.isFinite(dayNumber)) {
      return null;
    }

    const week = model.trainingPlan.weeks?.find(
      (candidateWeek) => candidateWeek.week === weekNumber
    );
    const day = week?.days?.find(
      (candidateDay) => candidateDay.day === dayNumber
    );

    if (!week || !day) {
      return null;
    }

    return {
      week: weekNumber,
      day: dayNumber,
      sessionLabel: day.sessionLabel || `Week ${weekNumber} Day ${dayNumber}`,
      preferredWeekday: day.preferredWeekday || "",
      sessionProfile: day.sessionProfile || null,
      exercises: Array.isArray(day.exercises) ? day.exercises : [],
      sessionDurationMinutes: model.questionnaire?.sessionDurationMinutes,
    };
  }

  function getExerciseProgressForSession(session) {
    if (!session) {
      return {
        completedExerciseCount: 0,
        totalExerciseCount: 0,
        hasStartedSession: false,
      };
    }

    const sessionKey = `${session.week}-${session.day}`;
    const sessionProgress = model.activeSessionProgressByKey?.[sessionKey];
    const completedStepKeys = new Set(
      Array.isArray(sessionProgress?.completedStepKeys)
        ? sessionProgress.completedStepKeys
        : []
    );
    const exercises = Array.isArray(session.exercises) ? session.exercises : [];
    const completedExerciseCount = exercises.filter((exercise, exerciseIndex) => {
      const parsedSetCount = Number.parseInt(exercise?.sets, 10);
      const setCount =
        Number.isFinite(parsedSetCount) && parsedSetCount > 0
          ? Math.min(parsedSetCount, 12)
          : 1;

      return Array.from({ length: setCount }).every((_, setIndex) =>
        completedStepKeys.has(`${exerciseIndex}:${setIndex}`)
      );
    }).length;

    return {
      completedExerciseCount,
      totalExerciseCount: exercises.length,
      hasStartedSession:
        completedStepKeys.size > 0 ||
        Boolean(
          sessionProgress?.trackingDrafts &&
            Object.values(sessionProgress.trackingDrafts).some((draft) =>
              draft?.loadKg ||
              draft?.reps ||
              draft?.rpe ||
              Object.values(draft?.customValues || {}).some(Boolean)
            )
        ),
    };
  }

  function openCurrentSession() {
    const currentSession = getCurrentSession();

    if (!currentSession) {
      router.push("/(tabs)/overview");
      return;
    }

    model.setForumTabBarHidden?.(true);
    router.push({
      pathname: "/(tabs)/active-session",
      params: {
        week: String(currentSession.week),
        day: String(currentSession.day),
        returnTo: "/(tabs)",
      },
    });
  }

  async function pushBackCurrentSession() {
    const currentSession = getCurrentSession();

    if (!currentSession || pushingBackSession) {
      return;
    }

    setPushingBackSession(true);

    try {
      await model.reportMissedSession?.({
        weekNumber: currentSession.week,
        dayNumber: currentSession.day,
      });
    } catch (error) {
      console.error("Could not update missed session logic:", error);
      model.showError?.(error, "Could not push this session back. Please try again.");
    } finally {
      setPushingBackSession(false);
    }
  }

  function openPushBackConfirm() {
    if (pushingBackSession) {
      return;
    }

    setPushBackConfirmVisible(true);
  }

  function closePushBackConfirm() {
    if (pushingBackSession) {
      return;
    }

    setPushBackConfirmVisible(false);
  }

  async function confirmPushBackCurrentSession() {
    setPushBackConfirmVisible(false);
    await pushBackCurrentSession();
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.planGenerationContainer]}>
        <BlackGradient />
        <LoadingView label="Generating" progress />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorView
          message={error}
          onRetry={() => {
            setError(null);
            setStep(STEPS.INPUT);
          }}
        />
      </View>
    );
  }

  const currentSession = getCurrentSession();
  const { completedExerciseCount, totalExerciseCount, hasStartedSession } =
    getExerciseProgressForSession(currentSession);

  const renderByStep = {
    [STEPS.START]: () => (
      <StartView
        hasProgram={Boolean(model.trainingPlan)}
        plan={model.trainingPlan}
        questionnaire={model.questionnaire}
        completedDays={model.completedDays}
        currentSession={currentSession}
        completedExerciseCount={completedExerciseCount}
        totalExerciseCount={totalExerciseCount}
        hasStartedSession={hasStartedSession}
        isPushingBackSession={pushingBackSession}
        onStart={() => setQuestionnaireStep(questionnaireResumeStep)}
        onStartSession={openCurrentSession}
        onPushBackSession={openPushBackConfirm}
        onAdjustPlan={() =>
          router.push({
            pathname: "/(tabs)/profile-plan-adjustments",
            params: { returnTo: "/(tabs)" },
          })
        }
        onMyPosts={() =>
          router.push({
            pathname: "/(tabs)/profile-my-posts",
            params: { returnTo: "/(tabs)" },
          })
        }
      />
    ),

    [STEPS.Q_SPORT]: () => (
      <QuestionnaireSportView
        options={PRIMARY_COMBAT_SPORT_OPTIONS}
        value={questionnaireDraft?.primaryCombatSport ?? null}
        onChange={(sport) => {
          model.primaryCombatSport = sport;
          setQuestionnaireDraft((currentDraft) => ({
            ...currentDraft,
            primaryCombatSport: sport,
          }));
        }}
        onBack={goBack}
        onClose={closeQuestionnaire}
        onContinue={() => setQuestionnaireStep(STEPS.Q_FREQ)}
      />
    ),

    [STEPS.Q_FREQ]: () => (
      <QuestionnaireFrequencyView
        value={questionnaireDraft?.sessionsPerWeek ?? 1}
        onChange={(freq) => {
          model.sessionsPerWeek = freq;
          setQuestionnaireDraft((currentDraft) => ({
            ...currentDraft,
            sessionsPerWeek: freq,
            daysPerWeek: freq,
          }));
        }}
        onBack={goBack}
        onClose={closeQuestionnaire}
        onContinue={() => setQuestionnaireStep(STEPS.INPUT)}
      />
    ),

    [STEPS.INPUT]: () => (
      <InputFormView
        onSubmit={handleQuestionnaireSubmit}
        onBack={goBack}
        initialValues={{
          ...questionnaireDraft,
        }}
        initialActiveStep={inputActiveStep}
        onActiveStepChange={setInputActiveStep}
        onDraftChange={setQuestionnaireDraft}
        subscription={model.isSubscribed?.() || false}
        daysRemaining={model.getDaysRemainingInSubscription?.() || 0}
        onClose={closeQuestionnaire}
      />
    ),
  };

  const render = renderByStep[step];

  return (
    <View style={styles.container}>
      {render ? (
        step === STEPS.START ? (
          render()
        ) : (
          <RightSlideQuestionnaireStep key={step} step={step}>
            {render()}
          </RightSlideQuestionnaireStep>
        )
      ) : null}
      <WhiteBottomMenu
        visible={pushBackConfirmVisible}
        onDismiss={closePushBackConfirm}
        title="Push back session?"
        description="This moves the session forward and updates the plan around the missed slot."
        buttonText={pushingBackSession ? "Updating..." : "Yes, push back"}
        buttonDisabled={pushingBackSession}
        onButtonPress={confirmPushBackCurrentSession}
        secondaryButtonText="Cancel"
        secondaryButtonDisabled={pushingBackSession}
        onSecondaryButtonPress={closePushBackConfirm}
      />
    </View>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  questionnaireStep: {
    flex: 1,
  },
  planGenerationContainer: {
    overflow: "hidden",
  },
});
