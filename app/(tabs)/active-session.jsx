import {
  useCallback,
  useEffect,
  useMemo,
  useRef } from "react";
import { observer } from "mobx-react-lite";
import { useFocusEffect,
  useLocalSearchParams,
  useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import ActiveSessionView from "../../src/screens/ActiveSessionView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import ExpandingRouteView from "../../src/components/navigation/ExpandingRouteView.jsx";
import { getSafeReturnToPath } from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const ActiveSessionScreen = observer(function ActiveSessionScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = getSafeReturnToPath(params, "/(tabs)/overview");
  const pendingSessionProgressRef = useRef(null);
  const sessionProgressSaveTimerRef = useRef(null);

  const weekNumber = Number.parseInt(params.week, 10);
  const dayNumber = Number.parseInt(params.day, 10);
  const plan = model.trainingPlan;
  const sessionProgressKey =
    Number.isFinite(weekNumber) && Number.isFinite(dayNumber)
      ? `${weekNumber}-${dayNumber}`
      : "";

  const selectedDay = useMemo(() => {
    if (!plan || !Number.isFinite(weekNumber) || !Number.isFinite(dayNumber)) {
      return null;
    }

    const week = plan.weeks?.find((candidateWeek) => candidateWeek.week === weekNumber);
    const day = week?.days?.find((candidateDay) => candidateDay.day === dayNumber);

    if (!day) {
      return null;
    }

    return {
      week: weekNumber,
      day: dayNumber,
      dayData: day,
      exercises: day.exercises || [],
    };
  }, [dayNumber, plan, weekNumber]);

  const sessionAssessmentResults = useMemo(
    () =>
      model.getStrengthAssessmentSessionResults?.(weekNumber, dayNumber) || [],
    [dayNumber, model, model.strengthAssessmentState, weekNumber]
  );
  const sessionPerformanceResults = useMemo(
    () =>
      model.getTrainingPerformanceSessionResults?.(weekNumber, dayNumber) || [],
    [dayNumber, model, model.trainingPerformanceState, weekNumber]
  );
  const strengthAssessmentSummary = useMemo(
    () => model.getStrengthAssessmentSummary?.() || null,
    [model, model.strengthAssessmentState]
  );
  const totalDays = useMemo(
    () => model.getTrackableTrainingDayCount?.() || 0,
    [model, plan]
  );

  useEffect(() => {
    if (model.user && model.ready && (!plan || !selectedDay)) {
      router.replace("/(tabs)/overview");
    }
  }, [model.ready, model.user, plan, router, selectedDay]);

  useFocusEffect(
    useCallback(() => {
      model.setForumTabBarHidden?.(true);

      return () => {
        model.setForumTabBarHidden?.(false);
      };
    }, [model])
  );

  useAndroidBackHandler(handleBack, [model, returnTo, router]);

  useEffect(
    () => () => {
      flushSessionProgress();
    },
    []
  );

  if (!model.ready) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  if (!model.user) {
    return (
      <AuthGateView
        onLogin={() => router.push("/(auth)/login")}
        onSignup={() => router.push("/(auth)/signup")}
      />
    );
  }

  if (!selectedDay) {
    return null;
  }

  function handleBack() {
    flushSessionProgress();
    model.setForumTabBarHidden?.(false);
    router.replace(returnTo);
  }

  function commitSessionProgress(progress) {
    if (!sessionProgressKey || !progress) {
      return;
    }

    model.activeSessionProgressByKey = {
      ...(model.activeSessionProgressByKey || {}),
      [sessionProgressKey]: progress,
    };
  }

  function flushSessionProgress() {
    if (sessionProgressSaveTimerRef.current) {
      clearTimeout(sessionProgressSaveTimerRef.current);
      sessionProgressSaveTimerRef.current = null;
    }

    if (!pendingSessionProgressRef.current) {
      return;
    }

    commitSessionProgress(pendingSessionProgressRef.current);
    pendingSessionProgressRef.current = null;
  }

  function saveSessionProgress(progress) {
    if (!sessionProgressKey || !progress) {
      return;
    }

    pendingSessionProgressRef.current = progress;

    if (sessionProgressSaveTimerRef.current) {
      clearTimeout(sessionProgressSaveTimerRef.current);
    }

    sessionProgressSaveTimerRef.current = setTimeout(() => {
      sessionProgressSaveTimerRef.current = null;
      flushSessionProgress();
    }, 350);
  }

  function clearSessionProgress() {
    if (!sessionProgressKey) {
      return;
    }

    pendingSessionProgressRef.current = null;

    if (sessionProgressSaveTimerRef.current) {
      clearTimeout(sessionProgressSaveTimerRef.current);
      sessionProgressSaveTimerRef.current = null;
    }

    const {
      [sessionProgressKey]: _clearedProgress,
      ...remainingProgress
    } = model.activeSessionProgressByKey || {};

    model.activeSessionProgressByKey = remainingProgress;
  }

  function handleFinish(trackedResults = [], completedProgress = {}) {
    flushSessionProgress();

    if (sessionProgressKey) {
      model.saveCompletedSessionProgress?.(sessionProgressKey, {
        completedStepKeys: completedProgress.completedStepKeys || [],
        trackingDrafts: completedProgress.trackingDrafts || {},
      });
    }

    clearSessionProgress();

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
    const currentCompleted = Array.isArray(model.completedDays)
      ? new Set(model.completedDays)
      : new Set();

    if (!currentCompleted.has(key)) {
      currentCompleted.add(key);
      model.completedDays = Array.from(currentCompleted);
    }

    model.updateSportLoadAfterWeekCompletion?.(selectedDay.week);

    if (model.getPendingTrainingCheckIn?.()) {
      model.setForumTabBarHidden?.(false);
      router.replace("/(tabs)/overview");
      return;
    }

    const remaining = Math.max(totalDays - currentCompleted.size, 0);

    if (remaining <= 0 && totalDays > 0) {
      const totalWeeksAvailable = model.getPlannedWeeksFromSubscription?.() || 0;
      const weeksInCurrentPlan = plan?.weeks?.length || 0;
      const currentBlockEndWeek = Math.max(
        0,
        ...(Array.isArray(plan?.weeks)
          ? plan.weeks.map((week) => Number.parseInt(week?.week, 10) || 0)
          : [])
      );
      const parentCycleEndWeek = Math.max(
        0,
        ...(Array.isArray(plan?.phaseOverview)
          ? plan.phaseOverview.map(
              (phase) => Number.parseInt(phase?.weekEnd, 10) || 0
            )
          : [])
      );
      const hasFutureGeneratedBlocks = parentCycleEndWeek > currentBlockEndWeek;

      if (hasFutureGeneratedBlocks || totalWeeksAvailable > weeksInCurrentPlan) {
        model.completeCurrentBatch?.(weeksInCurrentPlan);
        model.setForumTabBarHidden?.(false);
        router.replace("/(tabs)?resume=questionnaireSport");
      } else {
        model.setFinishedWorkout?.(3);
        model.setForumTabBarHidden?.(false);
        router.replace("/(tabs)/feedback");
      }
      return;
    }

    model.setForumTabBarHidden?.(false);
    router.replace("/(tabs)/overview");
  }

  return (
    <ExpandingRouteView routeKey={sessionProgressKey}>
      <ActiveSessionView
        plan={plan}
        weekNumber={selectedDay.week}
        day={selectedDay.dayData}
        exercises={selectedDay.exercises}
        initialPerformanceResults={sessionPerformanceResults}
        initialAssessmentResults={sessionAssessmentResults}
        strengthAssessmentSummary={strengthAssessmentSummary}
        initialSessionProgress={
          sessionProgressKey
            ? model.activeSessionProgressByKey?.[sessionProgressKey]
            : null
        }
        onSessionProgressChange={saveSessionProgress}
        onStrengthAssessmentSave={(trackedResults) =>
          model.saveStrengthAssessmentResults?.({
            weekNumber: selectedDay.week,
            dayNumber: selectedDay.day,
            exercises: selectedDay.exercises,
            results: trackedResults,
          })
        }
        onBack={handleBack}
        onFinish={handleFinish}
      />
    </ExpandingRouteView>
  );
});

export default ActiveSessionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
