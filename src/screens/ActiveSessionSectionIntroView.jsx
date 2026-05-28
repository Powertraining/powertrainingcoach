import { useEffect, useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
const SECTION_PROGRESS_RING_SIZE = 260;
const SECTION_PROGRESS_RING_CENTER = SECTION_PROGRESS_RING_SIZE / 2;
const SECTION_PROGRESS_RING_RADIUS = 110;
const SECTION_PROGRESS_RING_STROKE = 12;
const SECTION_PROGRESS_RING_CIRCUMFERENCE =
  2 * Math.PI * SECTION_PROGRESS_RING_RADIUS;
const SECTION_PROGRESS_RING_ANIMATION_DURATION_MS = 360;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function clampProgressCount(value, total) {
  const parsedValue = Number.parseInt(value, 10);
  const parsedTotal = Number.parseInt(total, 10);

  if (!Number.isFinite(parsedValue) || !Number.isFinite(parsedTotal)) {
    return 0;
  }

  return Math.max(0, Math.min(parsedValue, parsedTotal));
}

function getProgressOffset(completedCount, totalCount) {
  if (totalCount <= 0) {
    return SECTION_PROGRESS_RING_CIRCUMFERENCE;
  }

  return (
    SECTION_PROGRESS_RING_CIRCUMFERENCE -
    SECTION_PROGRESS_RING_CIRCUMFERENCE * (completedCount / totalCount)
  );
}

export default function ActiveSessionSectionIntroView({
  weekNumber = 1,
  phaseLabel = "Building",
  phaseFocus = "",
  sectionLabel = "",
  sectionIndex = 0,
  sectionCount = 0,
  exerciseCount = 0,
  completedExerciseCount = 0,
  previousCompletedExerciseCount = completedExerciseCount,
  totalExerciseCount = 0,
  progressAnimationDelayMs = 0,
  isSessionComplete = false,
  hideIntroContent = false,
  children,
  onContinue,
}) {
  const sectionNumber = sectionIndex + 1;
  const stageLabel = isSessionComplete
    ? "Stage complete"
    : `Stage ${sectionNumber} - ${sectionLabel}`;
  const safeTotalExerciseCount = Math.max(0, Number.parseInt(totalExerciseCount, 10) || 0);
  const safeCompletedExerciseCount = clampProgressCount(
    completedExerciseCount,
    safeTotalExerciseCount
  );
  const safePreviousCompletedExerciseCount = clampProgressCount(
    previousCompletedExerciseCount,
    safeTotalExerciseCount
  );
  const previousProgressOffset = getProgressOffset(
    safePreviousCompletedExerciseCount,
    safeTotalExerciseCount
  );
  const progressOffset = getProgressOffset(
    safeCompletedExerciseCount,
    safeTotalExerciseCount
  );
  const animatedProgressOffset = useRef(
    new Animated.Value(previousProgressOffset)
  ).current;

  useEffect(() => {
    animatedProgressOffset.setValue(previousProgressOffset);
    const animation = Animated.timing(animatedProgressOffset, {
      toValue: progressOffset,
      duration: SECTION_PROGRESS_RING_ANIMATION_DURATION_MS,
      delay: progressAnimationDelayMs,
      useNativeDriver: false,
    });

    animation.start();

    return () => animation.stop();
  }, [
    animatedProgressOffset,
    previousProgressOffset,
    progressAnimationDelayMs,
    progressOffset,
  ]);

  return (
    <View style={styles.sectionIntro}>
      {!hideIntroContent ? (
        <View style={styles.sectionIntroContent}>
          <View style={styles.sectionIntroRing}>
            <Svg
              width={SECTION_PROGRESS_RING_SIZE}
              height={SECTION_PROGRESS_RING_SIZE}
              viewBox={`0 0 ${SECTION_PROGRESS_RING_SIZE} ${SECTION_PROGRESS_RING_SIZE}`}
            >
              <Circle
                cx={SECTION_PROGRESS_RING_CENTER}
                cy={SECTION_PROGRESS_RING_CENTER}
                r={SECTION_PROGRESS_RING_RADIUS}
                fill="none"
                stroke="#5f5f5f"
                strokeWidth={SECTION_PROGRESS_RING_STROKE}
              />
              <AnimatedCircle
                cx={SECTION_PROGRESS_RING_CENTER}
                cy={SECTION_PROGRESS_RING_CENTER}
                r={SECTION_PROGRESS_RING_RADIUS}
                fill="none"
                stroke="#ffffff"
                strokeWidth={SECTION_PROGRESS_RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${SECTION_PROGRESS_RING_CIRCUMFERENCE} ${SECTION_PROGRESS_RING_CIRCUMFERENCE}`}
                strokeDashoffset={animatedProgressOffset}
                rotation="-90"
                originX={SECTION_PROGRESS_RING_CENTER}
                originY={SECTION_PROGRESS_RING_CENTER}
              />
            </Svg>
            <View style={styles.sectionIntroRingContent}>
              <View style={styles.sectionIntroPhaseBlock}>
                <IBMPlexText style={styles.sectionIntroTitle}>
                  {isSessionComplete ? "Complete" : phaseLabel}
                </IBMPlexText>
                <IBMPlexText style={styles.sectionIntroWeekText}>Week {weekNumber}</IBMPlexText>
              </View>
            </View>
          </View>
          {phaseFocus ? (
            <IBMPlexText style={styles.sectionIntroPhaseText}>{phaseFocus}</IBMPlexText>
          ) : null}
          {isSessionComplete ? (
            <IBMPlexText style={styles.sectionIntroDescription}>
              Save this session and return to your plan.
            </IBMPlexText>
          ) : exerciseCount > 0 ? (
            <IBMPlexText style={styles.sectionIntroDescription}>
              {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"} in this section.
            </IBMPlexText>
          ) : null}
        </View>
      ) : null}
      {children}
      <View style={styles.sectionIntroFooter}>
        {hideIntroContent ? null : (
          <IBMPlexText style={styles.sectionIntroStageLabel}>{stageLabel}</IBMPlexText>
        )}
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <IBMPlexText defaultWhite style={styles.nextButtonText}>Continue</IBMPlexText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionIntro: {
    flex: 1,
    justifyContent: "space-between",
    gap: 24,
    paddingTop: 0,
    paddingBottom: 18,
  },
  sectionIntroContent: {
    minHeight: "56%",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingBottom: 18,
  },
  sectionIntroRing: {
    alignItems: "center",
    height: SECTION_PROGRESS_RING_SIZE,
    justifyContent: "center",
    width: SECTION_PROGRESS_RING_SIZE,
  },
  sectionIntroRingContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 42,
  },
  sectionIntroTitle: {
    color: "#fff",
    fontSize: 30, fontWeight: "800",
    lineHeight: 36,
    textAlign: "center",
  },
  sectionIntroPhaseBlock: {
    alignItems: "center",
    gap: 4,
  },
  sectionIntroWeekText: {
    color: "#fff",
    fontSize: 18, fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  sectionIntroPhaseText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
    textAlign: "center",
  },
  sectionIntroDescription: {
    color: "#C9B259",
    fontSize: 15,
    lineHeight: 22,
  },
  sectionIntroFooter: {
    alignItems: "center",
    gap: 10,
    paddingTop: 16,
  },
  sectionIntroStageLabel: {
    color: "#fff",
    fontSize: 13, fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
  },
  continueButton: {
    alignSelf: "center",
    width: "68%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
    backgroundColor: "#fff",
  },
  nextButtonText: {
    color: "#000",
    fontSize: 17, fontWeight: "700",
  },
});
