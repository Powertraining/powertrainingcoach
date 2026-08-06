import {
  useState,
  useEffect,
  useMemo,
  useRef } from "react";
import { observer } from "mobx-react-lite";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams,
  useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import ProgramOverviewView from "../../src/screens/ProgramOverviewView.jsx";
import WhiteBottomMenu from "../../src/components/profileComponents/WhiteBottomMenu.jsx";
import IBMPlexText from "../../src/components/textComponents/IBMPlexText.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import { getWeekdayNameFromIndex } from "../../src/constants/weekdays.js";
import {
  getClosestActiveTrainingDay,
  getCurrentTrainingWeek,
  getTrainingDayPreferredWeekday,
} from "../../src/services/utils/trainingPlan.js";
import { getProgramOverviewToday } from "../../src/services/utils/programOverview.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";
import {
  getRequiredProgramMaxLifts,
  shouldRequireProgramMaxSetup,
} from "../../src/services/utils/strengthAssessment.js";
import { formatWeightFromKilograms } from "../../src/services/utils/measurementUnits.js";

const LOCKED_GATE_PAN_HANDLERS = Object.freeze({});

const OverviewScreen = observer(function OverviewScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();

  const plan = model.trainingPlan;
  const strengthAssessmentSummary = useMemo(
    () => model.getStrengthAssessmentSummary?.() || null,
    [model, model.strengthAssessmentState]
  );
  const [completedDays, setCompletedDays] = useState(new Set());
  const [trainingCheckInSubmitting, setTrainingCheckInSubmitting] = useState(false);
  const [selectedDayPointer, setSelectedDayPointer] = useState(null);
  const [selectionDismissed, setSelectionDismissed] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const [programMaxGateVisible, setProgramMaxGateVisible] = useState(false);
  const [activationNoticeDismissed, setActivationNoticeDismissed] = useState(false);
  const lastResolvedSelectedDayRef = useRef(null);
  const lastRouteSelectedDayRef = useRef("");
  const suppressAutoSelectRef = useRef(false);

  useEffect(() => {
    model.restoreRemovedManualSessionMerges?.();
  }, [model, model.trainingPlan]);

  function getParamValue(value) {
    return Array.isArray(value) ? value[0] : value;
  }

  // Sync completed days from model
  useEffect(() => {
    if (model.completedDays) {
      const completed = Array.isArray(model.completedDays)
        ? new Set(model.completedDays)
        : new Set();
      setCompletedDays(completed);
    }
  }, [model.completedDays]);

  // If no plan, redirect to home to create one
  useEffect(() => {
    if (model.user && !plan && model.ready) {
      router.replace(
        model.questionnaire?.pendingCycleReview ?
          "/(tabs)?resume=questionnaireSport" :
          "/(tabs)"
      );
    }
  }, [plan, model.questionnaire, model.ready, model.user, router]);

  const pendingTrainingCheckIn = useMemo(
    () => model.getPendingTrainingCheckIn?.() || null,
    [completedDays, model, model.completedDays, model.questionnaire, model.strengthAssessmentState, model.trainingCheckInState, plan]
  );
  const requiresProgramMaxSetup = shouldRequireProgramMaxSetup({
    plan,
    liftIntensityMethod: model.questionnaire?.liftIntensityMethod,
    strengthAssessmentSummary,
    completedDays: model.completedDays,
  });
  const currentTrainingWeek = getCurrentTrainingWeek(
    plan,
    Array.from(completedDays)
  );
  const estimatedProgramMaxes = (
    Array.isArray(strengthAssessmentSummary?.latestByLift)
      ? strengthAssessmentSummary.latestByLift
      : []
  ).filter((entry) => entry?.method === "rpe_based_1rm" && entry?.trainingMaxKg);
  const requiredProgramMaxLifts = getRequiredProgramMaxLifts(
    plan,
    strengthAssessmentSummary
  );
  const unresolvedProgramMaxLifts = requiredProgramMaxLifts.filter(
    (lift) => !lift.programMaxKg
  );
  const showActivationNotice = Boolean(
    isFocused &&
    !programMaxGateVisible &&
    !activationNoticeDismissed &&
    Number(currentTrainingWeek?.week) >= 2 &&
    (estimatedProgramMaxes.length > 0 || unresolvedProgramMaxLifts.length > 0)
  );

  useEffect(() => {
    if (!isFocused || !model.ready || !model.user || !requiresProgramMaxSetup) {
      setProgramMaxGateVisible(false);
      return undefined;
    }

    model.setForumTabBarHidden?.(true);
    const revealTimer = setTimeout(() => setProgramMaxGateVisible(true), 420);

    return () => {
      clearTimeout(revealTimer);
      setProgramMaxGateVisible(false);
      model.setForumTabBarHidden?.(false);
    };
  }, [
    isFocused,
    model,
    model.ready,
    model.user,
    requiresProgramMaxSetup,
  ]);
  const routeWeekNumber = Number.parseInt(getParamValue(params.week), 10);
  const routeDayNumber = Number.parseInt(getParamValue(params.day), 10);
  const initialScrollToTopKey =
    Number.isFinite(routeWeekNumber) && Number.isFinite(routeDayNumber)
      ? `${routeWeekNumber}-${routeDayNumber}`
      : "";

  const selectedDay = useMemo(() => {
    if (!selectedDayPointer) {
      lastResolvedSelectedDayRef.current = null;
      return null;
    }

    const week = plan?.weeks?.find((candidateWeek) => candidateWeek.week === selectedDayPointer.week);
    const cachedSelectedDay = lastResolvedSelectedDayRef.current;

    if (!week) {
      return cachedSelectedDay?.week === selectedDayPointer.week &&
        cachedSelectedDay?.day === selectedDayPointer.day
        ? cachedSelectedDay
        : null;
    }

    const day = week.days?.find((candidateDay) => candidateDay.day === selectedDayPointer.day);
    if (!day) {
      return cachedSelectedDay?.week === selectedDayPointer.week &&
        cachedSelectedDay?.day === selectedDayPointer.day
        ? cachedSelectedDay
        : null;
    }

    const resolvedSelectedDay = {
      week: selectedDayPointer.week,
      day: selectedDayPointer.day,
      dayData: day,
      exercises: day.exercises || [],
      preferredWeekday: day.preferredWeekday || "",
      sessionLabel: day.sessionLabel || "",
      status: day.status || "pending",
      rescueMode: day.rescueMode || "",
      adjustmentSummary: day.adjustmentSummary || "",
    };

    lastResolvedSelectedDayRef.current = resolvedSelectedDay;
    return resolvedSelectedDay;
  }, [plan, selectedDayPointer]);

  useEffect(() => {
    const routeDayKey = `${routeWeekNumber}-${routeDayNumber}`;

    if (
      !plan ||
      !Number.isFinite(routeWeekNumber) ||
      !Number.isFinite(routeDayNumber) ||
      lastRouteSelectedDayRef.current === routeDayKey
    ) {
      return;
    }

    const week = plan.weeks?.find(
      (candidateWeek) => candidateWeek.week === routeWeekNumber
    );
    const day = week?.days?.find(
      (candidateDay) => candidateDay.day === routeDayNumber
    );

    if (!week || !day) {
      return;
    }

    lastRouteSelectedDayRef.current = routeDayKey;
    setSelectionDismissed(false);
    setSelectedDayPointer({ week: routeWeekNumber, day: routeDayNumber });
  }, [plan, routeDayNumber, routeWeekNumber]);

  useEffect(() => {
    if (!plan || selectedDayPointer || selectionDismissed) {
      return;
    }

    if (suppressAutoSelectRef.current) {
      return;
    }

    const routeWeek = plan.weeks?.find(
      (candidateWeek) => candidateWeek.week === routeWeekNumber
    );
    const routeDay = routeWeek?.days?.find(
      (candidateDay) => candidateDay.day === routeDayNumber
    );

    if (routeWeek && routeDay) {
      return;
    }

    const completedDayEntries = completedDays instanceof Set
      ? Array.from(completedDays)
      : [];
    const currentWeek = getCurrentTrainingWeek(plan, completedDayEntries);
    const today = getProgramOverviewToday();
    const todayWeekday = getWeekdayNameFromIndex(today.getDay());
    const todayTrainingDay =
      currentWeek?.days?.find(
        (day) => getTrainingDayPreferredWeekday(day) === todayWeekday
      ) ||
      currentWeek?.days?.find((day) => !getTrainingDayPreferredWeekday(day));

    if (!currentWeek?.week || !todayTrainingDay?.day) {
      return;
    }

    setSelectedDayPointer({ week: currentWeek.week, day: todayTrainingDay.day });
  }, [
    completedDays,
    plan,
    routeDayNumber,
    routeWeekNumber,
    selectedDayPointer,
    selectionDismissed,
  ]);
  const selectedDayAssessmentResults = useMemo(
    () =>
      selectedDay
        ? model.getStrengthAssessmentSessionResults?.(selectedDay.week, selectedDay.day) || []
        : [],
    [model, model.strengthAssessmentState, selectedDay]
  );
  const selectedDayPerformanceResults = useMemo(
    () =>
      selectedDay
        ? model.getTrainingPerformanceSessionResults?.(selectedDay.week, selectedDay.day) || []
        : [],
    [model, model.trainingPerformanceState, selectedDay]
  );
  const totalDays = useMemo(() => {
    return model.getTrackableTrainingDayCount?.() || 0;
  }, [model, plan]);

  useAndroidBackHandler(() => {
    if (requiresProgramMaxSetup) {
      return true;
    }

    if (selectedDayPointer) {
      handleClearSelectedDay();
      return;
    }

    return false;
  }, [requiresProgramMaxSetup, selectedDayPointer]);

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

  function handleSelectDay(weekNumber, dayNumber) {
    if (!plan) return;

    const weeks = Array.isArray(plan.weeks) ? plan.weeks : [];
    const week = weeks.find((w) => w.week === weekNumber);
    if (!week) return;

    const days = Array.isArray(week.days) ? week.days : [];
    const day = days.find((d) => d.day === dayNumber);
    if (!day) return;

    suppressAutoSelectRef.current = false;
    setSelectedDayPointer({ week: weekNumber, day: dayNumber });
    setSelectionDismissed(false);
  }

  function handleClearSelectedDay(reason = "") {
    suppressAutoSelectRef.current = reason === "rest";
    setSelectedDayPointer(null);
    setSelectionDismissed(true);
  }

  function handleTestSession() {
    const targetSession =
      selectedDay ||
      getClosestActiveTrainingDay(model.trainingPlan, model.completedDays) ||
      model.getCurrentTrainingDay?.(model.completedDays);
    const weekNumber = Number.parseInt(targetSession?.week, 10);
    const dayNumber = Number.parseInt(targetSession?.day, 10);

    if (!Number.isFinite(weekNumber) || !Number.isFinite(dayNumber)) {
      return;
    }

    model.setForumTabBarHidden?.(true);
    router.push({
      pathname: "/(tabs)/active-session",
      params: {
        week: String(weekNumber),
        day: String(dayNumber),
        returnTo: "/(tabs)/overview",
      },
    });
  }

  function handleTestProgramMaxSetup() {
    router.push({
      pathname: "/(tabs)/program-max-setup",
      params: { developerPreview: "1" },
    });
  }

  function openProgramMaxSetup() {
    setProgramMaxGateVisible(false);
    router.push("/(tabs)/program-max-setup");
  }

  function handleProgramMaxGateBack() {
    setProgramMaxGateVisible(false);

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)");
  }

  function getActiveSessionProgress(sessionKey) {
    return sessionKey
      ? model.activeSessionProgressByKey?.[sessionKey]
      : null;
  }

  function buildCompletedStepKeysForExercises(exercises = []) {
    return (Array.isArray(exercises) ? exercises : []).flatMap((exercise, exerciseIndex) => {
      const parsedSetCount = Number.parseInt(exercise?.sets, 10);
      const setCount =
        Number.isFinite(parsedSetCount) && parsedSetCount > 0
          ? Math.min(parsedSetCount, 12)
          : 1;

      return Array.from({ length: setCount }).map(
        (_, setIndex) => `${exerciseIndex}:${setIndex}`
      );
    });
  }

  function getCompletedSessionProgress(sessionKey) {
    return sessionKey
      ? model.completedSessionProgressByKey?.[sessionKey]
      : null;
  }

  function handleCompletedSessionProgressSave(sessionKey, progress) {
    model.saveCompletedSessionProgress?.(sessionKey, progress);
  }

  function handleActiveSessionProgressChange(sessionKey, progress) {
    if (!sessionKey || !progress) {
      return;
    }

    model.activeSessionProgressByKey = {
      ...(model.activeSessionProgressByKey || {}),
      [sessionKey]: progress,
    };
  }

  function handleActiveSessionProgressClear(sessionKey) {
    if (!sessionKey) {
      return;
    }

    const {
      [sessionKey]: _clearedProgress,
      ...remainingProgress
    } = model.activeSessionProgressByKey || {};

    model.activeSessionProgressByKey = remainingProgress;
  }

  function handleReplaceExercise(exerciseIndex, substitutionId) {
    if (!selectedDay || !substitutionId) {
      return;
    }

    model.replaceTrainingPlanExercise?.(
      selectedDay.week,
      selectedDay.day,
      exerciseIndex,
      substitutionId
    );
  }

  async function handleMoveDay(targetDate) {
    if (!selectedDay || !(targetDate instanceof Date) || updatingPlan) {
      return;
    }

    setUpdatingPlan(true);

    try {
      await model.moveTrainingSession?.({
        weekNumber: selectedDay.week,
        dayNumber: selectedDay.day,
        targetDate,
        targetWeekday: getWeekdayNameFromIndex(targetDate.getDay()),
      });
    } catch (error) {
      console.error("Could not move session:", error);
    } finally {
      setUpdatingPlan(false);
    }
  }

  function handleFinishDay(trackedResults = []) {
    if (!selectedDay) return;

    model.saveTrainingPerformanceResults?.({
      weekNumber: selectedDay.week,
      dayNumber: selectedDay.day,
      exercises: selectedDay.exercises,
      results: trackedResults,
    });
    model.saveStrengthAssessmentResults?.({
      weekNumber: selectedDay.week,
      dayNumber: selectedDay.day,
      exercises: selectedDay.exercises,
      results: trackedResults,
    });

    const key = `${selectedDay.week}-${selectedDay.day}`;
    if (!model.completedSessionProgressByKey?.[key]) {
      model.saveCompletedSessionProgress?.(key, {
        completedStepKeys: buildCompletedStepKeysForExercises(selectedDay.exercises),
        trackingDrafts: {},
      });
    }

    const currentCompleted = Array.isArray(model.completedDays)
      ? new Set(model.completedDays)
      : new Set();

    if (!currentCompleted.has(key)) {
      currentCompleted.add(key);
      model.completedDays = Array.from(currentCompleted);
      setCompletedDays(new Set(currentCompleted));
    }

    model.updateSportLoadAfterWeekCompletion?.(selectedDay.week);

    if (model.getPendingTrainingCheckIn?.()) {
      setSelectedDayPointer(null);
      return;
    }

    const remaining = Math.max(totalDays - currentCompleted.size, 0);

    if (remaining <= 0 && totalDays > 0) {
      const totalWeeksAvailable = model.getPlannedWeeksFromSubscription?.() || 0;
      const weeksInCurrentPlan = plan?.weeks?.length || 0;

      if (totalWeeksAvailable > weeksInCurrentPlan) {
        model.completeCurrentBatch?.(weeksInCurrentPlan);
        router.replace("/(tabs)");
      } else {
        model.setFinishedWorkout?.(3);
        router.replace("/(tabs)/feedback");
      }
      return;
    }

    setSelectedDayPointer(null);
  }

  async function handleSubmitTrainingCheckIn(payload) {
    if (!payload || trainingCheckInSubmitting) {
      return;
    }

    setTrainingCheckInSubmitting(true);

    try {
      await model.completeTrainingCheckIn?.(payload);
    } catch (error) {
      console.error("Could not complete training check-in:", error);
    } finally {
      setTrainingCheckInSubmitting(false);
    }
  }

  function handleReadinessInjuryReportChange(value = "") {
    model.setQuestionnaire?.({
      ...(model.questionnaire || {}),
      injuriesInput: String(value || "").trim(),
    });
  }

  return (
    <View style={styles.container}>
      <ProgramOverviewView
        plan={plan}
        unitSystem={model.unitSystem}
        trainingPlanHistory={model.trainingPlanHistory}
        onSelectDay={handleSelectDay}
        completedDays={completedDays}
        pendingTrainingCheckIn={pendingTrainingCheckIn}
        onSubmitTrainingCheckIn={handleSubmitTrainingCheckIn}
        onReadinessInjuryReportChange={handleReadinessInjuryReportChange}
        trainingCheckInSubmitting={trainingCheckInSubmitting}
        questionnaire={model.questionnaire}
        selectedDay={selectedDay}
        selectedDayPerformanceResults={selectedDayPerformanceResults}
        selectedDayAssessmentResults={selectedDayAssessmentResults}
        strengthAssessmentSummary={strengthAssessmentSummary}
        onClearSelectedDay={handleClearSelectedDay}
        onReplaceExercise={handleReplaceExercise}
        onFinishDay={handleFinishDay}
        onMoveDay={handleMoveDay}
        getActiveSessionProgress={getActiveSessionProgress}
        onActiveSessionProgressChange={handleActiveSessionProgressChange}
        onActiveSessionProgressClear={handleActiveSessionProgressClear}
        onStrengthAssessmentSave={(weekNumber, dayNumber, exercises, results) =>
          model.saveStrengthAssessmentResults?.({
            weekNumber,
            dayNumber,
            exercises,
            results,
          })
        }
        getCompletedSessionProgress={getCompletedSessionProgress}
        onCompletedSessionProgressSave={handleCompletedSessionProgressSave}
        onTestSession={handleTestSession}
        onTestProgramMaxSetup={handleTestProgramMaxSetup}
        updatingPlan={updatingPlan}
        initialScrollToTopKey={initialScrollToTopKey}
      />
      <WhiteBottomMenu
        buttonText="Set up Program Maxes"
        description="Before you start your program, add the current maxes you already know. Any lift you leave blank will begin with RPE."
        onButtonPress={openProgramMaxSetup}
        onDismiss={() => {}}
        panHandlers={LOCKED_GATE_PAN_HANDLERS}
        secondaryButtonText="Go back"
        onSecondaryButtonPress={handleProgramMaxGateBack}
        title="Complete Program Max setup"
        visible={programMaxGateVisible}
      />
      <WhiteBottomMenu
        buttonText="Continue to Week 2"
        description="Week 1 estimates are now applied automatically. Any lift without a suitable top set stays RPE-based until enough data is available."
        onButtonPress={() => setActivationNoticeDismissed(true)}
        onDismiss={() => setActivationNoticeDismissed(true)}
        title="Percentage loading is now active"
        visible={showActivationNotice}
        content={(
          <View style={styles.activationList}>
            {estimatedProgramMaxes.map((entry) => (
              <View key={entry.liftKey || entry.liftName} style={styles.activationRow}>
                <View style={styles.activationCopy}>
                  <IBMPlexText style={styles.activationLift}>{entry.liftName}</IBMPlexText>
                  <IBMPlexText style={styles.activationSource}>
                    {formatWeightFromKilograms(entry.loadKg, model.unitSystem)} × {entry.reps} @ RPE {entry.rpe} · estimated {formatWeightFromKilograms(entry.estimatedOneRepMaxKg, model.unitSystem)}
                  </IBMPlexText>
                </View>
                <IBMPlexText style={styles.activationMax}>
                  {formatWeightFromKilograms(entry.trainingMaxKg, model.unitSystem)}
                </IBMPlexText>
              </View>
            ))}
            {unresolvedProgramMaxLifts.map((lift) => (
              <View key={lift.liftKey} style={styles.activationRow}>
                <View style={styles.activationCopy}>
                  <IBMPlexText style={styles.activationLift}>{lift.liftName}</IBMPlexText>
                  <IBMPlexText style={styles.moreDataText}>More data needed · stays RPE-based</IBMPlexText>
                </View>
              </View>
            ))}
          </View>
        )}
      />
    </View>
  );
});

export default OverviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  activationList: { gap: 8 },
  activationRow: { alignItems: "center", backgroundColor: "#F3F3F3", borderRadius: 14, flexDirection: "row", minHeight: 62, paddingHorizontal: 14, paddingVertical: 10 },
  activationCopy: { flex: 1 },
  activationLift: { color: "#111111", fontSize: 13, fontWeight: "800" },
  activationSource: { color: "#717171", fontSize: 11, marginTop: 3 },
  activationMax: { color: "#111111", fontSize: 15, fontWeight: "900" },
  moreDataText: { color: "#A45A00", fontSize: 11, marginTop: 3 },
});
