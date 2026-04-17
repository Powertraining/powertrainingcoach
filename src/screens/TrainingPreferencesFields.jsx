import { Text, TextInput, View, StyleSheet, useWindowDimensions } from "react-native";
import { Picker } from "@react-native-picker/picker";

import AppLogicSettingsFields from "./AppLogicSettingsFields.jsx";
import WeightScroller from "../components/questionnaireComponents/weightBar.jsx";
import QuestionnaireNextFightView from "./questionnaire/QuestionnaireNextFightView.jsx";
import QuestionnaireTrainingPhaseView from "./questionnaire/QuestionnaireTrainingPhaseView.jsx";
import {
  EXPERIENCE_OPTIONS,
  getTrainingPreferencesFormState,
  GOAL_OPTIONS,
  PLYOMETRICS_EXPERIENCE_OPTIONS,
} from "../constants/trainingPreferences.js";
import { WEEKDAY_OPTIONS } from "../constants/weekdays.js";

const DEFAULT_WEIGHT_VALUE = 65;

function getWeightScrollerValue(weightClass) {
  if (typeof weightClass !== "string") {
    return DEFAULT_WEIGHT_VALUE;
  }

  const match = weightClass.replace(",", ".").match(/-?\d+(?:\.\d+)?/);

  if (!match) {
    return DEFAULT_WEIGHT_VALUE;
  }

  const parsedValue = Math.abs(Number.parseFloat(match[0]));
  return Number.isFinite(parsedValue) ? parsedValue : DEFAULT_WEIGHT_VALUE;
}

function formatWeightClassValue(value) {
  return `${value.toFixed(0)} kg`;
}

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
  const selectedWeightValue = getWeightScrollerValue(
    resolvedValues.weightClass
  );

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
        <Text style={styles.label}>Weight class / current bodyweight</Text>
        <View style={styles.weightScrollerCard}>
          <WeightScroller
            min={30}
            max={200}
            step={1}
            initialValue={selectedWeightValue}
            unit="kg"
            height={screenHeight}
            onChange={(nextValue) =>
              updateField("weightClass", formatWeightClassValue(nextValue))
            }
          />
        </View>
      </View>

      <QuestionnaireTrainingPhaseView
        value={resolvedValues.trainingPhase}
        onChange={(value) => updateField("trainingPhase", value)}
      />

      {resolvedValues.trainingPhase === "in_camp" ? (
        <QuestionnaireNextFightView
          value={resolvedValues.competitionTimeline}
          onChange={(value) => updateField("competitionTimeline", value)}
        />
      ) : null}

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

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Goal</Text>
        <Picker
          selectedValue={resolvedValues.goal}
          onValueChange={(value) => updateField("goal", value)}
          style={styles.input}
        >
          {GOAL_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Experience</Text>
        <Picker
          selectedValue={resolvedValues.experience}
          onValueChange={(value) => updateField("experience", value)}
          style={styles.input}
        >
          {EXPERIENCE_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <View style={[styles.field, styles.screenSection, { minHeight: screenHeight }]}>
        <Text style={styles.label}>Experience in plyometrics</Text>
        <Picker
          selectedValue={resolvedValues.plyometricsExperience}
          onValueChange={(value) =>
            updateField("plyometricsExperience", value)
          }
          style={styles.input}
        >
          {PLYOMETRICS_EXPERIENCE_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
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
  weightScrollerCard: {
    backgroundColor: "transparent",
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
});
