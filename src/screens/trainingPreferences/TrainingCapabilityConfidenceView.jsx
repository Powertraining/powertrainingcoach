import { Image, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const CONFIDENCE_OPTIONS = [
  { label: "Not Very", value: "no" },
  { label: "Somewhat", value: "somewhat" },
  { label: "Very", value: "yes" },
];
const OPTION_BUTTON_HEIGHT = 48;
const OPTION_SHADOW_OFFSET = 6;

function getExerciseExamples(description = "") {
  return description
    .split(",")
    .map((exercise) => exercise.trim())
    .filter(Boolean);
}

function getExerciseRows(exercises) {
  if (exercises.length <= 3) {
    return [exercises];
  }

  if (exercises.length === 4) {
    return [exercises.slice(0, 2), exercises.slice(2)];
  }

  return [
    exercises.slice(0, 3),
    ...getExerciseRows(exercises.slice(3)),
  ];
}

function ExerciseBox({ exercise, imageSource }) {
  return (
    <View style={styles.exerciseBox}>
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.exerciseImage}
          resizeMode="contain"
        />
      ) : (
        <StandardText style={styles.exerciseBoxText}>{exercise}</StandardText>
      )}
    </View>
  );
}

export default function TrainingCapabilityConfidenceView({
  item,
  value,
  onChange,
  exerciseImages = {},
}) {
  const { height: screenHeight } = useWindowDimensions();
  const exerciseExamples = getExerciseExamples(item?.description);
  const exerciseRows = getExerciseRows(exerciseExamples);

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <TitleText height={86}>{item.label}</TitleText>
      <StandardText style={styles.categoryText}>{item.description}</StandardText>

      <View style={styles.exerciseGrid}>
        {exerciseRows.map((row, rowIndex) => (
          <View key={`exercise-row-${rowIndex}`} style={styles.exerciseRow}>
            {row.map((exercise) => (
              <ExerciseBox
                key={exercise}
                exercise={exercise}
                imageSource={exerciseImages[exercise.toLowerCase()]}
              />
            ))}
          </View>
        ))}
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
                <View pointerEvents="none" style={styles.optionShadow} />
                <View style={[styles.optionFace, isSelected ? styles.optionFaceSelected : null]}>
                  <StandardText
                    lines={1}
                    style={styles.optionButtonText}
                    textColor="#000000"
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
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
  exerciseBoxText: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
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
    marginVertical: 18,
  },
  optionRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  optionButton: {
    flex: 1,
    height: OPTION_BUTTON_HEIGHT,
    position: "relative",
    overflow: "visible",
  },
  optionShadow: {
    position: "absolute",
    top: -OPTION_SHADOW_OFFSET,
    left: -OPTION_SHADOW_OFFSET,
    right: OPTION_SHADOW_OFFSET,
    bottom: OPTION_SHADOW_OFFSET,
    borderRadius: 8,
    backgroundColor: "#E1E1E1",
    zIndex: 0,
  },
  optionFace: {
    height: OPTION_BUTTON_HEIGHT,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
  optionFaceSelected: {
    transform: [{ translateX: -OPTION_SHADOW_OFFSET }, { translateY: -OPTION_SHADOW_OFFSET }],
  },
  optionButtonText: {
    fontSize: 16,
    textAlign: "center",
    includeFontPadding: false,
    width: "100%",
  },
});
