import { ScrollView, StyleSheet, View } from "react-native";

import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
import { PROGRAM_MAX_SETUP_OPTIONS } from "../../constants/appLogicSettings.js";

export default function ProgramMaxSetupView({ value, onChange }) {
  return (
    <View style={styles.section}>
      <IBMPlexText titleBlock height={178}>
        Start now or calibrate your maxes first?
      </IBMPlexText>
      <ScrollView
        contentContainerStyle={styles.options}
        showsVerticalScrollIndicator={false}
      >
        {PROGRAM_MAX_SETUP_OPTIONS.map((option) => (
          <PreferenceOptionButton
            key={option.value}
            isSelected={value === option.value}
            label={option.label}
            mediaText={option.value === "calibration_week" ? "CAL" : "RPE"}
            description={option.description}
            onPress={() => onChange?.(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 52,
  },
  options: {
    gap: 14,
    paddingBottom: 132,
  },
});
