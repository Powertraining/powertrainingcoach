import {
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import ActiveSessionSetLoggingInputPanel from "../components/planComponents/ActiveSessionSetLoggingInputPanel.jsx";
import WhiteBottomMenu from "../components/profileComponents/WhiteBottomMenu.jsx";
import ActiveSessionSectionIntroView from "./ActiveSessionSectionIntroView.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import {
  getExercisePerformanceTarget,
  getExercisePercentagePrescription,
  getExerciseStrengthAssessment,
  getTrainingPlanPhaseOverview,
  normalizeExercise,
} from "../services/utils/trainingPlan.js";
import {
  buildExerciseSessionSteps,
  getExerciseDisplayName,
  getExerciseOrderLabel,
} from "../services/utils/exerciseSupersets.js";
import {
  createStrengthAssessmentEntry,
  getStrengthAssessmentMinimumRpe,
  getStrengthAssessmentLiftKey,
  getStrengthAssessmentReferenceOneRepMaxKg,
  getStrengthAssessmentRequirements,
  resolveStrengthAssessmentReferenceOneRepMaxKg,
} from "../services/utils/strengthAssessment.js";
import { calculateTargetLoadFromPercentOneRepMax } from "../services/utils/percentagePrescription.js";
import { parseRpeFromText } from "../services/utils/trainingPerformance.js";
import {
  getExerciseSetDisplayValue,
  getPrescribedSetCount,
} from "../services/utils/exerciseSets.js";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
import LoadedJumpGuideline from "../components/planComponents/LoadedJumpGuideline.jsx";
import {
  formatBodyMassLoadRange,
  getLoadedJumpPrescription,
} from "../services/utils/loadedJumpPrescription.js";
import {
  formatMeasurementText,
  formatWeightFromKilograms,
} from "../services/utils/measurementUnits.js";
const HEADER_PROGRESS_ANIMATION_DURATION_MS = 220;
const HEADER_PROGRESS_POST_ANIMATION_BUFFER_MS = 30;
const SESSION_CONTENT_SLIDE_DURATION_MS = 220;
const SESSION_EXERCISE_ADVANCE_DELAY_MS =
  HEADER_PROGRESS_ANIMATION_DURATION_MS + HEADER_PROGRESS_POST_ANIMATION_BUFFER_MS;
const RESULTS_FADE_IN_DURATION_MS = 120;
const RESULTS_FADE_IN_TRANSLATE_Y = 10;
const SESSION_HORIZONTAL_PADDING = 24;
const SET_OVERVIEW_ITEM_GAP = 4;
const EXERCISE_RESULT_RING_SIZE = 65;
const EXERCISE_RESULT_RING_CENTER = EXERCISE_RESULT_RING_SIZE / 2;
const EXERCISE_RESULT_RING_RADIUS = 26;
const EXERCISE_RESULT_RING_STROKE = 5;
const EXERCISE_RESULT_RING_CIRCUMFERENCE =
  2 * Math.PI * EXERCISE_RESULT_RING_RADIUS;
const SESSION_SCREEN_MODES = Object.freeze({
  SECTION_INTRO: "sectionIntro",
  EXERCISE: "exercise",
  EXERCISE_ALREADY_COMPLETED: "exerciseAlreadyCompleted",
  SESSION_COMPLETE: "sessionComplete",
});
const EXERCISE_SECTION_LABELS = Object.freeze({
  power: "Power",
  compound: "Compound",
  primary_pull: "Primary pull",
  core: "Core",
  accessory: "Accessory",
});

function includesAnyKeyword(text = "", keywords = []) {
  return keywords.some((keyword) => text.includes(keyword));
}

function getExplicitExerciseSection(exercise = {}) {
  const exerciseText = ` ${exercise?.name || ""} ${exercise?.notes || ""} ${exercise?.reps || ""} `.toLowerCase();

  if (
    includesAnyKeyword(exerciseText, [
      " med ball",
      " medicine ball",
      " plyo",
      " box jump",
      " broad jump",
      " vertical jump",
      " squat jump",
      " hurdle jump",
      " bound",
      " throw",
      " slam",
      " sprint",
      " ballistic",
      " clean",
      " snatch",
    ])
  ) {
    return "power";
  }

  if (
    includesAnyKeyword(exerciseText, [
      " pull-up",
      " pull up",
      " chin-up",
      " chin up",
      " row",
      " lat pulldown",
    ])
  ) {
    return "primary_pull";
  }

  if (
    includesAnyKeyword(exerciseText, [
      " plank",
      " anti rotation",
      " rollout",
      " pallof",
      " hollow",
      " hanging knee raise",
      " hanging leg raise",
      " suitcase carry",
      " farmer carry",
    ])
  ) {
    return "core";
  }

  if (
    getExercisePerformanceTarget(exercise) ||
    getExercisePercentagePrescription(exercise) ||
    getExerciseStrengthAssessment(exercise) ||
    includesAnyKeyword(exerciseText, [
      " squat",
      " deadlift",
      " bench",
      " press",
      " split squat",
      " lunge",
    ])
  ) {
    return "compound";
  }

  return "accessory";
}

function buildExerciseSectionRuns(exercises = []) {
  return exercises.reduce((runs, exercise, exerciseIndex) => {
    const section = getExplicitExerciseSection(exercise);
    const previousRun = runs[runs.length - 1];
    const exerciseItem = { exercise, exerciseIndex };

    if (previousRun?.section === section) {
      previousRun.exercises.push(exerciseItem);
      return runs;
    }

    runs.push({
      section,
      exercises: [exerciseItem],
    });

    return runs;
  }, []);
}

function parsePrescribedSetCount(exercise = {}) {
  return getPrescribedSetCount(exercise);
}

function getDraftKey(exerciseIndex, setIndex = 0) {
  return `${exerciseIndex}:${setIndex}`;
}

function getStepKey(exerciseIndex, setIndex = 0) {
  return `${exerciseIndex}:${setIndex}`;
}

function isExerciseFullyCompleted(completedStepKeys, exerciseIndex, exercise = {}) {
  if (!Number.isInteger(exerciseIndex) || exerciseIndex < 0 || !exercise) {
    return false;
  }

  return Array.from({ length: parsePrescribedSetCount(exercise) }).every(
    (_, setIndex) => completedStepKeys.has(getStepKey(exerciseIndex, setIndex))
  );
}

