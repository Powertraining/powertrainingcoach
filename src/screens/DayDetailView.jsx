import {
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  useWindowDimensions,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
    Circle,
    Defs,
    LinearGradient as SvgLinearGradient,
    Path,
    Stop,
} from "react-native-svg";
import WhiteBottomMenu from "../components/profileComponents/WhiteBottomMenu.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import {
    getExercisePerformanceTarget,
    getExercisePercentagePrescription,
    getExerciseStrengthAssessment,
    getExerciseSubstitutionOptions,
    getTrainingDayLabel,
    getTrainingDayPreferredWeekday,
    normalizeExercise,
} from "../services/utils/trainingPlan.js";
import {
    getExerciseDisplayName,
    getExerciseOrderLabel,
    getExerciseSupersetKey,
} from "../services/utils/exerciseSupersets.js";
import {
    getPendingProgramMaxAssessments,
    getStrengthAssessmentLiftKey,
    getStrengthAssessmentMethodLabel,
    getStrengthAssessmentRequirements,
    getStrengthAssessmentReferenceOneRepMaxKg,
    resolveStrengthAssessmentReferenceOneRepMaxKg,
} from "../services/utils/strengthAssessment.js";
import { calculateTargetLoadFromPercentOneRepMax } from "../services/utils/percentagePrescription.js";
import {
    buildMissedRepRecommendation,
    MISSED_REP_REASON_OPTIONS,
    parseRpeFromText,
} from "../services/utils/trainingPerformance.js";
import {
    getExerciseSetDisplayValue,
    getPrescribedSetCount,
} from "../services/utils/exerciseSets.js";
import { fonts } from "../theme/colors.js";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
function buildTrackingDrafts(
    exercises = [],
    initialPerformanceResults = [],
    initialAssessmentResults = []
) {
    const drafts = {};
    const normalizedPerformanceResults = Array.isArray(initialPerformanceResults)
        ? initialPerformanceResults
        : [];
    const normalizedAssessmentResults = Array.isArray(initialAssessmentResults)
        ? initialAssessmentResults
        : [];
    const allResults = [...normalizedPerformanceResults, ...normalizedAssessmentResults];

    allResults.forEach((result) => {
        if (!Number.isInteger(result?.exerciseIndex) || result.exerciseIndex < 0) {
            return;
        }

        drafts[result.exerciseIndex] = {
            exerciseIndex: result.exerciseIndex,
            loadKg: result?.loadKg != null ? String(result.loadKg) : "",
            reps: result?.reps != null ? String(result.reps) : "",
            rpe: result?.rpe != null ? String(result.rpe) : "",
            missedRep: Boolean(result?.missedRep),
            missedRepReason: result?.missedRepReason || "",
        };
    });

    exercises.forEach((exercise, exerciseIndex) => {
        const strengthAssessment = getExerciseStrengthAssessment(exercise);
        const performanceTarget = getExercisePerformanceTarget(exercise);

        if (!strengthAssessment && !performanceTarget) {
            return;
        }

        if (!drafts[exerciseIndex]) {
            drafts[exerciseIndex] = {
                exerciseIndex,
                loadKg: "",
                reps: "",
                rpe: "",
                missedRep: false,
                missedRepReason: "",
            };
        }
    });

    return drafts;
}

const CARD_HORIZONTAL_PADDING = 28;
const COMPLETED_EXERCISE_RING_SIZE = 42;
const COMPLETED_EXERCISE_RING_CENTER = COMPLETED_EXERCISE_RING_SIZE / 2;
const COMPLETED_EXERCISE_RING_RADIUS = 17;
const COMPLETED_EXERCISE_RING_STROKE = 4;
const COMPLETED_EXERCISE_RING_CIRCUMFERENCE =
    2 * Math.PI * COMPLETED_EXERCISE_RING_RADIUS;

function getExerciseSearchText(exercise = {}) {
    const safeExercise = exercise && typeof exercise === "object" ? exercise : {};

    return ` ${safeExercise.name || ""} ${safeExercise.notes || ""} ${safeExercise.reps || ""} `.toLowerCase();
}

function parsePrescribedSetCount(exercise = {}) {
    return getPrescribedSetCount(exercise);
}

function formatSwapOptionSetsLabel(value = "") {
    const normalizedValue = String(value || "").trim();

    if (!normalizedValue) {
        return "";
    }

    return /\bsets?\b/i.test(normalizedValue)
        ? normalizedValue
        : `${normalizedValue} sets`;
}

