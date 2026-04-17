import { Text, TextInput, View, StyleSheet, useWindowDimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";

import AppLogicSettingsFields from "./AppLogicSettingsFields.jsx";
import QuestionnaireTrainingPhaseView from "./questionnaire/QuestionnaireTrainingPhaseView.jsx";
import {
  CAPABILITY_RATING_OPTIONS,
  DESIRED_TRAINING_OPTIONS,
  EQUIPMENT_OPTIONS,
  getTrainingPreferencesFormState,
  SESSION_DURATION_OPTIONS,
  STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS,
  TRAINING_CAPABILITY_GROUPS,
} from "../constants/trainingPreferences.js";
import { WEEKDAY_OPTIONS } from "../constants/weekdays.js";

export default function TrainingPreferencesFields({
  title,
  description,
  values,
  onChange,
  appLogicTitle = "App Logic Settings",
  appLogicDescription,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const resolvedValues = getTrainingPreferencesFormState(values);

  function updateField(field, value) {
    onChange?.({
      ...resolvedValues,
      [field]: value,
    });
  }

  function updatePreferredWeekday(index, value) {
    const nextPreferredWeekdays = Array.from(
      { length: resolvedValues.daysPerWeek },
      (_, currentIndex) => resolvedValues.preferredWeekdays[currentIndex] || ""
    );

    nextPreferredWeekdays[index] = value;
    updateField("preferredWeekdays", nextPreferredWeekdays);
  }

  function updateCapability(capability, rating) {
    updateField("trainingCapabilities", {
      ...resolvedValues.trainingCapabilities,
      [capability]: rating,
    });
  }

  return (
    <View style={styles.section}>
      {(title || description) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
        </View>
      )}

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>How would you rate your S&C experience?</Text>
        <Picker
          selectedValue={resolvedValues.experience}
          onValueChange={(value) => updateField("experience", value)}
          style={styles.input}
        >
          {STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>What can you do safely and confidently?</Text>
        <View style={styles.capabilityGroups}>
          {TRAINING_CAPABILITY_GROUPS.map((group) => (
            <View key={group.title} style={styles.capabilityGroup}>
              <Text style={styles.groupLabel}>{group.title}</Text>
              {group.items.map((item) => (
                <View key={item.value} style={styles.capabilityRow}>
                  <View style={styles.capabilityText}>
                    <Text style={styles.capabilityLabel}>{item.label}</Text>
                    {item.description ? (
                      <Text style={styles.helperText}>{item.description}</Text>
                    ) : null}
                  </View>
                  <Picker
                    selectedValue={resolvedValues.trainingCapabilities[item.value]}
                    onValueChange={(value) => updateCapability(item.value, value)}
                    style={styles.ratingInput}
                  >
                    {CAPABILITY_RATING_OPTIONS.map((option) => (
                      <Picker.Item
                        key={`${item.value}-${option.value}`}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Picker>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Desired training</Text>
        <Picker
          selectedValue={resolvedValues.desiredTraining}
          onValueChange={(value) => updateField("desiredTraining", value)}
          style={styles.input}
        >
          {DESIRED_TRAINING_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Duration of each session</Text>
        <Picker
          selectedValue={resolvedValues.sessionDuration}
          onValueChange={(value) => updateField("sessionDuration", value)}
          style={styles.input}
        >
          {SESSION_DURATION_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Equipment available</Text>
        <Picker
          selectedValue={resolvedValues.equipment}
          onValueChange={(value) => updateField("equipment", value)}
          style={styles.input}
        >
          {EQUIPMENT_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <QuestionnaireTrainingPhaseView
        value={resolvedValues.trainingPhase}
        onChange={(value) => updateField("trainingPhase", value)}
      />

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>
          Which competition(s) or important events are you preparing for?
        </Text>
        <Text style={styles.helperText}>
          Include anything useful, such as event names, dates, or rough timelines.
        </Text>
        <TextInput
          placeholder="e.g. amateur bout on 2026-06-20, regional tournament in September"
          value={resolvedValues.eventPreparation}
          onChangeText={(value) => updateField("eventPreparation", value)}
          multiline
          numberOfLines={3}
          style={styles.textarea}
        />
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Injuries / weaknesses</Text>
        <TextInput
          placeholder="e.g. sore shoulder, weak left kick, knee rehab"
          value={resolvedValues.injuriesInput}
          onChangeText={(value) => updateField("injuriesInput", value)}
          multiline
          numberOfLines={3}
          style={styles.textarea}
        />
      </View>

      <View style={[styles.screenSection, { minHeight: screenHeight }]}>
        <AppLogicSettingsFields
          title={appLogicTitle}
          description={appLogicDescription}
          values={resolvedValues}
          onChange={onChange}
        />
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Preferred weekdays</Text>
        <Text style={styles.helperText}>
          Optional. The plan still runs as Day 1, Day 2, Day 3, and so on.
          These only add calendar guidance.
        </Text>
        <View style={styles.preferenceGrid}>
          {Array.from({ length: resolvedValues.daysPerWeek }, (_, index) => (
            <View
              key={`preferred-weekday-${index + 1}`}
              style={styles.preferenceItem}
            >
              <Text style={styles.preferenceLabel}>Day {index + 1}</Text>
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

    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
    backgroundColor: "transparent",
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },
  field: {
    gap: 6,
  },
  screenSection: {
    justifyContent: "center",
  },
  label: {
    color: "#111827",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
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
  textarea: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9fafb",
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
  capabilityGroups: {
    gap: 16,
  },
  capabilityGroup: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  capabilityRow: {
    gap: 8,
  },
  capabilityText: {
    gap: 2,
  },
  capabilityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  ratingInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
});
