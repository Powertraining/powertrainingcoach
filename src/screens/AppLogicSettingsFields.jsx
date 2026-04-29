import { Text, View, StyleSheet } from "react-native";

import {
  COMBAT_TRAINING_INTENSITY_OPTIONS,
  COMPETENCY_AND_LIMITATION_OPTIONS,
  DELOAD_STRATEGY_OPTIONS,
  getAppLogicSettingsFormState,
  getSportLoadLevelOption,
  LIFT_INTENSITY_METHOD_OPTIONS,
  LOADING_STRATEGY_OPTIONS,
  PERCENTAGE_REFERENCE_METHOD_OPTIONS,
  SPORT_LOAD_LEVEL_OPTIONS,
  TRAINING_PHASE_OPTIONS,
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

  return (
    <View style={styles.section}>
      {(title || description) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Training phase</Text>
        <Picker
          selectedValue={resolvedValues.trainingPhase}
          onValueChange={(value) => updateField("trainingPhase", value)}
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
        <OptionDescription
          options={TRAINING_PHASE_OPTIONS}
          value={resolvedValues.trainingPhase}
        />
      </View>

      {resolvedValues.trainingPhase === "in_camp" && (
        <View style={styles.field}>
          <Text style={styles.label}>When is the planned competition?</Text>
          <TextInput
            placeholder="e.g. 2026-06-20 or 8 weeks out"
            value={resolvedValues.competitionTimeline}
            onChangeText={(value) => updateField("competitionTimeline", value)}
            style={styles.input}
          />
          <Text style={styles.helperText}>
            Share a date or timeline so the app can plan the camp appropriately.
          </Text>
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
        <Text style={styles.label}>Weekly sport load level</Text>
        <Text style={styles.helperText}>
          Higher sport load steals volume from strength work. The app uses this to cut accessories first, then back-off volume, while trying to keep the main intensity exposure.
        </Text>
        <Picker
          selectedValue={resolvedValues.sportLoadLevel}
          onValueChange={(value) => updateField("sportLoadLevel", value)}
          style={styles.input}
        >
          {SPORT_LOAD_LEVEL_OPTIONS.map((option) => (
            <Picker.Item
              key={option.value}
              label={`${option.label} (${option.shortDescription})`}
              value={option.value}
            />
          ))}
        </Picker>
        <Text style={styles.helperText}>
          Volume multiplier: {getSportLoadLevelOption(resolvedValues.sportLoadLevel).multiplier}x.
        </Text>
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
});
