import { Text, View, StyleSheet, useWindowDimensions } from "react-native";

import { TRAINING_PHASE_OPTIONS } from "../../constants/appLogicSettings.js";
import SideButton from "../../components/questionnaireComponents/SideButton.jsx";

function OptionDescription({ value }) {
  const selectedOption = TRAINING_PHASE_OPTIONS.find(
    (option) => option.value === value
  );

  if (!selectedOption?.description) {
    return null;
  }

  return <Text style={styles.helperText}>{selectedOption.description}</Text>;
}

const PHASE_BUTTON_LABELS = Object.freeze({
  off_camp: "OFF CAMP",
  in_camp: "IN CAMP",
});

const PHASE_BUTTON_SIDES = Object.freeze({
  off_camp: "left",
  in_camp: "right",
});

export default function QuestionnaireTrainingPhaseView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <View style={styles.field}>
        <Text style={styles.label}>Training phase</Text>
        <View style={styles.phaseButtonRow}>
          {TRAINING_PHASE_OPTIONS.map((option) => (
            <SideButton
              key={option.value}
              label={PHASE_BUTTON_LABELS[option.value] || option.label}
              isSelected={value === option.value}
              side={PHASE_BUTTON_SIDES[option.value] || "left"}
              onPress={() => onChange?.(option.value)}
            />
          ))}
        </View>
        <OptionDescription value={value} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
    justifyContent: "center",
  },
  field: {
    gap: 6,
  },
  phaseButtonRow: {
    flexDirection: "column",
    gap: 10,
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
});
