import {
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import { useRouter } from "expo-router";
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
import PlanSetTabs from "../components/planComponents/PlanSetTabs.jsx";
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
  getStrengthAssessmentLiftKey,
  getStrengthAssessmentReferenceOneRepMaxKg,
  getStrengthAssessmentRequirements,
  resolveStrengthAssessmentReferenceOneRepMaxKg,
} from "../services/utils/strengthAssessment.js";
import { calculateTargetLoadFromPercentOneRepMax } from "../services/utils/percentagePrescription.js";
import { parseRpeFromText } from "../services/utils/trainingPerformance.js";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
const HEADER_PROGRESS_ANIMATION_DURATION_MS = 220;
const HEADER_PROGRESS_POST_ANIMATION_BUFFER_MS = 30;
const SESSION_CONTENT_SLIDE_DURATION_MS = 220;
const SESSION_EXERCISE_ADVANCE_DELAY_MS =
  HEADER_PROGRESS_ANIMATION_DURATION_MS + HEADER_PROGRESS_POST_ANIMATION_BUFFER_MS;
const RESULTS_FADE_IN_DURATION_MS = 120;
const RESULTS_FADE_IN_TRANSLATE_Y = 10;
const SESSION_HORIZONTAL_PADDING = 24;
const EXERCISE_RESULT_RING_SIZE = 65;
const EXERCISE_RESULT_RING_CENTER = EXERCISE_RESULT_RING_SIZE / 2;
const EXERCISE_RESULT_RING_RADIUS = 26;
const EXERCISE_RESULT_RING_STROKE = 5;
const EXERCISE_RESULT_RING_CIRCUMFERENCE =
  2 * Math.PI * EXERCISE_RESULT_RING_RADIUS;
const SESSION_SCREEN_MODES = Object.freeze({
  SECTION_INTRO: "sectionIntro",
  EXERCISE: "exercise",
  SESSION_COMPLETE: "sessionComplete",
});
const EXERCISE_SECTION_LABELS = Object.freeze({
  power: "Power",
  compound: "Compound",
  primary_pull: "Primary pull",
  core: "Core",
  accessory: "Accessory",
});

function getExerciseDisplayName(exercise = {}) {
  return String(exercise.name || "").replace(/^\s*\d+[a-z]?\.\s*/i, "");
}

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
  const parsedValue = Number.parseInt(exercise?.sets, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return Math.min(parsedValue, 12);
}

function getDraftKey(exerciseIndex, setIndex = 0) {
  return `${exerciseIndex}:${setIndex}`;
}

function getStepKey(exerciseIndex, setIndex = 0) {
  return `${exerciseIndex}:${setIndex}`;
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
  const sets = String(exercise.sets || "").trim();
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

function formatCompactKg(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return `${Math.round(value * 10) / 10}kg`;
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

function getEstimatedLoadFromNotesPercent(exercise = {}, strengthReferenceOneRepMaxByLift = {}) {
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

    return endLoad ? `${formatCompactKg(startLoad)}-${formatCompactKg(endLoad)}` : formatCompactKg(startLoad);
  }

  return formatCompactKg(startLoad);
}

function getExerciseRecommendationDisplay(exercise = {}, strengthReferenceOneRepMaxByLift = {}) {
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
    const detailParts = [
      primaryWorkingSet.percent1RM ? `${primaryWorkingSet.percent1RM}% 1RM` : "",
      primaryWorkingSet.relativeIntensity ? `RI ${primaryWorkingSet.relativeIntensity}%` : "",
      notesDetails,
    ].filter(Boolean);

    return {
      primary: estimatedLoadKg ? formatCompactNumberUnit(estimatedLoadKg, "kg") : "",
      details: detailParts.join(" * "),
    };
  }

  return {
    primary:
      getExplicitLoadOrSpeedValue(exercise) ||
      getEstimatedLoadFromNotesPercent(exercise, strengthReferenceOneRepMaxByLift),
    details: notesDetails,
  };
}

