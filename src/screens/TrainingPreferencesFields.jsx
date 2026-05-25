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
import TrainingPreferencesEnduranceMethodsView from "./trainingPreferences/TrainingPreferencesEnduranceMethodsView.jsx";
import TrainingPreferencesEnduranceSetupView from "./trainingPreferences/TrainingPreferencesEnduranceSetupView.jsx";
import TrainingPreferencesSessionDurationView from "./trainingPreferences/TrainingPreferencesSessionDurationView.jsx";
import TrainingPreferencesEquipmentView from "./trainingPreferences/TrainingPreferencesEquipmentView.jsx";
import TrainingPreferencesEventPreparationView from "./trainingPreferences/TrainingPreferencesEventPreparationView.jsx";
import TrainingPreferencesInjuriesView from "./trainingPreferences/TrainingPreferencesInjuriesView.jsx";
import TrainingPreferencesPreferredWeekdaysView from "./trainingPreferences/TrainingPreferencesPreferredWeekdaysView.jsx";
import CombatTrainingIntensityView from "./appLogicSettings/CombatTrainingIntensityView.jsx";
import LiftIntensityMethodView from "./appLogicSettings/LiftIntensityMethodView.jsx";
import DeloadStrategyView from "./appLogicSettings/DeloadStrategyView.jsx";
import LoadingStrategyView from "./appLogicSettings/LoadingStrategyView.jsx";

const BASE_TRAINING_PREFERENCES_SECTION_COUNT = 22;
const APP_LOGIC_SECTION_COUNT = 4;
export const DESIRED_TRAINING_STEP_INDEX = 14;
export const TRAINING_PHASE_STEP_INDEX = 17;
export const EVENT_DESCRIPTION_STEP_INDEX = 18;
export const INJURIES_STEP_INDEX = 20;
export const LIFT_INTENSITY_METHOD_STEP_INDEX = 22;
export const DELOAD_STRATEGY_STEP_INDEX = 23;

function shouldShowEnduranceMethods(values = {}) {
  return (
    values?.desiredTraining === "endurance" ||
    values?.desiredTraining === "strength_power_endurance"
  );
}

export function getTrainingPreferencesSectionCount(values = {}) {
  const resolvedValues = getTrainingPreferencesFormState(values);
  const enduranceSectionCount = shouldShowEnduranceMethods(resolvedValues)
    ? 2
    : 0;

  return (
    BASE_TRAINING_PREFERENCES_SECTION_COUNT +
    APP_LOGIC_SECTION_COUNT +
    enduranceSectionCount
  );
}

const CAPABILITY_CONFIDENCE_GROUPS = [
  {
    category: TRAINING_CAPABILITY_GROUPS[0].title,
    pages: [
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
    ],
  },
  {
    category: TRAINING_CAPABILITY_GROUPS[1].title,
    pages: [
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
    ],
  },
  {
    category: TRAINING_CAPABILITY_GROUPS[2].title,
    pages: [
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
    ],
  },
];

export const CONFIDENCE_STEP_KEYS = Object.freeze({
  2: "compoundLifts",
  3: "singleLegLifts",
  4: "pullingWork",
  6: "olympicLiftVariations",
  7: "plyometrics",
  8: "ballisticTraining",
  10: "runningSprinting",
  11: "bikeRowerAssaultBike",
  12: "circuitTraining",
  13: "heavyBag",
});

