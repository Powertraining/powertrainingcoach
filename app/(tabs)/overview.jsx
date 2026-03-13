import { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import ProgramOverviewView from "../../src/screens/screens/ProgramOverviewView.jsx";
import AuthGateView from "../../src/screens/screens/AuthGateView.jsx";

const OverviewScreen = observer(function OverviewScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const plan = model.trainingPlan;
  const [completedDays, setCompletedDays] = useState(new Set());

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
    if (!plan && model.ready) {
      router.replace("/(tabs)");
    }
  }, [plan, model.ready]);

  // Check auth
  if (!model.user) {
    return (
      <AuthGateView
        onLogin={() => router.push("/(auth)/login")}
        onSignup={() => router.push("/(auth)/signup")}
      />
    );
  }

  // Compute current day pointer
  const currentDayPointer = useMemo(() => {
    if (!plan?.weeks) return null;
    const flattenedDays = plan.weeks
      .slice()
      .sort((a, b) => a.week - b.week)
      .flatMap((week) =>
        (week.days || [])
          .slice()
          .sort((a, b) => a.day - b.day)
          .map((day) => ({
            week: week.week,
            day: day.day,
          }))
      );
    return (
      flattenedDays.find((d) => !completedDays.has(`${d.week}-${d.day}`)) || null
    );
  }, [plan, completedDays]);

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

  return (
    <View style={styles.container}>
      <ProgramOverviewView
        plan={plan}
        onSelectDay={handleSelectDay}
        onBack={handleBack}
        currentDay={currentDayPointer}
        completedDays={completedDays}
      />
    </View>
  );
});

export default OverviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
});