function getRecommendedLoadKg(
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

function getRecommendedRepCount(exercise = {}, setIndex = 0) {
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

function ActiveSessionHeader({
  title = "",
  progressText = "",
  showHelp = false,
  onHelp,
  onBack,
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <IBMPlexText style={styles.backButtonIcon}>←</IBMPlexText>
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        {title ? (
          <IBMPlexText style={styles.headerTitle} numberOfLines={1}>
            {title}
          </IBMPlexText>
        ) : null}
      </View>
      {showHelp ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Show exercise guidance"
          activeOpacity={0.7}
          style={styles.headerHelpButton}
          onPress={onHelp}
        >
          <IBMPlexText style={styles.headerHelpIcon}>?</IBMPlexText>
        </TouchableOpacity>
      ) : progressText ? (
        <View style={styles.progressRow}>
          <IBMPlexText style={styles.progressText}>{progressText}</IBMPlexText>
        </View>
      ) : null}
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

function getReportedResultSummaryForExercise(trackingDrafts = {}, exerciseIndex = 0) {
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
    parts.push(`${averageLoadKg} kg`);
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
    } else if (fieldValues.length === 1) {
      parts.push(`${fieldId.replace(/_/g, " ")} ${fieldValues[0]}`);
    }
  });

  return parts.join(" · ");
}

