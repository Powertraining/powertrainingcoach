import { EQUIPMENT_OPTIONS } from "../../constants/trainingPreferences.js";
import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const EQUIPMENT_IMAGES = Object.freeze({
  full_gym: require("../../assets/icons/bench.png"),
  home_minimal: require("../../assets/icons/dumbellpng.png"),
  bodyweight_only: require("../../assets/icons/bicep.png"),
});

export default function TrainingPreferencesEquipmentView({
  value,
  onChange,
}) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;
  const imageSize = Math.min(Math.max(screenWidth * 0.12, 42), 56);

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <IBMPlexText titleBlock height={130}>Equipment available</IBMPlexText>
      <IBMPlexText defaultWhite style={styles.helperText} center>
        Pick the setup you can train with most often so exercises match your access.
      </IBMPlexText>
      <View style={styles.options}>
        {EQUIPMENT_OPTIONS.map((option) => {
          const isSelected = displayedValue === option.value;

          return (
            <PreferenceOptionButton
              key={option.value}
              onPress={() => {
                setIsSelectionCleared(isSelected);
                onChange?.(isSelected ? null : option.value);
              }}
              isSelected={isSelected}
              stacked
              buttonStyle={styles.optionButton}
              imageSource={EQUIPMENT_IMAGES[option.value]}
              imageStyle={[
                styles.optionImage,
                { height: imageSize, width: imageSize },
              ]}
              labelStyle={styles.optionLabel}
              label={option.label}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  options: {
    gap: 16,
    marginTop: 56,
  },
  optionButton: {
    minHeight: 118,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionImage: {
    flexShrink: 1,
  },
  optionLabel: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
  },
});
