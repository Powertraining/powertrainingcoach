import { useEffect } from "react";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";




import { reactiveModel } from "../src/services/models/mobxReactiveModel.js";
import LoadingView from "../src/screens/LoadingView.jsx";
import StripeProviderWrapper from "../src/StripeProviderWrapper.jsx";
import BlackGradient from "../src/components/colorComponents/BlackGradient.jsx";


// Make model globally available for debugging
if (typeof global !== "undefined") {
  global.reactiveModel = reactiveModel;
}

const RootLayout = observer(function RootLayout() {
  const model = reactiveModel;
  const [fontsLoaded] = useFonts({
    BebasNeue: require("../src/assets/BebasNeue-Regular.ttf"),
  });

  // Start the background date change detector when app mounts
  useEffect(() => {
    model.startDateChangeDetector?.();

    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setBackgroundColorAsync("transparent");
    NavigationBar.setButtonStyleAsync("light");
    

    return () => {
      model.stopDateChangeDetector?.();
    };
  }, [model]);

  const isGeneratingPlan =
    model.trainingPlanPromiseState?.promise &&
    !model.trainingPlanPromiseState?.data &&
    !model.trainingPlanPromiseState?.error;
  const isLoading = !model.ready || isGeneratingPlan;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StripeProviderWrapper>
      <View style={styles.root}>
        <BlackGradient />
        <SafeAreaProvider style={styles.provider}>
          <StatusBar style="light" backgroundColor="transparent" />
          <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <LoadingView />
              </View>
            )}

            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
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
      </View>
    </StripeProviderWrapper>
  );
});

export default RootLayout;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  provider: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
