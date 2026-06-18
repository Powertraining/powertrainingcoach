import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const SIZE = 54;
const CENTER = SIZE / 2;
const RADIUS = 22;
const STROKE_WIDTH = 5;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ANIMATION_DURATION_MS = 220;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function getProgressOffset(progressPercent = 0) {
  return CIRCUMFERENCE - CIRCUMFERENCE * (progressPercent / 100);
}

export default function ActiveSessionProgressRing({
  progressText = "",
  progressPercent = 0,
  previousProgressPercent = progressPercent,
}) {
  const animatedProgressOffset = useRef(
    new Animated.Value(getProgressOffset(previousProgressPercent))
  ).current;

  useEffect(() => {
    animatedProgressOffset.setValue(getProgressOffset(previousProgressPercent));
    const animation = Animated.timing(animatedProgressOffset, {
      toValue: getProgressOffset(progressPercent),
      duration: ANIMATION_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();
    return () => animation.stop();
  }, [animatedProgressOffset, previousProgressPercent, progressPercent]);

  return (
    <View style={styles.ring}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#5f5f5f"
          strokeWidth={STROKE_WIDTH}
        />
        <AnimatedCircle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={animatedProgressOffset}
          rotation="-90"
          originX={CENTER}
          originY={CENTER}
        />
      </Svg>
      <View style={styles.content}>
        <IBMPlexText style={styles.text}>{progressText}</IBMPlexText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: SIZE,
    height: SIZE,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
    textAlign: "center",
  },
});
