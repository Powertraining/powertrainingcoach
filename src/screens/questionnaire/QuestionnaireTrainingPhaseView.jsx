import { Text, TextInput, View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { TRAINING_PHASE_OPTIONS } from "../../constants/appLogicSettings.js";

function OptionDescription({ value }) {
  const selectedOption = TRAINING_PHASE_OPTIONS.find(
    (option) => option.value === value
  );

  if (!selectedOption?.description) {
    return null;
  }

  return <Text style={styles.helperText}>{selectedOption.description}</Text>;
}

export default function QuestionnaireTrainingPhaseView({
  value,
  competitionTimeline = "",
  onChange,
  onCompetitionTimelineChange,
}) {
  return (
    <View style={styles.section}>
      <View style={styles.field}>
        <Text style={styles.label}>Training phase</Text>
        <Picker
          selectedValue={value}
          onValueChange={(nextValue) => onChange?.(nextValue)}
          style={styles.input}
        >
          {TRAINING_PHASE_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
        <OptionDescription value={value} />
      </View>

      {value === "in_camp" && (
        <View style={styles.field}>
          <Text style={styles.label}>When is the planned competition?</Text>
          <TextInput
            placeholder="e.g. 2026-06-20 or 8 weeks out"
            value={competitionTimeline}
            onChangeText={(nextValue) =>
              onCompetitionTimelineChange?.(nextValue)
            }
            style={styles.input}
          />
          <Text style={styles.helperText}>
            Share a date or timeline so the app can plan the camp appropriately.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
});
