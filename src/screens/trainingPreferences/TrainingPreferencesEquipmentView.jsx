import { EQUIPMENT_OPTIONS } from "../../constants/trainingPreferences.js";
import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const EQUIPMENT_IMAGES = Object.freeze({
  full_gym: require("../../assets/icons/bench.png"),
  home_minimal: require("../../assets/icons/dumbellpng.png"),
  bodyweight_only: require("../../assets/icons/bicep.png"),
});

export default function TrainingPreferencesEquipmentView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <TitleText height={130}>Equipment available</TitleText>
      <StandardText style={styles.helperText} center>
        Pick the setup you can train with most often so exercises match your access.
      </StandardText>
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
              imageSource={EQUIPMENT_IMAGES[option.value]}
              imageStyle={
                option.value === "full_gym" ? styles.benchImage : null
              }
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
  benchImage: {
    height: 68,
    width: 68,
  },
});
