import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import ProgramOverviewView from "../../src/screens/ProgramOverviewView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";

const OverviewScreen = observer(function OverviewScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const plan = model.trainingPlan;
  const [completedDays, setCompletedDays] = useState(new Set());
  const [trainingCheckInSubmitting, setTrainingCheckInSubmitting] = useState(false);
  const [selectedDayPointer, setSelectedDayPointer] = useState(null);
  const [updatingPlan, setUpdatingPlan] = useState(false);

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
      router.replace("/(tabs)");
    }
  }, [plan, model.ready, model.user, router]);

  const pendingTrainingCheckIn = useMemo(
    () => model.getPendingTrainingCheckIn?.() || null,
    [completedDays, model, model.completedDays, model.questionnaire, model.strengthAssessmentState, model.trainingCheckInState, plan]
  );
  const selectedDay = useMemo(() => {
    if (!plan || !selectedDayPointer) return null;

    const week = plan.weeks?.find((candidateWeek) => candidateWeek.week === selectedDayPointer.week);
    if (!week) return null;

    const day = week.days?.find((candidateDay) => candidateDay.day === selectedDayPointer.day);
    if (!day) return null;

    return {
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
  }, [plan, selectedDayPointer]);
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
  const strengthAssessmentSummary = useMemo(
    () => model.getStrengthAssessmentSummary?.() || null,
    [model, model.strengthAssessmentState]
  );
  const totalDays = useMemo(() => {
    return model.getTrackableTrainingDayCount?.() || 0;
  }, [model, plan]);

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

    const week = plan.weeks.find((w) => w.week === weekNumber);
    if (!week) return;

    const day = week.days.find((d) => d.day === dayNumber);
    if (!day) return;

    setSelectedDayPointer({ week: weekNumber, day: dayNumber });
  }

  function handleClearSelectedDay() {
    setSelectedDayPointer(null);
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

  async function handleMissedDay() {
    if (!selectedDay || updatingPlan) {
      return;
    }

    setUpdatingPlan(true);

    try {
      await model.reportMissedSession?.({
        weekNumber: selectedDay.week,
        dayNumber: selectedDay.day,
      });
      setSelectedDayPointer(null);
    } catch (error) {
      console.error("Could not update missed session logic:", error);
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
    const currentCompleted = Array.isArray(model.completedDays)
      ? new Set(model.completedDays)
      : new Set();

    if (!currentCompleted.has(key)) {
      currentCompleted.add(key);
      model.completedDays = Array.from(currentCompleted);
      setCompletedDays(new Set(currentCompleted));
    }

    model.updateSportLoadAfterWeekCompletion?.(selectedDay.week);

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

  return (
    <View style={styles.container}>
      <ProgramOverviewView
        plan={plan}
        onSelectDay={handleSelectDay}
        completedDays={completedDays}
        pendingTrainingCheckIn={pendingTrainingCheckIn}
        onSubmitTrainingCheckIn={handleSubmitTrainingCheckIn}
        trainingCheckInSubmitting={trainingCheckInSubmitting}
        questionnaire={model.questionnaire}
        selectedDay={selectedDay}
        selectedDayPerformanceResults={selectedDayPerformanceResults}
        selectedDayAssessmentResults={selectedDayAssessmentResults}
        strengthAssessmentSummary={strengthAssessmentSummary}
        onClearSelectedDay={handleClearSelectedDay}
        onReplaceExercise={handleReplaceExercise}
        onFinishDay={handleFinishDay}
        onMissedDay={handleMissedDay}
        updatingPlan={updatingPlan}
      />
    </View>
  );
});

export default OverviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
