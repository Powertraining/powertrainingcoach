import { useEffect } from "react";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { reactiveModel } from "../../services/models/mobxReactiveModel.js";
import LoadingView from "../../screens/screens/LoadingView.jsx";

// Make model globally available for debugging
if (typeof global !== "undefined") {
  global.reactiveModel = reactiveModel;
}

const RootLayout = observer(function RootLayout() {
  const model = reactiveModel;

  // Start the background date change detector when app mounts
  useEffect(() => {
    model.startDateChangeDetector?.();
    return () => {
      model.stopDateChangeDetector?.();
    };
  }, [model]);

  const isGeneratingPlan =
    model.trainingPlanPromiseState?.promise &&
    !model.trainingPlanPromiseState?.data &&
    !model.trainingPlanPromiseState?.error;
  const isLoading = !model.ready || isGeneratingPlan;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingView />
          </View>
        )}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#f5f5f7" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
      </SafeAreaView>
    </SafeAreaProvider>
  );
});

export default RootLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
});
