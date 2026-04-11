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

  // Keep hook order stable when auth state changes during logout.
  const currentDayPointer = useMemo(() => {
    return model.getCurrentTrainingDay?.(Array.from(completedDays)) || null;
  }, [completedDays, model, plan]);
  const pendingTrainingCheckIn = useMemo(
    () => model.getPendingTrainingCheckIn?.() || null,
    [completedDays, model, model.completedDays, model.questionnaire, model.strengthAssessmentState, model.trainingCheckInState, plan]
  );

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

    // Navigate to day detail with params
    router.push({
      pathname: "/(tabs)/day-detail",
      params: {
        week: weekNumber,
        day: dayNumber,
      },
    });
  }

  function handleBack() {
    router.back();
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
        onBack={handleBack}
        currentDay={currentDayPointer}
        completedDays={completedDays}
        pendingTrainingCheckIn={pendingTrainingCheckIn}
        onSubmitTrainingCheckIn={handleSubmitTrainingCheckIn}
        trainingCheckInSubmitting={trainingCheckInSubmitting}
        questionnaire={model.questionnaire}
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
