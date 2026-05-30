import {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  Easing,
  useWindowDimensions,
  View,
  StyleSheet,
} from "react-native";

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
import PercentageReferenceMethodView from "./appLogicSettings/PercentageReferenceMethodView.jsx";
import DeloadStrategyView from "./appLogicSettings/DeloadStrategyView.jsx";
import LoadingStrategyView from "./appLogicSettings/LoadingStrategyView.jsx";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
const BASE_TRAINING_PREFERENCES_SECTION_COUNT = 22;
const APP_LOGIC_SECTION_COUNT = 4;
export const DESIRED_TRAINING_STEP_INDEX = 14;
export const TRAINING_PHASE_STEP_INDEX = 17;
export const EVENT_DESCRIPTION_STEP_INDEX = 18;
export const INJURIES_STEP_INDEX = 20;
export const LIFT_INTENSITY_METHOD_STEP_INDEX = 22;
export const PERCENTAGE_REFERENCE_METHOD_STEP_INDEX = 23;
export const DELOAD_STRATEGY_STEP_INDEX = 24;

function shouldShowEnduranceMethods(values = {}) {
  return (
    values?.desiredTraining === "endurance" ||
    values?.desiredTraining === "strength_power_endurance"
  );
}

function hasOwnValue(source, key) {
  return Object.prototype.hasOwnProperty.call(source ?? {}, key);
}