function ActiveSessionSlideIn({ children }) {
  const screenWidth = Dimensions.get("window").width;
  const translateX = useRef(new Animated.Value(screenWidth)).current;

  useEffect(() => {
    translateX.setValue(screenWidth);
    const animation = Animated.timing(translateX, {
      toValue: 0,
      duration: SESSION_CONTENT_SLIDE_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [screenWidth, translateX]);

  return (
    <Animated.View
      style={[
        styles.sessionContentTransition,
        { transform: [{ translateX }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function normalizeText(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function formatTargetSections(value = "") {
  return String(value)
    .replace(/\s*[+*]\s*/g, "\n")
    .trim();
}

function toFieldId(value, fallback = "field") {
  const normalizedValue = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedValue || fallback;
}

function getExerciseText(exercise = {}) {
  return `${exercise?.name || ""} ${exercise?.reps || ""} ${exercise?.notes || ""}`.toLowerCase();
}

function getExercisePrescriptionDisplay(exercise = {}) {
  const sets = getExerciseSetDisplayValue(exercise);
  const reps = String(exercise.reps || "").trim().replace(/\s*\+\s*/g, " + ");
  const hasSimpleSetCount = /^\d+$/.test(sets);
  const formatWithSets = (prescription) =>
    hasSimpleSetCount && prescription
      ? formatPrescriptionWithSets(sets, prescription)
      : prescription;
  const compactTimePrescription = getCompactTimePrescription(reps, exercise);

  if (compactTimePrescription) {
    return formatWithSets(compactTimePrescription);
  }

  const compactDistancePrescription = getCompactDistancePrescription(reps, exercise);

  if (compactDistancePrescription) {
    return formatWithSets(compactDistancePrescription);
  }

  if (hasSimpleSetCount && reps) {
    return `${sets}x${reps}`;
  }

  return reps;
}

function formatPrescriptionWithSets(sets = "", prescription = "") {
  const normalizedPrescription = String(prescription || "").trim();

  if (!/^\d+$/.test(sets) || !normalizedPrescription) {
    return normalizedPrescription;
  }

  const hasMultiplePrescriptionParts = /\s(?:\/|\+|,)\s/.test(normalizedPrescription);

  return hasMultiplePrescriptionParts
    ? `${sets}x ${normalizedPrescription}`
    : `${sets}x${normalizedPrescription}`;
}

function getCompactTimePrescription(value = "", exercise = {}) {
  const normalizedValue = String(value || "")
    .trim()
    .replace(/\s*\+\s*/g, " + ");
  const exerciseSearchText = getExerciseText(exercise);
  const isLikelyDistance =
    /\b\d+(?:[.,]\d+)?\s*m(?:\s*\/\s*\d+(?:[.,]\d+)?\s*ft)?\b/i.test(normalizedValue) &&
    /\b(?:sprint|run|shuttle|carry|walk|prowler|sled|farmer|march)\b/i.test(exerciseSearchText);
  const hasTimeUnit =
    /\b(?:seconds?|secs?|s|minutes?|mins?|hours?|hrs?|h)\b/i.test(normalizedValue) ||
    /\b\d+(?:[.,]\d+)?\s*[sh]\b/i.test(normalizedValue) ||
    (!isLikelyDistance && /\b\d+(?:[.,]\d+)?\s*m\b/i.test(normalizedValue));

  if (!hasTimeUnit) {
    return "";
  }

  return normalizedValue
    .replace(/\bhours?\b/gi, "h")
    .replace(/\bhrs?\b/gi, "h")
    .replace(/\bseconds?\b/gi, "sec")
    .replace(/\bsecs?\b/gi, "sec")
    .replace(/\bminutes?\b/gi, "min")
    .replace(/\bmins?\b/gi, "min")
    .replace(/\b(\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?)\s*s\b/gi, "$1 sec")
    .replace(/\b(\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?)\s*m\b/gi, "$1 min")
    .replace(/\b(\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?)\s*h\b/gi, "$1 h")
    .replace(/\s+each(?:\s+(?:side|direction|leg|arm|way))?\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getCompactDistancePrescription(value = "", exercise = {}) {
  const normalizedValue = String(value || "").trim();
  const exerciseSearchText = getExerciseText(exercise);

  if (!/\b(?:sprint|run|shuttle|carry|walk|prowler|sled|farmer|march)\b/i.test(exerciseSearchText)) {
    return "";
  }

  return normalizedValue
    .replace(/\b(\d+(?:[.,]\d+)?)\s*m\b/gi, (_, distance) => `${distance} meters`)
    .replace(/\b(\d+(?:[.,]\d+)?)\s*ft\b/gi, (_, distance) => `${distance} ft`)
    .replace(/\s+/g, " ")
    .trim();
}

function getExplicitLoadOrSpeedValue(exercise = {}) {
  const exerciseText = `${exercise?.notes || ""} ${exercise?.reps || ""}`;
  const speedMatch = exerciseText.match(/\b\d+(?:[.,]\d+)?\s*(?:km\/h|kmh|mph|m\/s)\b/i);

  if (speedMatch) {
    return speedMatch[0].replace(/\s+/g, "").replace(/kmh/i, "kmh");
  }

  const loadMatch = exerciseText.match(/\b\d+(?:[.,]\d+)?\s*(?:kg|kgs|kilogram|kilograms)\b/i);

  if (loadMatch) {
    return loadMatch[0]
      .replace(/\s+/g, "")
      .replace(/kgs?|kilograms?/i, "kg");
  }

  return "";
}

function getNotesIntensityDetails(exercise = {}) {
  const exerciseText = `${exercise?.notes || ""} ${exercise?.reps || ""}`;
  const detailParts = [];
  const addDetail = (value = "") => {
    const normalizedValue = value.replace(/\s+/g, " ").trim();

    if (normalizedValue && !detailParts.includes(normalizedValue)) {
      detailParts.push(normalizedValue);
    }
  };

  exerciseText
    .match(/\b\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?\s*%\s*(?:1\s*rm|1rm)?\b/gi)
    ?.forEach((match) => {
      const percentText = match.replace(/\s+/g, " ").trim();
      addDetail(/1\s*rm/i.test(percentText) ? percentText : `${percentText} 1RM`);
    });

  exerciseText
    .match(/\b(?:@?\s*rpe|rir)\s*\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?\b/gi)
    ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").replace(/^@\s*/i, "").toUpperCase()));

  exerciseText
    .match(/\b\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?\s*reps?\s+(?:left\s+)?in\s+reserve\b/gi)
    ?.forEach((match) => {
      const rirValue = match.match(/\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?/i)?.[0];
      addDetail(rirValue ? `RIR ${rirValue.replace(/\s+/g, "")}` : "");
    });

  exerciseText
    .match(/\bri\s*\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?\s*%?\b/gi)
    ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").toUpperCase()));

  exerciseText
    .match(/\b(?:max\s*)?\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?\s*bpm\b|\b(?:max\s*bpm|bpm)\s*\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?\b/gi)
    ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").toUpperCase()));

  exerciseText
    .match(/\b(?:hr|heart rate)\s*(?:zone\s*)?\d+(?:[.,]\d+)?(?:\s*[-\u2013]\s*\d+(?:[.,]\d+)?)?\b|\bzone\s*\d+\b/gi)
    ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").toUpperCase()));

  exerciseText
    .match(/\b\d+\s*[-:]\s*\d+\s*[-:]\s*\d+(?:\s*[-:]\s*\d+)?\b/gi)
    ?.forEach((match) => addDetail(`Tempo ${match.replace(/\s+/g, "")}`));

  return detailParts.join(" * ");
}

function formatCompactNumberUnit(value, unit = "") {
  if (value == null || value === "") {
    return "";
  }

  return `${String(value).replace(/\s+/g, "")}${unit}`;
}

function formatCompactKg(value, unitSystem = "metric") {
  if (!Number.isFinite(value)) {
    return "";
  }

  return formatWeightFromKilograms(value, unitSystem, { compact: true });
}

function getPrimaryPercentageWorkingSet(percentagePrescription = {}) {
  const workingSets = Array.isArray(percentagePrescription?.workingSets)
    ? percentagePrescription.workingSets
    : [];

  if (workingSets.length === 0) {
    return null;
  }

  return workingSets.reduce((primarySet, workingSet) => {
    if (!primarySet) {
      return workingSet;
    }

    return (workingSet?.percent1RM || 0) >= (primarySet?.percent1RM || 0)
      ? workingSet
      : primarySet;
  }, null);
}

function getPercentRangeFromNotes(exercise = {}) {
  const exerciseText = `${exercise.notes || ""} ${exercise.reps || ""}`;
  const percentMatch = exerciseText.match(/\b(\d+(?:[.,]\d+)?)(?:\s*[-\u2013]\s*(\d+(?:[.,]\d+)?))?\s*%\s*(?:1\s*rm|1rm)?\b/i);

  if (!percentMatch) {
    return null;
  }

  const startPercent = Number.parseFloat(percentMatch[1].replace(",", "."));
  const endPercent = percentMatch[2]
    ? Number.parseFloat(percentMatch[2].replace(",", "."))
    : null;

  if (!Number.isFinite(startPercent)) {
    return null;
  }

  return {
    startPercent,
    endPercent: Number.isFinite(endPercent) ? endPercent : null,
  };
}

function getEstimatedLoadFromNotesPercent(
  exercise = {},
  strengthReferenceOneRepMaxByLift = {},
  unitSystem = "metric"
) {
  const percentRange = getPercentRangeFromNotes(exercise);

  if (!percentRange) {
    return "";
  }

  const referenceLiftDetails = resolveStrengthAssessmentReferenceOneRepMaxKg(
    exercise.name || "",
    strengthReferenceOneRepMaxByLift
  );

  if (!referenceLiftDetails.oneRepMaxKg) {
    return "";
  }

  const startLoad = calculateTargetLoadFromPercentOneRepMax(
    referenceLiftDetails.oneRepMaxKg,
    percentRange.startPercent
  );

  if (!startLoad) {
    return "";
  }

  if (percentRange.endPercent) {
    const endLoad = calculateTargetLoadFromPercentOneRepMax(
      referenceLiftDetails.oneRepMaxKg,
      percentRange.endPercent
    );

    return endLoad
      ? `${formatCompactKg(startLoad, unitSystem)}-${formatCompactKg(endLoad, unitSystem)}`
      : formatCompactKg(startLoad, unitSystem);
  }

  return formatCompactKg(startLoad, unitSystem);
}

function getExerciseRecommendationDisplay(
  exercise = {},
  strengthReferenceOneRepMaxByLift = {},
  unitSystem = "metric"
) {
  const percentagePrescription = getExercisePercentagePrescription(exercise);
  const primaryWorkingSet = getPrimaryPercentageWorkingSet(percentagePrescription);
  const notesDetails = getNotesIntensityDetails(exercise);

  if (primaryWorkingSet) {
    const referenceLiftDetails = resolveStrengthAssessmentReferenceOneRepMaxKg(
      percentagePrescription.referenceLiftName || exercise.name || "",
      strengthReferenceOneRepMaxByLift
    );
    const estimatedLoadKg = referenceLiftDetails.oneRepMaxKg
      ? calculateTargetLoadFromPercentOneRepMax(
          referenceLiftDetails.oneRepMaxKg,
          primaryWorkingSet.percent1RM
        )
      : null;
    const percentageNotesDetails = notesDetails
      .split(/\s*\*\s*/)
      .filter((detail) => !/^(?:RPE|RIR)\b/i.test(detail))
      .join(" * ");
    const detailParts = [
      primaryWorkingSet.percent1RM
        ? `${primaryWorkingSet.percent1RM}% Program Max`
        : "",
      primaryWorkingSet.relativeIntensity ? `RI ${primaryWorkingSet.relativeIntensity}%` : "",
      percentageNotesDetails,
    ].filter(Boolean);

    return {
      primary: estimatedLoadKg
        ? formatWeightFromKilograms(estimatedLoadKg, unitSystem, { compact: true })
        : "",
      details: formatMeasurementText(detailParts.join(" * "), unitSystem),
    };
  }

  return {
    primary:
      formatMeasurementText(getExplicitLoadOrSpeedValue(exercise), unitSystem) ||
      getEstimatedLoadFromNotesPercent(
        exercise,
        strengthReferenceOneRepMaxByLift,
        unitSystem
      ),
    details: formatMeasurementText(notesDetails, unitSystem),
  };
}

export function getRecommendedLoadKg(
  exercise = {},
  setIndex = 0,
  strengthReferenceOneRepMaxByLift = {}
) {
  const percentagePrescription = getExercisePercentagePrescription(exercise);
  const workingSets = Array.isArray(percentagePrescription?.workingSets)
    ? percentagePrescription.workingSets.flatMap((workingSet) =>
        Array.from(
          { length: Math.max(1, Number.parseInt(workingSet?.count, 10) || 1) },
          () => workingSet
        )
      )
    : [];
  const prescribedSet = workingSets[setIndex] || getPrimaryPercentageWorkingSet(percentagePrescription);

  if (prescribedSet?.percent1RM) {
    const referenceLiftDetails = resolveStrengthAssessmentReferenceOneRepMaxKg(
      percentagePrescription.referenceLiftName || exercise.name || "",
      strengthReferenceOneRepMaxByLift
    );
    const personalizedLoad = referenceLiftDetails.oneRepMaxKg
      ? calculateTargetLoadFromPercentOneRepMax(
          referenceLiftDetails.oneRepMaxKg,
          prescribedSet.percent1RM
        )
      : null;

    if (personalizedLoad) {
      return personalizedLoad;
    }
  }

  const recommendation = getExerciseRecommendationDisplay(
    exercise,
    strengthReferenceOneRepMaxByLift
  );
  const explicitKgMatch = String(recommendation.primary || "").match(
    /\b(\d+(?:[.,]\d+)?)\s*kg\b/i
  );

  return explicitKgMatch
    ? Number.parseFloat(explicitKgMatch[1].replace(",", "."))
    : null;
}

export function getRecommendedRepCount(exercise = {}, setIndex = 0) {
  const percentagePrescription = getExercisePercentagePrescription(exercise);
  const workingSets = Array.isArray(percentagePrescription?.workingSets)
    ? percentagePrescription.workingSets.flatMap((workingSet) =>
        Array.from(
          { length: Math.max(1, Number.parseInt(workingSet?.count, 10) || 1) },
          () => workingSet
        )
      )
    : [];
  const prescribedSet = workingSets[setIndex];
  const prescribedSetReps = Number.parseInt(prescribedSet?.reps, 10);

  if (Number.isFinite(prescribedSetReps) && prescribedSetReps >= 0) {
    return prescribedSetReps;
  }

  const exerciseReps = Number.parseInt(String(exercise?.reps || ""), 10);
  return Number.isFinite(exerciseReps) && exerciseReps >= 0 ? exerciseReps : 0;
}

function getExerciseLoggingFieldSource(exercise = {}) {
  if (Array.isArray(exercise?.loggingFields)) {
    return exercise.loggingFields;
  }

  if (Array.isArray(exercise?.trackingFields)) {
    return exercise.trackingFields;
  }

  if (Array.isArray(exercise?.resultFields)) {
    return exercise.resultFields;
  }

  if (Array.isArray(exercise?.logFields)) {
    return exercise.logFields;
  }

  return [];
}

function normalizeCustomLoggingField(field, fallbackIndex = 0) {
  if (typeof field === "string") {
    const normalizedType = normalizeText(field);

    if (!normalizedType) {
      return null;
    }

    return {
      id: toFieldId(normalizedType, `field_${fallbackIndex + 1}`),
      type: normalizedType,
      label: normalizedType.replace(/_/g, " "),
      placeholder: "",
      keyboardType: normalizedType === "notes" ? "default" : "decimal-pad",
    };
  }

  if (!field || typeof field !== "object") {
    return null;
  }

  const type = normalizeText(field.type || field.key || field.name);
  const label = normalizeText(field.label, type.replace(/_/g, " "));
  const keyboardType = normalizeText(
    field.keyboardType,
    /note|text|comment/.test(type) ? "default" : "decimal-pad"
  );

  if (!type || !label) {
    return null;
  }

  return {
    id: toFieldId(field.id || type, `field_${fallbackIndex + 1}`),
    type,
    label,
    placeholder: normalizeText(field.placeholder),
    keyboardType,
  };
}

function inferCustomLoggingFields(exercise = {}) {
  const exerciseText = getExerciseText(exercise);
  const fields = [];
  const addField = (id, type, label, placeholder = "", keyboardType = "decimal-pad") => {
    if (fields.some((field) => field.id === id)) {
      return;
    }

    fields.push({
      id,
      type,
      label,
      placeholder,
      keyboardType,
    });
  };

  if (
    /\b(?:record|log|measure|track)\b/.test(exerciseText) &&
    /\b(?:time|split|seconds?|secs?|minutes?|mins?)\b/.test(exerciseText)
  ) {
    addField("time", "time", "Time", "e.g. 12.4 sec");
  }

  if (
    /\b(?:record|log|measure|track)\b/.test(exerciseText) &&
    /\b(?:speed|velocity|pace|km\/h|kmh|mph|m\/s)\b/.test(exerciseText)
  ) {
    addField("speed", "speed", "Speed", "e.g. 7.5 m/s");
  }

  if (
    /\b(?:record|log|measure|track)\b/.test(exerciseText) &&
    /\b(?:distance|height|jump)\b/.test(exerciseText)
  ) {
    addField("distance", "distance", "Distance", "e.g. 2.4 m");
  }

  if (
    /\b(?:record|log|measure|track)\b/.test(exerciseText) &&
    /\b(?:tempo|cadence)\b/.test(exerciseText)
  ) {
    addField("tempo", "tempo", "Tempo", "e.g. 3-1-1-0", "default");
  }

  if (
    /\b(?:record|log|measure|track)\b/.test(exerciseText) &&
    /\b(?:heart rate|hr|bpm)\b/.test(exerciseText)
  ) {
    addField("heart_rate", "heart_rate", "Heart rate", "e.g. 165 bpm");
  }

  return fields;
}

function buildTrackingDrafts(
  exercises = [],
  initialPerformanceResults = [],
  initialAssessmentResults = []
) {
  const drafts = {};
  const allResults = [
    ...(Array.isArray(initialPerformanceResults) ? initialPerformanceResults : []),
    ...(Array.isArray(initialAssessmentResults) ? initialAssessmentResults : []),
  ];

  allResults.forEach((result) => {
    if (!Number.isInteger(result?.exerciseIndex) || result.exerciseIndex < 0) {
      return;
    }

    const setIndex = Number.isInteger(result?.setIndex) && result.setIndex >= 0
      ? result.setIndex
      : 0;
    const draftKey = getDraftKey(result.exerciseIndex, setIndex);

    drafts[draftKey] = {
      exerciseIndex: result.exerciseIndex,
      setIndex,
      loadKg: result?.loadKg != null ? String(result.loadKg) : "",
      reps: result?.reps != null ? String(result.reps) : "",
      durationMinutes:
        result?.durationMinutes != null ? String(result.durationMinutes) : "",
      rpe: result?.rpe != null ? String(result.rpe) : "",
      customValues:
        result?.customValues && typeof result.customValues === "object"
          ? Object.fromEntries(
              Object.entries(result.customValues).map(([key, value]) => [key, String(value ?? "")])
            )
          : {},
    };
  });

  exercises.forEach((exercise, exerciseIndex) => {
    Array.from({ length: parsePrescribedSetCount(exercise) }).forEach((_, setIndex) => {
      const draftKey = getDraftKey(exerciseIndex, setIndex);

      if (!drafts[draftKey]) {
        drafts[draftKey] = {
          exerciseIndex,
          setIndex,
          loadKg: "",
          reps: "",
          durationMinutes: "",
          rpe: "",
          customValues: {},
        };
      }
    });
  });

  return drafts;
}

function getTrackedResultsFromDrafts(drafts = {}) {
  return Object.values(drafts)
    .filter((draft) =>
      draft?.loadKg ||
      draft?.reps ||
      draft?.durationMinutes ||
      draft?.rpe ||
      Object.values(draft?.customValues || {}).some(Boolean)
    )
    .sort((left, right) => {
      const exerciseOrder = (left.exerciseIndex || 0) - (right.exerciseIndex || 0);

      if (exerciseOrder !== 0) {
        return exerciseOrder;
      }

      return (left.setIndex || 0) - (right.setIndex || 0);
    });
}

function getSavedNumber(value, fallback = 0) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

function getSavedCompletedStepKeys(value) {
  return new Set(
    Array.isArray(value)
      ? value.filter((entry) => typeof entry === "string" && entry)
      : []
  );
}

function getSavedTrackingDrafts(value, fallbackDrafts) {
  return value && typeof value === "object" ? value : fallbackDrafts;
}

function buildSessionSteps(exercises = []) {
  return buildExerciseSessionSteps(exercises).map((step) => ({
    ...step,
    setCount: parsePrescribedSetCount(step.exercise),
    section: getExplicitExerciseSection(step.exercise),
  }));
}

function shouldShowSectionIntro(currentStep, nextStep) {
  if (!currentStep || !nextStep || nextStep.section === currentStep.section) {
    return false;
  }

  return !(
    currentStep.supersetKey &&
    currentStep.supersetKey === nextStep.supersetKey
  );
}

function getInitialSessionStep({
  exercises = [],
  initialSessionProgress = null,
  initialExerciseIndex = null,
  initialSetIndex = null,
  startAtExercise = false,
} = {}) {
  const sessionSteps = buildSessionSteps(exercises);
  const fallbackStep = sessionSteps[0] || { exerciseIndex: 0, setIndex: 0 };

  if (startAtExercise) {
    const requestedExerciseIndex = getSavedNumber(
      initialExerciseIndex,
      getSavedNumber(initialSessionProgress?.activeExerciseIndex)
    );
    const requestedSetIndex = getSavedNumber(
      initialSetIndex,
      getSavedNumber(initialSessionProgress?.activeSetIndex)
    );
    const requestedStep = sessionSteps.find(
      (step) =>
        step.exerciseIndex === requestedExerciseIndex &&
        step.setIndex === requestedSetIndex
    );

    return requestedStep || fallbackStep;
  }

  const completedStepKeys = getSavedCompletedStepKeys(
    initialSessionProgress?.completedStepKeys
  );

  return (
    sessionSteps.find((step) =>
      !completedStepKeys.has(getStepKey(step.exerciseIndex, step.setIndex))
    ) || fallbackStep
  );
}

function ActiveSessionHeader({
  title = "",
  showHelp = false,
  compact = false,
  onHelp,
  onBack,
}) {
  return (
    <View style={[styles.header, compact ? styles.compactHeader : null]}>
      <TouchableOpacity
        style={[styles.backButton, compact ? styles.compactBackButton : null]}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <IBMPlexText style={[styles.backButtonIcon, compact ? styles.compactBackButtonIcon : null]}>
          ←
        </IBMPlexText>
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        {title ? (
          <IBMPlexText
            style={[styles.headerTitle, compact ? styles.compactHeaderTitle : null]}
            numberOfLines={1}
          >
            {title}
          </IBMPlexText>
        ) : null}
      </View>
      <View style={styles.headerTrailingActions}>
        {showHelp ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Show exercise guidance"
            activeOpacity={0.7}
            style={[styles.headerHelpButton, compact ? styles.compactHeaderHelpButton : null]}
            onPress={onHelp}
          >
            <IBMPlexText style={[styles.headerHelpIcon, compact ? styles.compactHeaderHelpIcon : null]}>
              ?
            </IBMPlexText>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.headerActionSpacer,
              compact ? styles.compactHeaderActionSpacer : null,
            ]}
          />
        )}
      </View>
    </View>
  );
}

function getSectionLabel(section = "") {
  return EXERCISE_SECTION_LABELS[section] || "Section";
}

function getSectionRunForExerciseIndex(sectionRuns = [], exerciseIndex = 0) {
  const sectionRunIndex = sectionRuns.findIndex((run) =>
    run.exercises.some((item) => item.exerciseIndex === exerciseIndex)
  );
  const sectionRun = sectionRunIndex >= 0 ? sectionRuns[sectionRunIndex] : null;

  return {
    sectionRun,
    sectionRunIndex,
    sectionLabel: getSectionLabel(sectionRun?.section),
  };
}

function getSessionPhaseDetails(plan = {}, weekNumber = 1) {
  const phaseOverview = getTrainingPlanPhaseOverview(plan);
  const week = Number.parseInt(weekNumber, 10) || 1;
  const phase =
    phaseOverview.find(
      (candidatePhase) =>
        week >= candidatePhase.weekStart && week <= candidatePhase.weekEnd
    ) ||
    phaseOverview.find((candidatePhase) => week <= candidatePhase.weekEnd) ||
    phaseOverview[phaseOverview.length - 1] ||
    null;

  return {
    label: phase?.label || "Building",
    focus: normalizeText(phase?.focus),
  };
}

function ExerciseResultProgressRing({ completedSetCount = 0, totalSetCount = 0 }) {
  const progressPercent =
    totalSetCount > 0
      ? Math.min(100, Math.round((completedSetCount / totalSetCount) * 100))
      : 0;
  const progressOffset =
    EXERCISE_RESULT_RING_CIRCUMFERENCE -
    EXERCISE_RESULT_RING_CIRCUMFERENCE * (progressPercent / 100);

  return (
    <View style={styles.resultsExerciseProgressRing}>
      <Svg
        width={EXERCISE_RESULT_RING_SIZE}
        height={EXERCISE_RESULT_RING_SIZE}
        viewBox={`0 0 ${EXERCISE_RESULT_RING_SIZE} ${EXERCISE_RESULT_RING_SIZE}`}
      >
        <Circle
          cx={EXERCISE_RESULT_RING_CENTER}
          cy={EXERCISE_RESULT_RING_CENTER}
          r={EXERCISE_RESULT_RING_RADIUS}
          fill="none"
          stroke="#3f3f46"
          strokeWidth={EXERCISE_RESULT_RING_STROKE}
        />
        <Circle
          cx={EXERCISE_RESULT_RING_CENTER}
          cy={EXERCISE_RESULT_RING_CENTER}
          r={EXERCISE_RESULT_RING_RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth={EXERCISE_RESULT_RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${EXERCISE_RESULT_RING_CIRCUMFERENCE} ${EXERCISE_RESULT_RING_CIRCUMFERENCE}`}
          strokeDashoffset={progressOffset}
          rotation="-90"
          originX={EXERCISE_RESULT_RING_CENTER}
          originY={EXERCISE_RESULT_RING_CENTER}
        />
      </Svg>
      <View style={styles.resultsExerciseProgressRingContent}>
        <IBMPlexText style={styles.resultsExerciseProgressRingText}>
          {completedSetCount}/{totalSetCount}
        </IBMPlexText>
      </View>
    </View>
  );
}

function parseTrackedNumber(value) {
  if (value == null || value === "") {
    return null;
  }

  const parsedValue = Number.parseFloat(String(value).replace(",", "."));

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function formatAverageNumber(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number.isInteger(value)
    ? String(value)
    : String(Math.round(value * 10) / 10);
}

function getAverageTrackedValue(values = []) {
  const numericValues = values
    .map(parseTrackedNumber)
    .filter((value) => Number.isFinite(value));

  if (!numericValues.length) {
    return "";
  }

  const average =
    numericValues.reduce((total, value) => total + value, 0) /
    numericValues.length;

  return formatAverageNumber(average);
}

function getReportedResultSummaryForExercise(
  trackingDrafts = {},
  exerciseIndex = 0,
  unitSystem = "metric"
) {
  const drafts = Object.values(trackingDrafts)
    .filter((draft) => draft?.exerciseIndex === exerciseIndex)
    .sort((left, right) => (left.setIndex || 0) - (right.setIndex || 0));
  const parts = [];
  const averageLoadKg = getAverageTrackedValue(
    drafts.map((draft) => draft.loadKg)
  );
  const averageReps = getAverageTrackedValue(
    drafts.map((draft) => draft.reps)
  );
  const averageDurationMinutes = getAverageTrackedValue(
    drafts.map((draft) => draft.durationMinutes)
  );
  const averageRpe = getAverageTrackedValue(
    drafts.map((draft) => draft.rpe)
  );
  const customFieldIds = Array.from(
    new Set(
      drafts.flatMap((draft) => Object.keys(draft.customValues || {}))
    )
  );

  if (averageLoadKg) {
    parts.push(formatWeightFromKilograms(averageLoadKg, unitSystem));
  }

  if (averageReps) {
    parts.push(`${averageReps} reps`);
  }

  if (averageDurationMinutes) {
    parts.push(`${averageDurationMinutes} min`);
  }

  if (averageRpe) {
    parts.push(`RPE ${averageRpe}`);
  }

  customFieldIds.forEach((fieldId) => {
    const fieldValues = drafts
      .map((draft) => draft.customValues?.[fieldId])
      .filter(Boolean);
    const averageValue = getAverageTrackedValue(fieldValues);

    if (averageValue) {
      parts.push(`${fieldId.replace(/_/g, " ")} ${averageValue}`);
    } else if (fieldValues.length > 0) {
      const categoricalValues = Array.from(new Set(fieldValues));
      parts.push(
        `${fieldId.replace(/_/g, " ")} ${categoricalValues.join(" / ")}`
      );
    }
  });

  return parts.join(" · ");
}

function ActiveSessionResultsList({
  sectionRuns = [],
  completedStepKeys,
  trackingDrafts = {},
  unitSystem = "metric",
}) {
  const router = useRouter();
  const fadeProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeProgress.setValue(0);
    const animation = Animated.timing(fadeProgress, {
      toValue: 1,
      duration: RESULTS_FADE_IN_DURATION_MS,
      delay: SESSION_CONTENT_SLIDE_DURATION_MS,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [fadeProgress]);

  const translateY = fadeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [RESULTS_FADE_IN_TRANSLATE_Y, 0],
  });

  if (!sectionRuns.length) {
    return null;
  }

  const completedSteps =
    completedStepKeys instanceof Set
      ? completedStepKeys
      : new Set(Array.isArray(completedStepKeys) ? completedStepKeys : []);

  function openForumSearch(exercise = {}) {
    const searchQuery = getExerciseDisplayName(exercise);

    if (!searchQuery) {
      return;
    }

    router.push({
      pathname: "/(tabs)/forum",
      params: { searchQuery },
    });
  }

  return (
    <Animated.View
      style={[
        styles.resultsFadeIn,
        {
          opacity: fadeProgress,
          transform: [{ translateY }],
        },
      ]}
    >
    <ScrollView
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      style={styles.resultsScroller}
      contentContainerStyle={styles.resultsBlock}
    >
      {sectionRuns.map(({ section, exercises: sectionExercises }, sectionIndex) => (
        <View
          key={`results-${section}-${sectionIndex}`}
          style={styles.resultsSection}
        >
          <IBMPlexText style={styles.resultsSectionTitle}>{getSectionLabel(section)}</IBMPlexText>
          <View style={styles.resultsExerciseList}>
            {sectionExercises.map(({ exercise, exerciseIndex }) => {
              const recommendation = getExerciseRecommendationDisplay(
                exercise,
                {},
                unitSystem
              );
              const prescription = getExercisePrescriptionDisplay(exercise);
              const totalSetCount = parsePrescribedSetCount(exercise);
              const completedSetCount = Array.from({ length: totalSetCount }).filter(
                (_, setIndex) => completedSteps.has(getStepKey(exerciseIndex, setIndex))
              ).length;
              const reportedResultSummary = getReportedResultSummaryForExercise(
                trackingDrafts,
                exerciseIndex,
                unitSystem
              );

              return (
                <View key={exerciseIndex} style={styles.resultsExerciseRow}>
                  <ExerciseResultProgressRing
                    completedSetCount={completedSetCount}
                    totalSetCount={totalSetCount}
                  />
                  <TouchableOpacity
                    style={styles.resultsExerciseForumButton}
                    onPress={() => openForumSearch(exercise)}
                  >
                    <IBMPlexText style={styles.resultsExerciseForumText}>Forum</IBMPlexText>
                  </TouchableOpacity>
                  <View style={styles.resultsExerciseMain}>
                    <IBMPlexText style={styles.resultsExerciseName}>
                      {getExerciseDisplayName(exercise)}
                    </IBMPlexText>
                    {prescription ? (
                      <IBMPlexText style={styles.resultsExercisePrescription}>
                        {prescription}
                      </IBMPlexText>
                    ) : null}
                    {reportedResultSummary ? (
                      <IBMPlexText style={styles.resultsReportedText}>
                        {reportedResultSummary}
                      </IBMPlexText>
                    ) : null}
                    {recommendation.details ? (
                      <IBMPlexText style={styles.resultsExerciseDetails}>
                        {recommendation.details}
                      </IBMPlexText>
                    ) : null}
                  </View>
                  {recommendation.primary ? (
                    <IBMPlexText style={styles.resultsExercisePrimary}>
                      {recommendation.primary}
                    </IBMPlexText>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
    </Animated.View>
  );
}

export function getSetLoggingConfig(exercise = {}) {
  const performanceTarget = getExercisePerformanceTarget(exercise);
  const strengthAssessment = getExerciseStrengthAssessment(exercise);
  const baseStrengthRequirements = strengthAssessment
    ? getStrengthAssessmentRequirements(strengthAssessment.method)
    : null;
  const strengthMinimumRpe =
    strengthAssessment?.method === "rpe_based_1rm"
      ? getStrengthAssessmentMinimumRpe(exercise)
      : null;
  const strengthRequirements = baseStrengthRequirements
    ? {
        ...baseStrengthRequirements,
        rpePlaceholder: strengthMinimumRpe
          ? `${strengthMinimumRpe}-9`
          : baseStrengthRequirements.rpePlaceholder,
      }
    : null;
  const explicitCustomFields = getExerciseLoggingFieldSource(exercise)
    .map((field, fieldIndex) => normalizeCustomLoggingField(field, fieldIndex))
    .filter(Boolean);
  const inferredCustomFields =
    explicitCustomFields.length > 0 ? [] : inferCustomLoggingFields(exercise);
  const customFields = [...explicitCustomFields, ...inferredCustomFields].filter(
    (field) => field.id !== "set_quality"
  );
  const isTimedEnduranceExercise = Boolean(exercise?.endurancePrescription);

  if (strengthAssessment) {
    return {
      performanceTarget,
      strengthAssessment,
      strengthRequirements,
      showInputs: true,
      showLoad: true,
      showReps: true,
      showTime: false,
      showRpe: Boolean(strengthRequirements?.requiresRpe),
      customFields,
    };
  }

  if (performanceTarget) {
    return {
      performanceTarget,
      strengthAssessment,
      strengthRequirements,
      showInputs: true,
      showLoad: true,
      showReps: true,
      showTime: false,
      showRpe: performanceTarget.strategy === "fixed_rpe",
      customFields,
    };
  }

  return {
    performanceTarget: null,
    strengthAssessment: null,
    strengthRequirements: null,
    showInputs: true,
    showLoad: false,
    showReps: !isTimedEnduranceExercise,
    showTime: isTimedEnduranceExercise,
    showRpe: false,
    customFields,
  };
}

function ExerciseSessionStep({
  exercise,
  exerciseIndex,
  setIndex,
  draft,
  prescribedSets,
  completedSetIndexes,
  trackingDrafts,
  onSelectSet,
  onDraftChange,
  strengthReferenceOneRepMaxByLift,
  compact = false,
  isEstimatingProgramMax = false,
  programMaxStatusLabel = "Estimating your max",
  unitSystem = "metric",
}) {
  const [setOverviewWidth, setSetOverviewWidth] = useState(0);
  const {
    performanceTarget,
    strengthAssessment,
    strengthRequirements,
    showInputs,
    showLoad,
    showReps,
    showTime,
    showRpe,
    customFields,
  } = getSetLoggingConfig(exercise);
  const recommendedRepCount = getRecommendedRepCount(exercise, setIndex);
  const inputDraft = {
    exerciseIndex,
    setIndex,
    loadKg: "",
    durationMinutes: "",
    rpe: "",
    customValues: {},
    ...(draft || {}),
    reps:
      draft?.reps != null && draft.reps !== ""
        ? draft.reps
        : String(recommendedRepCount),
  };
  if (
    showTime &&
    (!draft?.durationMinutes && exercise?.endurancePrescription?.durationMinutes)
  ) {
    inputDraft.durationMinutes = String(
      exercise.endurancePrescription.durationMinutes
    );
  }
  const exerciseRecommendation = getExerciseRecommendationDisplay(
    exercise,
    strengthReferenceOneRepMaxByLift,
    unitSystem
  );
  const recommendedLoadKg = getRecommendedLoadKg(
    exercise,
    setIndex,
    strengthReferenceOneRepMaxByLift
  );
  const assessmentMinimumRpe =
    strengthAssessment?.method === "rpe_based_1rm"
      ? getStrengthAssessmentMinimumRpe(exercise)
      : null;
  const usesPercentagePrescription = Boolean(
    getExercisePercentagePrescription(exercise)
  );
  const displayedTargetRpe = usesPercentagePrescription
    ? null
    : performanceTarget?.targetRpe ||
      parseRpeFromText(exercise?.notes) ||
      assessmentMinimumRpe;
  const performanceTargetRpe = displayedTargetRpe
    ? `RPE ${
        assessmentMinimumRpe && displayedTargetRpe === assessmentMinimumRpe
          ? `${assessmentMinimumRpe}-9`
          : displayedTargetRpe
      }`
    : "";
  const programMaxIntensityMetric = isEstimatingProgramMax
    ? [performanceTargetRpe, programMaxStatusLabel].filter(Boolean).join("\n")
    : performanceTargetRpe;
  const exerciseRecommendationDetails = String(exerciseRecommendation.details || "")
    .split(/\s*\*\s*/)
    .filter((detail) => !performanceTargetRpe || !/^RPE\b/i.test(detail));
  const endurancePrescription = exercise?.endurancePrescription || {};
  const setDisplayValue = getExerciseSetDisplayValue(exercise);
  const loadedJumpPrescription = getLoadedJumpPrescription(exercise);
  const intensityMetric =
    (loadedJumpPrescription
      ? formatBodyMassLoadRange(loadedJumpPrescription)
      : programMaxIntensityMetric ||
        exerciseRecommendation.primary ||
        exerciseRecommendationDetails[0]) ||
    "";
  const planMetrics = [
    intensityMetric
      ? {
          label: "Intensity",
          value: intensityMetric,
          isProgramMaxEstimate: isEstimatingProgramMax,
        }
      : null,
    setDisplayValue ? { label: "Sets", value: setDisplayValue } : null,
    normalizeText(exercise?.reps)
      ? {
          label: showTime ? "Duration" : "Reps",
          value: normalizeText(exercise?.reps),
        }
      : null,
  ].filter(Boolean);
  const additionalTargetMetrics = [
    ...exerciseRecommendationDetails.map((value) => ({
      label: /\b(?:1\s*RM|Program Max)\b/i.test(value)
        ? "1RM target"
        : /^RI\b/i.test(value)
          ? "Relative intensity"
          : /^Tempo\b/i.test(value)
            ? "Tempo"
            : "Target",
      value,
    })),
    endurancePrescription.work
      ? { label: "Work", value: endurancePrescription.work }
      : null,
    endurancePrescription.durationMinutes
      ? { label: "Total", value: `${endurancePrescription.durationMinutes} min` }
      : null,
    endurancePrescription.rounds
      ? { label: "Rounds", value: `${endurancePrescription.rounds}` }
      : null,
    endurancePrescription.rest
      ? { label: "Rest", value: endurancePrescription.rest }
      : null,
  ].filter(Boolean);
  const targetMetrics = [...planMetrics, ...additionalTargetMetrics].filter(
    (metric, metricIndex, metrics) =>
      metric.value &&
      metrics.findIndex(({ value }) => value === metric.value) === metricIndex
  );
  const completedSetIndexSet = new Set(completedSetIndexes);
  const setOverviewItems = prescribedSets.map(({ setIndex: overviewSetIndex }) => {
    const setDraft = trackingDrafts?.[
      getDraftKey(exerciseIndex, overviewSetIndex)
    ] || {};
    const setSummaryParts = [];

    if (setDraft.loadKg) {
      setSummaryParts.push(
        formatWeightFromKilograms(setDraft.loadKg, unitSystem)
      );
    }

    if (setDraft.reps) {
      setSummaryParts.push(`${setDraft.reps} reps`);
    }

    if (setDraft.durationMinutes) {
      setSummaryParts.push(`${setDraft.durationMinutes} min`);
    }

    if (setDraft.rpe) {
      setSummaryParts.push(`RPE ${setDraft.rpe}`);
    }

    const isActive = overviewSetIndex === setIndex;
    const isCompleted = completedSetIndexSet.has(overviewSetIndex);
    const summary = setSummaryParts.join(" × ");

    return {
      setIndex: overviewSetIndex,
      isActive,
      isCompleted,
      summary:
        summary || (isCompleted ? "Completed" : isActive ? "Current set" : "Not logged"),
    };
  });
  const visibleSetColumnCount = Math.max(
    1,
    Math.min(setOverviewItems.length, 3)
  );
  const setOverviewItemWidth = setOverviewWidth
    ? (setOverviewWidth -
        SET_OVERVIEW_ITEM_GAP * (visibleSetColumnCount - 1)) /
      visibleSetColumnCount
    : undefined;
  return (
    <View style={[styles.exerciseCard, compact ? styles.compactExerciseCard : null]}>
      <View
        style={[
          styles.activeExercisePlanCard,
          compact ? styles.compactActiveExercisePlanCard : null,
        ]}
      >
        <IBMPlexText style={styles.activeExerciseTargetsTitle}>
          Targets
        </IBMPlexText>
        {targetMetrics.length > 0 ? (
          <View style={styles.activeExerciseMetricsRow}>
            {targetMetrics.map((metric, metricIndex) => (
              <View
                key={`${metric.label}-${metric.value}-${metricIndex}`}
                style={styles.activeExerciseMetricColumn}
              >
                <IBMPlexText style={styles.activeExerciseMetricLabel}>
                  {metric.label}
                </IBMPlexText>
                {metric.isProgramMaxEstimate ? (
                  <View style={styles.programMaxIntensityChip}>
                    <IBMPlexText
                      numberOfLines={2}
                      style={styles.programMaxIntensityMetric}
                    >
                      {formatTargetSections(
                        formatMeasurementText(metric.value, unitSystem)
                      )}
                    </IBMPlexText>
                  </View>
                ) : (
                  <IBMPlexText style={styles.activeExerciseMetricValue}>
                    {formatTargetSections(
                      formatMeasurementText(metric.value, unitSystem)
                    )}
                  </IBMPlexText>
                )}
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {loadedJumpPrescription ? (
        <LoadedJumpGuideline compact={compact} />
      ) : null}

      {showRpe ? (
        <IBMPlexText style={[styles.workingSetsNote, compact ? styles.compactWorkingSetsNote : null]}>
          Do not include warm-up sets.
        </IBMPlexText>
      ) : null}

      <View style={[styles.bottomControls, compact ? styles.compactBottomControls : null]}>
        {showInputs || customFields.length > 0 ? (
          <ActiveSessionSetLoggingInputPanel
            exerciseIndex={exerciseIndex}
            setIndex={setIndex}
            draft={inputDraft}
            showLoad={showLoad}
            showReps={showReps}
            showTime={showTime}
            showRpe={showRpe}
            strengthAssessment={strengthAssessment}
            strengthRequirements={strengthRequirements}
            customFields={customFields}
            recommendedLoadKg={recommendedLoadKg}
            recommendedRepCount={recommendedRepCount}
            targetDurationMinutes={endurancePrescription.durationMinutes}
            targetRpe={displayedTargetRpe}
            unitSystem={unitSystem}
            onDraftChange={onDraftChange}
            compact={compact}
          />
        ) : null}

        <View style={styles.sessionSetSection}>
          <View style={styles.sessionSetSectionHeader}>
            <View style={styles.sessionSetSectionIcon}>
              <Ionicons color="#A1A1AA" name="albums-outline" size={19} />
            </View>
            <View style={styles.sessionSetSectionHeadingCopy}>
              <IBMPlexText style={styles.sessionSetSectionEyebrow}>
                Sets
              </IBMPlexText>
              <IBMPlexText style={styles.sessionSetCompletionText}>
                {completedSetIndexes.length}/{prescribedSets.length || 1} complete
              </IBMPlexText>
            </View>
          </View>

          <View style={styles.sessionSetOverviewViewport}>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sessionSetOverviewRow}
              onLayout={(event) => {
                setSetOverviewWidth(event.nativeEvent.layout.width);
              }}
            >
              {setOverviewItems.map((item) => (
                <TouchableOpacity
                  key={item.setIndex}
                  accessibilityRole="button"
                  accessibilityLabel={`Open set ${item.setIndex + 1}`}
                  accessibilityState={{ selected: item.isActive }}
                  activeOpacity={0.75}
                  style={[
                    styles.sessionSetOverviewItem,
                    setOverviewItemWidth
                      ? { width: setOverviewItemWidth }
                      : null,
                    item.isActive ? styles.sessionSetOverviewItemActive : null,
                  ]}
                  onPress={() => onSelectSet?.(item.setIndex)}
                >
                  <View style={styles.sessionSetOverviewItemHeader}>
                    {item.isCompleted ? (
                      <Ionicons
                        color="#22C55E"
                        name="checkmark-circle"
                        size={15}
                      />
                    ) : null}
                    <IBMPlexText
                      style={[
                        styles.sessionSetOverviewItemTitle,
                        item.isActive
                          ? styles.sessionSetOverviewItemTitleActive
                          : null,
                      ]}
                    >
                      Set {item.setIndex + 1}
                    </IBMPlexText>
                  </View>
                  <IBMPlexText
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                    style={styles.sessionSetOverviewItemSummary}
                  >
                    {item.summary}
                  </IBMPlexText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

      </View>
    </View>
  );
}

function ExerciseAlreadyCompletedView({
  exercise,
  setCount = 0,
  onContinue,
  onRetry,
}) {
  const exerciseName = getExerciseDisplayName(exercise);

  return (
    <View style={styles.alreadyCompletedCard}>
      <View style={styles.alreadyCompletedBadge}>
        <IBMPlexText style={styles.alreadyCompletedBadgeText}>Done</IBMPlexText>
      </View>
      <View style={styles.alreadyCompletedCopy}>
        <IBMPlexText style={styles.alreadyCompletedTitle}>
          Exercise already completed
        </IBMPlexText>
        {exerciseName ? (
          <IBMPlexText style={styles.alreadyCompletedExercise}>
            {exerciseName}
          </IBMPlexText>
        ) : null}
        <IBMPlexText style={styles.alreadyCompletedBody}>
          {setCount > 1
            ? `${setCount} sets are already logged for this exercise.`
            : "This exercise is already logged."}
        </IBMPlexText>
      </View>
      <View style={styles.alreadyCompletedActions}>
        <TouchableOpacity
          style={[styles.nextButton, styles.alreadyCompletedContinueButton]}
          onPress={onContinue}
        >
          <IBMPlexText defaultWhite style={styles.nextButtonText}>
            Continue
          </IBMPlexText>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.retryCompletedButton}
          onPress={onRetry}
        >
          <IBMPlexText style={styles.retryCompletedText}>
            Retry this exercise
          </IBMPlexText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ActiveSessionView({
  plan,
  weekNumber = 1,
  day,
  exercises = [],
  initialPerformanceResults = [],
  initialAssessmentResults = [],
  strengthAssessmentSummary,
  initialSessionProgress = null,
  initialExerciseIndex = null,
  initialSetIndex = null,
  startAtExercise = false,
  embedded = false,
  scrollStyle,
  contentContainerStyle,
  onSessionProgressChange,
  onStrengthAssessmentSave,
  onBack,
  onFinish,
  unitSystem = "metric",
}) {
  const normalizedExercises = useMemo(
    () =>
      Array.isArray(exercises)
        ? exercises.map((exercise) => normalizeExercise(exercise))
        : [],
    [exercises]
  );
  const strengthReferenceOneRepMaxByLift = useMemo(
    () =>
      (Array.isArray(strengthAssessmentSummary?.latestByLift)
        ? strengthAssessmentSummary.latestByLift
        : []
      ).reduce((accumulator, entry) => {
        const liftKey = getStrengthAssessmentLiftKey(entry?.liftName || "");
        const referenceOneRepMaxKg = getStrengthAssessmentReferenceOneRepMaxKg(entry);

        if (liftKey && referenceOneRepMaxKg) {
          accumulator[liftKey] = referenceOneRepMaxKg;
        }

        return accumulator;
      }, {}),
    [strengthAssessmentSummary]
  );
  const phaseDetails = useMemo(
    () => getSessionPhaseDetails(plan, weekNumber),
    [plan, weekNumber]
  );
  const resolvedInitialStep = getInitialSessionStep({
    exercises: normalizedExercises,
    initialSessionProgress,
    initialExerciseIndex,
    initialSetIndex,
    startAtExercise,
  });
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() =>
    resolvedInitialStep.exerciseIndex
  );
  const [activeSetIndex, setActiveSetIndex] = useState(() =>
    resolvedInitialStep.setIndex
  );
  const [displayedCompletedExerciseCount, setDisplayedCompletedExerciseCount] =
    useState(() => resolvedInitialStep.exerciseIndex);
  const [
    previousDisplayedCompletedExerciseCount,
    setPreviousDisplayedCompletedExerciseCount,
  ] = useState(() => resolvedInitialStep.exerciseIndex);
  const [sessionScreenMode, setSessionScreenMode] = useState(
    startAtExercise
      ? SESSION_SCREEN_MODES.EXERCISE
      : SESSION_SCREEN_MODES.SECTION_INTRO
  );
  const [isDescriptionMenuVisible, setIsDescriptionMenuVisible] = useState(false);
  const [newProgramMax, setNewProgramMax] = useState(null);
  const advanceTimeoutRef = useRef(null);
  const [completedStepKeys, setCompletedStepKeys] = useState(() =>
    getSavedCompletedStepKeys(initialSessionProgress?.completedStepKeys)
  );
  const [trackingDrafts, setTrackingDrafts] = useState(() => {
    const fallbackDrafts = buildTrackingDrafts(
      normalizedExercises,
      initialPerformanceResults,
      initialAssessmentResults
    );

    return getSavedTrackingDrafts(
      initialSessionProgress?.trackingDrafts,
      fallbackDrafts
    );
  });
  const sectionRuns = useMemo(
    () => buildExerciseSectionRuns(normalizedExercises),
    [normalizedExercises]
  );
  const sessionSteps = useMemo(
    () => buildSessionSteps(normalizedExercises),
    [normalizedExercises]
  );
  const activeStepIndex = sessionSteps.findIndex(
    (step) =>
      step.exerciseIndex === activeExerciseIndex &&
      step.setIndex === activeSetIndex
  );
  const resolvedActiveStepIndex = activeStepIndex >= 0 ? activeStepIndex : 0;
  const activeStep = sessionSteps[resolvedActiveStepIndex] || null;
  const activeExercise = activeStep?.exercise || null;
  const {
    sectionRun: activeSectionRun,
    sectionRunIndex: activeSectionRunIndex,
    sectionLabel: activeSectionLabel,
  } = getSectionRunForExerciseIndex(sectionRuns, activeStep?.exerciseIndex || 0);
  const isLastStep = resolvedActiveStepIndex >= sessionSteps.length - 1;
  const isSessionCompleteIntro =
    sessionScreenMode === SESSION_SCREEN_MODES.SESSION_COMPLETE;
  const showSectionIntro =
    sessionScreenMode === SESSION_SCREEN_MODES.SECTION_INTRO && activeExercise;
  const showExerciseStep =
    sessionScreenMode === SESSION_SCREEN_MODES.EXERCISE && activeExercise;
  const showAlreadyCompletedExercise =
    sessionScreenMode === SESSION_SCREEN_MODES.EXERCISE_ALREADY_COMPLETED &&
    activeExercise;
  const traversedExerciseCount = isSessionCompleteIntro
    ? normalizedExercises.length
    : displayedCompletedExerciseCount;
  const headerTitle = isSessionCompleteIntro
    ? "Session results"
    : showSectionIntro
      ? activeSectionLabel
      : activeExercise
        ? getExerciseDisplayName(activeExercise)
        : "";
  const activeExerciseGuidance = activeExercise
    ? formatMeasurementText(
        activeExercise.notes || "No additional guidance for this exercise.",
        unitSystem
      )
    : "";
  const activeExerciseSetTabs = activeExercise
    ? Array.from({ length: activeStep.setCount }).map((_, setIndex) => ({
        setIndex,
      }))
    : [];
  const activeSessionSlideKey = [
    sessionScreenMode,
    activeStep?.exerciseIndex ?? "empty",
  ].join(":");
  const sessionProgressRatio = isSessionCompleteIntro
    ? 1
    : normalizedExercises.length > 0
      ? Math.min(
          1,
          displayedCompletedExerciseCount / normalizedExercises.length
        )
      : 0;

  useEffect(() => {
    const fallbackDrafts = buildTrackingDrafts(
      normalizedExercises,
      initialPerformanceResults,
      initialAssessmentResults
    );

    const nextInitialStep = getInitialSessionStep({
      exercises: normalizedExercises,
      initialSessionProgress,
      initialExerciseIndex,
      initialSetIndex,
      startAtExercise,
    });

    setActiveExerciseIndex(nextInitialStep.exerciseIndex);
    setActiveSetIndex(nextInitialStep.setIndex);
    setDisplayedCompletedExerciseCount(nextInitialStep.exerciseIndex);
    setPreviousDisplayedCompletedExerciseCount(nextInitialStep.exerciseIndex);
    setSessionScreenMode(
      startAtExercise
        ? SESSION_SCREEN_MODES.EXERCISE
        : SESSION_SCREEN_MODES.SECTION_INTRO
    );
    setCompletedStepKeys(
      getSavedCompletedStepKeys(initialSessionProgress?.completedStepKeys)
    );
    setTrackingDrafts(
      getSavedTrackingDrafts(
        initialSessionProgress?.trackingDrafts,
        fallbackDrafts
      )
    );
  }, [
    day?.day,
    initialAssessmentResults,
    initialExerciseIndex,
    initialPerformanceResults,
    initialSetIndex,
    normalizedExercises,
    startAtExercise,
  ]);

  useEffect(
    () => () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!newProgramMax) {
      return undefined;
    }

    const timeout = setTimeout(() => setNewProgramMax(null), 6000);
    return () => clearTimeout(timeout);
  }, [newProgramMax]);

  useEffect(() => {
    onSessionProgressChange?.({
      activeExerciseIndex,
      activeSetIndex,
      completedStepKeys: Array.from(completedStepKeys),
      trackingDrafts,
      updatedAt: new Date().toISOString(),
    });
  }, [activeExerciseIndex, activeSetIndex, completedStepKeys, trackingDrafts]);

  useEffect(() => {
    const fallbackStep = sessionSteps[0] || { exerciseIndex: 0, setIndex: 0 };
    const stillValid = sessionSteps.some(
      (step) =>
        step.exerciseIndex === activeExerciseIndex &&
        step.setIndex === activeSetIndex
    );

    if (!stillValid) {
      setActiveExerciseIndex(fallbackStep.exerciseIndex);
      setActiveSetIndex(fallbackStep.setIndex);
    }
  }, [activeExerciseIndex, activeSetIndex, sessionSteps]);

  function updateTrackingDraft(exerciseIndex, setIndex, field, value, isCustomField = false) {
    const draftKey = getDraftKey(exerciseIndex, setIndex);

    setTrackingDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: {
        exerciseIndex,
        setIndex,
        ...(currentDrafts[draftKey] || {}),
        ...(isCustomField
          ? {
              customValues: {
                ...(currentDrafts[draftKey]?.customValues || {}),
                [field]: value,
              },
            }
          : {
              [field]: value,
            }),
      },
    }));
  }

  function goToStep(stepIndex) {
    const nextStep = sessionSteps[stepIndex];

    if (!nextStep) {
      return;
    }

    setActiveExerciseIndex(nextStep.exerciseIndex);
    setActiveSetIndex(nextStep.setIndex);
  }

  function goToSessionStep(stepIndex, { showIntro = false } = {}) {
    const nextStep = sessionSteps[stepIndex];

    if (!nextStep) {
      return;
    }

    goToStep(stepIndex);
    setSessionScreenMode(
      showIntro
        ? SESSION_SCREEN_MODES.SECTION_INTRO
        : isExerciseFullyCompleted(
            completedStepKeys,
            nextStep.exerciseIndex,
            nextStep.exercise
          )
          ? SESSION_SCREEN_MODES.EXERCISE_ALREADY_COMPLETED
          : SESSION_SCREEN_MODES.EXERCISE
    );
  }

  function scheduleSessionStep(stepIndex, options = {}) {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }

    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      goToSessionStep(stepIndex, options);
    }, SESSION_EXERCISE_ADVANCE_DELAY_MS);
  }

  function scheduleSessionComplete() {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
    }

    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setSessionScreenMode(SESSION_SCREEN_MODES.SESSION_COMPLETE);
    }, SESSION_EXERCISE_ADVANCE_DELAY_MS);
  }

  function handleExitSession() {
    onBack?.();
  }

  function handleCompleteCurrentSet() {
    if (!activeStep) {
      return;
    }

    const nextCompletedStepKeys = new Set(completedStepKeys);
    nextCompletedStepKeys.add(
      getStepKey(activeStep.exerciseIndex, activeStep.setIndex)
    );

    const strengthAssessment = getExerciseStrengthAssessment(activeExercise);
    const liftKey = getStrengthAssessmentLiftKey(strengthAssessment?.liftName || "", "");
    const isMissingProgramMax = Boolean(
      strengthAssessment &&
      liftKey &&
      !strengthReferenceOneRepMaxByLift[liftKey]
    );

    if (isMissingProgramMax) {
      const result = trackingDrafts[
        getDraftKey(activeStep.exerciseIndex, activeStep.setIndex)
      ];
      const entry = createStrengthAssessmentEntry({
        metadata: {
          ...strengthAssessment,
          minimumRpe: getStrengthAssessmentMinimumRpe(activeExercise),
        },
        result,
        exerciseIndex: activeStep.exerciseIndex,
        setIndex: activeStep.setIndex,
        sourceExerciseName: activeExercise?.name,
      });

      if (entry) {
        setNewProgramMax(entry);
        onStrengthAssessmentSave?.(getTrackedResultsFromDrafts(trackingDrafts));
      }
    }

    setCompletedStepKeys((currentCompletedStepKeys) => {
      const updatedCompletedStepKeys = new Set(currentCompletedStepKeys);
      updatedCompletedStepKeys.add(
        getStepKey(activeStep.exerciseIndex, activeStep.setIndex)
      );
      return updatedCompletedStepKeys;
    });

    if (embedded) {
      onFinish?.(getTrackedResultsFromDrafts(trackingDrafts), {
        completedStepKeys: Array.from(nextCompletedStepKeys),
        trackingDrafts,
      });
      return;
    }

    if (!isLastStep) {
      const nextStep = sessionSteps[resolvedActiveStepIndex + 1];
      const isMovingToNextExercise =
        nextStep?.exerciseIndex !== activeStep.exerciseIndex;
      const completedExerciseCount = normalizedExercises.filter(
        (exercise, exerciseIndex) =>
          isExerciseFullyCompleted(
            nextCompletedStepKeys,
            exerciseIndex,
            exercise
          )
      ).length;

      if (isMovingToNextExercise) {
        setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
        setDisplayedCompletedExerciseCount(completedExerciseCount);
        scheduleSessionStep(resolvedActiveStepIndex + 1, {
          showIntro: shouldShowSectionIntro(activeStep, nextStep),
        });
        return;
      }

      goToSessionStep(resolvedActiveStepIndex + 1, {
        showIntro: shouldShowSectionIntro(activeStep, nextStep),
      });
      return;
    }

    setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
    setDisplayedCompletedExerciseCount(normalizedExercises.length);
    scheduleSessionComplete();
  }

  function handlePreviousSet() {
    if (!activeStep || resolvedActiveStepIndex <= 0) {
      return;
    }

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    const previousStepIndex = resolvedActiveStepIndex - 1;
    const previousStep = sessionSteps[previousStepIndex];

    if (!previousStep) {
      return;
    }

    setCompletedStepKeys((currentCompletedStepKeys) => {
      const nextCompletedStepKeys = new Set(currentCompletedStepKeys);
      nextCompletedStepKeys.delete(
        getStepKey(previousStep.exerciseIndex, previousStep.setIndex)
      );
      return nextCompletedStepKeys;
    });

    goToSessionStep(previousStepIndex);
  }

  function handleSkipExercise() {
    if (!activeStep) {
      return;
    }

    const nextExerciseStepIndex = sessionSteps.findIndex(
      (step) => step.exerciseIndex > activeStep.exerciseIndex
    );

    if (nextExerciseStepIndex >= 0) {
      const nextStep = sessionSteps[nextExerciseStepIndex];
      setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
      setDisplayedCompletedExerciseCount(nextStep.exerciseIndex);
      goToSessionStep(nextExerciseStepIndex, {
        showIntro: nextStep?.section !== activeStep.section,
      });
      return;
    }

    setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
    setDisplayedCompletedExerciseCount(normalizedExercises.length);
    setSessionScreenMode(SESSION_SCREEN_MODES.SESSION_COMPLETE);
  }

  function continuePastActiveExercise() {
    if (!activeStep) {
      return;
    }

    const nextExerciseStepIndex = sessionSteps.findIndex(
      (step) => step.exerciseIndex > activeStep.exerciseIndex
    );

    if (nextExerciseStepIndex >= 0) {
      const nextStep = sessionSteps[nextExerciseStepIndex];
      setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
      setDisplayedCompletedExerciseCount(nextStep.exerciseIndex);
      goToSessionStep(nextExerciseStepIndex, {
        showIntro: nextStep?.section !== activeStep.section,
      });
      return;
    }

    setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
    setDisplayedCompletedExerciseCount(normalizedExercises.length);
    setSessionScreenMode(SESSION_SCREEN_MODES.SESSION_COMPLETE);
  }

  function handleRetryCompletedExercise() {
    if (!activeStep) {
      return;
    }

    setCompletedStepKeys((currentCompletedStepKeys) => {
      const nextCompletedStepKeys = new Set(currentCompletedStepKeys);

      Array.from({ length: activeStep.setCount }).forEach((_, setIndex) => {
        nextCompletedStepKeys.delete(getStepKey(activeStep.exerciseIndex, setIndex));
      });

      return nextCompletedStepKeys;
    });
    setActiveExerciseIndex(activeStep.exerciseIndex);
    setActiveSetIndex(0);
    setPreviousDisplayedCompletedExerciseCount(
      Math.max(activeStep.exerciseIndex - 1, 0)
    );
    setDisplayedCompletedExerciseCount(activeStep.exerciseIndex);
    setSessionScreenMode(SESSION_SCREEN_MODES.EXERCISE);
  }

  function handleContinueIntro() {
    if (isSessionCompleteIntro) {
      onFinish?.(getTrackedResultsFromDrafts(trackingDrafts), {
        completedStepKeys: Array.from(completedStepKeys),
        trackingDrafts,
      });
      return;
    }

    setSessionScreenMode(
      isExerciseFullyCompleted(
        completedStepKeys,
        activeStep?.exerciseIndex,
        activeExercise
      )
        ? SESSION_SCREEN_MODES.EXERCISE_ALREADY_COMPLETED
        : SESSION_SCREEN_MODES.EXERCISE
    );
  }

  const content = (
    <>
      <ScrollView
        contentContainerStyle={[
          styles.center,
          embedded ? styles.embeddedCenter : null,
          showExerciseStep ? styles.centerWithSessionNavigation : null,
          contentContainerStyle,
        ]}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={[
          styles.sessionScroll,
          embedded ? styles.embeddedSessionScroll : null,
          scrollStyle,
        ]}
      >
        <ActiveSessionHeader
          title={headerTitle}
          showHelp={showExerciseStep}
          compact={embedded}
          onHelp={() => setIsDescriptionMenuVisible(true)}
          onBack={handleExitSession}
        />

        {newProgramMax ? (
          <View accessibilityLiveRegion="polite" style={styles.newProgramMaxBanner}>
            <IBMPlexText style={styles.newProgramMaxIcon}>✓</IBMPlexText>
            <View style={styles.newProgramMaxCopy}>
              <IBMPlexText style={styles.newProgramMaxTitle}>
                New Program Max:{" "}
                {formatWeightFromKilograms(
                  newProgramMax.trainingMaxKg,
                  unitSystem
                )}
              </IBMPlexText>
              <IBMPlexText style={styles.newProgramMaxDescription}>
                {newProgramMax.liftName} switches to % loading on its next exposure
              </IBMPlexText>
            </View>
          </View>
        ) : null}

        <ActiveSessionSlideIn key={activeSessionSlideKey}>
          {isSessionCompleteIntro ? (
            <ActiveSessionSectionIntroView
              weekNumber={weekNumber}
              phaseLabel={phaseDetails.label}
              phaseFocus={phaseDetails.focus}
              sectionLabel={activeSectionLabel}
              sectionIndex={Math.max(activeSectionRunIndex, 0)}
              sectionCount={sectionRuns.length}
              exerciseCount={activeSectionRun?.exercises.length || 0}
              completedExerciseCount={Math.min(
                traversedExerciseCount,
                normalizedExercises.length
              )}
              previousCompletedExerciseCount={Math.max(
                0,
                Math.min(traversedExerciseCount - 1, normalizedExercises.length)
              )}
              totalExerciseCount={normalizedExercises.length}
              progressAnimationDelayMs={SESSION_CONTENT_SLIDE_DURATION_MS}
              isSessionComplete
              hideIntroContent
              onContinue={handleContinueIntro}
            >
              <ActiveSessionResultsList
                sectionRuns={sectionRuns}
                completedStepKeys={completedStepKeys}
                trackingDrafts={trackingDrafts}
                unitSystem={unitSystem}
              />
            </ActiveSessionSectionIntroView>
          ) : showSectionIntro ? (
            <ActiveSessionSectionIntroView
              weekNumber={weekNumber}
              phaseLabel={phaseDetails.label}
              phaseFocus={phaseDetails.focus}
              sectionLabel={activeSectionLabel}
              sectionIndex={Math.max(activeSectionRunIndex, 0)}
              sectionCount={sectionRuns.length}
              exerciseCount={activeSectionRun?.exercises.length || 0}
              completedExerciseCount={Math.min(
                traversedExerciseCount,
                normalizedExercises.length
              )}
              previousCompletedExerciseCount={Math.max(
                0,
                Math.min(traversedExerciseCount - 1, normalizedExercises.length)
              )}
              totalExerciseCount={normalizedExercises.length}
              progressAnimationDelayMs={SESSION_CONTENT_SLIDE_DURATION_MS}
              onContinue={handleContinueIntro}
            />
          ) : showAlreadyCompletedExercise ? (
            <ExerciseAlreadyCompletedView
              exercise={activeExercise}
              setCount={activeStep.setCount}
              onContinue={continuePastActiveExercise}
              onRetry={handleRetryCompletedExercise}
            />
          ) : showExerciseStep ? (
            <ExerciseSessionStep
              key={`${activeExercise.name}-${activeStep.exerciseIndex}`}
              exercise={activeExercise}
              isEstimatingProgramMax={Boolean(
                getExerciseStrengthAssessment(activeExercise) &&
                !strengthReferenceOneRepMaxByLift[
                  getStrengthAssessmentLiftKey(
                    getExerciseStrengthAssessment(activeExercise)?.liftName || "",
                    ""
                  )
                ]
              )}
              programMaxStatusLabel={
                getExerciseStrengthAssessment(activeExercise)?.method ===
                "rpe_based_1rm"
                  ? "Estimating your max"
                  : "Calibrating your max"
              }
              exerciseIndex={activeStep.exerciseIndex}
              setIndex={activeStep.setIndex}
              draft={trackingDrafts[getDraftKey(activeStep.exerciseIndex, activeStep.setIndex)]}
              prescribedSets={activeExerciseSetTabs}
              completedSetIndexes={activeExerciseSetTabs
                .filter(({ setIndex }) =>
                  completedStepKeys.has(
                    getStepKey(activeStep.exerciseIndex, setIndex)
                  )
                )
                .map(({ setIndex }) => setIndex)}
              trackingDrafts={trackingDrafts}
              onSelectSet={(setIndex) => {
                setActiveExerciseIndex(activeStep.exerciseIndex);
                setActiveSetIndex(setIndex);
                setSessionScreenMode(SESSION_SCREEN_MODES.EXERCISE);
              }}
              onDraftChange={updateTrackingDraft}
              strengthReferenceOneRepMaxByLift={strengthReferenceOneRepMaxByLift}
              compact={embedded}
              unitSystem={unitSystem}
            />
          ) : (
            <View style={styles.emptyState}>
              <IBMPlexText style={styles.emptyStateTitle}>No exercises in this session.</IBMPlexText>
              <TouchableOpacity style={styles.nextButton} onPress={onBack}>
                <IBMPlexText defaultWhite style={styles.nextButtonText}>Back</IBMPlexText>
              </TouchableOpacity>
            </View>
          )}
        </ActiveSessionSlideIn>
      </ScrollView>
      <WhiteBottomMenu
        visible={isDescriptionMenuVisible}
        onDismiss={() => setIsDescriptionMenuVisible(false)}
        title="Exercise guidance"
        description={activeExerciseGuidance}
        buttonText="Got it"
        onButtonPress={() => setIsDescriptionMenuVisible(false)}
      />
    </>
  );
  const sessionProgressBar = (
    <View pointerEvents="none" style={styles.sessionProgressLineTrack}>
      <View
        style={[
          styles.sessionProgressLineFill,
          { width: `${sessionProgressRatio * 100}%` },
        ]}
      />
    </View>
  );
  const sessionNavigationBar = showExerciseStep ? (
    <View
      style={[
        styles.floatingSessionNavigation,
        embedded ? styles.compactFloatingSessionNavigation : null,
      ]}
    >
      <View
        style={[
          styles.navigationRow,
          styles.floatingNavigationRow,
          embedded ? styles.compactNavigationRow : null,
        ]}
      >
        <TouchableOpacity
          accessibilityState={{ disabled: resolvedActiveStepIndex <= 0 }}
          disabled={resolvedActiveStepIndex <= 0}
          style={[
            styles.secondaryActionButton,
            embedded ? styles.compactSecondaryActionButton : null,
            resolvedActiveStepIndex <= 0
              ? styles.secondaryActionButtonDisabled
              : null,
          ]}
          onPress={handlePreviousSet}
        >
          <IBMPlexText
            defaultWhite
            style={[
              styles.secondaryActionButtonText,
              embedded ? styles.compactSecondaryActionButtonText : null,
            ]}
          >
            Previous
          </IBMPlexText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.stepActionButton,
            embedded ? styles.compactStepActionButton : null,
          ]}
          onPress={handleCompleteCurrentSet}
        >
          <IBMPlexText
            defaultWhite
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
            style={[
              styles.nextButtonText,
              embedded ? styles.compactNextButtonText : null,
            ]}
          >
            Finish set
          </IBMPlexText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.secondaryActionButton,
            embedded ? styles.compactSecondaryActionButton : null,
          ]}
          onPress={handleSkipExercise}
        >
          <IBMPlexText
            defaultWhite
            style={[
              styles.secondaryActionButtonText,
              embedded ? styles.compactSecondaryActionButtonText : null,
            ]}
          >
            Skip
          </IBMPlexText>
        </TouchableOpacity>
      </View>
    </View>
  ) : null;

  if (embedded) {
    return (
      <View style={styles.embeddedRoot}>
        {content}
        {sessionNavigationBar}
        {showExerciseStep || showAlreadyCompletedExercise
          ? sessionProgressBar
          : null}
      </View>
    );
  }

  return (
    <QuestionnaireShell hideTabBar={true}>
      <View style={styles.sessionRoot}>
        {content}
        {sessionNavigationBar}
        {showExerciseStep || showAlreadyCompletedExercise
          ? sessionProgressBar
          : null}
      </View>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  sessionRoot: {
    flex: 1,
    minHeight: 0,
  },
  sessionScroll: {
    flex: 1,
  },
  embeddedRoot: {
    flex: 1,
    minHeight: 0,
  },
  embeddedSessionScroll: {
    backgroundColor: "#000",
  },
  sessionProgressLineTrack: {
    height: 2,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 30,
  },
  sessionProgressLineFill: {
    backgroundColor: "rgba(255, 255, 255, 0.86)",
    height: "100%",
  },
  center: {
    flexGrow: 1,
    padding: SESSION_HORIZONTAL_PADDING,
    paddingBottom: 48,
    gap: 18,
  },
  centerWithSessionNavigation: {
    paddingBottom: 118,
  },
  embeddedCenter: {
    gap: 12,
    paddingHorizontal: 2,
    paddingTop: 0,
    paddingBottom: 12,
  },
  sessionContentTransition: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  compactHeader: {
    marginTop: 0,
    minHeight: 34,
  },
  backButton: {
    flexShrink: 0,
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactBackButton: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  backButtonIcon: {
    color: "#fff",
    fontSize: 24, fontWeight: "700",
    lineHeight: 24,
  },
  compactBackButtonIcon: {
    fontSize: 20,
    lineHeight: 20,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17, fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  compactHeaderTitle: {
    fontSize: 15,
    lineHeight: 18,
  },
  headerTrailingActions: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 0,
    gap: 2,
  },
  headerActionSpacer: {
    height: 36,
    width: 48,
  },
  compactHeaderActionSpacer: {
    height: 30,
    width: 36,
  },
  headerHelpButton: {
    width: 48,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  compactHeaderHelpButton: {
    height: 30,
    width: 36,
  },
  headerHelpIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
  compactHeaderHelpIcon: {
    fontSize: 16,
    lineHeight: 18,
  },
  resultsBlock: {
    gap: 18,
    paddingTop: 8,
    paddingBottom: 18,
  },
  resultsFadeIn: {
    alignSelf: "stretch",
    flex: 1,
  },
  resultsScroller: {
    alignSelf: "stretch",
    flex: 1,
  },
  resultsSection: {
    gap: 10,
  },
  resultsSectionTitle: {
    color: "#9ca3af",
    fontSize: 12, fontWeight: "800",
    lineHeight: 15,
    textTransform: "uppercase",
  },
  resultsExerciseList: {
    gap: 10,
  },
  resultsExerciseRow: {
    alignItems: "stretch",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    justifyContent: "space-between",
    minHeight: 150,
    padding: 17,
    position: "relative",
  },
  resultsExerciseMain: {
    flex: 1,
    gap: 6,
    minWidth: 0,
    paddingRight: 82,
  },
  resultsExerciseName: {
    color: "#fff",
    fontSize: 15, fontWeight: "700",
    lineHeight: 18,
  },
  resultsExercisePrescription: {
    color: "#C9B259",
    fontSize: 14,
    lineHeight: 17,
  },
  resultsReportedText: {
    color: "#fff",
    fontSize: 12, fontWeight: "700",
    lineHeight: 15,
    paddingTop: 2,
  },
  resultsExerciseDetails: {
    color: "#d1d5db",
    fontSize: 10, fontWeight: "700",
    lineHeight: 12,
  },
  resultsExercisePrimary: {
    color: "#fff",
    fontSize: 17, fontWeight: "700",
    lineHeight: 20,
  },
  resultsExerciseProgressRing: {
    alignItems: "center",
    height: EXERCISE_RESULT_RING_SIZE,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: EXERCISE_RESULT_RING_SIZE,
  },
  resultsExerciseProgressRingContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  resultsExerciseProgressRingText: {
    color: "#fff",
    fontSize: 12, fontWeight: "800",
    lineHeight: 14,
    textAlign: "center",
  },
  resultsExerciseForumButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 999,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 86,
    width: 65,
  },
  resultsExerciseForumText: {
    color: "#000",
    fontSize: 13, fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  exerciseCard: {
    flex: 1,
    gap: 14,
    paddingVertical: 10,
  },
  activeExercisePlanCard: {
    alignItems: "center",
    alignSelf: "stretch",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  compactActiveExercisePlanCard: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  activeExerciseTargetsTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
    marginBottom: 6,
    textAlign: "center",
  },
  activeExerciseMetricsRow: {
    gap: 2,
    width: "100%",
  },
  activeExerciseMetricColumn: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  activeExerciseMetricLabel: {
    color: "#8B8B94",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  activeExerciseMetricValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 18,
    maxWidth: "64%",
    textAlign: "right",
  },
  programMaxIntensityMetric: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 15,
    textAlign: "center",
  },
  programMaxIntensityChip: {
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderColor: "#34343A",
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 1,
    marginLeft: 16,
    maxWidth: "72%",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  newProgramMaxBanner: {
    alignItems: "center",
    backgroundColor: "rgba(35, 115, 62, 0.2)",
    borderColor: "#4BA96A",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "100%",
  },
  newProgramMaxIcon: {
    color: "#70D78F",
    fontSize: 20,
    fontWeight: "800",
    marginRight: 11,
  },
  newProgramMaxCopy: {
    flex: 1,
  },
  newProgramMaxTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  newProgramMaxDescription: {
    color: "#B7DCC1",
    fontSize: 12,
    marginTop: 2,
  },
  compactExerciseCard: {
    gap: 9,
    paddingVertical: 4,
  },
  workingSetsNote: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  compactWorkingSetsNote: {
    fontSize: 11,
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  bottomControls: {
    marginTop: "auto",
    gap: 8,
  },
  compactBottomControls: {
    gap: 4,
  },
  sessionSetSection: {
    alignSelf: "stretch",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    overflow: "hidden",
    padding: 10,
  },
  sessionSetSectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  sessionSetSectionIcon: {
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderColor: "#34343A",
    borderRadius: 9,
    borderWidth: 1,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  sessionSetSectionHeadingCopy: {
    gap: 2,
  },
  sessionSetSectionEyebrow: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
  },
  sessionSetCompletionText: {
    color: "#8B8B94",
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 12,
  },
  sessionSetOverviewViewport: {
    minHeight: 60,
    overflow: "hidden",
  },
  sessionSetOverviewRow: {
    alignItems: "center",
    gap: SET_OVERVIEW_ITEM_GAP,
    minWidth: "100%",
  },
  sessionSetOverviewItem: {
    alignItems: "center",
    backgroundColor: "#0A0A0A",
    borderColor: "#2A2A2A",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 7,
    width: 96,
  },
  sessionSetOverviewItemActive: {
    backgroundColor: "#181818",
    borderColor: "#34343A",
    borderRadius: 12,
    borderWidth: 1,
  },
  sessionSetOverviewItemHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
  },
  sessionSetOverviewItemTitle: {
    color: "#D4D4D8",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  sessionSetOverviewItemTitleActive: {
    color: "#FFFFFF",
  },
  sessionSetOverviewItemSummary: {
    color: "#8B8B94",
    fontSize: 9,
    fontWeight: "400",
    lineHeight: 12,
    textAlign: "center",
  },
  alreadyCompletedCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
    paddingVertical: 42,
  },
  alreadyCompletedBadge: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 82,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#C9B259",
    paddingHorizontal: 16,
  },
  alreadyCompletedBadgeText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  alreadyCompletedCopy: {
    alignItems: "center",
    gap: 10,
    maxWidth: 320,
  },
  alreadyCompletedTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    textAlign: "center",
  },
  alreadyCompletedExercise: {
    color: "#C9B259",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 21,
    textAlign: "center",
  },
  alreadyCompletedBody: {
    color: "#d4d4d8",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    textAlign: "center",
  },
  alreadyCompletedActions: {
    alignSelf: "stretch",
    gap: 10,
    alignItems: "center",
  },
  alreadyCompletedContinueButton: {
    flex: 0,
    width: "100%",
    maxWidth: 320,
  },
  retryCompletedButton: {
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  retryCompletedText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    width: "100%",
  },
  compactNavigationRow: {
    gap: 7,
  },
  floatingSessionNavigation: {
    bottom: 12,
    left: 12,
    padding: 8,
    position: "absolute",
    right: 12,
    zIndex: 40,
  },
  compactFloatingSessionNavigation: {
    bottom: 6,
    left: 4,
    padding: 6,
    right: 4,
  },
  floatingNavigationRow: {
    paddingTop: 0,
  },
  secondaryActionButton: {
    height: 44,
    minWidth: 70,
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "#585858",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 14,
  },
  compactSecondaryActionButton: {
    height: 38,
    minWidth: 58,
    paddingHorizontal: 10,
  },
  secondaryActionButtonDisabled: {
    opacity: 0.45,
  },
  secondaryActionButtonText: {
    color: "#fff",
    fontSize: 13, fontWeight: "700",
  },
  compactSecondaryActionButtonText: {
    fontSize: 12,
    lineHeight: 15,
  },
  stepActionButton: {
    flex: 1,
    minWidth: 112,
    maxWidth: 172,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  compactStepActionButton: {
    height: 38,
    minWidth: 96,
    maxWidth: 150,
    paddingHorizontal: 12,
  },
  nextButton: {
    flex: 1,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
    backgroundColor: "#fff",
  },
  nextButtonText: {
    color: "#000",
    fontSize: 17, fontWeight: "700",
  },
  compactNextButtonText: {
    fontSize: 14,
    lineHeight: 17,
  },
  emptyState: {
    gap: 14,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#5A5A5A",
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 18, fontWeight: "700",
  },
});
