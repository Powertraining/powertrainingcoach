import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";

import {
  COMBAT_TRAINING_INTENSITY_OPTIONS,
  COMPETENCY_AND_LIMITATION_OPTIONS,
  DELOAD_STRATEGY_OPTIONS,
  getAppLogicSettingsFormState,
  LIFT_INTENSITY_METHOD_OPTIONS,
  LOADING_STRATEGY_OPTIONS,
  PERCENTAGE_REFERENCE_METHOD_OPTIONS,
} from "../constants/appLogicSettings.js";

function OptionDescription({ options, value }) {
  const selectedOption = options.find((option) => option.value === value);

  if (!selectedOption?.description) {
    return null;
  }

  return <Text style={styles.helperText}>{selectedOption.description}</Text>;
}

export default function AppLogicSettingsFields({
  title,
  description,
  values,
  onChange,
}) {
  const safeValues = values && typeof values === "object" ? values : {};
  const resolvedValues = {
    ...safeValues,
    ...getAppLogicSettingsFormState(values),
  };

  function updateField(field, value) {
    onChange?.({
      ...safeValues,
      ...resolvedValues,
      [field]: value,
    });
  }

  function toggleCompetency(value) {
    const nextValues = new Set(resolvedValues.competencyAndLimitations);

    if (nextValues.has(value)) {
      nextValues.delete(value);
    } else {
      nextValues.add(value);
    }

    updateField("competencyAndLimitations", Array.from(nextValues));
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
        <Text style={styles.label}>How intense is current combat sports training?</Text>
        <Picker
          selectedValue={resolvedValues.combatTrainingIntensity}
          onValueChange={(value) => updateField("combatTrainingIntensity", value)}
          style={styles.input}
        >
          {COMBAT_TRAINING_INTENSITY_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Competency and limitations</Text>
        <Text style={styles.helperText}>Select all that apply.</Text>
        <View style={styles.chipGroup}>
          {COMPETENCY_AND_LIMITATION_OPTIONS.map((option) => {
            const selected = resolvedValues.competencyAndLimitations.includes(
              option.value
            );

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => toggleCompetency(option.value)}
                style={[styles.chip, selected ? styles.chipSelected : null]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selected ? styles.chipTextSelected : null,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Lift intensity logic</Text>
        <Picker
          selectedValue={resolvedValues.liftIntensityMethod}
          onValueChange={(value) => updateField("liftIntensityMethod", value)}
          style={styles.input}
        >
          {LIFT_INTENSITY_METHOD_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
        <OptionDescription
          options={LIFT_INTENSITY_METHOD_OPTIONS}
          value={resolvedValues.liftIntensityMethod}
        />
      </View>

      {resolvedValues.liftIntensityMethod === "percentage" && (
        <View style={styles.field}>
          <Text style={styles.label}>How should the app gauge strength for % work?</Text>
          <Text style={styles.helperText}>
            Choose how main lifts get their % references. The app will schedule these conservatively and store the results for future plan updates.
          </Text>
          <Picker
            selectedValue={resolvedValues.percentageReferenceMethod}
            onValueChange={(value) =>
              updateField("percentageReferenceMethod", value)
            }
            style={styles.input}
          >
            {PERCENTAGE_REFERENCE_METHOD_OPTIONS.map((option) => (
              <Picker.Item
                key={option.value}
                label={option.label}
                value={option.value}
              />
            ))}
          </Picker>
          <OptionDescription
            options={PERCENTAGE_REFERENCE_METHOD_OPTIONS}
            value={resolvedValues.percentageReferenceMethod}
          />
          <Text style={styles.helperText}>
            Heavy singles are the default and can appear about every 3rd loading week. 2-5RM tests are occasional, and true 1RMs are rare plus limited to suitable off-camp phases.
          </Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Deload strategy</Text>
        <Picker
          selectedValue={resolvedValues.deloadStrategy}
          onValueChange={(value) => updateField("deloadStrategy", value)}
          style={styles.input}
        >
          {DELOAD_STRATEGY_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
        <OptionDescription
          options={DELOAD_STRATEGY_OPTIONS}
          value={resolvedValues.deloadStrategy}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Loading strategy</Text>
        <Picker
          selectedValue={resolvedValues.loadingStrategy}
          onValueChange={(value) => updateField("loadingStrategy", value)}
          style={styles.input}
        >
          {LOADING_STRATEGY_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
        <OptionDescription
          options={LOADING_STRATEGY_OPTIONS}
          value={resolvedValues.loadingStrategy}
        />
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
  chipGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.12)",
    backgroundColor: "#ffffff",
  },
  chipSelected: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  chipText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#ffffff",
  },
});
