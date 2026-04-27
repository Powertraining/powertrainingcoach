import { Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";
import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";

const GROUP = TRAINING_CAPABILITY_GROUPS[0];
const ITEM = GROUP.items[0];
const EXERCISE_BOXES = ITEM.description.split(",").map((exercise) => exercise.trim());
const EXERCISE_IMAGES = {
  squat: require("../../assets/icons/sports/squat.png"),
  deadlift: require("../../assets/icons/sports/deadLift.png"),
  bench: require("../../assets/icons/sports/benchPress.png"),
  row: require("../../assets/icons/sports/row.png"),
  "overhead press": require("../../assets/icons/sports/overheadPress.png"),
};
const CONFIDENCE_OPTIONS = [
  { label: "Not Very", value: "no" },
  { label: "Somewhat", value: "somewhat" },
  { label: "Very", value: "yes" },
];

export default function TrainingPreferencesCompoundLiftsView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <TitleText height={86}>{ITEM.label}</TitleText>
      <StandardText style={styles.categoryText}>{ITEM.description}</StandardText>
      <View style={styles.exerciseGrid}>
        <View style={styles.exerciseRow}>
          {EXERCISE_BOXES.slice(0, 3).map((exercise) => (
            <View key={exercise} style={styles.exerciseBox}>
              <Image
                source={EXERCISE_IMAGES[exercise.toLowerCase()]}
                style={styles.exerciseImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </View>
        <View style={styles.exerciseRow}>
          {EXERCISE_BOXES.slice(3).map((exercise) => (
            <View key={exercise} style={styles.exerciseBox}>
              <Image
                source={EXERCISE_IMAGES[exercise.toLowerCase()]}
                style={styles.exerciseImage}
                resizeMode="contain"
              />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.options}>
        <StandardText style={styles.confidenceQuestion}>
          How confident are you?
        </StandardText>
        <View style={styles.optionRow}>
          {CONFIDENCE_OPTIONS.map((option) => {
            const isSelected = value === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  onChange?.(isSelected ? null : option.value);
                }}
                style={styles.optionButton}
              >
                <View
                  pointerEvents="none"
                  style={[
                    styles.optionShadow,
                    isSelected ? styles.optionShadowSelected : null,
                  ]}
                />
                <View style={styles.optionFace}>
                  <StandardText
                    style={styles.optionButtonText}
                    textColor="#000000"
                  >
                    {option.label}
                  </StandardText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 120,
  },
  categoryText: {
    color: "#C9B259",
    fontSize: 14,
    marginTop: 6,
    width: "75%",
    textAlign: "center",
  },
  exerciseGrid: {
    width: "78%",
    marginTop: 36,
    gap: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  exerciseBox: {
    width: 76,
    height: 76,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "#585858",
    borderStyle: "dashed",
    backgroundColor: "#0F0F0F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  exerciseImage: {
    width: 46,
    height: 46,
    tintColor: "#585858",
  },
  options: {
    width: "78%",
    position: "absolute",
    bottom: 50,
    gap: 12,
  },
  confidenceQuestion: {
    fontSize: 20,
    textAlign: "center",
    marginBlock: 18,
  },
  optionRow: {
    flexDirection: "row",
    gap: 12,
  },
  optionButton: {
    flex: 1,
    minHeight: 48,
    position: "relative",
    overflow: "visible",
  },
  optionShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: "#E1E1E1",
    transform: [{ translateX: -6 }, { translateY: -6 }],
    zIndex: 0,
  },
  optionShadowSelected: {
    backgroundColor: "#C9B259",
  },
  optionFace: {
    minHeight: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
  optionButtonText: {
    fontSize: 16,
  },
});
