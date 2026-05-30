import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";

export default function LoadingView({
  label = "",
  progress = false,
  progressLabel = "Building your training plan",
}) {
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const lastProgressPercent = useRef(0);
  const [progressPercent, setProgressPercent] = useState(0);

  useEffect(() => {
    if (!progress) {
      progressAnimation.setValue(0);
      lastProgressPercent.current = 0;
      setProgressPercent(0);
      return undefined;
    }

    progressAnimation.setValue(0);
    lastProgressPercent.current = 0;
    setProgressPercent(0);
    const listenerId = progressAnimation.addListener(({ value }) => {
      const nextPercent = Math.round(value * 100);

      if (nextPercent !== lastProgressPercent.current) {
        lastProgressPercent.current = nextPercent;
        setProgressPercent(nextPercent);
      }
    });

    const animation = Animated.sequence([
      Animated.timing(progressAnimation, {
        toValue: 0.36,
        duration: 2400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: 0.68,
        duration: 9000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: 0.9,
        duration: 22000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
      Animated.timing(progressAnimation, {
        toValue: 0.96,
        duration: 40000,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
      progressAnimation.removeListener(listenerId);
    };
  }, [progress, progressAnimation]);

  if (progress) {
    const progressBarWidth = progressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.container}>
        {label ? (
          <IBMPlexText style={styles.progressTitle}>{label}</IBMPlexText>
        ) : null}
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
          style={styles.progressTrack}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressBarWidth,
              },
            ]}
          />
        </View>
        <View style={styles.progressTextRow}>
          <IBMPlexText style={styles.progressLabel}>{progressLabel}</IBMPlexText>
          <IBMPlexText style={styles.progressPercent}>
            {progressPercent}%
          </IBMPlexText>
        </View>
        <IBMPlexText style={styles.progressHint}>
          This can take a minute while the program is assembled.
        </IBMPlexText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.72)" />
      {label ? <IBMPlexText style={styles.label}>{label}</IBMPlexText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 14,
    color: "#ffffff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 20,
    lineHeight: 22,
  },
  progressTitle: {
    color: "#ffffff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 20,
    lineHeight: 22,
  },
  progressTrack: {
    width: "72%",
    maxWidth: 340,
    height: 12,
    marginTop: 22,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#F3E7A6",
  },
  progressTextRow: {
    width: "72%",
    maxWidth: 340,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
  },
  progressLabel: {
    flex: 1,
    color: "rgba(255, 255, 255, 0.86)",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 14,
    lineHeight: 18,
  },
  progressPercent: {
    color: "#ffffff",
    fontFamily: "IBMPlexSans_700Bold",
    fontSize: 14,
    lineHeight: 18,
  },
  progressHint: {
    width: "72%",
    maxWidth: 340,
    marginTop: 8,
    color: "rgba(255, 255, 255, 0.56)",
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});