function CompletedExerciseProgressRing({ completedSetCount = 0, totalSetCount = 0 }) {
    const progressPercent =
        totalSetCount > 0
            ? Math.min(100, Math.round((completedSetCount / totalSetCount) * 100))
            : 0;
    const progressOffset =
        COMPLETED_EXERCISE_RING_CIRCUMFERENCE -
        COMPLETED_EXERCISE_RING_CIRCUMFERENCE * (progressPercent / 100);

    return (
        <View style={styles.completedExerciseProgressRing}>
            <Svg
                width={COMPLETED_EXERCISE_RING_SIZE}
                height={COMPLETED_EXERCISE_RING_SIZE}
                viewBox={`0 0 ${COMPLETED_EXERCISE_RING_SIZE} ${COMPLETED_EXERCISE_RING_SIZE}`}
            >
                <Circle
                    cx={COMPLETED_EXERCISE_RING_CENTER}
                    cy={COMPLETED_EXERCISE_RING_CENTER}
                    r={COMPLETED_EXERCISE_RING_RADIUS}
                    fill="none"
                    stroke="#3f3f46"
                    strokeWidth={COMPLETED_EXERCISE_RING_STROKE}
                />
                <Circle
                    cx={COMPLETED_EXERCISE_RING_CENTER}
                    cy={COMPLETED_EXERCISE_RING_CENTER}
                    r={COMPLETED_EXERCISE_RING_RADIUS}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={COMPLETED_EXERCISE_RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${COMPLETED_EXERCISE_RING_CIRCUMFERENCE} ${COMPLETED_EXERCISE_RING_CIRCUMFERENCE}`}
                    strokeDashoffset={progressOffset}
                    rotation="-90"
                    originX={COMPLETED_EXERCISE_RING_CENTER}
                    originY={COMPLETED_EXERCISE_RING_CENTER}
                />
            </Svg>
            <View style={styles.completedExerciseProgressRingContent}>
                <IBMPlexText style={styles.completedExerciseProgressRingText}>
                    {completedSetCount}/{totalSetCount}
                </IBMPlexText>
            </View>
        </View>
    );
}

function CompletedExerciseCheckIcon() {
    return (
        <View pointerEvents="none" style={styles.completedExerciseCheckIcon}>
            <Svg width={27} height={27} viewBox="0 0 24 24">
                <Defs>
                    <SvgLinearGradient
                        id="completedExerciseGoldCheckGradient"
                        x1="4"
                        y1="4"
                        x2="20"
                        y2="20"
                        gradientUnits="userSpaceOnUse"
                    >
                        <Stop offset="0" stopColor="#FFF2A8" />
                        <Stop offset="0.48" stopColor="#D8BD4A" />
                        <Stop offset="1" stopColor="#8F7317" />
                    </SvgLinearGradient>
                </Defs>
                <Path
                    d="M5.25 12.35 9.45 16.55 18.95 7.05"
                    fill="none"
                    stroke="url(#completedExerciseGoldCheckGradient)"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3.1}
                />
            </Svg>
        </View>
    );
}

function ExerciseCardActionIcon({ color = "#B8B8C2", size = 16 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M8 7h9m0 0-3-3m3 3-3 3M16 17H7m0 0 3 3m-3-3 3-3"
                stroke={color}
                strokeWidth={2.3}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function formatReportedResult(result = {}) {
    if (result.missedRep) {
        return result.missedRepReasonLabel || "Missed rep logged";
    }

    const parts = [];

    if (result.loadKg != null && result.loadKg !== "") {
        parts.push(`${result.loadKg} kg`);
    }

    if (result.reps != null && result.reps !== "") {
        parts.push(`${result.reps} reps`);
    }

    if (result.rpe != null && result.rpe !== "") {
        parts.push(`RPE ${result.rpe}`);
    }

    Object.entries(result.customValues || {}).forEach(([field, value]) => {
        if (value == null || value === "") {
            return;
        }

        parts.push(`${field.replace(/_/g, " ")} ${value}`);
    });

    return parts.join(" · ");
}

function buildReportedResultsByExercise(...resultGroups) {
    const resultsByExercise = new Map();

    resultGroups.flat().forEach((result) => {
        if (!Number.isInteger(result?.exerciseIndex) || result.exerciseIndex < 0) {
            return;
        }

        const formattedResult = formatReportedResult(result);

        if (!formattedResult) {
            return;
        }

        const exerciseResults = resultsByExercise.get(result.exerciseIndex) || [];
        exerciseResults.push({
            setIndex: Number.isInteger(result.setIndex) && result.setIndex >= 0
                ? result.setIndex
                : 0,
            result: formattedResult,
        });
        resultsByExercise.set(result.exerciseIndex, exerciseResults);
    });

    resultsByExercise.forEach((exerciseResults) => {
        exerciseResults.sort((left, right) => left.setIndex - right.setIndex);
    });

    return resultsByExercise;
}

function formatReportedDraft(draft = {}) {
    const parts = [];

    if (draft.loadKg) {
        parts.push(`${draft.loadKg} kg`);
    }

    if (draft.reps) {
        parts.push(`${draft.reps} reps`);
    }

    if (draft.rpe) {
        parts.push(`RPE ${draft.rpe}`);
    }

    Object.entries(draft.customValues || {}).forEach(([field, value]) => {
        if (!value) {
            return;
        }

        parts.push(`${field.replace(/_/g, " ")} ${value}`);
    });

    return parts.join(" · ");
}

function buildReportedDraftsByExercise(trackingDrafts = {}) {
    const resultsByExercise = new Map();

    Object.values(trackingDrafts || {}).forEach((draft) => {
        if (!Number.isInteger(draft?.exerciseIndex) || draft.exerciseIndex < 0) {
            return;
        }

        const formattedResult = formatReportedDraft(draft);

        if (!formattedResult) {
            return;
        }

        const exerciseResults = resultsByExercise.get(draft.exerciseIndex) || [];
        exerciseResults.push({
            setIndex: Number.isInteger(draft.setIndex) && draft.setIndex >= 0
                ? draft.setIndex
                : 0,
            result: formattedResult,
        });
        resultsByExercise.set(draft.exerciseIndex, exerciseResults);
    });

    resultsByExercise.forEach((exerciseResults) => {
        exerciseResults.sort((left, right) => left.setIndex - right.setIndex);
    });

    return resultsByExercise;
}

function normalizePrescriptionWords(value = "") {
    return String(value || "")
        .replace(/\ball[-\s]?out\b/gi, "max")
        .replace(/\bmax(?:imum)? effort\b/gi, "max")
        .replace(/\bwork\b/gi, "hard")
        .replace(/\bthreshold\b/gi, "hard")
        .replace(/\btempo\b/gi, "medium-hard")
        .replace(/\bmoderate\b/gi, "medium")
        .replace(/\brecovery\b/gi, "easy")
        .replace(/\beasy\s+(?:spin|jog|run|walk)\b/gi, "easy")
        .replace(/\s+/g, " ")
        .trim();
}

function getReadablePrescriptionLabel(label = "") {
    const normalizedLabel = normalizePrescriptionWords(label).toLowerCase();

    if (!normalizedLabel) {
        return "";
    }

    if (/\brest\b/.test(normalizedLabel)) {
        return "rest";
    }

    if (/\btransitions?\b/.test(normalizedLabel)) {
        return "transition";
    }

    if (/\b(?:easy|light|slow|walk|jog)\b/.test(normalizedLabel)) {
        return "easy";
    }

    if (/\b(?:max|sprint)\b/.test(normalizedLabel)) {
        return "max";
    }

    if (/\b(?:hard|fast)\b/.test(normalizedLabel)) {
        return normalizedLabel.includes("fast") ? "fast" : "hard";
    }

    if (/\bmedium-hard\b/.test(normalizedLabel)) {
        return "medium-hard";
    }

    if (/\bmedium\b/.test(normalizedLabel)) {
        return "medium";
    }

    return normalizedLabel;
}

function getCompactTimePrescription(value = "", exercise = {}) {
    const normalizedValue = String(value || "")
        .trim()
        .replace(/\s*\+\s*/g, " + ");
    const exerciseSearchText = getExerciseSearchText(exercise);
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

    return normalizePrescriptionWords(normalizedValue
        .replace(/\bhours?\b/gi, "h")
        .replace(/\bhrs?\b/gi, "h")
        .replace(/\bseconds?\b/gi, "sec")
        .replace(/\bsecs?\b/gi, "sec")
        .replace(/\bminutes?\b/gi, "min")
        .replace(/\bmins?\b/gi, "min")
        .replace(
            /\b(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*(sec|min|h)\b/gi,
            (_, duration, unit) => `${duration.replace(/\s*([-–])\s*/g, "$1")}${unit.toLowerCase()}`
        )
        .replace(/\b(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*s\b/gi, "$1sec")
        .replace(/\b(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)\s*m\b/gi, "$1min")
        .replace(/\s+/g, " ")
        .trim());
}

function getCompactDistancePrescription(value = "", exercise = {}) {
    const normalizedValue = String(value || "").trim();
    const exerciseSearchText = getExerciseSearchText(exercise);

    if (!/\b(?:sprint|run|shuttle|carry|walk|prowler|sled|farmer|march)\b/i.test(exerciseSearchText)) {
        return "";
    }

    return normalizedValue
        .replace(/\b(\d+(?:[.,]\d+)?)\s*m\b/gi, (_, distance) => `${distance}m`)
        .replace(/\b(\d+(?:[.,]\d+)?)\s*(?:kilometers?|kilometres?|km)\b/gi, (_, distance) => `${distance}km`)
        .replace(/\b(\d+(?:[.,]\d+)?)\s*(?:yards?|yds?|yd)\b/gi, (_, distance) => `${distance}yd`)
        .replace(/\b(\d+(?:[.,]\d+)?)\s*(?:feet|foot|ft)\b/gi, (_, distance) => `${distance}ft`)
        .replace(/\b(\d+(?:[.,]\d+)?)\s*(?:miles?|mi)\b/gi, (_, distance) => `${distance}mi`)
        .replace(/\s+/g, " ")
        .trim();
}

function formatIntervalSegment(segment = "") {
    const match = String(segment || "")
        .trim()
        .match(/^(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*(?:sec|min|h))\s+(.+)$/i);

    if (!match) {
        return "";
    }

    const duration = match[1].replace(/\s+/g, "");
    const label = getReadablePrescriptionLabel(match[2]);

    return label ? `${duration} ${label}` : "";
}

function getIntervalPrescriptionDisplay(prescription = "", sets = "") {
    const normalizedPrescription = String(prescription || "")
        .replace(/\s*\/\s*/g, " / ")
        .replace(/\s*\+\s*/g, " + ")
        .replace(/\s*,\s*/g, ", ")
        .replace(/\s+/g, " ")
        .trim();
    const intervalParts = normalizedPrescription.split(/\s+(?:\/|\+|,)\s+/);

    if (intervalParts.length !== 2) {
        return "";
    }

    const formattedParts = intervalParts.map(formatIntervalSegment);

    if (formattedParts.some((part) => !part)) {
        return "";
    }

    return /^\d+$/.test(sets)
        ? `${sets}x ${formattedParts.join(" + ")}`
        : formattedParts.join(" + ");
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

function getExercisePrescriptionDisplay(exercise = {}) {
    const safeExercise = exercise && typeof exercise === "object" ? exercise : {};
    const endurancePrescription = safeExercise.endurancePrescription || {};
    if (endurancePrescription.work || endurancePrescription.rest) {
        return [endurancePrescription.work, endurancePrescription.rest]
            .filter(Boolean)
            .join(" / ");
    }

    if (endurancePrescription.durationMinutes) {
        return `${endurancePrescription.durationMinutes} min`;
    }

    const sets = getExerciseSetDisplayValue(safeExercise);
    const reps = String(safeExercise.reps || "").trim().replace(/\s*\+\s*/g, " + ");
    const hasSimpleSetCount = /^\d+$/.test(sets);
    const formatWithSets = (prescription) =>
        hasSimpleSetCount && prescription
            ? formatPrescriptionWithSets(sets, prescription)
            : prescription;
    const compactTimePrescription = getCompactTimePrescription(reps, safeExercise);

    if (compactTimePrescription) {
        const intervalPrescription = getIntervalPrescriptionDisplay(
            compactTimePrescription,
            sets
        );

        if (intervalPrescription) {
            return intervalPrescription;
        }

        return formatWithSets(compactTimePrescription);
    }

    const compactDistancePrescription = getCompactDistancePrescription(reps, safeExercise);

    if (compactDistancePrescription) {
        return formatWithSets(compactDistancePrescription);
    }

    if (hasSimpleSetCount && reps) {
        return `${sets}x${reps}`;
    }

    return reps;
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
    const percentMatch = exerciseText.match(/\b(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*%\s*(?:1\s*rm|1rm)?\b/i);

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

function getExplicitLoadOrSpeedValue(exercise = {}) {
    const exerciseText = `${exercise.notes || ""} ${exercise.reps || ""}`;
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
    const exerciseText = `${exercise.notes || ""} ${exercise.reps || ""}`;
    const detailParts = [];
    const addDetail = (value = "") => {
        const normalizedValue = value.replace(/\s+/g, " ").trim();

        if (normalizedValue && !detailParts.includes(normalizedValue)) {
            detailParts.push(normalizedValue);
        }
    };

    exerciseText
        .match(/\b\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*%\s*(?:1\s*rm|1rm)?\b/gi)
        ?.forEach((match) => {
            const percentText = match.replace(/\s+/g, " ").trim();
            addDetail(/1\s*rm/i.test(percentText) ? percentText : `${percentText} 1RM`);
        });

    exerciseText
        .match(/\b(?:@?\s*rpe|rir)\s*\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\b/gi)
        ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").replace(/^@\s*/i, "").toUpperCase()));

    exerciseText
        .match(/\b\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*reps?\s+(?:left\s+)?in\s+reserve\b/gi)
        ?.forEach((match) => {
            const rirValue = match.match(/\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?/i)?.[0];
            addDetail(rirValue ? `RIR ${rirValue.replace(/\s+/g, "")}` : "");
        });

    exerciseText
        .match(/\bri\s*\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*%?\b/gi)
        ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").toUpperCase()));

    exerciseText
        .match(/\b(?:max\s*)?\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\s*bpm\b|\b(?:max\s*bpm|bpm)\s*\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\b/gi)
        ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").toUpperCase()));

    exerciseText
        .match(/\b(?:hr|heart rate)\s*(?:zone\s*)?\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?\b|\bzone\s*\d+\b/gi)
        ?.forEach((match) => addDetail(match.replace(/\s+/g, " ").toUpperCase()));

    exerciseText
        .match(/\b\d+\s*[-:]\s*\d+\s*[-:]\s*\d+(?:\s*[-:]\s*\d+)?\b/gi)
        ?.forEach((match) => addDetail(`Tempo ${match.replace(/\s+/g, "")}`));

    return detailParts.join(" * ");
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

function isMedicineBallExercise(exercise = {}) {
    const exerciseText = `${exercise?.name || ""} ${exercise?.notes || ""}`.toLowerCase();
    return /\bmed(?:icine)?[\s-]?ball\b/.test(exerciseText);
}

function getMedicineBallIntensity(exercise = {}) {
    if (!isMedicineBallExercise(exercise)) {
        return "";
    }

    const exerciseText = `${exercise?.notes || ""} ${exercise?.reps || ""}`;
    const kgMatch = exerciseText.match(
        /\b(\d+(?:[.,]\d+)?)(?:\s*[-–]\s*(\d+(?:[.,]\d+)?))?\s*kgs?\b/i
    );
    const startKg = kgMatch ? Number.parseFloat(kgMatch[1].replace(",", ".")) : 2;
    const endKg = kgMatch
        ? (kgMatch[2] ? Number.parseFloat(kgMatch[2].replace(",", ".")) : null)
        : 8;
    const toLb = (kg) => Math.round(kg * 2.20462);
    const formatRange = (start, end, unit) =>
        end != null ? `${start}-${end} ${unit}` : `${start} ${unit}`;

    return `${formatRange(startKg, endKg, "kg")} (${formatRange(
        toLb(startKg),
        endKg != null ? toLb(endKg) : null,
        "lb"
    )})`;
}

function isBodyweightOnlyPlyoExercise(exercise = {}) {
    const exerciseText = `${exercise?.name || ""} ${exercise?.notes || ""}`.toLowerCase();

    if (!/\b(?:jump|plyo|pogo|hop|bound)/.test(exerciseText)) {
        return false;
    }

    if (
        /\b(?:trap[\s-]?bar|loaded|weighted|dumbbell|barbell|kettlebell|kgs?|kilograms?|depth jump|drop jump|drop height)\b/.test(
            exerciseText
        )
    ) {
        return false;
    }

    return true;
}

function getCompactExerciseCardMetrics(exercise = {}, strengthReferenceOneRepMaxByLift = {}) {
    const recommendation = getExerciseRecommendationDisplay(
        exercise,
        strengthReferenceOneRepMaxByLift
    );
    const performanceTarget = getExercisePerformanceTarget(exercise);
    const endurancePrescription = exercise?.endurancePrescription || {};
    const circuitPrescription = exercise?.circuitPrescription || {};
    const heavyBagPrescription = exercise?.heavyBagPrescription || {};
    const sprintPrescription = exercise?.sprintPrescription || {};
    const recommendationDetails = String(recommendation.details || "")
        .split(/\s*\*\s*/)
        .map((detail) => detail.trim())
        .filter(Boolean);
    const displayedTargetRpe =
        performanceTarget?.targetRpe || parseRpeFromText(exercise?.notes);
    const formatRangeMidpoint = (startValue, endValue) => {
        const start = Number.parseFloat(String(startValue).replace(",", "."));
        const end = Number.parseFloat(String(endValue).replace(",", "."));

        if (!Number.isFinite(start) || !Number.isFinite(end)) {
            return "";
        }

        const midpoint = Math.round(((start + end) / 2) * 10) / 10;
        return Number.isInteger(midpoint) ? String(midpoint) : midpoint.toFixed(1);
    };
    const normalizeRpeValue = (value = "") => {
        const normalizedValue = String(value || "").replace(/\s+/g, " ").trim();
        const rangeMatch = normalizedValue.match(/^(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)$/);

        return rangeMatch
            ? formatRangeMidpoint(rangeMatch[1], rangeMatch[2]) || normalizedValue
            : normalizedValue;
    };
    const formatIntensityDisplay = (value = "") => {
        const normalizedValue = String(value || "").replace(/\s+/g, " ").trim();
        const rpeMatch = normalizedValue.match(/\brpe\s*:?@?\s*(\d+(?:[.,]\d+)?(?:\s*[-–]\s*\d+(?:[.,]\d+)?)?)/i);

        if (rpeMatch) {
            return `RPE ${normalizeRpeValue(rpeMatch[1])}`;
        }

        return normalizedValue;
    };
    const intensityFromDetails =
        recommendationDetails.find((detail) => /^(?:RPE|RIR|RI\b)/i.test(detail)) ||
        recommendationDetails.find((detail) => /%|BPM|zone/i.test(detail)) ||
        recommendationDetails[0] ||
        "";
    const medicineBallIntensity = getMedicineBallIntensity(exercise);
    const bodyweightOnlyPlyoIntensity =
        !medicineBallIntensity && isBodyweightOnlyPlyoExercise(exercise) ? "Bodyweight" : "";
    const intensity = formatIntensityDisplay(
        medicineBallIntensity ||
        bodyweightOnlyPlyoIntensity ||
        (displayedTargetRpe
            ? `RPE ${displayedTargetRpe}`
            : endurancePrescription.intensity || intensityFromDetails)
    );
    const exerciseSetCount = getExerciseSetDisplayValue(exercise);
    const sets = String(exerciseSetCount || sprintPrescription.sets || "").trim();
    const formatRepDisplay = (value = "") =>
        String(value || "")
            .trim()
            .replace(/^\s*(\d+(?:[.,]\d+)?)\s*\+\s*\1\s*$/i, "$1 / side")
            .replace(/\s*\+\s*/g, " + ");
    const reps = formatRepDisplay(
        exercise?.reps ||
        sprintPrescription.repsPerSet ||
        ""
    );
    const getDefaultPrescriptionMetric = (value = "") => {
        const normalizedValue = String(value || "").replace(/\s+/g, " ").trim();

        if (!normalizedValue) {
            return null;
        }

        if (/\b(?:sec|secs|second|seconds|min|mins|minute|minutes|hour|hours|hr|hrs)\b/i.test(normalizedValue)) {
            return { label: "Time", value: normalizedValue };
        }

        if (/\b(?:m|meter|meters|metre|metres|km|kilometer|kilometers|kilometre|kilometres|yd|yard|yards|ft|feet|mile|miles)\b/i.test(normalizedValue)) {
            return { label: "Distance", value: normalizedValue };
        }

        return { label: "Reps", value: normalizedValue };
    };
    const weight = String(recommendation.primary || "").trim();
    const hasEndurancePrescription = Object.keys(endurancePrescription).length > 0;
    const hasCircuitPrescription = Object.keys(circuitPrescription).length > 0;
    const hasHeavyBagPrescription = Object.keys(heavyBagPrescription).length > 0;
    const hasSprintPrescription = Object.keys(sprintPrescription).length > 0;
    const metrics = [];
    const formatDistanceMeters = (value) => {
        const normalizedValue = String(value || "").replace(/\s+/g, " ").trim();

        if (!normalizedValue) {
            return "";
        }

        return /[a-z]/i.test(normalizedValue) ? normalizedValue : `${normalizedValue}m`;
    };
    const addMetric = (label, value) => {
        const normalizedValue = String(value || "").replace(/\s+/g, " ").trim();

        if (!label || !normalizedValue) {
            return;
        }

        if (metrics.some((metric) => metric.label === label && metric.value === normalizedValue)) {
            return;
        }

        metrics.push({ label, value: normalizedValue });
    };

    if (hasSprintPrescription) {
        addMetric("Distance", formatDistanceMeters(sprintPrescription.distanceMeters));
        addMetric("Sets", sets);
        addMetric("Reps", reps);
        addMetric("Rest", sprintPrescription.restBetweenReps || sprintPrescription.restBetweenSets);
        addMetric("Intensity", intensity);
        return metrics.slice(0, 4);
    }

    if (hasHeavyBagPrescription) {
        addMetric("Sets", exerciseSetCount);
        addMetric("Rounds", heavyBagPrescription.rounds || endurancePrescription.rounds);
        addMetric("Time", heavyBagPrescription.roundLength);
        addMetric("Rest", heavyBagPrescription.rest || endurancePrescription.rest);
        addMetric("Intensity", intensity);
        addMetric("Focus", heavyBagPrescription.technicalFocus || heavyBagPrescription.target);
        return metrics.slice(0, 4);
    }

    if (hasCircuitPrescription) {
        addMetric("Sets", exerciseSetCount);
        addMetric("Work", circuitPrescription.workSeconds ? `${circuitPrescription.workSeconds}s` : endurancePrescription.work);
        addMetric("Rest", circuitPrescription.restSeconds ? `${circuitPrescription.restSeconds}s` : endurancePrescription.rest);
        addMetric("Rounds", circuitPrescription.rounds || endurancePrescription.rounds);
        addMetric("Stations", circuitPrescription.stationCount);
        addMetric("Intensity", intensity);
        return metrics.slice(0, 4);
    }

    if (hasEndurancePrescription) {
        addMetric("Sets", exerciseSetCount);
        addMetric("Time", endurancePrescription.durationMinutes ? `${endurancePrescription.durationMinutes} min` : "");
        addMetric("Work", endurancePrescription.work);
        addMetric("Rest", endurancePrescription.rest);
        addMetric("Rounds", endurancePrescription.rounds);
        addMetric("Intensity", intensity);
        return metrics.slice(0, 4);
    }

    addMetric("Intensity", intensity);
    addMetric("Sets", sets);
    const prescriptionMetric = getDefaultPrescriptionMetric(reps);
    addMetric(prescriptionMetric?.label, prescriptionMetric?.value);
    addMetric("Weight", weight);
    return metrics.slice(0, 4);
}

export default function DayDetailView({
    week,
    day,
    preferredWeekday,
    sessionLabel,
    status = "pending",
    rescueMode = "",
    adjustmentSummary = "",
    exercises = [],
    isSessionComplete = false,
    completedSessionProgress = null,
    initialPerformanceResults = [],
    initialAssessmentResults = [],
    strengthAssessmentSummary = null,
    questionnaire = {},
    onBack,
    onReplaceExercise,
    onFinish,
    onMissed,
    onLogExercise,
    onSwapEditorVisibilityChange,
    updatingPlan = false,
    showRescheduledNotice = true,
    exerciseListHorizontalBleed = CARD_HORIZONTAL_PADDING,
}) {
    const router = useRouter();
    const { height: windowHeight } = useWindowDimensions();
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
    const [highlightedExerciseIndex, setHighlightedExerciseIndex] = useState(null);
    const [swapExerciseIndex, setSwapExerciseIndex] = useState(null);
    const [tipsExerciseIndex, setTipsExerciseIndex] = useState(null);
    const exerciseTabAnimationsRef = useRef(new Map());
    const normalizedExercises = useMemo(
        () =>
            Array.isArray(exercises)
                ? exercises.map((exercise) => normalizeExercise(exercise))
                : [],
        [exercises]
    );
    const [trackingDrafts, setTrackingDrafts] = useState(() =>
        buildTrackingDrafts(
            normalizedExercises,
            initialPerformanceResults,
            initialAssessmentResults
        )
    );
    const activeExerciseIndex = Math.min(
        selectedExerciseIndex,
        Math.max(normalizedExercises.length - 1, 0)
    );

    useEffect(() => {
        setTrackingDrafts(
            buildTrackingDrafts(
                normalizedExercises,
                initialPerformanceResults,
                initialAssessmentResults
            )
        );
    }, [initialAssessmentResults, initialPerformanceResults, normalizedExercises]);

    const resolvedDay =
        day && typeof day === "object"
            ? day
            : { day, preferredWeekday, sessionLabel, status, rescueMode, adjustmentSummary };
    const dayLabel = getTrainingDayLabel(resolvedDay);
    const dayIdentity = `${week || ""}-${resolvedDay.day || dayLabel}`;
    const preferredWeekdayLabel = getTrainingDayPreferredWeekday(resolvedDay);
    const selectedExercise = normalizedExercises[activeExerciseIndex];
    const swapExercise = Number.isInteger(swapExerciseIndex)
        ? normalizedExercises[swapExerciseIndex]
        : null;
    const tipsExercise = Number.isInteger(tipsExerciseIndex)
        ? normalizedExercises[tipsExerciseIndex]
        : null;
    const swapExerciseOptions = swapExercise
        ? getExerciseSubstitutionOptions(swapExercise)
        : [];
    const swapExerciseReplacementOptions = swapExercise
        ? swapExerciseOptions.filter((option) => option.id !== swapExercise.selectedSubstitutionId)
        : [];
    const visibleSwapExerciseOptions =
        swapExerciseReplacementOptions.length > 0
            ? swapExerciseReplacementOptions.slice(0, 2)
            : swapExerciseOptions.slice(0, 2);
    const isSwapEditorVisible = Boolean(
        swapExercise && swapExerciseOptions.length > 1 && onReplaceExercise
    );

    useEffect(() => {
        onSwapEditorVisibilityChange?.(isSwapEditorVisible);

        return () => {
            onSwapEditorVisibilityChange?.(false);
        };
    }, [isSwapEditorVisible, onSwapEditorVisibilityChange]);

    const isSkipped = status === "skipped";
    const isRescheduled = status === "rescheduled";
    const trackedExercises = normalizedExercises
        .map((exercise, exerciseIndex) => ({
            exercise,
            exerciseIndex,
            performanceTarget: getExercisePerformanceTarget(exercise),
            strengthAssessment: getExerciseStrengthAssessment(exercise),
        }))
        .filter((item) => item.strengthAssessment || item.performanceTarget);
    const assessmentExercises = trackedExercises.filter(
        (item) => item.strengthAssessment
    );
    const pendingProgramMaxAssessmentByExerciseIndex = new Map(
        getPendingProgramMaxAssessments(
            normalizedExercises,
            strengthAssessmentSummary
        ).map((item) => [item.exerciseIndex, item])
    );
    function getExerciseTabAnimation(exerciseIndex) {
        const animations = exerciseTabAnimationsRef.current;

        if (!animations.has(exerciseIndex)) {
            animations.set(
                exerciseIndex,
                new Animated.Value(exerciseIndex === highlightedExerciseIndex ? 1 : 0)
            );
        }

        return animations.get(exerciseIndex);
    }

    useEffect(() => {
        const animations = exerciseTabAnimationsRef.current;
        const nextIndexes = new Set(normalizedExercises.map((_, exerciseIndex) => exerciseIndex));

        animations.forEach((animation, exerciseIndex) => {
            if (!nextIndexes.has(exerciseIndex)) {
                animations.delete(exerciseIndex);
            }
        });

        normalizedExercises.forEach((_, exerciseIndex) => {
            Animated.timing(getExerciseTabAnimation(exerciseIndex), {
                toValue: exerciseIndex === highlightedExerciseIndex ? 1 : 0,
                duration: 260,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start();
        });
    }, [highlightedExerciseIndex, normalizedExercises]);
    const savedAssessmentResults = new Map(
        (Array.isArray(initialAssessmentResults) ? initialAssessmentResults : [])
            .filter((result) => Number.isInteger(result?.exerciseIndex))
            .map((result) => [result.exerciseIndex, result])
    );
    const savedPerformanceResults = new Map(
        (Array.isArray(initialPerformanceResults) ? initialPerformanceResults : [])
            .filter((result) => Number.isInteger(result?.exerciseIndex))
            .map((result) => [result.exerciseIndex, result])
    );
    const reportedResultsByExercise = useMemo(
        () => {
            const savedResults = buildReportedResultsByExercise(
                Array.isArray(initialPerformanceResults) ? initialPerformanceResults : [],
                Array.isArray(initialAssessmentResults) ? initialAssessmentResults : []
            );
            const draftResults = buildReportedDraftsByExercise(
                completedSessionProgress?.trackingDrafts
            );

            draftResults.forEach((results, exerciseIndex) => {
                savedResults.set(exerciseIndex, results);
            });

            return savedResults;
        },
        [completedSessionProgress, initialAssessmentResults, initialPerformanceResults]
    );
    const completedSessionStepKeys = useMemo(
        () =>
            new Set(
                Array.isArray(completedSessionProgress?.completedStepKeys)
                    ? completedSessionProgress.completedStepKeys
                    : []
            ),
        [completedSessionProgress]
    );
    const strengthReferenceOneRepMaxByLift = useMemo(
        () =>
            (Array.isArray(strengthAssessmentSummary?.latestByLift) ?
                strengthAssessmentSummary.latestByLift :
                []
            ).reduce((accumulator, entry) => {
                const liftKey = getStrengthAssessmentLiftKey(entry?.liftName || "");
                const referenceOneRepMaxKg =
                    getStrengthAssessmentReferenceOneRepMaxKg(entry);

                if (liftKey && referenceOneRepMaxKg) {
                    accumulator[liftKey] = referenceOneRepMaxKg;
                }

                return accumulator;
            }, {}),
        [strengthAssessmentSummary]
    );
    function updateTrackingDraft(exerciseIndex, field, value) {
        setTrackingDrafts((currentDrafts) => ({
            ...currentDrafts,
            [exerciseIndex]: {
                exerciseIndex,
                ...(currentDrafts[exerciseIndex] || {}),
                [field]: value,
            },
        }));
    }

    function handleTabTouchStart(event) {
        event.stopPropagation?.();
    }

    function openSwapOptions(exerciseIndex) {
        setSelectedExerciseIndex(exerciseIndex);
        setHighlightedExerciseIndex(exerciseIndex);
        setSwapExerciseIndex(exerciseIndex);
    }

    function closeSwapOptions() {
        setSwapExerciseIndex(null);
    }

    function openTips(exerciseIndex) {
        setSelectedExerciseIndex(exerciseIndex);
        setHighlightedExerciseIndex(exerciseIndex);
        setTipsExerciseIndex(exerciseIndex);
    }

    function closeTips() {
        setTipsExerciseIndex(null);
    }

    function replaceExerciseFromOverlay(substitutionId) {
        if (!substitutionId || !Number.isInteger(swapExerciseIndex)) {
            return;
        }

        onReplaceExercise?.(swapExerciseIndex, substitutionId);
    }

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
        <QuestionnaireShell hideTabBar={!onSwapEditorVisibilityChange && isSwapEditorVisible}>
            <Modal
                visible={isSwapEditorVisible}
                transparent
                animationType="fade"
                hardwareAccelerated
                presentationStyle="overFullScreen"
                statusBarTranslucent
                onRequestClose={closeSwapOptions}
            >
                {isSwapEditorVisible ? (
                    <View style={styles.swapEditorModalRoot}>
                        <Pressable
                            onPress={closeSwapOptions}
                            style={styles.swapEditorDimLayer}
                        />
                        <View
                            pointerEvents="box-none"
                            style={[
                                styles.swapEditorLayer,
                                {
                                    minHeight: Math.max(windowHeight, 520),
                                },
                            ]}
                        >
                            <View style={styles.swapEditorTopArea}>
                                <IBMPlexText style={styles.swapCurrentLabel}>Swap exercise</IBMPlexText>
                                <View style={styles.swapCurrentExerciseCard}>
                                    <View style={styles.swapCurrentExerciseBadge}>
                                        <IBMPlexText style={styles.swapCurrentExerciseBadgeText}>
                                            Selected
                                        </IBMPlexText>
                                    </View>
                                    <IBMPlexText defaultWhite
                                        lines={2}
                                        style={styles.swapCurrentExerciseName}
                                    >
                                        {getExerciseDisplayName(swapExercise)}
                                    </IBMPlexText>
                                    <IBMPlexText defaultWhite
                                        lines={1}
                                        style={styles.swapCurrentExercisePrescription}
                                    >
                                        {getExercisePrescriptionDisplay(swapExercise)}
                                    </IBMPlexText>
                                    {swapExercise?.notes ? (
                                        <IBMPlexText
                                            numberOfLines={3}
                                            style={styles.swapCurrentExerciseDescription}
                                        >
                                            {swapExercise.notes}
                                        </IBMPlexText>
                                    ) : null}
                                </View>
                            </View>

                            <View style={styles.swapEditorBottomArea}>
                                <IBMPlexText style={styles.swapOptionsLabel}>
                                    Choose replacement
                                </IBMPlexText>
                                <View style={styles.swapOptionCards}>
                                    {visibleSwapExerciseOptions.map((option) => (
                                        <View
                                            key={option.id}
                                            style={styles.swapOptionCard}
                                        >
                                            <View style={styles.swapOptionTextBlock}>
                                                <IBMPlexText lines={2} style={styles.swapOptionName}>
                                                    {option.name}
                                                </IBMPlexText>
                                                <View style={styles.swapOptionMetricRow}>
                                                    {option.sets ? (
                                                        <View style={styles.swapOptionMetricPill}>
                                                            <IBMPlexText style={styles.swapOptionMetricText}>
                                                                {formatSwapOptionSetsLabel(option.sets)}
                                                            </IBMPlexText>
                                                        </View>
                                                    ) : null}
                                                    {option.reps ? (
                                                        <View style={styles.swapOptionMetricPill}>
                                                            <IBMPlexText style={styles.swapOptionMetricText}>
                                                                {option.reps}
                                                            </IBMPlexText>
                                                        </View>
                                                    ) : null}
                                                </View>
                                                {option.notes ? (
                                                    <IBMPlexText lines={2} style={styles.swapOptionNotes}>
                                                        {option.notes}
                                                    </IBMPlexText>
                                                ) : null}
                                            </View>
                                            <TouchableOpacity
                                                accessibilityRole="button"
                                                accessibilityLabel={`Swap to ${option.name}`}
                                                onPress={() => replaceExerciseFromOverlay(option.id)}
                                                style={styles.swapOptionAction}
                                            >
                                                <Ionicons
                                                    color="#FFFFFF"
                                                    name="swap-horizontal"
                                                    size={19}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                                <TouchableOpacity
                                    onPress={closeSwapOptions}
                                    style={styles.swapEditorCancelButton}
                                >
                                    <IBMPlexText style={styles.swapEditorCancelButtonText}>Done</IBMPlexText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ) : null}
            </Modal>
            <WhiteBottomMenu
                visible={Boolean(tipsExercise?.notes)}
                onDismiss={closeTips}
                title="Tips"
                description={tipsExercise ? getExerciseDisplayName(tipsExercise) : ""}
                buttonText="Close"
                onButtonPress={closeTips}
                contentStyle={styles.tipsSheetContent}
                sheetStyle={styles.tipsSheet}
                content={
                    <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        style={styles.tipsScroller}
                        contentContainerStyle={styles.tipsContent}
                    >
                        <IBMPlexText style={styles.tipsText}>{tipsExercise?.notes}</IBMPlexText>
                    </ScrollView>
                }
            />
            <ScrollView
                contentContainerStyle={styles.center}
            >
                <Pressable
                    style={styles.highlightDismissLayer}
                    onTouchStart={() => setHighlightedExerciseIndex(null)}
                    onPress={() => setHighlightedExerciseIndex(null)}
                />
                <Pressable
                    style={styles.card}
                    onPress={() => setHighlightedExerciseIndex(null)}
                >
                    {isSkipped ? (
                        <View style={styles.skippedStatus}>
                            <IBMPlexText style={styles.skippedStatusTitle}>Session skipped</IBMPlexText>
                            <IBMPlexText style={styles.skippedStatusText}>
                                {adjustmentSummary ||
                                    "This slot no longer counts toward the current training week."}
                            </IBMPlexText>
                            {rescueMode ? (
                                <IBMPlexText style={styles.skippedStatusMeta}>Mode: {rescueMode.replace(/_/g, " ")}</IBMPlexText>
                            ) : null}
                        </View>
                    ) : showRescheduledNotice && isRescheduled ? (
                        <View
                            style={[
                                styles.adjustmentBox,
                                styles.adjustmentBoxRescue,
                            ]}
                        >
                            <IBMPlexText style={styles.adjustmentTitle}>
                                Rescheduled session
                            </IBMPlexText>
                            <IBMPlexText style={styles.adjustmentText}>
                                {adjustmentSummary ||
                                    "This session was moved after a missed slot."}
                            </IBMPlexText>
                            {rescueMode ? (
                                <IBMPlexText style={styles.adjustmentMeta}>Mode: {rescueMode.replace(/_/g, " ")}</IBMPlexText>
                            ) : null}
                        </View>
                    ) : null}

                    {normalizedExercises.length === 0 ? null : (
                        <>
                    <View
                        style={[
                            styles.exerciseTabs,
                            { marginHorizontal: -exerciseListHorizontalBleed },
                        ]}
                    >
                        <View style={styles.tabsContainer}>
                                        {normalizedExercises.map((ex, exerciseIndex) => {
                                            const supersetKey = getExerciseSupersetKey(
                                                ex,
                                                exerciseIndex
                                            );
                                            const previousSupersetKey = exerciseIndex > 0
                                                ? getExerciseSupersetKey(
                                                    normalizedExercises[exerciseIndex - 1],
                                                    exerciseIndex - 1
                                                )
                                                : "";
                                            const nextSupersetKey = exerciseIndex < normalizedExercises.length - 1
                                                ? getExerciseSupersetKey(
                                                    normalizedExercises[exerciseIndex + 1],
                                                    exerciseIndex + 1
                                                )
                                                : "";
                                            const joinsPreviousSuperset = Boolean(
                                                supersetKey && supersetKey === previousSupersetKey
                                            );
                                            const joinsNextSuperset = Boolean(
                                                supersetKey && supersetKey === nextSupersetKey
                                            );
                                            const pendingProgramMaxAssessment =
                                                pendingProgramMaxAssessmentByExerciseIndex.get(exerciseIndex);
                                            const programMaxStatusLabel = pendingProgramMaxAssessment
                                                ? pendingProgramMaxAssessment.method === "rpe_based_1rm"
                                                    ? "Estimating your max"
                                                    : "Calibrating your max"
                                                : "";
                                            const exerciseCardMetrics = getCompactExerciseCardMetrics(
                                                ex,
                                                strengthReferenceOneRepMaxByLift
                                            ).map((metric) =>
                                                programMaxStatusLabel && metric.label === "Intensity"
                                                    ? {
                                                        ...metric,
                                                        value: [metric.value, programMaxStatusLabel]
                                                            .filter(Boolean)
                                                            .join(" · "),
                                                        isProgramMaxEstimate: true,
                                                    }
                                                    : metric
                                            );
                                            const isHighlighted =
                                                exerciseIndex === highlightedExerciseIndex;
                                            const exerciseSubstitutionOptions =
                                                getExerciseSubstitutionOptions(ex);
                                            const canSwapExercise =
                                                exerciseSubstitutionOptions.length > 1 &&
                                                onReplaceExercise;
                                            const hasExerciseTips = Boolean(ex.notes);
                                            const totalSetCount = parsePrescribedSetCount(ex);
                                            const completedSetCount =
                                                completedSessionStepKeys.size > 0
                                                    ? Array.from({ length: totalSetCount }).filter((_, setIndex) =>
                                                        completedSessionStepKeys.has(`${exerciseIndex}:${setIndex}`)
                                                    ).length
                                                    : isSessionComplete
                                                        ? totalSetCount
                                                        : 0;
                                            const isExerciseComplete =
                                                isSessionComplete ||
                                                (
                                                    totalSetCount > 0 &&
                                                    completedSetCount >= totalSetCount
                                                );
                                            const reportedResults =
                                                reportedResultsByExercise.get(exerciseIndex) || [];

                                            return (
                                                <Animated.View
                                                    key={exerciseIndex}
                                                    style={[
                                                        styles.tabButton,
                                                        styles.verticalTabButton,
                                                        joinsPreviousSuperset
                                                            ? styles.supersetCardContinuation
                                                            : null,
                                                        joinsNextSuperset
                                                            ? styles.supersetCardBeforeContinuation
                                                            : null,
                                                        isHighlighted
                                                            ? styles.tabButtonActive
                                                            : styles.tabButtonInactive,
                                                    ]}
                                                >
                                                    <View style={styles.tabButtonContent}>
                                                        {isExerciseComplete ? (
                                                            <CompletedExerciseCheckIcon />
                                                        ) : null}
                                                        <View
                                                            style={
                                                                isExerciseComplete
                                                                    ? styles.completedExerciseDimmedContent
                                                                    : null
                                                            }
                                                        >
                                                            <View style={styles.tabButtonHeader}>
                                                                <View style={styles.tabButtonIndexBadge}>
                                                                    <IBMPlexText defaultWhite
                                                                        style={styles.tabButtonIndex}
                                                                        lines={1}
                                                                    >
                                                                        {getExerciseOrderLabel(ex, exerciseIndex)}
                                                                    </IBMPlexText>
                                                                </View>
                                                                <View style={styles.tabButtonTitleBlock}>
                                                                    <IBMPlexText defaultWhite
                                                                        style={styles.tabButtonName}
                                                                        lines={2}
                                                                        textColor="#fff"
                                                                    >
                                                                        {getExerciseDisplayName(ex)}
                                                                    </IBMPlexText>
                                                                </View>
                                                            </View>
                                                        </View>
                                                        <View style={styles.tabButtonBody}>
                                                            <View
                                                                style={[
                                                                    styles.tabButtonBodyMain,
                                                                    isExerciseComplete
                                                                        ? styles.completedExerciseDimmedContent
                                                                        : null,
                                                                ]}
                                                            >
                                                                {exerciseCardMetrics.length > 0 ? (
                                                                    <View style={styles.tabButtonMetricsRow}>
                                                                        {exerciseCardMetrics.map((metric) => (
                                                                            <View
                                                                                key={metric.label}
                                                                                style={styles.tabButtonMetricColumn}
                                                                            >
                                                                                <IBMPlexText
                                                                                    style={styles.tabButtonMetricLabel}
                                                                                >
                                                                                    {metric.label}
                                                                                </IBMPlexText>
                                                                                {metric.isProgramMaxEstimate ? (
                                                                                    <View style={styles.programMaxIntensityChip}>
                                                                                        <IBMPlexText
                                                                                            style={[
                                                                                                styles.tabButtonMetricValue,
                                                                                                styles.programMaxIntensityMetric,
                                                                                            ]}
                                                                                        >
                                                                                            {metric.value}
                                                                                        </IBMPlexText>
                                                                                    </View>
                                                                                ) : (
                                                                                    <IBMPlexText defaultWhite
                                                                                        style={styles.tabButtonMetricValue}
                                                                                        textColor="#CDBB58"
                                                                                    >
                                                                                        {metric.value}
                                                                                    </IBMPlexText>
                                                                                )}
                                                                            </View>
                                                                        ))}
                                                                    </View>
                                                                ) : null}
                                                                {reportedResults.length > 0 ? (
                                                                    <View style={styles.tabButtonReportedList}>
                                                                        {reportedResults.map(({ setIndex, result }) => (
                                                                            <IBMPlexText defaultWhite
                                                                                key={`${exerciseIndex}-${setIndex}`}
                                                                                style={styles.tabButtonReportedText}
                                                                                lines={1}
                                                                            >
                                                                                Set {setIndex + 1}: {result}
                                                                            </IBMPlexText>
                                                                        ))}
                                                                    </View>
                                                                ) : null}
                                                                <View style={styles.tabButtonDivider} />
                                                            </View>
                                                            <View
                                                                style={styles.tabButtonFooter}
                                                                onTouchStart={(event) => {
                                                                    handleTabTouchStart(event);
                                                                }}
                                                            >
                                                                <View style={styles.tabButtonActionGroup}>
                                                                    {isSessionComplete ? (
                                                                        <CompletedExerciseProgressRing
                                                                            completedSetCount={completedSetCount}
                                                                            totalSetCount={totalSetCount}
                                                                        />
                                                                    ) : (
                                                                        <View
                                                                            style={[
                                                                                styles.tabButtonInlineActions,
                                                                                isExerciseComplete
                                                                                    ? styles.completedExerciseDimmedContent
                                                                                    : null,
                                                                            ]}
                                                                        >
                                                                            {canSwapExercise ? (
                                                                                <TouchableOpacity
                                                                                    accessibilityRole="button"
                                                                                    accessibilityLabel={`Swap ${getExerciseDisplayName(ex)}`}
                                                                                    style={styles.tabButtonActionButton}
                                                                                    onPress={(event) => {
                                                                                        event.stopPropagation?.();
                                                                                        openSwapOptions(exerciseIndex);
                                                                                    }}
                                                                                    onTouchStart={(event) => {
                                                                                        handleTabTouchStart(event);
                                                                                    }}
                                                                                >
                                                                                    <ExerciseCardActionIcon
                                                                                        color="#F3D04F"
                                                                                    />
                                                                                    <IBMPlexText
                                                                                        lines={1}
                                                                                        style={[
                                                                                            styles.tabButtonActionLabel,
                                                                                            styles.tabButtonSwapActionLabel,
                                                                                        ]}
                                                                                    >
                                                                                        Swap
                                                                                    </IBMPlexText>
                                                                                </TouchableOpacity>
                                                                            ) : null}
                                                                            {hasExerciseTips ? (
                                                                                <TouchableOpacity
                                                                                    accessibilityRole="button"
                                                                                    accessibilityLabel={`Show tips for ${getExerciseDisplayName(ex)}`}
                                                                                    style={styles.tabButtonActionButton}
                                                                                    onPress={(event) => {
                                                                                        event.stopPropagation?.();
                                                                                        openTips(exerciseIndex);
                                                                                    }}
                                                                                    onTouchStart={(event) => {
                                                                                        handleTabTouchStart(event);
                                                                                    }}
                                                                                >
                                                                                    <IBMPlexText style={styles.tabButtonQuestionIcon}>
                                                                                        ?
                                                                                    </IBMPlexText>
                                                                                    <IBMPlexText
                                                                                        lines={1}
                                                                                        style={[
                                                                                            styles.tabButtonActionLabel,
                                                                                            styles.tabButtonTipsActionLabel,
                                                                                        ]}
                                                                                    >
                                                                                        Tips
                                                                                    </IBMPlexText>
                                                                                </TouchableOpacity>
                                                                            ) : null}
                                                                        </View>
                                                                    )}
                                                                    <TouchableOpacity
                                                                        accessibilityRole="button"
                                                                        accessibilityLabel={`Search forum for ${getExerciseDisplayName(ex)}`}
                                                                        style={styles.tabButtonForumButton}
                                                                        onPress={(event) => {
                                                                            event.stopPropagation?.();
                                                                            openForumSearch(ex);
                                                                        }}
                                                                        onTouchStart={(event) => {
                                                                            handleTabTouchStart(event);
                                                                        }}
                                                                    >
                                                                        <Ionicons
                                                                            color="#B8B8C2"
                                                                            name="people"
                                                                            size={16}
                                                                        />
                                                                        <IBMPlexText lines={1} style={styles.tabButtonActionLabel}>
                                                                            Forum
                                                                        </IBMPlexText>
                                                                    </TouchableOpacity>
                                                                </View>
                                                                {!isSessionComplete && onLogExercise ? (
                                                                    <TouchableOpacity
                                                                        accessibilityRole="button"
                                                                        accessibilityLabel={`${
                                                                            isExerciseComplete ? "Edit" : "Log"
                                                                        } ${getExerciseDisplayName(ex)}`}
                                                                        style={styles.tabButtonLogButton}
                                                                        onPress={(event) => {
                                                                            event.stopPropagation?.();
                                                                            onLogExercise(exerciseIndex);
                                                                        }}
                                                                        onTouchStart={(event) => {
                                                                            handleTabTouchStart(event);
                                                                        }}
                                                                    >
                                                                        <IBMPlexText style={styles.tabButtonLogButtonText}>
                                                                            {isExerciseComplete ? "Edit >" : "Log >"}
                                                                        </IBMPlexText>
                                                                    </TouchableOpacity>
                                                                ) : null}
                                                            </View>
                                                        </View>
                                                    </View>
                                                </Animated.View>
                                            );
                                        })}
                        </View>
                    </View>

                    {trackedExercises.length > 0 ? (
                        <View>
                            {/* {trackedExercises.map(({ exercise, exerciseIndex, performanceTarget, strengthAssessment }) => {
                                const strengthRequirements = strengthAssessment ?
                                    getStrengthAssessmentRequirements(
                                        strengthAssessment.method
                                    ) :
                                    null;
                                const requiresReps = Boolean(
                                    performanceTarget ||
                                    strengthRequirements?.requiresReps
                                );
                                const requiresRpe = Boolean(
                                    performanceTarget ||
                                    strengthRequirements?.requiresRpe
                                );
                                const draft = trackingDrafts[exerciseIndex] || {
                                    exerciseIndex,
                                    loadKg: "",
                                    reps: "",
                                    rpe: "",
                                    missedRep: false,
                                    missedRepReason: "",
                                };
                                const savedResult = savedAssessmentResults.get(exerciseIndex);
                                const savedPerformanceResult =
                                    savedPerformanceResults.get(exerciseIndex);
                                const missedRepRecommendation = draft.missedRep && draft.missedRepReason ?
                                    buildMissedRepRecommendation({
                                        liftIntensityMethod: questionnaire?.liftIntensityMethod,
                                        exercise,
                                        metadata: performanceTarget || strengthAssessment || {},
                                        missReason: draft.missedRepReason,
                                    }) :
                                    savedPerformanceResult?.missedRepRecommendation || null;

                                return (
                                    <View
                                        key={`strength-assessment-${exerciseIndex}`}
                                        style={styles.assessmentCard}
                                    >
                                        <View style={styles.assessmentHeader}>
                                            <IBMPlexText style={styles.assessmentLiftName}>
                                                {performanceTarget?.liftName ||
                                                    strengthAssessment?.liftName ||
                                                    exercise.name}
                                            </IBMPlexText>
                                            {strengthAssessment ? (
                                                <IBMPlexText style={styles.assessmentMethodTag}>
                                                    {getStrengthAssessmentMethodLabel(
                                                        strengthAssessment.method
                                                    )}
                                                </IBMPlexText>
                                            ) : performanceTarget ? (
                                                <IBMPlexText style={styles.assessmentMethodTag}>
                                                    {performanceTarget.strategy.replace(/_/g, " ")}
                                                </IBMPlexText>
                                            ) : null}
                                        </View>
                                        {performanceTarget?.prompt ? (
                                            <IBMPlexText style={styles.assessmentPrompt}>
                                                {performanceTarget.prompt}
                                            </IBMPlexText>
                                        ) : null}
                                        {strengthAssessment?.prompt &&
                                        strengthAssessment.prompt !== performanceTarget?.prompt ? (
                                            <IBMPlexText style={styles.assessmentPromptSecondary}>
                                                {strengthAssessment.prompt}
                                            </IBMPlexText>
                                        ) : null}
                                        <View style={styles.assessmentInputRow}>
                                            <View style={styles.assessmentField}>
                                                <IBMPlexText style={styles.assessmentFieldLabel}>
                                                    {strengthRequirements?.loadLabel || "Load used (kg)"}
                                                </IBMPlexText>
                                                <TextInput
                                                    value={draft.loadKg}
                                                    onChangeText={(value) =>
                                                        updateTrackingDraft(
                                                            exerciseIndex,
                                                            "loadKg",
                                                            value
                                                        )
                                                    }
                                                    keyboardType="decimal-pad"
                                                    placeholder="e.g. 150"
                                                    style={styles.assessmentInput}
                                                />
                                            </View>

                                            {requiresReps ? (
                                                <View style={styles.assessmentField}>
                                                    <IBMPlexText style={styles.assessmentFieldLabel}>
                                                        {strengthRequirements?.repsLabel || "Reps completed"}
                                                    </IBMPlexText>
                                                    <TextInput
                                                        value={draft.reps}
                                                        onChangeText={(value) =>
                                                            updateTrackingDraft(
                                                                exerciseIndex,
                                                                "reps",
                                                                value
                                                            )
                                                        }
                                                        keyboardType="number-pad"
                                                        placeholder="2-5"
                                                        style={styles.assessmentInput}
                                                    />
                                                </View>
                                            ) : null}

                                            {requiresRpe ? (
                                                <View style={styles.assessmentField}>
                                                    <IBMPlexText style={styles.assessmentFieldLabel}>
                                                        {strengthRequirements?.rpeLabel || "RPE"}
                                                    </IBMPlexText>
                                                    <TextInput
                                                        value={draft.rpe}
                                                        onChangeText={(value) =>
                                                            updateTrackingDraft(
                                                                exerciseIndex,
                                                                "rpe",
                                                                value
                                                            )
                                                        }
                                                        keyboardType="decimal-pad"
                                                        placeholder="8-9"
                                                        style={styles.assessmentInput}
                                                    />
                                                </View>
                                            ) : null}
                                        </View>
                                        {performanceTarget ? (
                                            <View style={styles.missedRepBox}>
                                                <View style={styles.missedRepHeader}>
                                                    <IBMPlexText style={styles.missedRepTitle}>Missed rep</IBMPlexText>
                                                    <TouchableOpacity
                                                        style={[
                                                            styles.missedRepToggle,
                                                            draft.missedRep && styles.missedRepToggleActive,
                                                        ]}
                                                        onPress={() =>
                                                            updateTrackingDraft(
                                                                exerciseIndex,
                                                                "missedRep",
                                                                !draft.missedRep
                                                            )
                                                        }
                                                    >
                                                        <IBMPlexText
                                                            style={[
                                                                styles.missedRepToggleText,
                                                                draft.missedRep && styles.missedRepToggleTextActive,
                                                            ]}
                                                        >
                                                            {draft.missedRep ? "Logged" : "Log miss"}
                                                        </IBMPlexText>
                                                    </TouchableOpacity>
                                                </View>
                                                {draft.missedRep ? (
                                                    <View style={styles.missedReasonGroup}>
                                                        {MISSED_REP_REASON_OPTIONS.map((option) => {
                                                            const selected = draft.missedRepReason === option.value;

                                                            return (
                                                                <TouchableOpacity
                                                                    key={option.value}
                                                                    style={[
                                                                        styles.missedReasonChip,
                                                                        selected && styles.missedReasonChipSelected,
                                                                    ]}
                                                                    onPress={() =>
                                                                        updateTrackingDraft(
                                                                            exerciseIndex,
                                                                            "missedRepReason",
                                                                            option.value
                                                                        )
                                                                    }
                                                                >
                                                                    <IBMPlexText
                                                                        style={[
                                                                            styles.missedReasonChipText,
                                                                            selected && styles.missedReasonChipTextSelected,
                                                                        ]}
                                                                    >
                                                                        {option.label}
                                                                    </IBMPlexText>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                ) : null}
                                                {draft.missedRep && missedRepRecommendation ? (
                                                    <View style={styles.missedRecommendationBox}>
                                                        <IBMPlexText style={styles.missedRecommendationLabel}>Best next step</IBMPlexText>
                                                        <IBMPlexText style={styles.missedRecommendationTitle}>
                                                            {missedRepRecommendation.recommendedAction?.label}
                                                        </IBMPlexText>
                                                        {missedRepRecommendation.recommendedAction?.summary ? (
                                                            <IBMPlexText style={styles.missedRecommendationText}>
                                                                {missedRepRecommendation.recommendedAction.summary}
                                                            </IBMPlexText>
                                                        ) : null}
                                                        <IBMPlexText style={styles.missedRecommendationNext}>
                                                            Next session: {missedRepRecommendation.nextSessionAdjustment}
                                                        </IBMPlexText>
                                                    </View>
                                                ) : draft.missedRep ? (
                                                    <IBMPlexText style={styles.missedRepHelper}>
                                                        Pick the reason so the app can adjust the next exposure correctly.
                                                    </IBMPlexText>
                                                ) : null}
                                            </View>
                                        ) : null}
                                        {savedPerformanceResult ? (
                                            <IBMPlexText style={styles.assessmentSaved}>
                                                {savedPerformanceResult.missedRep ?
                                                    `Saved missed rep: ${savedPerformanceResult.missedRepReasonLabel || "Logged"}` :
                                                    `Saved performance: ${savedPerformanceResult.loadKg} kg x ${savedPerformanceResult.reps}`
                                                }
                                                {!savedPerformanceResult.missedRep && savedPerformanceResult.rpe ? ` @RPE ${savedPerformanceResult.rpe}` : ""}
                                                {savedPerformanceResult.estimatedOneRepMaxKg ?
                                                    ` | e1RM ${savedPerformanceResult.estimatedOneRepMaxKg} kg` :
                                                    ""
                                                }
                                                {savedPerformanceResult.rpeDrift != null ?
                                                    ` | drift ${savedPerformanceResult.rpeDrift > 0 ? "+" : ""}${savedPerformanceResult.rpeDrift}` :
                                                    ""
                                                }
                                            </IBMPlexText>
                                        ) : null}
                                        {savedResult ? (
                                            <IBMPlexText style={styles.assessmentSaved}>
                                                Saved estimate: {savedResult.estimatedOneRepMaxKg} kg 1RM, {savedResult.trainingMaxKg} kg training max.
                                            </IBMPlexText>
                                        ) : null}
                                        {!savedResult && !savedPerformanceResult ? (
                                            <IBMPlexText style={styles.assessmentSaved}>
                                                Leave blank if you did not perform the tracked top set today.
                                            </IBMPlexText>
                                        ) : null}
                                    </View>
                                );
                            })} */}
                        </View>
                    ) : null}

                        </>
                    )}
                </Pressable>
            </ScrollView>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    center: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    highlightDismissLayer: {
        ...StyleSheet.absoluteFillObject,
    },
    card: {
        width: '100%',
        maxWidth: 980,
        paddingHorizontal: 28,
        paddingTop: 18,
        paddingBottom: 28,
        gap: 20,
        backgroundColor: "transparent",
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    heading: { flexDirection: 'column', gap: 4 },
    eyebrow: {
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 12,
        opacity: 0.7,
    },
    title: { fontSize: 30, fontWeight: '700' },
    scheduleHint: { fontSize: 14, color: '#4b5563' },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#111',
    },
    backButtonText: { fontSize: 16, color: '#111' },
    adjustmentBox: {
        gap: 6,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    adjustmentBoxRescue: {
        borderColor: '#0f766e',
        backgroundColor: '#ecfeff',
    },
    adjustmentTitle: {
        fontSize: 14, fontWeight: '700',
        color: '#111827',
    },
    adjustmentText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#374151',
    },
    adjustmentMeta: {
        fontSize: 12,
        color: '#4b5563',
        textTransform: 'capitalize',
    },
    skippedStatus: {
        gap: 4,
    },
    skippedStatusTitle: {
        color: '#9ca3af',
        fontSize: 12, fontWeight: '700',
        textTransform: 'uppercase',
    },
    skippedStatusText: {
        color: '#4b5563',
        fontSize: 14,
        lineHeight: 20,
    },
    skippedStatusMeta: {
        color: '#6b7280',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    swapEditorModalRoot: {
        flex: 1,
    },
    swapEditorDimLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.66)',
        zIndex: 19,
    },
    swapEditorLayer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        paddingBottom: 44,
        paddingHorizontal: 20,
        paddingTop: 56,
        zIndex: 20,
    },
    swapEditorTopArea: {
        alignSelf: 'center',
        marginBottom: 24,
        maxWidth: 320,
        width: '100%',
    },
    swapCurrentExerciseCard: {
        alignItems: 'stretch',
        backgroundColor: '#111111',
        borderColor: '#252525',
        borderRadius: 18,
        borderWidth: 1,
        minHeight: 118,
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 18,
        position: "relative",
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 18,
        width: '100%',
        elevation: 12,
    },
    swapCurrentExerciseBadge: {
        alignSelf: "flex-start",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderColor: "rgba(255, 255, 255, 0.16)",
        borderRadius: 999,
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    swapCurrentExerciseBadgeText: {
        color: "#CDBB58",
        fontSize: 11,
        fontWeight: "900",
        lineHeight: 13,
        textTransform: "uppercase",
    },
    swapCurrentLabel: {
        color: '#7E7E7E',
        fontSize: 12, fontWeight: '800',
        lineHeight: 15,
        marginBottom: 6,
        paddingHorizontal: 2,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    swapCurrentExerciseName: {
        color: '#ffffff',
        fontSize: 18, fontWeight: '700',
        lineHeight: 22,
        textAlign: 'left',
    },
    swapCurrentExercisePrescription: {
        color: '#d1d5db',
        fontSize: 13, fontWeight: '700',
        lineHeight: 16,
        marginTop: 6,
        textAlign: 'left',
    },
    swapCurrentExerciseDescription: {
        color: '#9ca3af',
        fontSize: 12, fontWeight: '600',
        lineHeight: 16,
        marginTop: 8,
        textAlign: 'left',
    },
    swapEditorBottomArea: {
        alignSelf: 'stretch',
        gap: 12,
    },
    swapOptionsLabel: {
        color: "#9A9AA2",
        fontSize: 12,
        fontWeight: "900",
        lineHeight: 15,
        paddingHorizontal: 2,
        textAlign: "center",
        textTransform: "uppercase",
    },
    swapOptionCards: {
        gap: 10,
    },
    swapOptionCard: {
        alignItems: 'center',
        backgroundColor: '#111111',
        borderColor: '#252525',
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 14,
        justifyContent: 'space-between',
        minHeight: 104,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    swapOptionTextBlock: {
        flex: 1,
        gap: 8,
        minWidth: 0,
    },
    swapOptionName: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
        lineHeight: 21,
    },
    swapOptionMetricRow: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 7,
    },
    swapOptionMetricPill: {
        backgroundColor: "rgba(205, 187, 88, 0.12)",
        borderColor: "rgba(205, 187, 88, 0.24)",
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 9,
        paddingVertical: 4,
    },
    swapOptionMetricText: {
        color: "#CDBB58",
        fontSize: 11,
        fontWeight: "900",
        lineHeight: 13,
    },
    swapOptionNotes: {
        fontSize: 12,
        lineHeight: 16,
        color: '#9A9AA2',
        fontWeight: "700",
    },
    swapOptionAction: {
        alignItems: 'center',
        backgroundColor: '#0A84FF',
        borderColor: "rgba(255, 255, 255, 0.18)",
        borderRadius: 999,
        borderWidth: 1,
        flexShrink: 0,
        height: 42,
        justifyContent: 'center',
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
        width: 42,
    },
    swapEditorCancelButton: {
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: '#111111',
        borderColor: '#252525',
        borderWidth: 1,
        borderRadius: 999,
        justifyContent: 'center',
        minHeight: 38,
        paddingHorizontal: 18,
        paddingVertical: 9,
    },
    swapEditorCancelButtonText: {
        color: '#ffffff',
        fontSize: 12, fontWeight: '800',
    },
    tipsSheet: {
        maxHeight: '72%',
    },
    tipsSheetContent: {
        maxHeight: 360,
    },
    tipsScroller: {
        flexGrow: 0,
    },
    tipsContent: {
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },
    tipsText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#1f2937',
    },
    assessmentBox: {
        gap: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    assessmentTitle: {
        fontSize: 18, fontWeight: '700',
        color: '#111827',
    },
    assessmentDescription: {
        fontSize: 14,
        lineHeight: 20,
        color: '#4b5563',
    },
    assessmentCard: {
        gap: 10,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#dbeafe',
        backgroundColor: '#eff6ff',
    },
    assessmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    assessmentLiftName: {
        fontSize: 16, fontWeight: '700',
        color: '#111827',
    },
    assessmentMethodTag: {
        fontSize: 12, fontWeight: '700',
        color: '#1d4ed8',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    assessmentPrompt: {
        fontSize: 14,
        lineHeight: 20,
        color: '#1f2937',
    },
    assessmentPromptSecondary: {
        fontSize: 13,
        lineHeight: 19,
        color: '#475569',
    },
    assessmentInputRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    assessmentField: {
        minWidth: 180,
        flex: 1,
        gap: 6,
    },
    assessmentFieldLabel: {
        fontSize: 13, fontWeight: '600',
        color: '#1f2937',
    },
    assessmentInput: {
        height: 44,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        fontSize: 16,
        color: '#111827',
    },
    missedRepBox: {
        gap: 8,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fed7aa',
        backgroundColor: '#fff7ed',
    },
    missedRepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    missedRepTitle: {
        fontSize: 14, fontWeight: '700',
        color: '#7c2d12',
    },
    missedRepToggle: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#fdba74',
        backgroundColor: 'white',
    },
    missedRepToggleActive: {
        borderColor: '#c2410c',
        backgroundColor: '#c2410c',
    },
    missedRepToggleText: {
        fontSize: 13, fontWeight: '700',
        color: '#9a3412',
    },
    missedRepToggleTextActive: {
        color: 'white',
    },
    missedReasonGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    missedReasonChip: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#fdba74',
        backgroundColor: 'white',
    },
    missedReasonChipSelected: {
        borderColor: '#c2410c',
        backgroundColor: '#c2410c',
    },
    missedReasonChipText: {
        fontSize: 13, fontWeight: '600',
        color: '#9a3412',
    },
    missedReasonChipTextSelected: {
        color: 'white',
    },
    missedRepHelper: {
        fontSize: 13,
        lineHeight: 18,
        color: '#9a3412',
    },
    missedRecommendationBox: {
        gap: 4,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#431407',
    },
    missedRecommendationLabel: {
        fontSize: 11, fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: '#fed7aa',
    },
    missedRecommendationTitle: {
        fontSize: 15, fontWeight: '700',
        color: 'white',
    },
    missedRecommendationText: {
        fontSize: 13,
        lineHeight: 18,
        color: '#ffedd5',
    },
    missedRecommendationNext: {
        fontSize: 13,
        lineHeight: 18,
        color: '#fed7aa',
    },
    assessmentSaved: {
        fontSize: 13,
        lineHeight: 18,
        color: '#1d4ed8',
    },
    exerciseTabs: {
        gap: 12,
        paddingTop: 0,
    },
    tabsLabel: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
    tabsContainer: {
        flexDirection: 'column',
        gap: 12,
        paddingLeft: 20,
        paddingRight: 20,
    },
    tabButton: {
        backgroundColor: '#111111',
        borderColor: "#252525",
        borderRadius: 16,
        borderWidth: 1,
        minHeight: 184,
        overflow: "hidden",
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
        elevation: 4,
    },
    verticalTabButton: {
        alignSelf: "stretch",
        width: "100%",
    },
    supersetCardBeforeContinuation: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    supersetCardContinuation: {
        borderTopColor: "#343434",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        marginTop: -12,
    },
    tabButtonContent: {
        flex: 1,
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        position: "relative",
    },
    completedExerciseDimmedContent: {
        opacity: 0.42,
    },
    completedExerciseCheckIcon: {
        alignItems: "center",
        height: 32,
        justifyContent: "center",
        position: "absolute",
        right: 14,
        top: 13,
        width: 32,
        zIndex: 3,
    },
    completedExerciseProgressRing: {
        alignItems: "center",
        height: COMPLETED_EXERCISE_RING_SIZE,
        justifyContent: "center",
        width: COMPLETED_EXERCISE_RING_SIZE,
    },
    completedExerciseProgressRingContent: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    completedExerciseProgressRingText: {
        color: "#fff",
        fontSize: 10, fontWeight: "800",
        lineHeight: 12,
        textAlign: "center",
    },
    tabButtonHeader: {
        alignItems: 'flex-start',
        flexDirection: "row",
        gap: 12,
        minHeight: 0,
    },
    tabButtonIndexBadge: {
        alignItems: "flex-start",
        height: 30,
        justifyContent: "center",
        minWidth: 22,
    },
    tabButtonTitleBlock: {
        flex: 1,
        minWidth: 0,
    },
    tabButtonIndex: {
        color: '#9A9AA2',
        fontSize: 15,
        fontWeight: '800',
        lineHeight: 19,
        textAlign: "left",
    },
    tabButtonName: {
        color: 'white',
        fontSize: 19,
        fontWeight: '800',
        lineHeight: 24,
    },
    programMaxIntensityMetric: {
        color: "#F8E7A2",
        fontSize: 12,
        fontWeight: "700",
        lineHeight: 15,
    },
    programMaxIntensityChip: {
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: "rgba(243, 208, 79, 0.14)",
        borderColor: "rgba(243, 208, 79, 0.32)",
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: "row",
        paddingHorizontal: 11,
        paddingVertical: 7,
    },
    tabButtonBody: {
        flex: 1,
        gap: 12,
        justifyContent: "flex-end",
    },
    tabButtonBodyMain: {
        gap: 12,
    },
    tabButtonMetricsRow: {
        alignItems: 'flex-start',
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 18,
        rowGap: 8,
    },
    tabButtonMetricColumn: {
        alignItems: 'flex-start',
        flexShrink: 1,
        gap: 5,
        minWidth: 52,
    },
    tabButtonMetricLabel: {
        color: '#8B8B94',
        fontSize: 10,
        fontWeight: '800',
        lineHeight: 12,
        textTransform: "uppercase",
    },
    tabButtonMetricValue: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: '800',
        lineHeight: 19,
    },
    tabButtonDivider: {
        backgroundColor: '#252525',
        height: 1,
    },
    tabButtonFooter: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        justifyContent: "flex-start",
        minHeight: 17,
    },
    tabButtonActionGroup: {
        alignItems: 'center',
        flexDirection: 'row',
        flexWrap: "wrap",
        gap: 16,
        minWidth: 0,
    },
    tabButtonInlineActions: {
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        minWidth: 0,
    },
    tabButtonActionButton: {
        alignItems: 'center',
        backgroundColor: "transparent",
        flexDirection: "row",
        gap: 5,
        height: 24,
        justifyContent: 'center',
        paddingHorizontal: 0,
    },
    tabButtonActionLabel: {
        color: "#B8B8C2",
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 17,
        textAlign: "center",
    },
    tabButtonSwapActionLabel: {
        color: "#F3D04F",
    },
    tabButtonTipsActionLabel: {
        color: "#34C759",
    },
    tabButtonQuestionIcon: {
        color: "#34C759",
        fontSize: 17,
        fontWeight: "800",
        lineHeight: 17,
        textAlign: "center",
        width: 16,
    },
    tabButtonForumButton: {
        alignItems: 'center',
        backgroundColor: "transparent",
        flexDirection: "row",
        gap: 5,
        height: 24,
        justifyContent: 'center',
        paddingHorizontal: 0,
    },
    tabButtonLogButton: {
        alignItems: "center",
        backgroundColor: "transparent",
        height: 24,
        justifyContent: "center",
        marginLeft: "auto",
        paddingHorizontal: 0,
    },
    tabButtonLogButtonText: {
        color: "#0A84FF",
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 17,
        textAlign: "center",
    },
    tabButtonReportedList: {
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        borderColor: "#252525",
        borderRadius: 12,
        borderWidth: 1,
        gap: 3,
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    tabButtonReportedText: {
        color: "#B8B8C2",
        fontSize: 11,
        fontWeight: "700",
        lineHeight: 14,
    },
    tabButtonActive: {
        backgroundColor: '#141414',
        borderColor: '#3A3A3A',
    },
    tabButtonInactive: { },
    emptyState: {
        gap: 8,
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb',
    },
    emptyStateTitle: {
        fontSize: 18, fontWeight: '700',
        color: '#111827',
    },
    emptyStateText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#4b5563',
    },
});
