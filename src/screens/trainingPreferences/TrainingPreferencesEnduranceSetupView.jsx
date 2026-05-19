import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import TitleText from "../../components/textComponents/TitleText.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import {
  CIRCUIT_GOAL_EXAMPLES,
  CIRCUIT_PRIORITY_OPTIONS,
  ENDURANCE_FORMAT_OPTIONS,
  ENDURANCE_SESSION_COUNT_OPTIONS,
  HEAVY_BAG_ENDURANCE_TARGET_OPTIONS,
  SPRINTING_TARGET_OPTIONS,
} from "../../constants/trainingPreferences.js";

function ChoiceChip({ label, isSelected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isSelected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

function OptionGroup({ title, options, value, onChange, multi = false }) {
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const isSelected = multi
            ? selectedValues.includes(option.value)
            : value === option.value;

          return (
            <ChoiceChip
              key={option.value}
              label={option.label}
              isSelected={isSelected}
              onPress={() => {
                if (!multi) {
                  onChange?.(isSelected ? "" : option.value);
                  return;
                }

                onChange?.(
                  isSelected
                    ? selectedValues.filter((entry) => entry !== option.value)
                    : [...selectedValues, option.value]
                );
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TrainingPreferencesEnduranceSetupView({
  values,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const selectedModalities = Array.isArray(values?.preferredEnduranceModalities)
    ? values.preferredEnduranceModalities
    : [];
  const showCircuitDetails = selectedModalities.includes("circuit_training");
  const showHeavyBagDetails = selectedModalities.includes("heavy_bag");
  const showSprintingDetails = selectedModalities.includes("sprinting");

  function updateField(field, value) {
    onChange?.({
      ...values,
      [field]: value,
    });
  }

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={112}>Endurance Setup</TitleText>
      <StandardText style={styles.helperText} textColor="#C9B259" center>
        Start with the lowest dose that solves the conditioning problem. The
        plan will still protect sparring, lifting, and recovery.
      </StandardText>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <OptionGroup
          title="Sessions per week"
          options={ENDURANCE_SESSION_COUNT_OPTIONS}
          value={values?.enduranceSessionsPerWeek}
          onChange={(nextValue) =>
            updateField("enduranceSessionsPerWeek", nextValue || 1)
          }
        />

        {values?.enduranceSessionsPerWeek >= 3 ? (
          <Text style={styles.warningText}>
            Higher endurance frequency only fits when combat load and recovery
            truly allow it.
          </Text>
        ) : null}

        <OptionGroup
          title="Preferred structure"
          options={ENDURANCE_FORMAT_OPTIONS}
          value={values?.preferredEnduranceFormat}
          onChange={(nextValue) =>
            updateField("preferredEnduranceFormat", nextValue)
          }
        />

        {showCircuitDetails ? (
          <View style={styles.group}>
            <Text style={styles.groupTitle}>Circuit goal</Text>
            <Text style={styles.groupHint}>
              Describe what fades first and what you want to improve.
            </Text>
            <TextInput
              value={values?.circuitTrainingGoalInput}
              onChangeText={(nextValue) =>
                updateField("circuitTrainingGoalInput", nextValue)
              }
              multiline
              numberOfLines={3}
              placeholder="Example: my shoulders burn out late in rounds"
              placeholderTextColor="#9CA3AF"
              style={styles.textarea}
            />
            <View style={styles.exampleRow}>
              {CIRCUIT_GOAL_EXAMPLES.map((example) => (
                <ChoiceChip
                  key={example}
                  label={example}
                  isSelected={values?.circuitTrainingGoalInput === example}
                  onPress={() => updateField("circuitTrainingGoalInput", example)}
                />
              ))}
            </View>
            <OptionGroup
              title="Primary circuit priority"
              options={CIRCUIT_PRIORITY_OPTIONS}
              value={values?.circuitTrainingPrimaryPriority}
              onChange={(nextValue) =>
                updateField("circuitTrainingPrimaryPriority", nextValue)
              }
            />
            <OptionGroup
              title="Secondary priorities"
              options={CIRCUIT_PRIORITY_OPTIONS}
              value={values?.circuitTrainingSecondaryPriorities}
              onChange={(nextValue) =>
                updateField("circuitTrainingSecondaryPriorities", nextValue)
              }
              multi
            />
          </View>
        ) : null}

        {showHeavyBagDetails ? (
          <OptionGroup
            title="Heavy bag endurance target"
            options={HEAVY_BAG_ENDURANCE_TARGET_OPTIONS}
            value={values?.heavyBagEnduranceTarget}
            onChange={(nextValue) =>
              updateField("heavyBagEnduranceTarget", nextValue)
            }
          />
        ) : null}

        {showSprintingDetails ? (
          <OptionGroup
            title="Sprinting target"
            options={SPRINTING_TARGET_OPTIONS}
            value={values?.sprintingTarget}
            onChange={(nextValue) => updateField("sprintingTarget", nextValue)}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
  },
  helperText: {
    alignSelf: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    maxWidth: 340,
    paddingHorizontal: 24,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 120,
    paddingHorizontal: 6,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  groupHint: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  exampleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  chip: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: "#C9B259",
    borderColor: "#ffffff",
  },
  chipPressed: {
    opacity: 0.78,
  },
  chipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  chipTextSelected: {
    color: "#111827",
  },
  textarea: {
    backgroundColor: "#F9FAFB",
    borderColor: "rgba(17,24,39,0.14)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 15,
    minHeight: 88,
    padding: 10,
    textAlignVertical: "top",
  },
  warningText: {
    color: "#FDE68A",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
