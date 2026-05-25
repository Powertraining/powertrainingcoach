import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import TitleText from "../../components/textComponents/TitleText.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import { ENDURANCE_MODALITY_OPTIONS } from "../../constants/trainingPreferences.js";

const ENDURANCE_METHOD_IMAGES = Object.freeze({
  assault_bike: require("../../assets/icons/sports/assult Bike.png"),
  bicycling: require("../../assets/icons/sports/bike.png"),
  circuit_training: require("../../assets/icons/sports/curcuitTraining.png"),
  heavy_bag: require("../../assets/icons/sports/heavyBag.png"),
  rowing_ergometer: require("../../assets/icons/sports/rower.png"),
  running: require("../../assets/icons/sports/running.png"),
  sprinting: require("../../assets/icons/sports/running.png"),
  sport_specific: require("../../assets/icons/sport.png"),
  swimming: require("../../assets/icons/sports/stamina.png"),
});

const ENDURANCE_METHOD_TEXT = Object.freeze({
  arm_crank_machine: "Arm",
  skiing_ergometer: "Ski",
  versaclimber: "VC",
});

export default function TrainingPreferencesEnduranceMethodsView({
  value = [],
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [activeInfoValue, setActiveInfoValue] = useState(null);
  const selectedValues = Array.isArray(value) ? value : [];
  const activeInfoOption = ENDURANCE_MODALITY_OPTIONS.find(
    (option) => option.value === activeInfoValue
  );

  function toggleMethod(methodValue) {
    const nextValues = selectedValues.includes(methodValue)
      ? selectedValues.filter((entry) => entry !== methodValue)
      : [...selectedValues, methodValue];

    onChange?.(nextValues);
  }

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={118}>Endurance Methods</TitleText>
      <StandardText style={styles.helperText} textColor="#C9B259" center>
        Optional. Pick the tools you prefer, or leave this open so the coach can
        choose around your week.
      </StandardText>

      <View style={styles.grid}>
        {ENDURANCE_MODALITY_OPTIONS.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          const imageSource = ENDURANCE_METHOD_IMAGES[option.value];
          const mediaText = ENDURANCE_METHOD_TEXT[option.value];

          return (
            <Pressable
              key={option.value}
              onPress={() => toggleMethod(option.value)}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Pressable
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  setActiveInfoValue((currentValue) =>
                    currentValue === option.value ? null : option.value
                  );
                }}
                style={styles.infoButton}
              >
                <Text style={styles.infoButtonText}>?</Text>
              </Pressable>
              {imageSource ? (
                <Image
                  source={imageSource}
                  style={styles.optionImage}
                  resizeMode="contain"
                />
              ) : (
                <Text style={styles.mediaText}>{mediaText}</Text>
              )}
              <Text style={styles.optionLabel}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeInfoOption ? (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>{activeInfoOption.label}</Text>
          <Text style={styles.infoText}>{activeInfoOption.description}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  helperText: {
    alignSelf: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
    maxWidth: 330,
    paddingHorizontal: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  option: {
    alignItems: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 112,
    paddingHorizontal: 8,
    paddingVertical: 12,
    position: "relative",
    width: "30%",
  },
  optionSelected: {
    borderColor: "#ffffff",
  },
  optionPressed: {
    opacity: 0.78,
  },
  optionImage: {
    height: 36,
    marginBottom: 12,
    width: 36,
  },
  mediaText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  optionLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  infoButton: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: 6,
    top: 6,
    width: 18,
  },
  infoButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14,
  },
  infoPanel: {
    alignSelf: "center",
    marginTop: 16,
    maxWidth: 340,
    minHeight: 82,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  infoText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
