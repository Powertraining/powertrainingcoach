import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useEffect, useRef, useState } from "react";

import { TRAINING_PHASE_OPTIONS } from "../../constants/appLogicSettings.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const PHASE_BUTTON_TRAVEL = 12;
const PHASE_BUTTON_FACE_HEIGHT = 116;
const PHASE_BUTTON_HEIGHT = PHASE_BUTTON_FACE_HEIGHT + 18;
const PHASE_SELECTION_DURATION = 118;
const SHADOW_COLOR = "#F3E7A6";

const PHASE_BUTTON_LABELS = Object.freeze({
  off_camp: "Off camp",
  in_camp: "In camp",
});

function TrainingPhaseOptionButton({ option, isSelected, onPress }) {
  const selectionProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  function animateSelection(toValue) {
    selectionProgress.stopAnimation();

    Animated.timing(selectionProgress, {
      toValue,
      duration: PHASE_SELECTION_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  useEffect(() => {
    animateSelection(isSelected ? 1 : 0);
  }, [isSelected, selectionProgress]);

  function handlePressIn() {
    const nextSelected = !isSelected;
    animateSelection(nextSelected ? 1 : 0);

    pressScale.stopAnimation();
    Animated.timing(pressScale, {
      toValue: nextSelected ? 1.01 : 0.995,
      duration: 70,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
    onPress?.();
  }

  function handlePressOut() {
    pressScale.stopAnimation();
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const animatedShadowStyle = {
    opacity: selectionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    backgroundColor: SHADOW_COLOR,
    transform: [
      {
        translateY: selectionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [PHASE_BUTTON_TRAVEL, 0],
        }),
      },
    ],
  };

  const animatedButtonStyle = {
    transform: [
      {
        translateY: selectionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [PHASE_BUTTON_TRAVEL, 0],
        }),
      },
      {
        scale: selectionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
      { scale: pressScale },
    ],
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.phaseButtonPressable}
    >
      <Animated.View style={[styles.phaseButtonShadow, animatedShadowStyle]} />
      <Animated.View
        style={[
          styles.phaseButton,
          isSelected ? styles.phaseButtonSelected : null,
          animatedButtonStyle,
        ]}
      >
        <IBMPlexText
          defaultWhite
          style={[
            styles.phaseButtonTitle,
            isSelected ? styles.phaseButtonTitleSelected : null,
          ]}
        >
          {PHASE_BUTTON_LABELS[option.value] || option.label}
        </IBMPlexText>
        <IBMPlexText
          defaultWhite
          style={[
            styles.phaseButtonDescription,
            isSelected ? styles.phaseButtonDescriptionSelected : null,
          ]}
        >
          {option.description}
        </IBMPlexText>
      </Animated.View>
    </Pressable>
  );
}

export default function QuestionnaireTrainingPhaseView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [visualValue, setVisualValue] = useState(value ?? null);

  useEffect(() => {
    setVisualValue(value ?? null);
  }, [value]);

  function handleChange(nextValue) {
    setVisualValue(nextValue);
    onChange?.(nextValue);
  }

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <IBMPlexText titleBlock height={130}>Training phase</IBMPlexText>
      <IBMPlexText defaultWhite style={styles.helperText} center>
        Choose whether you are building generally or preparing for a specific event.
      </IBMPlexText>

      <View style={styles.phaseButtonRow}>
        {TRAINING_PHASE_OPTIONS.map((option) => {
          const isSelected = visualValue === option.value;

          return (
            <TrainingPhaseOptionButton
              key={option.value}
              option={option}
              isSelected={isSelected}
              onPress={() => handleChange(isSelected ? null : option.value)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
    transform: [{ translateY: 36 }],
  },
  helperText: {
    width: "82%",
    alignSelf: "center",
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  phaseButtonRow: {
    flexDirection: "column",
    gap: 16,
    marginTop: 56,
  },
  phaseButtonPressable: {
    alignSelf: "center",
    height: PHASE_BUTTON_HEIGHT,
    position: "relative",
    width: "75%",
  },
  phaseButtonShadow: {
    borderRadius: 22,
    height: PHASE_BUTTON_HEIGHT,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  phaseButton: {
    alignSelf: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    height: PHASE_BUTTON_FACE_HEIGHT,
    justifyContent: "center",
    minHeight: PHASE_BUTTON_FACE_HEIGHT,
    paddingHorizontal: 20,
    paddingVertical: 18,
    position: "absolute",
    top: 0,
    width: "100%",
  },
  phaseButtonSelected: {
    backgroundColor: "#C9B259",
    borderColor: "#F3E7A6",
    borderStyle: "solid",
  },
  phaseButtonTitle: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 32,
    textAlign: "center",
  },
  phaseButtonTitleSelected: {
    color: "#111111",
  },
  phaseButtonDescription: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center",
  },
  phaseButtonDescriptionSelected: {
    color: "#111111",
  },
});