export default function TrainingPreferencesFields({
  title,
  description,
  values,
  onChange,
  appLogicTitle = "App Logic Settings",
  appLogicDescription,
  activeStep,
  onEventDescriptionSkip,
  onEventDescriptionEditorChange,
  onInjuriesContinue,
  onInjuriesSkip,
}) {
  const resolvedValues = getTrainingPreferencesFormState(values);
  const hasLiftIntensityMethod = Object.prototype.hasOwnProperty.call(
    values ?? {},
    "liftIntensityMethod"
  );
  const hasPercentageReferenceMethod = Object.prototype.hasOwnProperty.call(
    values ?? {},
    "percentageReferenceMethod"
  );
  const liftIntensityMethodValue = hasLiftIntensityMethod
    ? values.liftIntensityMethod
    : resolvedValues.liftIntensityMethod;
  const percentageReferenceMethodValue = hasPercentageReferenceMethod
    ? values.percentageReferenceMethod
    : resolvedValues.percentageReferenceMethod;
  const hasDeloadStrategy = Object.prototype.hasOwnProperty.call(
    values ?? {},
    "deloadStrategy"
  );
  const deloadStrategyValue = hasDeloadStrategy
    ? values.deloadStrategy
    : resolvedValues.deloadStrategy;

  function updateFields(patch) {
    onChange?.({
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
        item={page.item}
        value={values?.trainingCapabilities?.[page.key] ?? null}
        onChange={(sectionValue) => updateNullableCapability(page.key, sectionValue)}
        exerciseImages={page.exerciseImages}
      />
    );
  }

  function renderCapabilityConfidenceGroup(group) {
    return [
      () => (
        <TrainingPreferencesExerciseEvaluationView
          category={group.category}
        />
      ),
      ...group.pages.map((page) => () => renderCapabilityConfidencePage(page)),
    ];
  }

  const sectionRenderers = [
    () => (
      <TrainingPreferencesExperienceView
        value={resolvedValues.experience}
        onChange={(sectionValue) => updateField("experience", sectionValue)}
      />
    ),
    ...CAPABILITY_CONFIDENCE_GROUPS.flatMap(renderCapabilityConfidenceGroup),
    () => (
      <TrainingPreferencesDesiredTrainingView
        value={resolvedValues.desiredTraining}
        onChange={(sectionValue) =>
          updateFields({
            desiredTraining: sectionValue,
            preferredEnduranceModalities:
              sectionValue === "strength_power"
                ? []
                : resolvedValues.preferredEnduranceModalities,
            enduranceSessionsPerWeek:
              sectionValue === "strength_power"
                ? 1
                : resolvedValues.enduranceSessionsPerWeek,
            preferredEnduranceFormat:
              sectionValue === "strength_power"
                ? "low_intensity_aerobic"
                : resolvedValues.preferredEnduranceFormat,
            circuitTrainingGoalInput:
              sectionValue === "strength_power"
                ? ""
                : resolvedValues.circuitTrainingGoalInput,
            circuitTrainingPrimaryPriority:
              sectionValue === "strength_power"
                ? ""
                : resolvedValues.circuitTrainingPrimaryPriority,
            circuitTrainingSecondaryPriorities:
              sectionValue === "strength_power"
                ? []
                : resolvedValues.circuitTrainingSecondaryPriorities,
            heavyBagEnduranceTarget:
              sectionValue === "strength_power"
                ? ""
                : resolvedValues.heavyBagEnduranceTarget,
            sprintingTarget:
              sectionValue === "strength_power" ? "" : resolvedValues.sprintingTarget,
          })
        }
      />
    ),
    ...(shouldShowEnduranceMethods(resolvedValues)
      ? [
          () => (
            <TrainingPreferencesEnduranceMethodsView
              value={resolvedValues.preferredEnduranceModalities}
              onChange={(sectionValue) =>
                updateField("preferredEnduranceModalities", sectionValue)
              }
            />
          ),
          () => (
            <TrainingPreferencesEnduranceSetupView
              values={resolvedValues}
              onChange={updateFields}
            />
          ),
        ]
      : []),
    () => (
      <TrainingPreferencesSessionDurationView
        value={resolvedValues.sessionDuration}
        onChange={(sectionValue) => updateField("sessionDuration", sectionValue)}
      />
    ),
    () => (
      <TrainingPreferencesEquipmentView
        value={resolvedValues.equipment}
        onChange={(sectionValue) => updateField("equipment", sectionValue)}
      />
    ),
    () => (
      <QuestionnaireTrainingPhaseView
        value={values?.trainingPhase ?? null}
        onChange={(sectionValue) => updateField("trainingPhase", sectionValue)}
      />
    ),
    () => (
      <TrainingPreferencesEventPreparationView
        value={resolvedValues.eventPreparation}
        onChange={(sectionValue) => updateField("eventPreparation", sectionValue)}
        mode="description"
        onSkip={onEventDescriptionSkip}
        onEditorVisibilityChange={onEventDescriptionEditorChange}
      />
    ),
    () => (
      <TrainingPreferencesEventPreparationView
        value={resolvedValues.eventPreparation}
        onChange={(sectionValue) => updateField("eventPreparation", sectionValue)}
        mode="date"
      />
    ),
    () => (
      <TrainingPreferencesInjuriesView
        value={resolvedValues.injuriesInput}
        onChange={(sectionValue) => updateField("injuriesInput", sectionValue)}
        onContinue={onInjuriesContinue}
        onSkip={onInjuriesSkip}
      />
    ),
    () => (
      <CombatTrainingIntensityView
        value={resolvedValues.combatTrainingIntensity}
        onChange={(sectionValue) =>
          updateField("combatTrainingIntensity", sectionValue)
        }
      />
    ),
    () => (
      <LiftIntensityMethodView
        value={liftIntensityMethodValue}
        onChange={(sectionValue) =>
          updateFields({
            liftIntensityMethod: sectionValue,
            percentageReferenceMethod: null,
          })
        }
        percentageReferenceValue={percentageReferenceMethodValue}
        onPercentageReferenceChange={(sectionValue) => {
          const isSelected =
            liftIntensityMethodValue === "percentage" &&
            percentageReferenceMethodValue === sectionValue;

          updateFields({
            liftIntensityMethod: isSelected ? null : "percentage",
            percentageReferenceMethod: isSelected ? null : sectionValue,
          });
        }}
      />
    ),
    () => (
      <DeloadStrategyView
        value={deloadStrategyValue}
        onChange={(sectionValue) => updateField("deloadStrategy", sectionValue)}
      />
    ),
    () => (
      <LoadingStrategyView
        value={resolvedValues.loadingStrategy}
        onChange={(sectionValue) =>
          updateField("loadingStrategy", sectionValue)
        }
      />
    ),
    () => (
      <TrainingPreferencesPreferredWeekdaysView
        daysPerWeek={resolvedValues.daysPerWeek}
        preferredWeekdays={resolvedValues.preferredWeekdays}
        onChange={updatePreferredWeekday}
      />
    ),
  ];

  const renderedSectionIndexes =
    typeof activeStep === "number"
      ? [activeStep]
      : sectionRenderers.map((_, index) => index);

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

      {renderedSectionIndexes.map((sectionIndex) => (
        <View key={`training-preferences-section-${sectionIndex}`}>
          {sectionRenderers[sectionIndex]?.()}
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
