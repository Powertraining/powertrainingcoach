import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PlanSetTabs from "../components/planComponents/PlanSetTabs.jsx";
import StandardText from "../components/textComponents/StandardText.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import {
  getExercisePerformanceTarget,
  getExercisePercentagePrescription,
  getExerciseStrengthAssessment,
  normalizeExercise,
} from "../services/utils/trainingPlan.js";
import { getStrengthAssessmentRequirements, resolveStrengthAssessmentReferenceOneRepMaxKg } from "../services/utils/strengthAssessment.js";
import { calculateTargetLoadFromPercentOneRepMax } from "../services/utils/percentagePrescription.js";

const NEXT_INPUT_KEYBOARD_GAP = 36;

function getExerciseDisplayName(exercise = {}) {
  return String(exercise.name || "").replace(/^\s*\d+[a-z]?\.\s*/i, "");
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

  if (strengthAssessment) {
    return {
      performanceTarget,
      strengthAssessment,
      strengthRequirements,
      showInputs: true,
      showLoad: true,
      showReps: Boolean(strengthRequirements?.requiresReps),
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
      showRpe: performanceTarget.strategy === "fixed_rpe",
      customFields,
    };
  }

  return {
    performanceTarget: null,
    strengthAssessment: null,
    strengthRequirements: null,
    showInputs: false,
    showLoad: false,
    showReps: false,
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
  onSkip,
  onDraftChange,
}) {
  const focusedScrollTargetKeyRef = useRef(null);
  const inputFieldLayoutsRef = useRef({});
  const inputPanelLayoutRef = useRef(null);
  const inputPanelAnchorRef = useRef(null);
  const inputPanelTranslateY = useRef(new Animated.Value(0)).current;
  const inputRowYRef = useRef(0);
  const keyboardTopRef = useRef(null);
  const {
    performanceTarget,
    strengthAssessment,
    strengthRequirements,
    showInputs,
    showLoad,
    showReps,
    showRpe,
    customFields,
  } = getSetLoggingConfig(exercise);
  const inputDraft = draft || {
    exerciseIndex,
    setIndex,
    loadKg: "",
    reps: "",
    rpe: "",
    customValues: {},
  };
  const exercisePrescription = getExercisePrescriptionDisplay(exercise);
  const recommendation = getExerciseRecommendationDisplay(exercise);
  const exerciseWeight = recommendation.primary || (inputDraft.loadKg ? `${inputDraft.loadKg}kg` : "");
  const hasRecommendationDetails = Boolean(recommendation.details);
  const inputKeys = [
    showLoad ? "loadKg" : null,
    showReps ? "reps" : null,
    showRpe ? "rpe" : null,
    ...customFields.map((field) => field.id),
  ].filter(Boolean);

  function handleInputFocus(inputKey) {
    const inputIndex = inputKeys.indexOf(inputKey);
    focusedScrollTargetKeyRef.current = inputKeys[inputIndex + 1] || inputKey;

    setTimeout(updateInputPanelShift, 80);
  }

  function handleInputFieldLayout(inputKey, event) {
    inputFieldLayoutsRef.current[inputKey] = event.nativeEvent.layout;
  }

  function handleInputPanelLayout(event) {
    inputPanelLayoutRef.current = event.nativeEvent.layout;
  }

  function animateInputPanelShift(nextShift) {
    Animated.timing(inputPanelTranslateY, {
      duration: 180,
      toValue: -nextShift,
      useNativeDriver: true,
    }).start();
  }

  function updateInputPanelShift() {
    const keyboardTop = keyboardTopRef.current;
    const targetKey = focusedScrollTargetKeyRef.current;
    const targetLayout = targetKey ? inputFieldLayoutsRef.current[targetKey] : null;
    const inputPanelLayout = inputPanelLayoutRef.current;
    const inputPanelAnchor = inputPanelAnchorRef.current;

    if (
      keyboardTop == null ||
      !targetLayout ||
      !inputPanelLayout ||
      !inputPanelAnchor?.measureInWindow
    ) {
      return;
    }

    inputPanelAnchor.measureInWindow((x, y) => {
      const inputPanelBottom = y + inputPanelLayout.height;
      const targetBottomInPanel =
        inputRowYRef.current + targetLayout.y + targetLayout.height;
      const distanceFromPanelBottomToTargetBottom =
        inputPanelLayout.height - targetBottomInPanel;
      const nextShift = Math.max(
        inputPanelBottom +
          NEXT_INPUT_KEYBOARD_GAP -
          keyboardTop -
          distanceFromPanelBottomToTargetBottom,
        0
      );

      animateInputPanelShift(nextShift);
    });
  }

  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(keyboardShowEvent, (event) => {
      const keyboardCoordinates = event.endCoordinates;
      keyboardTopRef.current =
        keyboardCoordinates?.screenY ??
        (keyboardCoordinates?.height
          ? Dimensions.get("window").height - keyboardCoordinates.height
          : null);
      setTimeout(updateInputPanelShift, 40);
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      TextInput.State?.currentlyFocusedInput?.()?.blur?.();
      keyboardTopRef.current = null;
      focusedScrollTargetKeyRef.current = null;
      animateInputPanelShift(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseSummaryRow}>
        <View
          style={[
            styles.exerciseInfoCard,
            !hasRecommendationDetails && styles.exerciseInfoCardCentered,
          ]}
        >
          <View style={styles.exerciseInfoMainText}>
            {exercisePrescription ? (
              <Text style={styles.exercisePrescription}>{exercisePrescription}</Text>
            ) : null}
            {exerciseWeight ? (
              <Text style={styles.exerciseWeight}>{exerciseWeight}</Text>
            ) : null}
          </View>
          {hasRecommendationDetails ? (
            <View style={styles.exerciseMetaRow}>
              <Text style={styles.exerciseIntensityDetails}>{recommendation.details}</Text>
            </View>
          ) : null}
        </View>

        {exercise.notes ? (
          <Text style={styles.exerciseNotes}>
            {exercise.notes}
          </Text>
        ) : null}
      </View>

      <View style={styles.setTabsBlock}>
        <PlanSetTabs
          prescribedSets={prescribedSets}
          activeSetIndex={setIndex}
          completedSetIndexes={completedSetIndexes}
          onSelectSet={onSelectSet}
        />
      </View>

      {showInputs || customFields.length > 0 ? (
        <View
          ref={inputPanelAnchorRef}
          collapsable={false}
          style={styles.inputPanelAnchor}
        >
          <Animated.View
            style={[
              styles.inputPanel,
              { transform: [{ translateY: inputPanelTranslateY }] },
            ]}
            onLayout={handleInputPanelLayout}
          >
            <View
              style={styles.inputRow}
              onLayout={(event) => {
                inputRowYRef.current = event.nativeEvent.layout.y;
              }}
            >
              {showLoad ? (
                <View
                  style={styles.inputField}
                  onLayout={(event) => handleInputFieldLayout("loadKg", event)}
                >
                  <Text style={styles.inputLabel}>
                    {strengthRequirements?.loadLabel || "Load used (kg)"}
                  </Text>
                  <TextInput
                    value={inputDraft.loadKg}
                    onChangeText={(value) => onDraftChange(exerciseIndex, setIndex, "loadKg", value)}
                    onFocus={() => handleInputFocus("loadKg")}
                    keyboardType="decimal-pad"
                    placeholder="e.g. 150"
                    placeholderTextColor="#A1A1AA"
                    style={styles.input}
                  />
                </View>
              ) : null}

              {showReps ? (
                <View
                  style={styles.inputField}
                  onLayout={(event) => handleInputFieldLayout("reps", event)}
                >
                  <Text style={styles.inputLabel}>
                    {strengthRequirements?.repsLabel || "Reps completed"}
                  </Text>
                  <TextInput
                    value={inputDraft.reps}
                    onChangeText={(value) => onDraftChange(exerciseIndex, setIndex, "reps", value)}
                    onFocus={() => handleInputFocus("reps")}
                    keyboardType="number-pad"
                    placeholder={strengthAssessment ? "2-5" : "e.g. 8"}
                    placeholderTextColor="#A1A1AA"
                    style={styles.input}
                  />
                </View>
              ) : null}

              {showRpe ? (
                <View
                  style={styles.inputField}
                  onLayout={(event) => handleInputFieldLayout("rpe", event)}
                >
                  <Text style={styles.inputLabel}>
                    {strengthRequirements?.rpeLabel || "RPE"}
                  </Text>
                  <TextInput
                    value={inputDraft.rpe}
                    onChangeText={(value) => onDraftChange(exerciseIndex, setIndex, "rpe", value)}
                    onFocus={() => handleInputFocus("rpe")}
                    keyboardType="decimal-pad"
                    placeholder="8-9"
                    placeholderTextColor="#A1A1AA"
                    style={styles.input}
                  />
                </View>
              ) : null}

              {customFields.map((field) => (
                <View
                  key={field.id}
                  style={styles.inputField}
                  onLayout={(event) => handleInputFieldLayout(field.id, event)}
                >
                  <Text style={styles.inputLabel}>{field.label}</Text>
                  <TextInput
                    value={inputDraft.customValues?.[field.id] || ""}
                    onChangeText={(value) => onDraftChange(exerciseIndex, setIndex, field.id, value, true)}
                    onFocus={() => handleInputFocus(field.id)}
                    keyboardType={field.keyboardType}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    placeholderTextColor="#A1A1AA"
                    style={styles.input}
                  />
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      ) : null}

      <View style={styles.footerActions}>
        <View style={styles.navigationRow}>
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <StandardText style={styles.skipButtonText}>Skip</StandardText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stepActionButton} onPress={onNext}>
            <StandardText style={styles.nextButtonText}>Finish set</StandardText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function ActiveSessionView({
  day,
  exercises = [],
  initialPerformanceResults = [],
  initialAssessmentResults = [],
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
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(() =>
    getSavedNumber(initialSessionProgress?.activeExerciseIndex)
  );
  const [activeSetIndex, setActiveSetIndex] = useState(() =>
    getSavedNumber(initialSessionProgress?.activeSetIndex)
  );
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
  const sessionSteps = useMemo(
    () =>
      normalizedExercises.flatMap((exercise, exerciseIndex) =>
        Array.from({ length: parsePrescribedSetCount(exercise) }).map((_, setIndex) => ({
          exercise,
          exerciseIndex,
          setIndex,
          setCount: parsePrescribedSetCount(exercise),
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
  const isLastStep = resolvedActiveStepIndex >= sessionSteps.length - 1;
  const activeExerciseSetTabs = activeExercise
    ? Array.from({ length: activeStep.setCount }).map((_, setIndex) => ({
        setIndex,
      }))
    : [];

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
      goToStep(resolvedActiveStepIndex + 1);
      return;
    }

    onFinish?.(getTrackedResultsFromDrafts(trackingDrafts));
  }

  function handleSkipExercise() {
    if (!activeStep) {
      return;
    }

    const nextExerciseStepIndex = sessionSteps.findIndex(
      (step) => step.exerciseIndex > activeStep.exerciseIndex
    );

    if (nextExerciseStepIndex >= 0) {
      goToStep(nextExerciseStepIndex);
      return;
    }

    onFinish?.(getTrackedResultsFromDrafts(trackingDrafts));
  }

  return (
    <QuestionnaireShell hideTabBar={true}>
      <ScrollView
        contentContainerStyle={styles.center}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        style={styles.sessionScroll}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleExitSession}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backButtonIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            {activeExercise ? (
              <Text style={styles.headerTitle} numberOfLines={1}>
                {getExerciseDisplayName(activeExercise)}
              </Text>
            ) : null}
          </View>
          {activeStep ? (
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {activeStep.exerciseIndex + 1} of {normalizedExercises.length}
              </Text>
            </View>
          ) : null}
        </View>

        {activeExercise ? (
          <ExerciseSessionStep
            key={`${activeExercise.name}-${activeStep.exerciseIndex}-${activeStep.setIndex}`}
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
            }}
            onNext={handleCompleteCurrentSet}
            onSkip={handleSkipExercise}
            onDraftChange={updateTrackingDraft}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No exercises in this session.</Text>
            <TouchableOpacity style={styles.nextButton} onPress={onBack}>
              <StandardText style={styles.nextButtonText}>Back</StandardText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  sessionScroll: {
    flex: 1,
  },
  center: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
    gap: 18,
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
    fontSize: 24,
    fontWeight: "700",
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
    fontSize: 17,
    fontWeight: "700",
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
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  exerciseCard: {
    flex: 1,
    gap: 12,
    paddingVertical: 16,
  },
  exerciseSummaryRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  exerciseInfoCard: {
    width: 98,
    height: 118,
    paddingHorizontal: 14,
    paddingVertical: 18,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#1E1E1E",
    backgroundColor: "#101010",
    justifyContent: "space-between",
  },
  exerciseInfoCardCentered: {
    justifyContent: "center",
  },
  exerciseInfoMainText: {
    gap: 4,
  },
  exercisePrescription: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 17,
  },
  exerciseWeight: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  exerciseIntensityDetails: {
    color: "#C9B259",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 11,
  },
  exerciseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  exerciseNotes: {
    flex: 1,
    color: "#d1d5db",
    fontSize: 13,
    lineHeight: 18,
    alignSelf: "center",
  },
  setTabsBlock: {
    marginTop: 30,
  },
  inputPanelAnchor: {
    marginTop: 30,
  },
  inputPanel: {
    gap: 10,
    padding: 14,
    borderRadius: 15,
    backgroundColor: "#101010",
  },
  inputRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  inputField: {
    flexGrow: 1,
    minWidth: 140,
    gap: 5,
  },
  inputLabel: {
    color: "#D4D4D8",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    minHeight: 42,
    borderRadius: 6,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#fff",
  },
  footerActions: {
    marginTop: "auto",
    gap: 8,
    alignItems: "center",
  },
  navigationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
  },
  skipButton: {
    height: 44,
    minWidth: 74,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "#585858",
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 14,
  },
  skipButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  stepActionButton: {
    width: "49%",
    maxWidth: 198,
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
    fontSize: 17,
    fontWeight: "700",
  },
  emptyState: {
    gap: 14,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "#5A5A5A",
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
