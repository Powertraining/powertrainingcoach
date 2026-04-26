import { View, Text, StyleSheet, useWindowDimensions } from "react-native";

import AppLogicSettingsFields from "./AppLogicSettingsFields.jsx";
import QuestionnaireTrainingPhaseView from "./questionnaire/QuestionnaireTrainingPhaseView.jsx";
import {
  getTrainingPreferencesFormState,
} from "../constants/trainingPreferences.js";
import TrainingPreferencesExperienceView from "./trainingPreferences/TrainingPreferencesExperienceView.jsx";
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

      <TrainingPreferencesExperienceView
        value={resolvedValues.experience}
        onChange={(value) => updateField("experience", value)}
      />

      <TrainingPreferencesCompoundLiftsView
        value={resolvedValues.trainingCapabilities.compoundLifts}
        onChange={(value) => updateCapability("compoundLifts", value)}
      />

      <TrainingPreferencesSingleLegLiftsView
        value={resolvedValues.trainingCapabilities.singleLegLifts}
        onChange={(value) => updateCapability("singleLegLifts", value)}
      />

      <TrainingPreferencesPullingWorkView
        value={resolvedValues.trainingCapabilities.pullingWork}
        onChange={(value) => updateCapability("pullingWork", value)}
      />

      <TrainingPreferencesOlympicLiftVariationsView
        value={resolvedValues.trainingCapabilities.olympicLiftVariations}
        onChange={(value) => updateCapability("olympicLiftVariations", value)}
      />

      <TrainingPreferencesPlyometricsView
        value={resolvedValues.trainingCapabilities.plyometrics}
        onChange={(value) => updateCapability("plyometrics", value)}
      />

      <TrainingPreferencesBallisticTrainingView
        value={resolvedValues.trainingCapabilities.ballisticTraining}
        onChange={(value) => updateCapability("ballisticTraining", value)}
      />

      <TrainingPreferencesRunningSprintingView
        value={resolvedValues.trainingCapabilities.runningSprinting}
        onChange={(value) => updateCapability("runningSprinting", value)}
      />

      <TrainingPreferencesBikeRowerAssaultBikeView
        value={resolvedValues.trainingCapabilities.bikeRowerAssaultBike}
        onChange={(value) => updateCapability("bikeRowerAssaultBike", value)}
      />

      <TrainingPreferencesCircuitTrainingView
        value={resolvedValues.trainingCapabilities.circuitTraining}
        onChange={(value) => updateCapability("circuitTraining", value)}
      />

      <TrainingPreferencesHeavyBagView
        value={resolvedValues.trainingCapabilities.heavyBag}
        onChange={(value) => updateCapability("heavyBag", value)}
      />

      <TrainingPreferencesDesiredTrainingView
        value={resolvedValues.desiredTraining}
        onChange={(value) => updateField("desiredTraining", value)}
      />

      <TrainingPreferencesSessionDurationView
        value={resolvedValues.sessionDuration}
        onChange={(value) => updateField("sessionDuration", value)}
      />

      <TrainingPreferencesEquipmentView
        value={resolvedValues.equipment}
        onChange={(value) => updateField("equipment", value)}
      />

      <QuestionnaireTrainingPhaseView
        value={resolvedValues.trainingPhase}
        onChange={(value) => updateField("trainingPhase", value)}
      />

      <TrainingPreferencesEventPreparationView
        value={resolvedValues.eventPreparation}
        onChange={(value) => updateField("eventPreparation", value)}
      />

      <TrainingPreferencesInjuriesView
        value={resolvedValues.injuriesInput}
        onChange={(value) => updateField("injuriesInput", value)}
      />

      <View style={{ minHeight: screenHeight, justifyContent: "center" }}>
        <AppLogicSettingsFields
          title={appLogicTitle}
          description={appLogicDescription}
          values={resolvedValues}
          onChange={onChange}
        />
      </View>

      <TrainingPreferencesPreferredWeekdaysView
        daysPerWeek={resolvedValues.daysPerWeek}
        preferredWeekdays={resolvedValues.preferredWeekdays}
        onChange={updatePreferredWeekday}
      />

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