function ActiveSessionResultsList({
  sectionRuns = [],
  completedStepKeys,
  trackingDrafts = {},
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
              const recommendation = getExerciseRecommendationDisplay(exercise);
              const prescription = getExercisePrescriptionDisplay(exercise);
              const totalSetCount = parsePrescribedSetCount(exercise);
              const completedSetCount = Array.from({ length: totalSetCount }).filter(
                (_, setIndex) => completedSteps.has(getStepKey(exerciseIndex, setIndex))
              ).length;
              const reportedResultSummary = getReportedResultSummaryForExercise(
                trackingDrafts,
                exerciseIndex
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

function getSetLoggingConfig(exercise = {}) {
  const performanceTarget = getExercisePerformanceTarget(exercise);
  const strengthAssessment = getExerciseStrengthAssessment(exercise);
  const strengthRequirements = strengthAssessment
    ? getStrengthAssessmentRequirements(strengthAssessment.method)
    : null;
  const explicitCustomFields = getExerciseLoggingFieldSource(exercise)
    .map((field, fieldIndex) => normalizeCustomLoggingField(field, fieldIndex))
    .filter(Boolean);
  const inferredCustomFields =
    explicitCustomFields.length > 0 ? [] : inferCustomLoggingFields(exercise);
  const customFields = [...explicitCustomFields, ...inferredCustomFields];
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
  onSelectSet,
  onNext,
  onPrevious,
  onSkip,
  onDraftChange,
  canGoPrevious = false,
  strengthReferenceOneRepMaxByLift,
}) {
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
  const exercisePrescription = getExercisePrescriptionDisplay(exercise);
  const exerciseRecommendation = getExerciseRecommendationDisplay(
    exercise,
    strengthReferenceOneRepMaxByLift
  );
  const recommendedLoadKg = getRecommendedLoadKg(
    exercise,
    setIndex,
    strengthReferenceOneRepMaxByLift
  );
  const displayedTargetRpe = performanceTarget?.targetRpe || parseRpeFromText(exercise?.notes);
  const performanceTargetRpe = displayedTargetRpe
    ? `RPE ${displayedTargetRpe}`
    : "";
  const exerciseRecommendationDetails = String(exerciseRecommendation.details || "")
    .split(/\s*\*\s*/)
    .filter((detail) => !performanceTargetRpe || !/^RPE\b/i.test(detail));
  const endurancePrescription = exercise?.endurancePrescription || {};
  const exerciseRecommendationMetrics = Array.from(
    new Set(
      [
        exercisePrescription,
        exerciseRecommendation.primary,
        ...exerciseRecommendationDetails,
        performanceTargetRpe,
        endurancePrescription.work,
        endurancePrescription.durationMinutes
          ? `${endurancePrescription.durationMinutes} min total`
          : "",
        endurancePrescription.rounds
          ? `${endurancePrescription.rounds} rounds`
          : "",
        endurancePrescription.rest
          ? `Rest ${endurancePrescription.rest}`
          : "",
      ].filter(Boolean)
    )
  );
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.setTabsBlock}>
        <PlanSetTabs
          prescribedSets={prescribedSets}
          activeSetIndex={setIndex}
          completedSetIndexes={completedSetIndexes}
          onSelectSet={onSelectSet}
        />
      </View>

      {exerciseRecommendationMetrics.length > 0 ? (
        <View style={styles.exerciseMetricsRow}>
          {exerciseRecommendationMetrics.map((metric) => (
            <IBMPlexText key={metric} style={styles.exerciseMetricLabel}>
              {metric}
            </IBMPlexText>
          ))}
        </View>
      ) : null}

      {showRpe ? (
        <IBMPlexText style={styles.workingSetsNote}>
          Do not include warm-up sets.
        </IBMPlexText>
      ) : null}

      <View style={styles.bottomControls}>
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
            onDraftChange={onDraftChange}
          />
        ) : null}

        <View style={styles.footerActions}>
          <View style={styles.navigationRow}>
            <TouchableOpacity
              accessibilityState={{ disabled: !canGoPrevious }}
              disabled={!canGoPrevious}
              style={[
                styles.secondaryActionButton,
                !canGoPrevious ? styles.secondaryActionButtonDisabled : null,
              ]}
              onPress={onPrevious}
            >
              <IBMPlexText defaultWhite style={styles.secondaryActionButtonText}>
                Previous
              </IBMPlexText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepActionButton} onPress={onNext}>
              <IBMPlexText
                defaultWhite
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={styles.nextButtonText}
              >
                Finish set
              </IBMPlexText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryActionButton} onPress={onSkip}>
              <IBMPlexText defaultWhite style={styles.secondaryActionButtonText}>Skip</IBMPlexText>
            </TouchableOpacity>
          </View>
        </View>
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
  onSessionProgressChange,
  onBack,
  onFinish,
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
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() =>
    getSavedNumber(initialSessionProgress?.activeExerciseIndex)
  );
  const [activeSetIndex, setActiveSetIndex] = useState(() =>
    getSavedNumber(initialSessionProgress?.activeSetIndex)
  );
  const [displayedCompletedExerciseCount, setDisplayedCompletedExerciseCount] =
    useState(() => getSavedNumber(initialSessionProgress?.activeExerciseIndex));
  const [
    previousDisplayedCompletedExerciseCount,
    setPreviousDisplayedCompletedExerciseCount,
  ] = useState(() => getSavedNumber(initialSessionProgress?.activeExerciseIndex));
  const [sessionScreenMode, setSessionScreenMode] = useState(
    SESSION_SCREEN_MODES.SECTION_INTRO
  );
  const [isDescriptionMenuVisible, setIsDescriptionMenuVisible] = useState(false);
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
    () =>
      normalizedExercises.flatMap((exercise, exerciseIndex) =>
        Array.from({ length: parsePrescribedSetCount(exercise) }).map((_, setIndex) => ({
          exercise,
          exerciseIndex,
          setIndex,
          setCount: parsePrescribedSetCount(exercise),
          section: getExplicitExerciseSection(exercise),
        }))
      ),
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
  const traversedExerciseCount = isSessionCompleteIntro
    ? normalizedExercises.length
    : displayedCompletedExerciseCount;
  const safeTotalExerciseCount = Number.isFinite(normalizedExercises.length)
    ? normalizedExercises.length
    : 0;
  const sessionProgressText = `${Math.min(
    traversedExerciseCount,
    safeTotalExerciseCount
  )} of ${safeTotalExerciseCount}`;
  const headerTitle = isSessionCompleteIntro
    ? "Session results"
    : showSectionIntro
      ? activeSectionLabel
      : activeExercise
        ? getExerciseDisplayName(activeExercise)
        : "";
  const headerProgressText = isSessionCompleteIntro
    ? `${safeTotalExerciseCount} of ${safeTotalExerciseCount}`
    : showSectionIntro
      ? sessionProgressText
      : activeStep
        ? sessionProgressText
        : "";
  const activeExerciseGuidance = activeExercise
    ? activeExercise.notes || "No additional guidance for this exercise."
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

  useEffect(() => {
    const fallbackDrafts = buildTrackingDrafts(
      normalizedExercises,
      initialPerformanceResults,
      initialAssessmentResults
    );

    setActiveExerciseIndex(
      getSavedNumber(initialSessionProgress?.activeExerciseIndex)
    );
    setActiveSetIndex(getSavedNumber(initialSessionProgress?.activeSetIndex));
    setDisplayedCompletedExerciseCount(
      getSavedNumber(initialSessionProgress?.activeExerciseIndex)
    );
    setPreviousDisplayedCompletedExerciseCount(
      getSavedNumber(initialSessionProgress?.activeExerciseIndex)
    );
    setSessionScreenMode(SESSION_SCREEN_MODES.SECTION_INTRO);
    setCompletedStepKeys(
      getSavedCompletedStepKeys(initialSessionProgress?.completedStepKeys)
    );
    setTrackingDrafts(
      getSavedTrackingDrafts(
        initialSessionProgress?.trackingDrafts,
        fallbackDrafts
      )
    );
  }, [day?.day, initialAssessmentResults, initialPerformanceResults, normalizedExercises]);

  useEffect(
    () => () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    },
    []
  );

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
    goToStep(stepIndex);
    setSessionScreenMode(
      showIntro ? SESSION_SCREEN_MODES.SECTION_INTRO : SESSION_SCREEN_MODES.EXERCISE
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

    setCompletedStepKeys((currentCompletedStepKeys) => {
      const nextCompletedStepKeys = new Set(currentCompletedStepKeys);
      nextCompletedStepKeys.add(
        getStepKey(activeStep.exerciseIndex, activeStep.setIndex)
      );
      return nextCompletedStepKeys;
    });

    if (!isLastStep) {
      const nextStep = sessionSteps[resolvedActiveStepIndex + 1];
      const isMovingToNextExercise =
        nextStep?.exerciseIndex !== activeStep.exerciseIndex;

      if (isMovingToNextExercise) {
        setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
        setDisplayedCompletedExerciseCount(nextStep.exerciseIndex);
        scheduleSessionStep(resolvedActiveStepIndex + 1, {
          showIntro: nextStep?.section !== activeStep.section,
        });
        return;
      }

      goToSessionStep(resolvedActiveStepIndex + 1, {
        showIntro: nextStep?.section !== activeStep.section,
      });
      return;
    }

    setPreviousDisplayedCompletedExerciseCount(displayedCompletedExerciseCount);
    setDisplayedCompletedExerciseCount(normalizedExercises.length);
    scheduleSessionComplete();
  }

  function handlePreviousSet() {
    if (!activeStep || activeStep.setIndex <= 0) {
      return;
    }

    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    const previousSetIndex = activeStep.setIndex - 1;
    const previousStepIndex = sessionSteps.findIndex(
      (step) =>
        step.exerciseIndex === activeStep.exerciseIndex &&
        step.setIndex === previousSetIndex
    );
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

  function handleContinueIntro() {
    if (isSessionCompleteIntro) {
      onFinish?.(getTrackedResultsFromDrafts(trackingDrafts), {
        completedStepKeys: Array.from(completedStepKeys),
        trackingDrafts,
      });
      return;
    }

    setSessionScreenMode(SESSION_SCREEN_MODES.EXERCISE);
  }

  return (
    <QuestionnaireShell hideTabBar={true}>
      <ScrollView
        contentContainerStyle={styles.center}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.sessionScroll}
      >
        <ActiveSessionHeader
          title={headerTitle}
          progressText={headerProgressText}
          showHelp={showExerciseStep}
          onHelp={() => setIsDescriptionMenuVisible(true)}
          onBack={handleExitSession}
        />

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
          ) : showExerciseStep ? (
            <ExerciseSessionStep
              key={`${activeExercise.name}-${activeStep.exerciseIndex}`}
              exercise={activeExercise}
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
              onSelectSet={(setIndex) => {
                setActiveExerciseIndex(activeStep.exerciseIndex);
                setActiveSetIndex(setIndex);
                setSessionScreenMode(SESSION_SCREEN_MODES.EXERCISE);
              }}
              onNext={handleCompleteCurrentSet}
              onPrevious={handlePreviousSet}
              onSkip={handleSkipExercise}
              canGoPrevious={activeStep.setIndex > 0}
              onDraftChange={updateTrackingDraft}
              strengthReferenceOneRepMaxByLift={strengthReferenceOneRepMaxByLift}
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
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  sessionScroll: {
    flex: 1,
  },
  center: {
    flexGrow: 1,
    padding: SESSION_HORIZONTAL_PADDING,
    paddingBottom: 48,
    gap: 18,
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
  backButton: {
    flexShrink: 0,
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backButtonIcon: {
    color: "#fff",
    fontSize: 24, fontWeight: "700",
    lineHeight: 24,
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
  progressRow: {
    flexShrink: 0,
    minWidth: 52,
    alignItems: "flex-end",
  },
  progressText: {
    color: "#fff",
    fontSize: 13, fontWeight: "700",
    textTransform: "uppercase",
  },
  headerHelpButton: {
    width: 48,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerHelpIcon: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
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
    gap: 16,
    paddingVertical: 16,
  },
  setTabsBlock: {
    marginTop: 16,
  },
  exerciseMetricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 20,
    rowGap: 8,
    paddingHorizontal: 8,
  },
  exerciseMetricLabel: {
    color: "#C9B259",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 21,
    textAlign: "center",
  },
  workingSetsNote: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  bottomControls: {
    marginTop: "auto",
    gap: 8,
  },
  footerActions: {
    gap: 8,
    alignItems: "center",
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    width: "100%",
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
  secondaryActionButtonDisabled: {
    opacity: 0.45,
  },
  secondaryActionButtonText: {
    color: "#fff",
    fontSize: 13, fontWeight: "700",
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
