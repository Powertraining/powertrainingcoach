import { View, StyleSheet, useWindowDimensions } from "react-native";

import { TRAINING_PHASE_OPTIONS } from "../../constants/appLogicSettings.js";
import SideButton from "../../components/questionnaireComponents/SideButton.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

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
        <TitleText height={380}>Training phase</TitleText>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
    justifyContent: "center",
    paddingBottom: 156,
  },
  field: {
    gap: 6,
  },
  phaseButtonRow: {
    flexDirection: "column",
    gap: 10,
    height: 230,
    justifyContent: "center",
  },
});
