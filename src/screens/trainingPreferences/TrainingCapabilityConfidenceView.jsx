import {
  Image,
  StyleSheet,
  View,
} from "react-native";
import PressedShadowButton from "../../components/questionnaireComponents/PressedShadowButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const CONFIDENCE_OPTIONS = [
  { label: "I'm not", value: "no" },
  { label: "Fairly", value: "somewhat" },
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
        <IBMPlexText defaultWhite style={styles.exerciseBoxText}>{exercise}</IBMPlexText>
      )}
    </View>
  );
}

function ConfidenceOptionButton({ isSelected, label, onPress }) {
  return (
    <PressedShadowButton
      faceSelectedStyle={styles.optionFaceSelected}
      faceStyle={styles.optionFace}
      onPress={onPress}
      pressedTranslateX={-OPTION_SHADOW_OFFSET}
      pressedTranslateY={-OPTION_SHADOW_OFFSET}
      releaseOnPressOut={false}
      selected={isSelected}
      shadowSelectedStyle={styles.optionShadowSelected}
      shadowStyle={styles.optionShadow}
      style={styles.optionButton}
    >
      <IBMPlexText defaultWhite
        lines={1}
        style={[
          styles.optionButtonText,
          isSelected ? styles.optionButtonTextSelected : null,
        ]}
      >
        {label}
      </IBMPlexText>
    </PressedShadowButton>
  );
}

export default function TrainingCapabilityConfidenceView({
  item,
  value,
  onChange,
  exerciseImages = {},
}) {
  const exerciseExamples = getExerciseExamples(item?.description);
  const exerciseRows = getExerciseRows(exerciseExamples);

  return (
    <View style={styles.container}>
      <View style={styles.titleWrap}>
        <IBMPlexText style={styles.titleText}>{item.label}</IBMPlexText>
        <IBMPlexText defaultWhite style={styles.categoryText}>{item.description}</IBMPlexText>
      </View>

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
        <IBMPlexText defaultWhite style={styles.confidenceQuestion}>
          How confident are you?
        </IBMPlexText>
        <View style={styles.optionRow}>
          {CONFIDENCE_OPTIONS.map((option) => {
            const isSelected = value === option.value;

            return (
              <ConfidenceOptionButton
                key={option.value}
                isSelected={isSelected}
                label={option.label}
                onPress={() => {
                  onChange?.(isSelected ? null : option.value);
                }}
              />
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
    minHeight: 560,
    paddingTop: 18,
    paddingBottom: 170,
  },
  titleWrap: {
    width: "75%",
    height: 132,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 35,
  },
  titleText: {
    color: "#ffffff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 35,
    lineHeight: 39,
    textAlign: "center",
  },
  categoryText: {
    color: "#C9B259",
    fontSize: 16,
    lineHeight: 19,
    marginTop: 8,
    textAlign: "center",
  },
  exerciseGrid: {
    width: "78%",
    marginTop: 20,
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
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1E1E1E",
    backgroundColor: "#141414",
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
    bottom: -42,
    gap: 12,
  },
  confidenceQuestion: {
    color: "#9A9A9A",
    fontSize: 20,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 18,
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
    borderRadius: 14,
    backgroundColor: "#E1E1E1",
    zIndex: 0,
  },
  optionShadowSelected: {
    backgroundColor: "#8B7B3E",
  },
  optionFace: {
    height: OPTION_BUTTON_HEIGHT,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
  optionFaceSelected: {
    backgroundColor: "#C9B259",
    borderColor: "#C9B259",
  },
  optionButtonText: {
    color: "#000000",
    fontSize: 15,
    textAlign: "center",
    includeFontPadding: false,
    width: "100%",
  },
  optionButtonTextSelected: {
    color: "#000000",
  },
});
