import { Text, TextInput, View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

import {
  DESIRED_TRAINING_OPTIONS,
  EQUIPMENT_OPTIONS,
  getTrainingPreferencesFormState,
  SESSION_DURATION_OPTIONS,
} from "../constants/trainingPreferences.js";
import {
  COMBAT_TRAINING_INTENSITY_OPTIONS,
  DELOAD_STRATEGY_OPTIONS,
  LIFT_INTENSITY_METHOD_OPTIONS,
  PERCENTAGE_REFERENCE_METHOD_OPTIONS,
  TRAINING_PHASE_OPTIONS,
} from "../constants/appLogicSettings.js";
import { WEEKDAY_OPTIONS } from "../constants/weekdays.js";

export default function ProfileTrainingPreferencesFields({
  title,
  description,
  values,
  onChange,
}) {
  const safeValues = values && typeof values === "object" ? values : {};
  const resolvedValues = getTrainingPreferencesFormState(safeValues);

  function updateFields(patch) {
    onChange?.({
      ...safeValues,
      ...resolvedValues,
      ...patch,
    });
  }

  function updateField(field, value) {
    updateFields({ [field]: value });
  }

  function updatePreferredWeekday(index, value) {
    const nextPreferredWeekdays = Array.from(
      { length: resolvedValues.daysPerWeek },
      (_, currentIndex) => resolvedValues.preferredWeekdays[currentIndex] || ""
    );

    nextPreferredWeekdays[index] = value;
    updateField("preferredWeekdays", nextPreferredWeekdays);
  }

  function renderPicker(field, options) {
    return (
      <Picker
        selectedValue={resolvedValues[field]}
        onValueChange={(value) => updateField(field, value)}
        style={styles.input}
      >
        {options.map((option) => (
          <Picker.Item
            key={option.value}
            label={option.label}
            value={option.value}
          />
        ))}
      </Picker>
    );
  }

  return (
    <View style={styles.section}>
      {(title || description) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Desired training</Text>
        {renderPicker("desiredTraining", DESIRED_TRAINING_OPTIONS)}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Session duration</Text>
        {renderPicker("sessionDuration", SESSION_DURATION_OPTIONS)}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Equipment</Text>
        {renderPicker("equipment", EQUIPMENT_OPTIONS)}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Training phase</Text>
        {renderPicker("trainingPhase", TRAINING_PHASE_OPTIONS)}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Event preparation</Text>
        <TextInput
          value={resolvedValues.eventPreparation}
          onChangeText={(value) => updateField("eventPreparation", value)}
          placeholder="e.g. 2026-06-20 or 8 weeks out"
          placeholderTextColor="#8E8E8E"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Combat training intensity</Text>
        {renderPicker("combatTrainingIntensity", COMBAT_TRAINING_INTENSITY_OPTIONS)}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Lift intensity logic</Text>
        {renderPicker("liftIntensityMethod", LIFT_INTENSITY_METHOD_OPTIONS)}
      </View>

      {resolvedValues.liftIntensityMethod === "percentage" ? (
        <View style={styles.field}>
          <Text style={styles.label}>Percentage reference</Text>
          {renderPicker(
            "percentageReferenceMethod",
            PERCENTAGE_REFERENCE_METHOD_OPTIONS
          )}
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Deload strategy</Text>
        {renderPicker("deloadStrategy", DELOAD_STRATEGY_OPTIONS)}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.groupTitle}>Preferred weekdays</Text>
        {Array.from({ length: resolvedValues.daysPerWeek }, (_, index) => (
          <View key={`profile-weekday-${index + 1}`} style={styles.field}>
            <Text style={styles.label}>Day {index + 1}</Text>
            <Picker
              selectedValue={resolvedValues.preferredWeekdays[index] || ""}
              onValueChange={(value) => updatePreferredWeekday(index, value)}
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
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  description: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 21,
  },
  fieldGroup: {
    gap: 10,
  },
  groupTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
});
