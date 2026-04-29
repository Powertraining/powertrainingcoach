import { View, Text, StyleSheet } from "react-native";

import QuestionnaireTrainingPhaseView from "./questionnaire/QuestionnaireTrainingPhaseView.jsx";
import {
  getTrainingPreferencesFormState,
  TRAINING_CAPABILITY_GROUPS,
} from "../constants/trainingPreferences.js";
import TrainingPreferencesExperienceView from "./trainingPreferences/TrainingPreferencesExperienceView.jsx";
import TrainingPreferencesExerciseEvaluationView from "./trainingPreferences/TrainingPreferencesExerciseEvaluationView.jsx";
import TrainingCapabilityConfidenceView from "./trainingPreferences/TrainingCapabilityConfidenceView.jsx";
import TrainingPreferencesDesiredTrainingView from "./trainingPreferences/TrainingPreferencesDesiredTrainingView.jsx";
import TrainingPreferencesSessionDurationView from "./trainingPreferences/TrainingPreferencesSessionDurationView.jsx";
import TrainingPreferencesEquipmentView from "./trainingPreferences/TrainingPreferencesEquipmentView.jsx";
import TrainingPreferencesEventPreparationView from "./trainingPreferences/TrainingPreferencesEventPreparationView.jsx";
import TrainingPreferencesInjuriesView from "./trainingPreferences/TrainingPreferencesInjuriesView.jsx";
import TrainingPreferencesPreferredWeekdaysView from "./trainingPreferences/TrainingPreferencesPreferredWeekdaysView.jsx";
import CombatTrainingIntensityView from "./appLogicSettings/CombatTrainingIntensityView.jsx";
import LiftIntensityMethodView from "./appLogicSettings/LiftIntensityMethodView.jsx";
import PercentageReferenceMethodView from "./appLogicSettings/PercentageReferenceMethodView.jsx";
import DeloadStrategyView from "./appLogicSettings/DeloadStrategyView.jsx";
import LoadingStrategyView from "./appLogicSettings/LoadingStrategyView.jsx";

const BASE_TRAINING_PREFERENCES_SECTION_COUNT = 19;

function getAppLogicSectionCount(values = {}) {
  return values.liftIntensityMethod === "percentage" ? 5 : 4;
}

export function getTrainingPreferencesSectionCount(values = {}) {
  const resolvedValues = getTrainingPreferencesFormState(values);

  return (
    BASE_TRAINING_PREFERENCES_SECTION_COUNT +
    getAppLogicSectionCount(resolvedValues)
  );
}

