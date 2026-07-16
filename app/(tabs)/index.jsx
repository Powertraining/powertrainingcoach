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
  Modal,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

import StartView from "../../src/screens/home/StartView.jsx";
import QuestionnaireSportView from "../../src/screens/questionnaire/QuestionnaireSportView.jsx";
import QuestionnaireFrequencyView from "../../src/screens/questionnaire/QuestionnaireFrequencyView.jsx";
import InputFormView from "../../src/screens/InputFormView.jsx";
import {
  getTrainingPreferencesStepKeys,
  getTrainingPreferencesStepLabel,
} from "../../src/screens/TrainingPreferencesFields.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ErrorView from "../../src/screens/ErrorView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import WhiteBottomMenu from "../../src/components/profileComponents/WhiteBottomMenu.jsx";
import SessionMoveCalendar from "../../src/components/planComponents/SessionMoveCalendar.jsx";
import BlackGradient from "../../src/components/colorComponents/BlackGradient.jsx";
import IBMPlexText from "../../src/components/textComponents/IBMPlexText.jsx";
import { refreshSubscriptionStatus } from "../../src/services/utils/stripeClient.js";
import { PRIMARY_COMBAT_SPORT_OPTIONS } from "../../src/constants/combatSports.js";
import { getWeekdayNameFromIndex } from "../../src/constants/weekdays.js";
import { getClosestActiveTrainingDay } from "../../src/services/utils/trainingPlan.js";
import { getPlanWeekStartDate } from "../../src/services/utils/programOverview.js";
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
  const [pushBackTarget, setPushBackTarget] = useState(null);
  const [selectedMoveDate, setSelectedMoveDate] = useState(null);
  const [questionnaireNavigatorVisible, setQuestionnaireNavigatorVisible] =
    useState(false);
  const [error, setError] = useState(null);
  const subscriptionRefreshAttemptedRef = useRef("");

  useEffect(() => {
    model.restoreRemovedManualSessionMerges?.();
  }, [model, model.trainingPlan]);

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
        setInputActiveStep(1);
        setQuestionnaireStep(STEPS.INPUT);
        break;
      case STEPS.INPUT:
        setQuestionnaireStep(STEPS.Q_SPORT);
        break;
      default:
        setStep(STEPS.START);
    }
  }

  function closeQuestionnaire() {
    setStep(STEPS.START);
  }

  function getQuestionnaireNavigatorItems() {
    const inputValues = {
      ...questionnaireDraft,
      primaryCombatSport:
        questionnaireDraft?.primaryCombatSport || model.primaryCombatSport,
      sessionsPerWeek:
        questionnaireDraft?.sessionsPerWeek || model.sessionsPerWeek || 1,
      daysPerWeek:
        questionnaireDraft?.daysPerWeek ||
        questionnaireDraft?.sessionsPerWeek ||
        model.sessionsPerWeek ||
        1,
    };

    return [
      {
        label: "Combat sport",
        detail: "Question 1",
        step: STEPS.Q_SPORT,
      },
      {
        label: "Training frequency",
        detail: "Question 2",
        step: STEPS.Q_FREQ,
      },
      ...getTrainingPreferencesStepKeys(inputValues).map((stepKey, index) => ({
        label: getTrainingPreferencesStepLabel(stepKey),
        detail: `Question ${index + 3}`,
        step: STEPS.INPUT,
        inputStep: index,
      })),
    ];
  }

  function openQuestionnaireNavigator() {
    setQuestionnaireNavigatorVisible(true);
  }

  function closeQuestionnaireNavigator() {
    setQuestionnaireNavigatorVisible(false);
  }

  function resetUserProgressForTesting() {
    setPushBackConfirmVisible(false);
    closeQuestionnaireNavigator();
    resetQuestionnaireProgress();
    model.resetUserProgressForTesting?.();
  }

  function navigateToQuestionnaireItem(item) {
    closeQuestionnaireNavigator();

    if (typeof item.inputStep === "number") {
      setInputActiveStep(item.inputStep);
    }

    setQuestionnaireStep(item.step);
  }

  function buildQuestionnairePayload(input, pendingPlanGeneration) {
    const sessionsPerWeek =
      Number.parseInt(input.sessionsPerWeek ?? input.daysPerWeek, 10) ||
      model.sessionsPerWeek;

    return {
      ...input,
      daysPerWeek: sessionsPerWeek,
      primaryCombatSport: model.primaryCombatSport,
      sessionsPerWeek,
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

    model.sessionsPerWeek = questionnaire.sessionsPerWeek;
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

  function openTrainingSession(weekNumber, dayNumber) {
    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const parsedDayNumber = Number.parseInt(dayNumber, 10);

    if (!Number.isFinite(parsedWeekNumber) || !Number.isFinite(parsedDayNumber)) {
      openCurrentSession();
      return;
    }

    model.setForumTabBarHidden?.(true);
    router.push({
      pathname: "/(tabs)/active-session",
      params: {
        week: String(parsedWeekNumber),
        day: String(parsedDayNumber),
        returnTo: "/(tabs)",
      },
    });
  }

  function openOverviewDay(weekNumber, dayNumber) {
    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const parsedDayNumber = Number.parseInt(dayNumber, 10);

    if (!Number.isFinite(parsedWeekNumber) || !Number.isFinite(parsedDayNumber)) {
      router.push("/(tabs)/overview");
      return;
    }

    router.push({
      pathname: "/(tabs)/overview",
      params: {
        week: String(parsedWeekNumber),
        day: String(parsedDayNumber),
      },
    });
  }

  function openPlanAdjustments() {
    router.push({
      pathname: "/(tabs)/profile-plan-adjustments",
      params: { returnTo: "/(tabs)" },
    });
  }

  function openEventPreparation() {
    router.push({
      pathname: "/(tabs)/profile-event-preparation",
      params: { returnTo: "/(tabs)" },
    });
  }

  function openMyPosts() {
    router.push({
      pathname: "/(tabs)/profile-my-posts",
      params: { returnTo: "/(tabs)" },
    });
  }

  function openReportInjury() {
    router.push("/(tabs)/profile-injuries");
  }

  async function moveCurrentSession(targetSession = null, targetDate = null) {
    const currentSession = targetSession || getCurrentSession();

    if (!currentSession || !targetDate || pushingBackSession) {
      return;
    }

    setPushingBackSession(true);

    try {
      await model.moveTrainingSession?.({
        weekNumber: currentSession.week,
        dayNumber: currentSession.day,
        targetDate,
        targetWeekday: getWeekdayNameFromIndex(targetDate.getDay()),
      });
    } catch (error) {
      console.error("Could not move session:", error);
      model.showError?.(error, "Could not move this session. Please try again.");
    } finally {
      setPushingBackSession(false);
    }
  }

  function openPushBackConfirm(weekNumber, dayNumber, sourceDate) {
    if (pushingBackSession) {
      return;
    }

    const parsedWeekNumber = Number.parseInt(weekNumber, 10);
    const parsedDayNumber = Number.parseInt(dayNumber, 10);

    setPushBackTarget(
      Number.isFinite(parsedWeekNumber) && Number.isFinite(parsedDayNumber)
        ? {
            week: parsedWeekNumber,
            day: parsedDayNumber,
            sourceDate:
              sourceDate instanceof Date && !Number.isNaN(sourceDate.getTime())
                ? new Date(sourceDate)
                : new Date(),
          }
        : null
    );
    setSelectedMoveDate(null);
    setPushBackConfirmVisible(true);
  }

  function closePushBackConfirm() {
    if (pushingBackSession) {
      return;
    }

    setPushBackConfirmVisible(false);
    setPushBackTarget(null);
    setSelectedMoveDate(null);
  }

  async function confirmPushBackCurrentSession() {
    const targetSession = pushBackTarget;
    const targetDate = selectedMoveDate;

    setPushBackConfirmVisible(false);
    setPushBackTarget(null);
    setSelectedMoveDate(null);
    await moveCurrentSession(targetSession, targetDate);
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

  const questionnaireNavigatorItems = getQuestionnaireNavigatorItems();

  const renderByStep = {
    [STEPS.START]: () => (
      <StartView
        hasProgram={Boolean(model.trainingPlan)}
        plan={model.trainingPlan}
        trainingPlanHistory={model.trainingPlanHistory}
        questionnaire={model.questionnaire}
        completedDays={model.completedDays}
        activeSessionProgressByKey={model.activeSessionProgressByKey}
        completedSessionProgressByKey={model.completedSessionProgressByKey}
        onStart={() => setQuestionnaireStep(questionnaireResumeStep)}
        onNavigateQuestionnaire={openQuestionnaireNavigator}
        onStartSession={openTrainingSession}
        onOpenOverview={openOverviewDay}
        onResetUserProgress={resetUserProgressForTesting}
        onAdjustPlan={openPlanAdjustments}
        onOpenEventPreparation={openEventPreparation}
        onOpenMyPosts={openMyPosts}
        onOpenWellness={openReportInjury}
        onMoveSession={openPushBackConfirm}
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
        onContinue={() => setQuestionnaireStep(STEPS.INPUT)}
      />
    ),

    [STEPS.Q_FREQ]: () => (
      <QuestionnaireFrequencyView
        value={questionnaireDraft?.sessionsPerWeek ?? model.sessionsPerWeek ?? 1}
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
        onContinue={() => {
          const freq =
            Number.parseInt(
              questionnaireDraft?.sessionsPerWeek ?? model.sessionsPerWeek ?? 1,
              10
            ) || 1;

          model.sessionsPerWeek = freq;
          setQuestionnaireDraft((currentDraft) => ({
            ...currentDraft,
            sessionsPerWeek: freq,
            daysPerWeek: freq,
          }));
          setQuestionnaireStep(STEPS.INPUT);
        }}
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
        onDesiredTrainingContinue={(nextStep) => {
          setInputActiveStep(nextStep);
          setQuestionnaireStep(STEPS.Q_FREQ);
        }}
        onBackToFrequency={(currentStep) => {
          setInputActiveStep(currentStep);
          setQuestionnaireStep(STEPS.Q_FREQ);
        }}
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
        title="Reschedule session"
        description="Choose an exact available date from this training week."
        content={
          <SessionMoveCalendar
            sourceDate={pushBackTarget?.sourceDate}
            weekStartDate={getPlanWeekStartDate(
              model.trainingPlan,
              pushBackTarget?.week
            )}
            selectedDate={selectedMoveDate}
            scheduledDays={
              model.trainingPlan?.weeks
                ?.find((week) => week.week === pushBackTarget?.week)
                ?.days?.filter((day) => day.status !== "skipped") || []
            }
            onSelectDate={setSelectedMoveDate}
          />
        }
        buttonText={
          pushingBackSession
            ? "Updating..."
            : selectedMoveDate && pushBackTarget?.sourceDate
              ? selectedMoveDate > pushBackTarget.sourceDate
                ? "Reschedule later"
                : "Move earlier"
              : "Select a day"
        }
        buttonDisabled={pushingBackSession || !selectedMoveDate}
        onButtonPress={confirmPushBackCurrentSession}
        secondaryButtonText="Cancel"
        secondaryButtonDisabled={pushingBackSession}
        onSecondaryButtonPress={closePushBackConfirm}
      />
      <Modal
        visible={questionnaireNavigatorVisible}
        transparent
        animationType="fade"
        onRequestClose={closeQuestionnaireNavigator}
      >
        <View style={styles.navigatorOverlay}>
          <View style={styles.navigatorPanel}>
            <View style={styles.navigatorHeader}>
              <IBMPlexText style={styles.navigatorTitle}>
                Navigate questionnaire
              </IBMPlexText>
              <TouchableOpacity
                style={styles.navigatorCloseButton}
                onPress={closeQuestionnaireNavigator}
              >
                <IBMPlexText style={styles.navigatorCloseText}>Close</IBMPlexText>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.navigatorList}
              contentContainerStyle={styles.navigatorListContent}
              showsVerticalScrollIndicator={false}
            >
              {questionnaireNavigatorItems.map((item) => (
                <TouchableOpacity
                  key={`${item.step}:${item.inputStep ?? item.label}`}
                  style={styles.navigatorItem}
                  onPress={() => navigateToQuestionnaireItem(item)}
                >
                  <IBMPlexText style={styles.navigatorItemLabel}>
                    {item.label}
                  </IBMPlexText>
                  <IBMPlexText style={styles.navigatorItemDetail}>
                    {item.detail}
                  </IBMPlexText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  navigatorOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.52)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  navigatorPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    maxHeight: "82%",
    overflow: "hidden",
    width: "100%",
  },
  navigatorHeader: {
    alignItems: "center",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  navigatorTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
  },
  navigatorCloseButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  navigatorCloseText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  navigatorList: {
    width: "100%",
  },
  navigatorListContent: {
    padding: 10,
  },
  navigatorItem: {
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  navigatorItemLabel: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },
  navigatorItemDetail: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 2,
  },
});
