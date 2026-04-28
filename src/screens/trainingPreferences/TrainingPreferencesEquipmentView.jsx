import { EQUIPMENT_OPTIONS } from "../../constants/trainingPreferences.js";
import { useState } from "react";
import { Image, TouchableOpacity, View, useWindowDimensions, StyleSheet } from "react-native";
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
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              setIsSelectionCleared(isSelected);
              onChange?.(isSelected ? null : option.value);
            }}
            style={[
              styles.burgerButtons,
              isSelected ? styles.burgerButtonSelected : null,
            ]}
          >
            <Image
              source={EQUIPMENT_IMAGES[option.value]}
              style={[
                styles.optionImage,
                option.value === "full_gym" ? styles.benchImage : null,
              ]}
              resizeMode="contain"
            />
            <StandardText
              fontSize={14}
              style={styles.optionText}
              textColor={isSelected ? "#ffffff" : "#C9B259"}
              center
            >
              {option.label}
            </StandardText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  burgerButtons: {
    alignSelf: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "75%",
    height: 110,
  },
  burgerButtonSelected: {
    backgroundColor: "#C9B259",
  },
  optionImage: {
    height: 42,
    marginBottom: 18,
    width: 42 ,
  },
  benchImage: {
    height: 68,
    width: 68,
  },
  optionText: {
    bottom: 8,
    position: "absolute",
    width: "100%",
  },
});