export function getTrainingPreferencesSectionCount(values = {}) {
  return getTrainingPreferencesStepKeys(values).length;
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
        item: {
          ...TRAINING_CAPABILITY_GROUPS[0].items[2],
          exerciseExamples: ["Pull-ups", "Chin-ups"],
        },
        exerciseImages: {
          "pull-ups": require("../assets/icons/sports/pullUp.png"),
          "chin-ups": require("../assets/icons/sports/chinUp.png"),
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

const NULLABLE_FORM_KEYS = Object.freeze([
  "experience",
  "desiredTraining",
  "enduranceSessionsPerWeek",
  "preferredEnduranceFormat",
  "circuitTrainingPrimaryPriority",
  "sessionDuration",
  "equipment",
  "trainingPhase",
  "combatTrainingIntensity",
  "liftIntensityMethod",
  "percentageReferenceMethod",
  "deloadStrategy",
  "loadingStrategy",
]);

function preserveExplicitEmptyValues(normalizedValues, sourceValues = {}) {
  const nextValues = NULLABLE_FORM_KEYS.reduce(
    (nextValues, key) => {
      if (
        Object.prototype.hasOwnProperty.call(sourceValues ?? {}, key) &&
        sourceValues[key] == null
      ) {
        nextValues[key] = sourceValues[key];
      }

      return nextValues;
    },
    { ...normalizedValues }
  );

  if (
    sourceValues?.trainingCapabilities &&
    typeof sourceValues.trainingCapabilities === "object"
  ) {
    nextValues.trainingCapabilities = {
      ...normalizedValues.trainingCapabilities,
    };

    Object.keys(sourceValues.trainingCapabilities).forEach((key) => {
      if (sourceValues.trainingCapabilities[key] == null) {
        nextValues.trainingCapabilities[key] = null;
      }
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(
      sourceValues ?? {},
      "circuitTrainingSecondaryPriorities"
    )
  ) {
    nextValues.circuitTrainingSecondaryPriorities = Array.isArray(
      sourceValues.circuitTrainingSecondaryPriorities
    )
      ? sourceValues.circuitTrainingSecondaryPriorities
      : [];
  }

  return nextValues;
}

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

export function getTrainingPreferencesStepKeys(values = {}) {
  const resolvedValues = preserveExplicitEmptyValues(
    getTrainingPreferencesFormState(values),
    values
  );
  const enduranceSetupValues = {
    ...resolvedValues,
    circuitTrainingPrimaryPriority: hasOwnValue(
      values,
      "circuitTrainingPrimaryPriority"
    )
      ? values.circuitTrainingPrimaryPriority
      : null,
    circuitTrainingSecondaryPriorities: hasOwnValue(
      values,
      "circuitTrainingSecondaryPriorities"
    )
      ? values.circuitTrainingSecondaryPriorities
      : [],
  };
  const keys = ["experience"];

  CAPABILITY_CONFIDENCE_GROUPS.forEach((group) => {
    keys.push(`intro:${group.category}`);
    group.pages.forEach((page) => {
      keys.push(page.key);
    });
  });

  keys.push("desiredTraining");

  if (shouldShowEnduranceMethods(resolvedValues)) {
    keys.push("enduranceMethods", "enduranceDays", "enduranceStyle");

    if (
      Array.isArray(resolvedValues.preferredEnduranceModalities) &&
      resolvedValues.preferredEnduranceModalities.includes("circuit_training")
    ) {
      keys.push("enduranceCircuitGoal", "enduranceCircuitFocus");
    }

    if (
      Array.isArray(resolvedValues.preferredEnduranceModalities) &&
      resolvedValues.preferredEnduranceModalities.includes("heavy_bag")
    ) {
      keys.push("enduranceHeavyBagFocus");
    }

    if (
      Array.isArray(resolvedValues.preferredEnduranceModalities) &&
      resolvedValues.preferredEnduranceModalities.includes("sprinting")
    ) {
      keys.push("enduranceSprintingFocus");
    }
  }

  keys.push(
    "sessionDuration",
    "equipment",
    "trainingPhase",
    "eventDescription",
    "eventDate",
    "injuries",
    "combatTrainingIntensity",
    "liftIntensityMethod",
    ...(resolvedValues.liftIntensityMethod === "percentage"
      ? ["percentageReferenceMethod"]
      : []),
    "deloadStrategy",
    "loadingStrategy",
    "preferredWeekdays"
  );

  return keys;
}

export function getTrainingPreferencesStepKey(values = {}, activeStep = 0) {
  return getTrainingPreferencesStepKeys(values)[activeStep] || "";
}

function RightSlideSection({ children }) {
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(width || 360)).current;
  const opacity = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateX]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }],
      }}
    >
      {children}
    </Animated.View>
  );
}

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
  onEnduranceMethodsInfoVisibilityChange,
  onEnduranceCircuitGoalContinue,
  onEnduranceCircuitGoalSkip,
  onInjuriesContinue,
  onInjuriesSkip,
}) {
  const resolvedValues = preserveExplicitEmptyValues(
    getTrainingPreferencesFormState(values),
    values
  );
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
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? []
                : resolvedValues.preferredEnduranceModalities,
            enduranceSessionsPerWeek:
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? null
                : resolvedValues.enduranceSessionsPerWeek,
            preferredEnduranceFormat:
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? null
                : resolvedValues.preferredEnduranceFormat,
            circuitTrainingGoalInput:
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? ""
                : resolvedValues.circuitTrainingGoalInput,
            circuitTrainingPrimaryPriority:
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? ""
                : resolvedValues.circuitTrainingPrimaryPriority,
            circuitTrainingSecondaryPriorities:
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? []
                : resolvedValues.circuitTrainingSecondaryPriorities,
            heavyBagEnduranceTarget:
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? ""
                : resolvedValues.heavyBagEnduranceTarget,
            sprintingTarget:
              sectionValue !== "endurance" &&
              sectionValue !== "strength_power_endurance"
                ? ""
                : resolvedValues.sprintingTarget,
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
              onInfoVisibilityChange={onEnduranceMethodsInfoVisibilityChange}
            />
          ),
          () => (
            <TrainingPreferencesEnduranceSetupView
              mode="days"
              values={resolvedValues}
              onChange={updateFields}
            />
          ),
          () => (
            <TrainingPreferencesEnduranceSetupView
              mode="style"
              values={resolvedValues}
              onChange={updateFields}
            />
          ),
          ...(Array.isArray(resolvedValues.preferredEnduranceModalities) &&
          resolvedValues.preferredEnduranceModalities.includes("circuit_training")
            ? [
                () => (
                  <TrainingPreferencesEnduranceSetupView
                    mode="circuitGoal"
                    values={resolvedValues}
                    onChange={updateFields}
                    onContinue={onEnduranceCircuitGoalContinue}
                    onSkip={onEnduranceCircuitGoalSkip}
                  />
                ),
                () => (
                  <TrainingPreferencesEnduranceSetupView
                    mode="circuitFocus"
                    values={resolvedValues}
                    onChange={updateFields}
                  />
                ),
              ]
            : []),
          ...(Array.isArray(resolvedValues.preferredEnduranceModalities) &&
          resolvedValues.preferredEnduranceModalities.includes("heavy_bag")
            ? [
                () => (
                  <TrainingPreferencesEnduranceSetupView
                    mode="heavyBagFocus"
                    values={resolvedValues}
                    onChange={updateFields}
                  />
                ),
              ]
            : []),
          ...(Array.isArray(resolvedValues.preferredEnduranceModalities) &&
          resolvedValues.preferredEnduranceModalities.includes("sprinting")
            ? [
                () => (
                  <TrainingPreferencesEnduranceSetupView
                    mode="sprintingFocus"
                    values={resolvedValues}
                    onChange={updateFields}
                  />
                ),
              ]
            : []),
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
      />
    ),
    ...(resolvedValues.liftIntensityMethod === "percentage"
      ? [
          () => (
            <PercentageReferenceMethodView
              value={percentageReferenceMethodValue}
              onChange={(sectionValue) =>
                updateField("percentageReferenceMethod", sectionValue)
              }
            />
          ),
        ]
      : []),
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
  const activeSectionKey =
    typeof activeStep === "number"
      ? getTrainingPreferencesStepKey(values, activeStep)
      : "";

  return (
    <View style={styles.section}>
      {(title || description) && (
        <View style={styles.header}>
          {title ? <IBMPlexText style={styles.title}>{title}</IBMPlexText> : null}
          {description ? (
            <IBMPlexText style={styles.description}>{description}</IBMPlexText>
          ) : null}
        </View>
      )}

      {renderedSectionIndexes.map((sectionIndex) => {
        const content = sectionRenderers[sectionIndex]?.();

        if (typeof activeStep !== "number") {
          return (
            <View key={`training-preferences-section-${sectionIndex}`}>
              {content}
            </View>
          );
        }

        return (
          <RightSlideSection
            key={`${sectionIndex}:${activeSectionKey}`}
          >
            {content}
          </RightSlideSection>
        );
      })}
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
    fontSize: 20, fontWeight: "700",
    color: "#111827",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },
});
