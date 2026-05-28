import { StyleSheet, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
const SECTION_PROGRESS_RING_SIZE = 260;
const SECTION_PROGRESS_RING_CENTER = SECTION_PROGRESS_RING_SIZE / 2;
const SECTION_PROGRESS_RING_RADIUS = 110;
const SECTION_PROGRESS_RING_STROKE = 12;
const SECTION_PROGRESS_RING_CIRCUMFERENCE =
  2 * Math.PI * SECTION_PROGRESS_RING_RADIUS;

export default function ActiveSessionSectionIntroView({
  weekNumber = 1,
  phaseLabel = "Building",
  phaseFocus = "",
  sectionLabel = "",
  sectionIndex = 0,
  sectionCount = 0,
  exerciseCount = 0,
  completedExerciseCount = 0,
  totalExerciseCount = 0,
  isSessionComplete = false,
  hideIntroContent = false,
  children,
  onContinue,
}) {
  const sectionNumber = sectionIndex + 1;
  const stageLabel = isSessionComplete
    ? "Stage complete"
    : `Stage ${sectionNumber} - ${sectionLabel}`;
  const progressPercent =
    totalExerciseCount > 0
      ? Math.round((completedExerciseCount / totalExerciseCount) * 100)
      : 0;
  const progressOffset =
    SECTION_PROGRESS_RING_CIRCUMFERENCE -
    SECTION_PROGRESS_RING_CIRCUMFERENCE * (progressPercent / 100);

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
              <Circle
                cx={SECTION_PROGRESS_RING_CENTER}
                cy={SECTION_PROGRESS_RING_CENTER}
                r={SECTION_PROGRESS_RING_RADIUS}
                fill="none"
                stroke="#ffffff"
                strokeWidth={SECTION_PROGRESS_RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={`${SECTION_PROGRESS_RING_CIRCUMFERENCE} ${SECTION_PROGRESS_RING_CIRCUMFERENCE}`}
                strokeDashoffset={progressOffset}
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
    color: "#d1d5db",
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
