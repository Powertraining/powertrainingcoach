import {
  useEffect,
  useMemo,
  useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter,
  useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import DayDetailView from "../../src/screens/DayDetailView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import { getSafeReturnToPath } from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const DayDetailScreen = observer(function DayDetailScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const [updatingPlan, setUpdatingPlan] = useState(false);
  const returnTo = getSafeReturnToPath(params, "/(tabs)/overview");

  const weekNumber = parseInt(params.week, 10);
  const dayNumber = parseInt(params.day, 10);

  const plan = model.trainingPlan;

  // Get exercises for the selected day
  const selectedDay = useMemo(() => {
    if (!plan || isNaN(weekNumber) || isNaN(dayNumber)) return null;

    const week = plan.weeks?.find((w) => w.week === weekNumber);
    if (!week) return null;

    const day = week.days?.find((d) => d.day === dayNumber);
    if (!day) return null;

    return {
      week: weekNumber,
      day: dayNumber,
      dayData: day,
      exercises: day.exercises || [],
      preferredWeekday: day.preferredWeekday || "",
      sessionLabel: day.sessionLabel || "",
      status: day.status || "pending",
      rescueMode: day.rescueMode || "",
      adjustmentSummary: day.adjustmentSummary || "",
    };
  }, [plan, weekNumber, dayNumber]);
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
  const sessionKey =
    Number.isFinite(weekNumber) && Number.isFinite(dayNumber)
      ? `${weekNumber}-${dayNumber}`
      : "";
  const isSessionComplete =
    Boolean(sessionKey) &&
    Array.isArray(model.completedDays) &&
    model.completedDays.includes(sessionKey);
  const completedSessionProgress = sessionKey
    ? model.completedSessionProgressByKey?.[sessionKey]
    : null;

  // Compute total days for progress tracking
  const totalDays = useMemo(() => {
    return model.getTrackableTrainingDayCount?.() || 0;
  }, [model, plan]);

  useEffect(() => {
    if (model.user && model.ready && (!plan || !selectedDay)) {
      router.replace(
        model.questionnaire?.pendingCycleReview ?
          "/(tabs)?resume=questionnaireSport" :
          "/(tabs)/overview"
      );
    }
  }, [model.questionnaire, model.ready, model.user, plan, selectedDay, router]);

  useAndroidBackHandler(handleBack, [returnTo, router]);

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

  function handleBack() {
    router.replace(returnTo);
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

  async function handleMissed() {
    if (!selectedDay || updatingPlan) {
      return;
    }

    setUpdatingPlan(true);

    try {
      await model.reportMissedSession?.({
        weekNumber: selectedDay.week,
        dayNumber: selectedDay.day,
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      console.error("Could not update missed session logic:", error);
    } finally {
      setUpdatingPlan(false);
    }
  }

  function handleFinish(trackedResults = []) {
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
        completedStepKeys: selectedDay.exercises.flatMap((exercise, exerciseIndex) => {
          const parsedSetCount = Number.parseInt(exercise?.sets, 10);
          const setCount =
            Number.isFinite(parsedSetCount) && parsedSetCount > 0
              ? Math.min(parsedSetCount, 12)
              : 1;

          return Array.from({ length: setCount }).map(
            (_, setIndex) => `${exerciseIndex}:${setIndex}`
          );
        }),
        trackingDrafts: {},
      });
    }

    // Get current completed days
    const currentCompleted = Array.isArray(model.completedDays)
      ? new Set(model.completedDays)
      : new Set();

    // Add this day if not already done
    if (!currentCompleted.has(key)) {
      currentCompleted.add(key);
      model.completedDays = Array.from(currentCompleted);
    }

    model.updateSportLoadAfterWeekCompletion?.(selectedDay.week);

    const remaining = Math.max(totalDays - currentCompleted.size, 0);
    console.log("Days remaining in batch:", remaining);

    if (remaining <= 0 && totalDays > 0) {
      // Check if there are more weeks available in subscription
      const totalWeeksAvailable = model.getPlannedWeeksFromSubscription?.() || 0;
      const weeksInCurrentPlan = plan?.weeks?.length || 0;

      if (totalWeeksAvailable > weeksInCurrentPlan) {
        // Complete current batch and go back to input for next batch
        model.completeCurrentBatch?.(weeksInCurrentPlan);
        router.replace("/(tabs)?resume=questionnaireSport");
      } else {
        // Finished the entire plan, go to feedback
        model.setFinishedWorkout?.(3);
        router.replace("/(tabs)/feedback");
      }
    } else {
      // Go back to overview
      router.replace("/(tabs)/overview");
    }
  }

  if (!selectedDay) {
    return null;
  }

  return (
    <View style={styles.container}>
      <DayDetailView
        week={selectedDay.week}
        day={selectedDay.dayData}
        exercises={selectedDay.exercises}
        preferredWeekday={selectedDay.preferredWeekday}
        sessionLabel={selectedDay.sessionLabel}
        status={selectedDay.status}
        rescueMode={selectedDay.rescueMode}
        adjustmentSummary={selectedDay.adjustmentSummary}
        isSessionComplete={isSessionComplete}
        completedSessionProgress={completedSessionProgress}
        initialPerformanceResults={sessionPerformanceResults}
        initialAssessmentResults={sessionAssessmentResults}
        strengthAssessmentSummary={strengthAssessmentSummary}
        questionnaire={model.questionnaire}
        onBack={handleBack}
        onReplaceExercise={handleReplaceExercise}
        onFinish={handleFinish}
        onMissed={handleMissed}
        updatingPlan={updatingPlan}
      />
    </View>
  );
});

export default DayDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
