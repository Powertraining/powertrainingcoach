import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import DayDetailView from "../../src/screens/screens/DayDetailView.jsx";
import AuthGateView from "../../src/screens/screens/AuthGateView.jsx";
import LoadingView from "../../src/screens/screens/LoadingView.jsx";

const DayDetailScreen = observer(function DayDetailScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();

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
      exercises: day.exercises || [],
    };
  }, [plan, weekNumber, dayNumber]);

  // Compute total days for progress tracking
  const totalDays = useMemo(() => {
    if (!plan?.weeks) return 0;
    return plan.weeks.reduce((acc, week) => acc + (week.days?.length || 0), 0);
  }, [plan]);

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

  // If no plan or invalid params, go back
  useEffect(() => {
    if (!plan || !selectedDay) {
      router.replace("/(tabs)/overview");
    }
  }, [plan, selectedDay, router]);

  function handleBack() {
    router.back();
  }

  function handleFinish() {
    if (!selectedDay) return;

    const key = `${selectedDay.week}-${selectedDay.day}`;

    // Get current completed days
    const currentCompleted = Array.isArray(model.completedDays)
      ? new Set(model.completedDays)
      : new Set();

    // Add this day if not already done
    if (!currentCompleted.has(key)) {
      currentCompleted.add(key);
      model.completedDays = Array.from(currentCompleted);
    }

    const remaining = Math.max(totalDays - currentCompleted.size, 0);
    console.log("Days remaining in batch:", remaining);

    if (remaining <= 0 && totalDays > 0) {
      // Check if there are more weeks available in subscription
      const totalWeeksAvailable = model.getPlannedWeeksFromSubscription?.() || 0;
      const weeksInCurrentPlan = plan?.weeks?.length || 0;

      if (totalWeeksAvailable > weeksInCurrentPlan) {
        // Complete current batch and go back to input for next batch
        model.completeCurrentBatch?.(weeksInCurrentPlan);
        router.replace("/(tabs)");
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
        day={selectedDay.day}
        exercises={selectedDay.exercises}
        onBack={handleBack}
        onFinish={handleFinish}
      />
    </View>
  );
});

export default DayDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
});
