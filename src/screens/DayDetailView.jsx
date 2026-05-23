import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Pressable, Modal } from "react-native";
import StandardText from "../components/textComponents/StandardText.jsx";
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
} from "../services/utils/trainingPerformance.js";

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

const EXERCISE_SECTION_LABELS = Object.freeze({
    power: "Power",
    compound: "Compound",
    primary_pull: "Primary pull",
    core: "Core",
    accessory: "Accessory",
});
const CARD_HORIZONTAL_PADDING = 28;

function getExerciseSearchText(exercise = {}) {
    return ` ${exercise.name || ""} ${exercise.notes || ""} ${exercise.reps || ""} `.toLowerCase();
}

function getExerciseDisplayName(exercise = {}) {
    return String(exercise.name || "").replace(/^\s*\d+[a-z]?\.\s*/i, "");
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
    const sets = String(exercise.sets || "").trim();
    const reps = String(exercise.reps || "").trim().replace(/\s*\+\s*/g, " + ");
    const hasSimpleSetCount = /^\d+$/.test(sets);
    const formatWithSets = (prescription) =>
        hasSimpleSetCount && prescription
            ? formatPrescriptionWithSets(sets, prescription)
            : prescription;
    const compactTimePrescription = getCompactTimePrescription(reps, exercise);

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

    const compactDistancePrescription = getCompactDistancePrescription(reps, exercise);

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

function includesAnyKeyword(text, keywords = []) {
    return keywords.some((keyword) => text.includes(keyword));
}

function getExplicitExerciseSection(exercise = {}) {
    const exerciseText = getExerciseSearchText(exercise);

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

export default function DayDetailView({
    week,
    day,
    preferredWeekday,
    sessionLabel,
    status = "pending",
    rescueMode = "",
    adjustmentSummary = "",
    exercises = [],
    initialPerformanceResults = [],
    initialAssessmentResults = [],
    strengthAssessmentSummary = null,
    questionnaire = {},
    onBack,
    onReplaceExercise,
    onFinish,
    onMissed,
    updatingPlan = false,
    exerciseListHorizontalBleed = CARD_HORIZONTAL_PADDING,
}) {
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
    const [highlightedExerciseIndex, setHighlightedExerciseIndex] = useState(null);
    const [swapExerciseIndex, setSwapExerciseIndex] = useState(null);
    const [tipsExerciseIndex, setTipsExerciseIndex] = useState(null);
    const tabTouchStartedRef = useRef(false);
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
    const exerciseSectionRuns = useMemo(
        () => buildExerciseSectionRuns(normalizedExercises),
        [normalizedExercises]
    );
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
        tabTouchStartedRef.current = true;
        event.stopPropagation?.();
    }

    function handleTabScrollerDragStart() {
        if (tabTouchStartedRef.current) {
            tabTouchStartedRef.current = false;
        }
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
        closeSwapOptions();
    }

    return (
        <QuestionnaireShell hideTabBar={false}>
            <Modal
                visible={Boolean(swapExercise && swapExerciseOptions.length > 1 && onReplaceExercise)}
                transparent
                animationType="fade"
                onRequestClose={closeSwapOptions}
            >
                <Pressable style={styles.swapOverlay} onPress={closeSwapOptions}>
                    <Pressable
                        style={styles.swapOptionsCard}
                        onPress={(event) => event.stopPropagation?.()}
                    >
                        <View style={styles.swapOptionsHeader}>
                            <View style={styles.swapOptionsHeading}>
                                <Text style={styles.swapOptionsTitle}>Exercise options</Text>
                                <Text style={styles.swapOptionsSubtitle}>
                                    {swapExercise ? getExerciseDisplayName(swapExercise) : ""}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.swapOptionsCloseButton}
                                onPress={closeSwapOptions}
                            >
                                <StandardText
                                    style={styles.swapOptionsCloseText}
                                    textColor="#111827"
                                >
                                    Close
                                </StandardText>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            style={styles.swapOptionsScroller}
                            contentContainerStyle={styles.swapOptionsList}
                        >
                            {swapExerciseOptions.map((option) => {
                                const isSelected =
                                    option.id === swapExercise?.selectedSubstitutionId;

                                return (
                                    <TouchableOpacity
                                        key={option.id}
                                        style={[
                                            styles.swapOptionRow,
                                            isSelected && styles.swapOptionRowSelected,
                                        ]}
                                        onPress={() => replaceExerciseFromOverlay(option.id)}
                                        disabled={isSelected}
                                    >
                                        <View style={styles.swapOptionTextBlock}>
                                            <Text style={styles.swapOptionName}>{option.name}</Text>
                                            <Text style={styles.swapOptionPrescription}>
                                                {option.sets} x {option.reps}
                                            </Text>
                                            {option.notes ? (
                                                <Text style={styles.swapOptionNotes}>{option.notes}</Text>
                                            ) : null}
                                        </View>
                                        <StandardText
                                            style={[
                                                styles.swapOptionAction,
                                                isSelected && styles.swapOptionActionSelected,
                                            ]}
                                            center
                                            textColor={isSelected ? "#111827" : "white"}
                                        >
                                            {isSelected ? "Current" : "Use"}
                                        </StandardText>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
            <Modal
                visible={Boolean(tipsExercise?.notes)}
                transparent
                animationType="fade"
                onRequestClose={closeTips}
            >
                <Pressable style={styles.tipsOverlay} onPress={closeTips}>
                    <Pressable
                        style={styles.tipsCard}
                        onPress={(event) => event.stopPropagation?.()}
                    >
                        <View style={styles.tipsHeader}>
                            <View style={styles.tipsHeading}>
                                <Text style={styles.tipsTitle}>Tips</Text>
                                <Text style={styles.tipsSubtitle}>
                                    {tipsExercise ? getExerciseDisplayName(tipsExercise) : ""}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.tipsCloseButton}
                                onPress={closeTips}
                            >
                                <StandardText
                                    style={styles.tipsCloseText}
                                    textColor="#111827"
                                >
                                    Close
                                </StandardText>
                            </TouchableOpacity>
                        </View>
                        <ScrollView
                            style={styles.tipsScroller}
                            contentContainerStyle={styles.tipsContent}
                        >
                            <Text style={styles.tipsText}>{tipsExercise?.notes}</Text>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
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
                    {(adjustmentSummary || isRescheduled || isSkipped) ? (
                        <View
                            style={[
                                styles.adjustmentBox,
                                isSkipped ? styles.adjustmentBoxSkipped : styles.adjustmentBoxRescue,
                            ]}
                        >
                            <Text style={styles.adjustmentTitle}>
                                {isSkipped ? "Session skipped" : isRescheduled ? "Rescheduled session" : "Plan update"}
                            </Text>
                            <Text style={styles.adjustmentText}>
                                {adjustmentSummary ||
                                    (isRescheduled
                                        ? "This session was moved after a missed slot."
                                        : "This slot no longer counts toward the current training week.")}
                            </Text>
                            {rescueMode ? (
                                <Text style={styles.adjustmentMeta}>Mode: {rescueMode.replace(/_/g, " ")}</Text>
                            ) : null}
                        </View>
                    ) : null}

                    {normalizedExercises.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateTitle}>No active workout in this slot.</Text>
                            <Text style={styles.emptyStateText}>
                                This slot has already been skipped or absorbed by a later rescue decision for the week.
                            </Text>
                        </View>
                    ) : (
                        <>
                    <View style={styles.exerciseTabs}>
                        {exerciseSectionRuns.map(({ section, exercises: sectionExercises }, sectionIndex) => {
                            return (
                                <View key={`tabs-${dayIdentity}-${section}-${sectionIndex}`} style={styles.exerciseSection}>
                                    <View style={styles.exerciseSectionHeader}>
                                        <StandardText
                                            style={styles.exerciseSectionTitle}
                                        >
                                            {EXERCISE_SECTION_LABELS[section]}
                                        </StandardText>
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={[
                                            styles.tabsScroller,
                                            { marginHorizontal: -exerciseListHorizontalBleed },
                                        ]}
                                        contentContainerStyle={styles.tabsContainer}
                                        onScrollBeginDrag={handleTabScrollerDragStart}
                                    >
                                        {sectionExercises.map(({ exercise: ex, exerciseIndex }) => {
                                            const recommendation = getExerciseRecommendationDisplay(
                                                ex,
                                                strengthReferenceOneRepMaxByLift
                                            );
                                            const isHighlighted =
                                                exerciseIndex === highlightedExerciseIndex;
                                            const exerciseSubstitutionOptions =
                                                getExerciseSubstitutionOptions(ex);
                                            const canSwapExercise =
                                                exerciseSubstitutionOptions.length > 1 &&
                                                onReplaceExercise;
                                            const hasExerciseTips = Boolean(ex.notes);
                                            const showActionRail =
                                                isHighlighted &&
                                                (canSwapExercise || hasExerciseTips);

                                            return (
                                                <TouchableOpacity
                                                    key={exerciseIndex}
                                                    style={[
                                                        styles.tabButton,
                                                        isHighlighted
                                                            ? styles.tabButtonActive
                                                            : styles.tabButtonInactive,
                                                        isHighlighted && styles.tabButtonSelected,
                                                    ]}
                                                        onPress={(event) => {
                                                            event.stopPropagation?.();
                                                            setSelectedExerciseIndex(exerciseIndex);
                                                            setHighlightedExerciseIndex(exerciseIndex);
                                                    }}
                                                    onTouchStart={(event) => {
                                                        handleTabTouchStart(event);
                                                    }}
                                                >
                                                    <View style={styles.tabButtonContent}>
                                                        {showActionRail ? (
                                                            <View
                                                                style={styles.tabButtonSwapRail}
                                                                onTouchStart={(event) => {
                                                                    handleTabTouchStart(event);
                                                                }}
                                                            >
                                                                {canSwapExercise ? (
                                                                    <TouchableOpacity
                                                                        style={styles.tabButtonActionButton}
                                                                        onPress={(event) => {
                                                                            event.stopPropagation?.();
                                                                            openSwapOptions(exerciseIndex);
                                                                        }}
                                                                        onTouchStart={(event) => {
                                                                            handleTabTouchStart(event);
                                                                        }}
                                                                    >
                                                                        <StandardText
                                                                            style={styles.tabButtonActionText}
                                                                            center
                                                                            textColor="#000"
                                                                        >
                                                                            Swap
                                                                        </StandardText>
                                                                    </TouchableOpacity>
                                                                ) : null}
                                                                {hasExerciseTips ? (
                                                                    <TouchableOpacity
                                                                        style={styles.tabButtonActionButton}
                                                                        onPress={(event) => {
                                                                            event.stopPropagation?.();
                                                                            openTips(exerciseIndex);
                                                                        }}
                                                                        onTouchStart={(event) => {
                                                                            handleTabTouchStart(event);
                                                                        }}
                                                                    >
                                                                        <StandardText
                                                                            style={styles.tabButtonActionText}
                                                                            center
                                                                            textColor="#000"
                                                                        >
                                                                            Tips
                                                                        </StandardText>
                                                                    </TouchableOpacity>
                                                                ) : null}
                                                            </View>
                                                        ) : null}
                                                        <View
                                                            style={[
                                                                styles.tabButtonMainText,
                                                                showActionRail
                                                                    ? styles.tabButtonMainTextWithSwap
                                                                    : null,
                                                            ]}
                                                        >
                                                            <View style={styles.tabButtonText}>
                                                                <StandardText
                                                                    style={styles.tabButtonName}
                                                                    lines={2}
                                                                    textColor="#fff"
                                                                >
                                                                    {getExerciseDisplayName(ex)}
                                                                </StandardText>
                                                                <StandardText
                                                                    style={styles.tabButtonSets}
                                                                    lines={isHighlighted ? 3 : 1}
                                                                    adjustsFontSizeToFit={isHighlighted}
                                                                    minimumFontScale={0.82}
                                                                    textColor="#fff"
                                                                >
                                                                    {getExercisePrescriptionDisplay(ex)}
                                                                </StandardText>
                                                                {recommendation.primary ? (
                                                                    <StandardText
                                                                        style={styles.tabButtonRecommendationPrimary}
                                                                        lines={1}
                                                                        textColor="#fff"
                                                                    >
                                                                        {recommendation.primary}
                                                                    </StandardText>
                                                                ) : null}
                                                            </View>
                                                        </View>
                                                        {recommendation.details ? (
                                                            <StandardText
                                                                style={styles.tabButtonRecommendationDetails}
                                                                lines={2}
                                                            >
                                                                {recommendation.details}
                                                            </StandardText>
                                                        ) : null}
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>
                                </View>
                            );
                        })}
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
                                            <Text style={styles.assessmentLiftName}>
                                                {performanceTarget?.liftName ||
                                                    strengthAssessment?.liftName ||
                                                    exercise.name}
                                            </Text>
                                            {strengthAssessment ? (
                                                <Text style={styles.assessmentMethodTag}>
                                                    {getStrengthAssessmentMethodLabel(
                                                        strengthAssessment.method
                                                    )}
                                                </Text>
                                            ) : performanceTarget ? (
                                                <Text style={styles.assessmentMethodTag}>
                                                    {performanceTarget.strategy.replace(/_/g, " ")}
                                                </Text>
                                            ) : null}
                                        </View>
                                        {performanceTarget?.prompt ? (
                                            <Text style={styles.assessmentPrompt}>
                                                {performanceTarget.prompt}
                                            </Text>
                                        ) : null}
                                        {strengthAssessment?.prompt &&
                                        strengthAssessment.prompt !== performanceTarget?.prompt ? (
                                            <Text style={styles.assessmentPromptSecondary}>
                                                {strengthAssessment.prompt}
                                            </Text>
                                        ) : null}
                                        <View style={styles.assessmentInputRow}>
                                            <View style={styles.assessmentField}>
                                                <Text style={styles.assessmentFieldLabel}>
                                                    {strengthRequirements?.loadLabel || "Load used (kg)"}
                                                </Text>
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
                                                    <Text style={styles.assessmentFieldLabel}>
                                                        {strengthRequirements?.repsLabel || "Reps completed"}
                                                    </Text>
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
                                                    <Text style={styles.assessmentFieldLabel}>
                                                        {strengthRequirements?.rpeLabel || "RPE"}
                                                    </Text>
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
                                                    <Text style={styles.missedRepTitle}>Missed rep</Text>
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
                                                        <Text
                                                            style={[
                                                                styles.missedRepToggleText,
                                                                draft.missedRep && styles.missedRepToggleTextActive,
                                                            ]}
                                                        >
                                                            {draft.missedRep ? "Logged" : "Log miss"}
                                                        </Text>
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
                                                                    <Text
                                                                        style={[
                                                                            styles.missedReasonChipText,
                                                                            selected && styles.missedReasonChipTextSelected,
                                                                        ]}
                                                                    >
                                                                        {option.label}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                ) : null}
                                                {draft.missedRep && missedRepRecommendation ? (
                                                    <View style={styles.missedRecommendationBox}>
                                                        <Text style={styles.missedRecommendationLabel}>Best next step</Text>
                                                        <Text style={styles.missedRecommendationTitle}>
                                                            {missedRepRecommendation.recommendedAction?.label}
                                                        </Text>
                                                        {missedRepRecommendation.recommendedAction?.summary ? (
                                                            <Text style={styles.missedRecommendationText}>
                                                                {missedRepRecommendation.recommendedAction.summary}
                                                            </Text>
                                                        ) : null}
                                                        <Text style={styles.missedRecommendationNext}>
                                                            Next session: {missedRepRecommendation.nextSessionAdjustment}
                                                        </Text>
                                                    </View>
                                                ) : draft.missedRep ? (
                                                    <Text style={styles.missedRepHelper}>
                                                        Pick the reason so the app can adjust the next exposure correctly.
                                                    </Text>
                                                ) : null}
                                            </View>
                                        ) : null}
                                        {savedPerformanceResult ? (
                                            <Text style={styles.assessmentSaved}>
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
                                            </Text>
                                        ) : null}
                                        {savedResult ? (
                                            <Text style={styles.assessmentSaved}>
                                                Saved estimate: {savedResult.estimatedOneRepMaxKg} kg 1RM, {savedResult.trainingMaxKg} kg training max.
                                            </Text>
                                        ) : null}
                                        {!savedResult && !savedPerformanceResult ? (
                                            <Text style={styles.assessmentSaved}>
                                                Leave blank if you did not perform the tracked top set today.
                                            </Text>
                                        ) : null}
                                    </View>
                                );
                            })} */}
                        </View>
                    ) : null}

                    {/* <View style={styles.listBlock}>
                        <Text style={styles.listLabel}>Complete workout breakdown:</Text>
                        {exerciseSectionRuns.map(({ section, exercises: sectionExercises }, sectionIndex) => {
                            return (
                                <View key={`${section}-${sectionIndex}`} style={styles.exerciseSection}>
                                    <View style={styles.exerciseSectionHeader}>
                                        <Text style={styles.exerciseSectionTitle}>
                                            {EXERCISE_SECTION_LABELS[section]}
                                        </Text>
                                    </View>
                                    {sectionExercises.map(({ exercise: ex, exerciseIndex }) => (
                                        <View key={exerciseIndex} style={styles.exerciseRow}>
                                            <View>
                                                <Text style={styles.exerciseName}>{getExerciseDisplayName(ex)}</Text>
                                                {ex.notes ? <Text style={styles.exerciseNotes}>{ex.notes}</Text> : null}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </View> */}
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
    adjustmentBoxSkipped: {
        borderColor: '#9ca3af',
        backgroundColor: '#f3f4f6',
    },
    adjustmentTitle: {
        fontSize: 14,
        fontWeight: '700',
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
    swapOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.48)',
    },
    swapOptionsCard: {
        width: '100%',
        maxWidth: 520,
        maxHeight: '82%',
        gap: 14,
        padding: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 24,
    },
    swapOptionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    swapOptionsHeading: {
        flex: 1,
        gap: 4,
    },
    swapOptionsTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    swapOptionsSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: '#4b5563',
    },
    swapOptionsCloseButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(17,24,39,0.14)',
        backgroundColor: '#f9fafb',
    },
    swapOptionsCloseText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
    },
    swapOptionsScroller: {
        flexGrow: 0,
    },
    swapOptionsList: {
        gap: 10,
    },
    swapOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },
    swapOptionRowSelected: {
        borderColor: '#111827',
        backgroundColor: '#f3f4f6',
    },
    swapOptionTextBlock: {
        flex: 1,
        gap: 3,
    },
    swapOptionName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    swapOptionPrescription: {
        fontSize: 14,
        color: '#374151',
    },
    swapOptionNotes: {
        fontSize: 13,
        lineHeight: 18,
        color: '#6b7280',
    },
    swapOptionAction: {
        minWidth: 64,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        overflow: 'hidden',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '800',
        color: 'white',
        backgroundColor: '#111827',
    },
    swapOptionActionSelected: {
        color: '#111827',
        backgroundColor: '#e5e7eb',
    },
    tipsOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.48)',
    },
    tipsCard: {
        width: '100%',
        maxWidth: 520,
        maxHeight: '82%',
        gap: 14,
        padding: 18,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOpacity: 0.28,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 24,
    },
    tipsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    tipsHeading: {
        flex: 1,
        gap: 4,
    },
    tipsTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    tipsSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: '#4b5563',
    },
    tipsCloseButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(17,24,39,0.14)',
        backgroundColor: '#f9fafb',
    },
    tipsCloseText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
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
        fontSize: 18,
        fontWeight: '700',
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
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    assessmentMethodTag: {
        fontSize: 12,
        fontWeight: '700',
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
        fontSize: 13,
        fontWeight: '600',
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
        fontSize: 14,
        fontWeight: '700',
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
        fontSize: 13,
        fontWeight: '700',
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
        fontSize: 13,
        fontWeight: '600',
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
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: '#fed7aa',
    },
    missedRecommendationTitle: {
        fontSize: 15,
        fontWeight: '700',
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
        gap: 18,
        paddingTop: 0,
    },
    tabsLabel: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
    tabsScroller: {
        flexGrow: 0,
        alignSelf: "stretch",
    },
    tabsContainer: { flexDirection: 'row', gap: 10, paddingLeft: 28, paddingRight: 28 },
    tabButton: {backgroundColor: '#141414', borderRadius: 22, height: 150, width:128,
        borderWidth: 1, borderColor: "#1E1E1E",
     },
    tabButtonSelected: {
        width: 240,
    },
    tabButtonContent: {
        flex: 1,
        justifyContent: 'space-between',
        margin: 7,
        padding: 10,
        position: 'relative',
    },
    tabButtonSwapRail: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 74,
        alignItems: 'center',
        paddingTop: 7,
        gap: 8,
    },
    tabButtonActionButton: {
        alignItems: 'center',
        borderRadius: 999,
        backgroundColor: '#fff',
        justifyContent: 'center',
        width: 65,
        height: 30,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    tabButtonActionText: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    tabButtonMainText: {
        gap: 6,
    },
    tabButtonMainTextWithSwap: {
        paddingRight: 74,
    },
    tabButtonText: { flexDirection: 'column', gap: 4},
    tabButtonName: { fontSize: 15, fontWeight: '700', color: 'white', marginBottom: 5, lineHeight: 18 },
    tabButtonSets: { fontSize: 14, color: "#d1d5db", lineHeight: 17 },
    tabButtonRecommendationPrimary: { fontSize: 17, fontWeight: '700', lineHeight: 20 },
    tabButtonRecommendationDetails: {
        color: '#C9B259',
        fontSize: 10,
        fontWeight: '700',
        lineHeight: 12,
    },
    tabButtonActive: { },
    tabButtonInactive: { },
    listBlock: {
        gap: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    listLabel: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
    emptyState: {
        gap: 8,
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb',
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    emptyStateText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#4b5563',
    },
    exerciseRow: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        alignItems: 'center',
    },
    exerciseSection: {
        gap: 8,
    },
    exerciseSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginTop: 4,
        marginBottom: 8,
    },
    exerciseSectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9ca3af',
        opacity: 1,
        textAlign: 'left',
        textTransform: 'uppercase',
    },
    exerciseName: { fontSize: 16, fontWeight: '600' },
    exerciseNotes: { fontSize: 14, opacity: 0.75 },
    exerciseSets: { fontSize: 16, fontWeight: '600', minWidth: 70, textAlign: 'right' },
});
