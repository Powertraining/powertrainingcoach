import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";

import { TRAINING_PHASE_OPTIONS } from "../../constants/appLogicSettings.js";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const PHASE_BUTTON_LABELS = Object.freeze({
  off_camp: "Off camp",
  in_camp: "In camp",
});

export default function QuestionnaireTrainingPhaseView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={130}>Training phase</TitleText>
      <StandardText style={styles.helperText} center>
        Choose whether you are building generally or preparing for a specific event.
      </StandardText>

      <View style={styles.phaseButtonRow}>
        {TRAINING_PHASE_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange?.(isSelected ? null : option.value)}
              style={({ pressed }) => [
                styles.phaseButton,
                isSelected ? styles.phaseButtonSelected : null,
                pressed ? styles.phaseButtonPressed : null,
              ]}
            >
              <StandardText
                style={[
                  styles.phaseButtonTitle,
                  isSelected ? styles.phaseButtonTitleSelected : null,
                ]}
              >
                {PHASE_BUTTON_LABELS[option.value] || option.label}
              </StandardText>
              <StandardText
                style={[
                  styles.phaseButtonDescription,
                  isSelected ? styles.phaseButtonDescriptionSelected : null,
                ]}
              >
                {option.description}
              </StandardText>
            </Pressable>
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
  phaseButton: {
    alignSelf: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    minHeight: 116,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: "75%",
  },
  phaseButtonSelected: {
    borderColor: "#ffffff",
    borderStyle: "solid",
  },
  phaseButtonPressed: {
    opacity: 0.78,
  },
  phaseButtonTitle: {
    color: "#ffffff",
    fontSize: 28,
    lineHeight: 32,
    textAlign: "center",
  },
  phaseButtonTitleSelected: {
    color: "#ffffff",
  },
  phaseButtonDescription: {
    color: "#9ca3af",
    fontSize: 14,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center",
  },
  phaseButtonDescriptionSelected: {
    color: "#ffffff",
  },
});
