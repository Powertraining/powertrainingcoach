import { Animated, StyleSheet, View } from "react-native";

export default function AnimatedPromptCardFrame({
  animationProgress,
  animationMode = "draw",
  children,
  style,
}) {
  const erase = animationMode === "erase";
  const topWidth = erase
    ? animationProgress.interpolate({
        inputRange: [0, 0.25],
        outputRange: ["100%", "0%"],
        extrapolate: "clamp",
      })
    : animationProgress.interpolate({
        inputRange: [0, 0.25],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });
  const rightHeight = erase
    ? animationProgress.interpolate({
        inputRange: [0, 0.25, 0.5],
        outputRange: ["100%", "100%", "0%"],
        extrapolate: "clamp",
      })
    : animationProgress.interpolate({
        inputRange: [0.25, 0.5],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });
  const bottomWidth = erase
    ? animationProgress.interpolate({
        inputRange: [0, 0.5, 0.75],
        outputRange: ["100%", "100%", "0%"],
        extrapolate: "clamp",
      })
    : animationProgress.interpolate({
        inputRange: [0.5, 0.75],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });
  const leftHeight = erase
    ? animationProgress.interpolate({
        inputRange: [0, 0.75, 1],
        outputRange: ["100%", "100%", "0%"],
        extrapolate: "clamp",
      })
    : animationProgress.interpolate({
        inputRange: [0.75, 1],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });

  return (
    <View style={[styles.card, style]}>
      <View pointerEvents="none" style={styles.borderLayer}>
        <Animated.View
          style={[
            styles.borderTop,
            { left: erase ? animationProgress.interpolate({
              inputRange: [0, 0.25], outputRange: ["0%", "100%"], extrapolate: "clamp",
            }) : "0%", width: topWidth },
          ]}
        />
        <Animated.View
          style={[
            styles.borderRight,
            { height: rightHeight, top: erase ? animationProgress.interpolate({
              inputRange: [0.25, 0.5], outputRange: ["0%", "100%"], extrapolate: "clamp",
            }) : "0%" },
          ]}
        />
        <Animated.View
          style={[
            styles.borderBottom,
            { right: erase ? animationProgress.interpolate({
              inputRange: [0.5, 0.75], outputRange: ["0%", "100%"], extrapolate: "clamp",
            }) : "0%", width: bottomWidth },
          ]}
        />
        <Animated.View
          style={[
            styles.borderLeft,
            { bottom: erase ? animationProgress.interpolate({
              inputRange: [0.75, 1], outputRange: ["0%", "100%"], extrapolate: "clamp",
            }) : "0%", height: leftHeight },
          ]}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
  },
  borderLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
  },
  borderTop: { borderColor: "#141414", borderStyle: "dashed", borderTopWidth: 2, position: "absolute", top: 0 },
  borderRight: { borderColor: "#141414", borderRightWidth: 2, borderStyle: "dashed", position: "absolute", right: 0 },
  borderBottom: { borderBottomWidth: 2, borderColor: "#141414", borderStyle: "dashed", bottom: 0, position: "absolute" },
  borderLeft: { borderColor: "#141414", borderLeftWidth: 2, borderStyle: "dashed", left: 0, position: "absolute" },
});
