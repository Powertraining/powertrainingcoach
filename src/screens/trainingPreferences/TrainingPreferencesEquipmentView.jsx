import { EQUIPMENT_OPTIONS } from "../../constants/trainingPreferences.js";
import { useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
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
    <View
      style={{
        minHeight: screenHeight,
        justifyContent: "center",
        gap: 16,
      }}
    >
      <TitleText height={130}>Equipment available</TitleText>
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
  );
}

const styles = StyleSheet.create({
  benchImage: {
    height: 68,
    width: 68,
  },
});