const CAPABILITY_CONFIDENCE_PAGES = [
  {
    key: "compoundLifts",
    item: TRAINING_CAPABILITY_GROUPS[0].items[0],
    exerciseImages: {
      squat: require("../assets/icons/sports/squat.png"),
      deadlift: require("../assets/icons/sports/deadLift.png"),
      bench: require("../assets/icons/sports/benchPress.png"),
      row: require("../assets/icons/sports/row.png"),
      "overhead press": require("../assets/icons/sports/overheadPress.png"),
    },
  },
  {
    key: "singleLegLifts",
    item: TRAINING_CAPABILITY_GROUPS[0].items[1],
    exerciseImages: {
      "split squat": require("../assets/icons/sports/splitSquat.png"),
      lunge: require("../assets/icons/sports/lunge.png"),
      "step-up": require("../assets/icons/sports/stepUp.png"),
    },
  },
  {
    key: "pullingWork",
    item: TRAINING_CAPABILITY_GROUPS[0].items[2],
    exerciseImages: {
      "pull-ups": require("../assets/icons/sports/pullUp.png"),
      "chin-ups": require("../assets/icons/sports/chinUp.png"),
      rows: require("../assets/icons/sports/row.png"),
    },
  },
  {
    key: "olympicLiftVariations",
    item: TRAINING_CAPABILITY_GROUPS[1].items[0],
    exerciseImages: {
      "power clean": require("../assets/icons/sports/powerClean.png"),
      "hang clean": require("../assets/icons/sports/hangClean.png"),
      "push press": require("../assets/icons/sports/pushPress.png"),
      "split jerk": require("../assets/icons/sports/splitJerk.png"),
    },
  },
  {
    key: "plyometrics",
    item: TRAINING_CAPABILITY_GROUPS[1].items[1],
    exerciseImages: {
      jumps: require("../assets/icons/sports/jumps.png"),
      bounds: require("../assets/icons/sports/bounds.png"),
      hops: require("../assets/icons/sports/hops.png"),
      "landing drills": require("../assets/icons/sports/landingDrills.png"),
    },
  },
  {
    key: "ballisticTraining",
    item: TRAINING_CAPABILITY_GROUPS[1].items[2],
    exerciseImages: {
      "medicine-ball throws": require("../assets/icons/sports/medicineBallThrow.png"),
      "jump squats": require("../assets/icons/sports/jumpSquat.png"),
      "landmine punches": require("../assets/icons/sports/landminePunches.png"),
    },
  },
  {
    key: "runningSprinting",
    item: {
      ...TRAINING_CAPABILITY_GROUPS[2].items[0],
      label: "Conditioning",
      description: "Running",
    },
    exerciseImages: {
      running: require("../assets/icons/sports/running.png"),
    },
  },
  {
    key: "bikeRowerAssaultBike",
    item: {
      ...TRAINING_CAPABILITY_GROUPS[2].items[1],
      description: "Bike, rower, assault bike",
    },
    exerciseImages: {
      bike: require("../assets/icons/sports/bike.png"),
      rower: require("../assets/icons/sports/rower.png"),
      "assault bike": require("../assets/icons/sports/assult Bike.png"),
    },
  },
  {
    key: "circuitTraining",
    item: {
      ...TRAINING_CAPABILITY_GROUPS[2].items[2],
      description: "Circuit training",
    },
    exerciseImages: {
      "circuit training": require("../assets/icons/sports/curcuitTraining.png"),
    },
  },
  {
    key: "heavyBag",
    item: {
      ...TRAINING_CAPABILITY_GROUPS[2].items[3],
      description: "Heavy bag",
    },
    exerciseImages: {
      "heavy bag": require("../assets/icons/sports/heavyBag.png"),
    },
  },
];

export default function TrainingPreferencesFields({
  title,
  description,
  values,
  onChange,
  appLogicTitle = "App Logic Settings",
  appLogicDescription,
  activeStep,
}) {
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

  function updateNullableCapability(capability, rating) {
    onChange?.({
      ...resolvedValues,
      trainingCapabilities: {
        ...resolvedValues.trainingCapabilities,
        [capability]: rating,
      },
    });
  }

  function renderCapabilityConfidencePage(page) {
    return (
      <TrainingCapabilityConfidenceView
        key={page.key}
        item={page.item}
        value={values?.trainingCapabilities?.[page.key] ?? null}
        onChange={(sectionValue) => updateNullableCapability(page.key, sectionValue)}
        exerciseImages={page.exerciseImages}
      />
    );
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
    ...CAPABILITY_CONFIDENCE_PAGES.map(renderCapabilityConfidencePage),
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
      <CombatTrainingIntensityView
        value={resolvedValues.combatTrainingIntensity}
        onChange={(sectionValue) =>
          updateField("combatTrainingIntensity", sectionValue)
        }
      />
    ),
    (
      <LiftIntensityMethodView
        value={resolvedValues.liftIntensityMethod}
        onChange={(sectionValue) =>
          updateField("liftIntensityMethod", sectionValue)
        }
      />
    ),
    ...(resolvedValues.liftIntensityMethod === "percentage"
      ? [
          (
            <PercentageReferenceMethodView
              value={resolvedValues.percentageReferenceMethod}
              onChange={(sectionValue) =>
                updateField("percentageReferenceMethod", sectionValue)
              }
            />
          ),
        ]
      : []),
    (
      <DeloadStrategyView
        value={resolvedValues.deloadStrategy}
        onChange={(sectionValue) => updateField("deloadStrategy", sectionValue)}
      />
    ),
    (
      <LoadingStrategyView
        value={resolvedValues.loadingStrategy}
        onChange={(sectionValue) =>
          updateField("loadingStrategy", sectionValue)
        }
      />
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
