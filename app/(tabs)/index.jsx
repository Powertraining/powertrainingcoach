import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

import StartView from "../../src/screens/home/StartView.jsx";
import QuestionnaireSportView from "../../src/screens/questionnaire/QuestionnaireSportView.jsx";
import QuestionnaireFrequencyView from "../../src/screens/questionnaire/QuestionnaireFrequencyView.jsx";
import InputFormView from "../../src/screens/InputFormView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ErrorView from "../../src/screens/ErrorView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import { refreshSubscriptionStatus } from "../../src/services/utils/stripeClient.js";
import { PRIMARY_COMBAT_SPORT_OPTIONS } from "../../src/constants/combatSports.js";

const STEPS = Object.freeze({
  START: "start",
  Q_SPORT: "questionnaireSport",
  Q_FREQ: "questionnaireFrequency",
  INPUT: "input",
});

const HomeScreen = observer(function HomeScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [step, setStep] = useState(STEPS.START);
  const [questionnaireResumeStep, setQuestionnaireResumeStep] = useState(STEPS.Q_SPORT);
  const [questionnaireDraft, setQuestionnaireDraft] = useState(() => model.questionnaire || {});
  const [inputActiveStep, setInputActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushingBackSession, setPushingBackSession] = useState(false);
  const [error, setError] = useState(null);
  const subscriptionRefreshAttemptedRef = useRef("");

  function getParamValue(value) {
    return Array.isArray(value) ? value[0] : value;
  }

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
    setQuestionnaireDraft(model.questionnaire || {});
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

    subscriptionRefreshAttemptedRef.current = model.user.uid;

    refreshSubscriptionStatus()
      .then((result) => {
        if (!result?.refreshed) {
          return;
        }

        model.applySubscriptionState?.({
          subscription: result.active,
          subscriptionEndDate: result.subscriptionEndDate,
          subscriptionStartDate: result.subscriptionStartDate,
          lookupKey: result.lookupKey,
        });
      })
      .catch((error) => {
        console.warn("Could not refresh Stripe subscription status:", error);
      });
  }, [model, model.ready, model.user, router]);

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

  function buildQuestionnairePayload(input, pendingPlanGeneration) {
    return {
      ...input,
      daysPerWeek: model.sessionsPerWeek,
      primaryCombatSport: model.primaryCombatSport,
      sessionsPerWeek: model.sessionsPerWeek,
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
      await model.generateTrainingPlan?.(normalizedQuestionnaire);
      model.setQuestionnaire?.({
        ...questionnaire,
        pendingPlanGeneration: false,
        pendingCycleReview: false,
      });
      resetQuestionnaireProgress();
      router.replace("/(tabs)/overview");
    } catch (e) {
      console.error("Error generating training plan:", e);
      setError(
        e.message || "Could not generate your personalized training plan."
      );
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
    const pointer = model.getCurrentTrainingDay?.(model.completedDays);
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

    router.push({
      pathname: "/(tabs)/active-session",
      params: {
        week: String(currentSession.week),
        day: String(currentSession.day),
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
    } finally {
      setPushingBackSession(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingView />
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
        onPushBackSession={pushBackCurrentSession}
        onAdjustPlan={() => router.push("/(tabs)/profile-plan-adjustments")}
        onMyPosts={() => router.push("/(tabs)/profile-my-posts")}
      />
    ),

    [STEPS.Q_SPORT]: () => (
      <QuestionnaireSportView
        options={PRIMARY_COMBAT_SPORT_OPTIONS}
        value={model.primaryCombatSport}
        onChange={(sport) => {
          model.primaryCombatSport = sport;
        }}
        onBack={goBack}
        onClose={closeQuestionnaire}
        onContinue={() => setQuestionnaireStep(STEPS.Q_FREQ)}
      />
    ),

    [STEPS.Q_FREQ]: () => (
      <QuestionnaireFrequencyView
        value={model.sessionsPerWeek}
        onChange={(freq) => {
          model.sessionsPerWeek = freq;
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
          daysPerWeek: model.sessionsPerWeek,
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

  return <View style={styles.container}>{render ? render() : null}</View>;
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
