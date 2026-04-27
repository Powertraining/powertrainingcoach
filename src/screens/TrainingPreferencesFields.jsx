import { View, Text, StyleSheet, useWindowDimensions } from "react-native";

import AppLogicSettingsFields from "./AppLogicSettingsFields.jsx";
import QuestionnaireTrainingPhaseView from "./questionnaire/QuestionnaireTrainingPhaseView.jsx";
import {
  getTrainingPreferencesFormState,
} from "../constants/trainingPreferences.js";
import TrainingPreferencesExperienceView from "./trainingPreferences/TrainingPreferencesExperienceView.jsx";
import TrainingPreferencesExerciseEvaluationView from "./trainingPreferences/TrainingPreferencesExerciseEvaluationView.jsx";
import TrainingPreferencesCompoundLiftsView from "./trainingPreferences/TrainingPreferencesCompoundLiftsView.jsx";
import TrainingPreferencesSingleLegLiftsView from "./trainingPreferences/TrainingPreferencesSingleLegLiftsView.jsx";
import TrainingPreferencesPullingWorkView from "./trainingPreferences/TrainingPreferencesPullingWorkView.jsx";
import TrainingPreferencesOlympicLiftVariationsView from "./trainingPreferences/TrainingPreferencesOlympicLiftVariationsView.jsx";
import TrainingPreferencesPlyometricsView from "./trainingPreferences/TrainingPreferencesPlyometricsView.jsx";
import TrainingPreferencesBallisticTrainingView from "./trainingPreferences/TrainingPreferencesBallisticTrainingView.jsx";
import TrainingPreferencesRunningSprintingView from "./trainingPreferences/TrainingPreferencesRunningSprintingView.jsx";
import TrainingPreferencesBikeRowerAssaultBikeView from "./trainingPreferences/TrainingPreferencesBikeRowerAssaultBikeView.jsx";
import TrainingPreferencesCircuitTrainingView from "./trainingPreferences/TrainingPreferencesCircuitTrainingView.jsx";
import TrainingPreferencesHeavyBagView from "./trainingPreferences/TrainingPreferencesHeavyBagView.jsx";
import TrainingPreferencesDesiredTrainingView from "./trainingPreferences/TrainingPreferencesDesiredTrainingView.jsx";
import TrainingPreferencesSessionDurationView from "./trainingPreferences/TrainingPreferencesSessionDurationView.jsx";
import TrainingPreferencesEquipmentView from "./trainingPreferences/TrainingPreferencesEquipmentView.jsx";
import TrainingPreferencesEventPreparationView from "./trainingPreferences/TrainingPreferencesEventPreparationView.jsx";
import TrainingPreferencesInjuriesView from "./trainingPreferences/TrainingPreferencesInjuriesView.jsx";
import TrainingPreferencesPreferredWeekdaysView from "./trainingPreferences/TrainingPreferencesPreferredWeekdaysView.jsx";

export const TRAINING_PREFERENCES_SECTION_COUNT = 20;

export default function TrainingPreferencesFields({
  title,
  description,
  values,
  onChange,
  appLogicTitle = "App Logic Settings",
  appLogicDescription,
  activeStep,
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

  function updateCompoundLiftsCapability(rating) {
    onChange?.({
      ...resolvedValues,
      trainingCapabilities: {
        ...resolvedValues.trainingCapabilities,
        compoundLifts: rating,
      },
    });
  }

  const sections = [
    (
      <TrainingPreferencesExperienceView
        value={resolvedValues.experience}
        onChange={(sectionValue) => updateField("experience", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesExerciseEvaluationView />
    ),
    (
      <TrainingPreferencesCompoundLiftsView
        value={values?.trainingCapabilities?.compoundLifts ?? null}
        onChange={updateCompoundLiftsCapability}
      />
    ),
    (
      <TrainingPreferencesSingleLegLiftsView
        value={resolvedValues.trainingCapabilities.singleLegLifts}
        onChange={(sectionValue) => updateCapability("singleLegLifts", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesPullingWorkView
        value={resolvedValues.trainingCapabilities.pullingWork}
        onChange={(sectionValue) => updateCapability("pullingWork", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesOlympicLiftVariationsView
        value={resolvedValues.trainingCapabilities.olympicLiftVariations}
        onChange={(sectionValue) =>
          updateCapability("olympicLiftVariations", sectionValue)
        }
      />
    ),
    (
      <TrainingPreferencesPlyometricsView
        value={resolvedValues.trainingCapabilities.plyometrics}
        onChange={(sectionValue) => updateCapability("plyometrics", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesBallisticTrainingView
        value={resolvedValues.trainingCapabilities.ballisticTraining}
        onChange={(sectionValue) =>
          updateCapability("ballisticTraining", sectionValue)
        }
      />
    ),
    (
      <TrainingPreferencesRunningSprintingView
        value={resolvedValues.trainingCapabilities.runningSprinting}
        onChange={(sectionValue) =>
          updateCapability("runningSprinting", sectionValue)
        }
      />
    ),
    (
      <TrainingPreferencesBikeRowerAssaultBikeView
        value={resolvedValues.trainingCapabilities.bikeRowerAssaultBike}
        onChange={(sectionValue) =>
          updateCapability("bikeRowerAssaultBike", sectionValue)
        }
      />
    ),
    (
      <TrainingPreferencesCircuitTrainingView
        value={resolvedValues.trainingCapabilities.circuitTraining}
        onChange={(sectionValue) =>
          updateCapability("circuitTraining", sectionValue)
        }
      />
    ),
    (
      <TrainingPreferencesHeavyBagView
        value={resolvedValues.trainingCapabilities.heavyBag}
        onChange={(sectionValue) => updateCapability("heavyBag", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesDesiredTrainingView
        value={resolvedValues.desiredTraining}
        onChange={(sectionValue) => updateField("desiredTraining", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesSessionDurationView
        value={resolvedValues.sessionDuration}
        onChange={(sectionValue) => updateField("sessionDuration", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesEquipmentView
        value={resolvedValues.equipment}
        onChange={(sectionValue) => updateField("equipment", sectionValue)}
      />
    ),
    (
      <QuestionnaireTrainingPhaseView
        value={resolvedValues.trainingPhase}
        onChange={(sectionValue) => updateField("trainingPhase", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesEventPreparationView
        value={resolvedValues.eventPreparation}
        onChange={(sectionValue) => updateField("eventPreparation", sectionValue)}
      />
    ),
    (
      <TrainingPreferencesInjuriesView
        value={resolvedValues.injuriesInput}
        onChange={(sectionValue) => updateField("injuriesInput", sectionValue)}
      />
    ),
    (
      <View style={{ minHeight: screenHeight, justifyContent: "center" }}>
        <AppLogicSettingsFields
          title={appLogicTitle}
          description={appLogicDescription}
          values={resolvedValues}
          onChange={onChange}
        />
      </View>
    ),
    (
      <TrainingPreferencesPreferredWeekdaysView
        daysPerWeek={resolvedValues.daysPerWeek}
        preferredWeekdays={resolvedValues.preferredWeekdays}
        onChange={updatePreferredWeekday}
      />
    ),
  ];

  const renderedSections =
    typeof activeStep === "number"
      ? sections.slice(activeStep, activeStep + 1)
      : sections;

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

      {renderedSections.map((section, index) => (
        <View key={`training-preferences-section-${typeof activeStep === "number" ? activeStep : index}`}>
          {section}
        </View>
      ))}
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
