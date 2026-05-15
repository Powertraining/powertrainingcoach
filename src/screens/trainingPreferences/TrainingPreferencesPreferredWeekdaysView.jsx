import { Text, View, StyleSheet, useWindowDimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";

import { WEEKDAY_OPTIONS } from "../../constants/weekdays.js";

export default function TrainingPreferencesPreferredWeekdaysView({
  daysPerWeek,
  preferredWeekdays,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <View style={styles.field}>
        <Text style={styles.label}>Preferred weekdays</Text>
        <Text style={styles.helperText}>
          Optional. The plan still runs as Day 1, Day 2, Day 3, and so on.
          These only add calendar guidance.
        </Text>
        <View style={styles.preferenceGrid}>
          {Array.from({ length: daysPerWeek }, (_, index) => (
            <View
              key={`preferred-weekday-${index + 1}`}
              style={styles.preferenceItem}
            >
              <Text style={styles.preferenceLabel}>Day {index + 1}</Text>
              <Picker
                selectedValue={preferredWeekdays[index] || ""}
                onValueChange={(value) => onChange(index, value)}
                style={styles.input}
              >
                {WEEKDAY_OPTIONS.map((option) => (
                  <Picker.Item
                    key={`${option.value || "none"}-${index + 1}`}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#111827",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
  },
  preferenceGrid: {
    gap: 10,
  },
  preferenceItem: {
    gap: 6,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
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
});
