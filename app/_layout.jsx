import { useEffect } from "react";
import { Stack } from "expo-router";
import { observer } from "mobx-react-lite";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";

import { reactiveModel } from "../src/services/models/mobxReactiveModel.js";
import LoadingView from "../src/screens/LoadingView.jsx";
import StripeProviderWrapper from "../src/StripeProviderWrapper.jsx";
import BlackGradient from "../src/components/colorComponents/BlackGradient.jsx";
import { preloadQuestionnaireImages } from "../src/services/utils/preloadAssets.js";
import { fonts } from "../src/theme/colors.js";


// Make model globally available for debugging
if (typeof global !== "undefined") {
  global.reactiveModel = reactiveModel;
}

const RootLayout = observer(function RootLayout() {
  const model = reactiveModel;
  const [fontsLoaded] = useFonts({
    [fonts.display]: require("../src/shared/fonts/bebaskai/BebasKai.ttf"),
    [fonts.body]: require("../src/shared/fonts/cmu-sans-serif/cmunss.ttf"),
    [fonts.bodyMedium]: require("../src/shared/fonts/cmu-bright/cmunbmr.ttf"),
    [fonts.bodySemiBold]: require("../src/shared/fonts/cmu-bright/cmunbsr.ttf"),
    [fonts.bodyBold]: require("../src/shared/fonts/cmu-sans-serif/cmunsx.ttf"),
  });

  // Start the background date change detector when app mounts
  useEffect(() => {
    model.startDateChangeDetector?.();

    NavigationBar.setPositionAsync("absolute");
    NavigationBar.setBackgroundColorAsync("transparent");
    NavigationBar.setButtonStyleAsync("light");
    preloadQuestionnaireImages().catch((error) => {
      console.warn("Could not preload questionnaire images:", error);
    });
    

    return () => {
      model.stopDateChangeDetector?.();
    };
  }, [model]);

  const isLoading = !model.ready;

  if (!fontsLoaded) {
    return null;
  }

  return (
    <StripeProviderWrapper>
      <View style={styles.root}>
        <BlackGradient />
        <SafeAreaProvider style={styles.provider}>
          <StatusBar style="light" backgroundColor="transparent" hidden/>
          <View style={styles.container}>
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
          </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.58)",
  },
});
