import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
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

function getExerciseSearchText(exercise = {}) {
    return ` ${exercise.name || ""} ${exercise.notes || ""} ${exercise.reps || ""} `.toLowerCase();
}

function getExerciseDisplayName(exercise = {}) {
    return String(exercise.name || "").replace(/^\s*\d+[a-z]?\.\s*/i, "");
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
    onBack,
    onReplaceExercise,
    onFinish,
    onMissed,
    updatingPlan = false,
}) {
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);
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
    const preferredWeekdayLabel = getTrainingDayPreferredWeekday(resolvedDay);
    const selectedExercise = normalizedExercises[activeExerciseIndex];
    const selectedExercisePercentagePrescription = selectedExercise ?
        getExercisePercentagePrescription(selectedExercise) :
        null;
    const substitutionOptions = selectedExercise
        ? getExerciseSubstitutionOptions(selectedExercise)
        : [];
    const summaryText = selectedExercise
        ? `${selectedExercise.name} – ${selectedExercise.sets} x ${selectedExercise.reps}`
        : `No exercises available for ${dayLabel} yet.`;
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
    const percentageReferenceLiftName =
        selectedExercisePercentagePrescription?.referenceLiftName ||
        selectedExercise?.name ||
        "";
    const referenceLiftDetails = resolveStrengthAssessmentReferenceOneRepMaxKg(
        percentageReferenceLiftName,
        strengthReferenceOneRepMaxByLift
    );
    const referenceOneRepMaxKg = referenceLiftDetails.oneRepMaxKg;

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

    return (
        <QuestionnaireShell hideTabBar={false}>
            <ScrollView contentContainerStyle={styles.center}>
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.heading}>
                        </View>
                        <View style={styles.headerActions}>
                            {onMissed ? (
                                <TouchableOpacity
                                    style={styles.missedButton}
                                    onPress={onMissed}
                                    disabled={updatingPlan || isSkipped}
                                >
                                    <Text style={styles.missedButtonText}>
                                        {updatingPlan ? "Updating..." : "Missed"}
                                    </Text>
                                </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                                style={[
                                    styles.finishButton,
                                    (updatingPlan || isSkipped) && styles.finishButtonDisabled,
                                ]}
                                onPress={() =>
                                    onFinish?.(
                                        trackedExercises.map(({ exerciseIndex }) => ({
                                            exerciseIndex,
                                            ...(trackingDrafts[exerciseIndex] || {
                                                exerciseIndex,
                                                loadKg: "",
                                                reps: "",
                                                rpe: "",
                                            }),
                                        }))
                                    )
                                }
                                disabled={updatingPlan || isSkipped}
                            >
                                <Text style={styles.finishButtonText}>Finish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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
                    <View style={styles.contentBlock}>
                        <Text style={styles.subtitle}>Current Exercise:</Text>
                        <Text style={styles.summary}>{summaryText}</Text>

                        {selectedExercise?.notes && (
                            <View style={styles.notesBox}>
                                <Text style={styles.notesLabel}>💡 Tips:</Text>
                                <Text style={styles.notesText}>{selectedExercise.notes}</Text>
                            </View>
                        )}

                        {selectedExercisePercentagePrescription ? (
                            <View style={styles.percentageBox}>
                                <Text style={styles.percentageTitle}>Percentage prescription</Text>
                                <Text style={styles.percentageDescription}>
                                    {selectedExercisePercentagePrescription.loadingStrategy ?
                                        `Loading strategy: ${selectedExercisePercentagePrescription.loadingStrategy.replace(/_/g, " ")}.` :
                                        "Percentage-based working sets."
                                    }{" "}
                                    Reference lift: {percentageReferenceLiftName}.
                                </Text>
                                {selectedExercisePercentagePrescription.workingSets.map(
                                    (workingSet, index) => {
                                        const estimatedLoadKg = referenceOneRepMaxKg ?
                                            calculateTargetLoadFromPercentOneRepMax(
                                                referenceOneRepMaxKg,
                                                workingSet.percent1RM
                                            ) :
                                            null;

                                        return (
                                            <View
                                                key={`percentage-working-set-${index}`}
                                                style={styles.percentageRow}
                                            >
                                                <Text style={styles.percentageRowPrimary}>
                                                    {workingSet.count > 1 ?
                                                        `${workingSet.count} sets of ${workingSet.reps}` :
                                                        `${workingSet.reps} reps`
                                                    }
                                                </Text>
                                                <Text style={styles.percentageRowSecondary}>
                                                    {workingSet.percent1RM}% 1RM
                                                    {workingSet.relativeIntensity ?
                                                        ` | RI ${workingSet.relativeIntensity}%` :
                                                        ""
                                                    }
                                                    {estimatedLoadKg ?
                                                        ` | ~${estimatedLoadKg} kg` :
                                                        ""
                                                    }
                                                </Text>
                                            </View>
                                        );
                                    }
                                )}
                                <Text style={styles.percentageHelper}>
                                    {referenceLiftDetails.source === "direct" ?
                                        `Load estimates are based on your latest stored ${percentageReferenceLiftName} reference max.` :
                                        referenceLiftDetails.source === "estimated_from_bench_press" ?
                                            `Load estimates are based on an estimated close-grip bench press max set to 95% of your latest Bench Press reference max.` :
                                        "Load estimates unlock after you log a recent strength assessment for this lift."
                                    }
                                </Text>
                            </View>
                        ) : null}

                        {substitutionOptions.length > 1 && onReplaceExercise ? (
                            <View style={styles.substitutionBox}>
                                <Text style={styles.substitutionLabel}>Exercise options</Text>
                                <View style={styles.substitutionPickerShell}>
                                    <Picker
                                        selectedValue={selectedExercise.selectedSubstitutionId}
                                        onValueChange={(value) => {
                                            if (!value) {
                                                return;
                                            }

                                            onReplaceExercise(activeExerciseIndex, value);
                                        }}
                                        style={styles.substitutionPicker}
                                    >
                                        {substitutionOptions.map((option) => (
                                            <Picker.Item
                                                key={option.id}
                                                label={option.name}
                                                value={option.id}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                                <Text style={styles.substitutionHelper}>
                                    Choose a comparable variation from the same category.
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.exerciseTabs}>
                        <Text style={styles.tabsLabel}>All exercises ({normalizedExercises.length}):</Text>
                        {exerciseSectionRuns.map(({ section, exercises: sectionExercises }, sectionIndex) => {
                            return (
                                <View key={`tabs-${section}-${sectionIndex}`} style={styles.exerciseSection}>
                                    <View style={styles.exerciseSectionHeader}>
                                        <View style={styles.exerciseSectionDivider} />
                                        <Text style={styles.exerciseSectionTitle}>
                                            {EXERCISE_SECTION_LABELS[section]}
                                        </Text>
                                        <View style={styles.exerciseSectionDivider} />
                                    </View>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        style={styles.tabsScroller}
                                        contentContainerStyle={styles.tabsContainer}
                                    >
                                        {sectionExercises.map(({ exercise: ex, exerciseIndex }) => (
                                            <TouchableOpacity
                                                key={exerciseIndex}
                                                style={[
                                                    styles.tabButton,
                                                    exerciseIndex === activeExerciseIndex
                                                        ? styles.tabButtonActive
                                                        : styles.tabButtonInactive,
                                                ]}
                                                onPress={() => setSelectedExerciseIndex(exerciseIndex)}
                                            >
                                                <View style={styles.tabButtonContent}>
                                                    <View style={styles.tabButtonText}>
                                                        <Text style={styles.tabButtonName}>{getExerciseDisplayName(ex)}</Text>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            );
                        })}
                    </View>

                    {trackedExercises.length > 0 ? (
                        <View style={styles.assessmentBox}>
                            <Text style={styles.assessmentTitle}>Tracked top sets</Text>
                            <Text style={styles.assessmentDescription}>
                                Save the main monitored set here so the app can track e1RM trend, best-set performance, fixed-RPE load, skipped top sets, and future percentage updates.
                            </Text>
                            {trackedExercises.map(({ exercise, exerciseIndex, performanceTarget, strengthAssessment }) => {
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
                                };
                                const savedResult = savedAssessmentResults.get(exerciseIndex);
                                const savedPerformanceResult =
                                    savedPerformanceResults.get(exerciseIndex);

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
                                        {savedPerformanceResult ? (
                                            <Text style={styles.assessmentSaved}>
                                                Saved performance: {savedPerformanceResult.loadKg} kg x {savedPerformanceResult.reps}
                                                {savedPerformanceResult.rpe ? ` @RPE ${savedPerformanceResult.rpe}` : ""}
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
                            })}
                        </View>
                    ) : null}

                    <View style={styles.listBlock}>
                        <Text style={styles.listLabel}>Complete workout breakdown:</Text>
                        {exerciseSectionRuns.map(({ section, exercises: sectionExercises }, sectionIndex) => {
                            return (
                                <View key={`${section}-${sectionIndex}`} style={styles.exerciseSection}>
                                    <View style={styles.exerciseSectionHeader}>
                                        <View style={styles.exerciseSectionDivider} />
                                        <Text style={styles.exerciseSectionTitle}>
                                            {EXERCISE_SECTION_LABELS[section]}
                                        </Text>
                                        <View style={styles.exerciseSectionDivider} />
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
                    </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    center: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 980,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 28,
        gap: 18,
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
    finishButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#111',
        backgroundColor: '#111',
    },
    finishButtonDisabled: {
        opacity: 0.5,
    },
    finishButtonText: { fontSize: 16, color: 'white' },
    missedButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#b45309',
        backgroundColor: '#fff7ed',
    },
    missedButtonText: {
        fontSize: 16,
        color: '#9a3412',
        fontWeight: '600',
    },
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
    contentBlock: { flexDirection: 'column', gap: 10 },
    subtitle: { fontSize: 16, opacity: 0.8 },
    summary: { fontSize: 20, fontWeight: '600' },
    notesBox: {
        padding: 12,
        backgroundColor: '#f9f3ff',
        borderWidth: 1,
        borderColor: '#e8d5ff',
        borderRadius: 10,
        gap: 6,
    },
    notesLabel: { fontSize: 14, fontWeight: '600', opacity: 0.9 },
    notesText: { fontSize: 14, lineHeight: 21, opacity: 0.85 },
    percentageBox: {
        gap: 8,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        backgroundColor: '#f8fafc',
    },
    percentageTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0f172a',
    },
    percentageDescription: {
        fontSize: 13,
        lineHeight: 19,
        color: '#334155',
    },
    percentageRow: {
        gap: 2,
        paddingVertical: 4,
    },
    percentageRowPrimary: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    percentageRowSecondary: {
        fontSize: 13,
        lineHeight: 18,
        color: '#475569',
    },
    percentageHelper: {
        fontSize: 12,
        lineHeight: 18,
        color: '#64748b',
    },
    substitutionBox: {
        gap: 6,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        backgroundColor: '#f9fafb',
    },
    substitutionLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
    substitutionPickerShell: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(17,24,39,0.14)',
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    substitutionPicker: {
        height: 46,
    },
    substitutionHelper: {
        fontSize: 13,
        lineHeight: 19,
        color: '#4b5563',
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
    assessmentSaved: {
        fontSize: 13,
        lineHeight: 18,
        color: '#1d4ed8',
    },
    exerciseTabs: {
        gap: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    tabsLabel: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
    tabsScroller: {
        flexGrow: 0,
    },
    tabsContainer: { flexDirection: 'row', gap: 8, paddingRight: 8 },
    tabButton: { borderRadius: 30, height: 140, width:120, },
    tabButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
    tabButtonText: { flexDirection: 'column', gap: 2 },
    tabButtonName: { fontSize: 13, fontWeight: '600' },
    tabButtonSets: { fontSize: 11, opacity: 0.7 },
    tabButtonActive: { backgroundColor:  '#747474' },
    tabButtonInactive: { backgroundColor: 'rgba(0,0,0,0.05)' },
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
        gap: 8,
        marginTop: 4,
    },
    exerciseSectionDivider: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.12)',
    },
    exerciseSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        opacity: 0.65,
        textTransform: 'uppercase',
    },
    exerciseName: { fontSize: 16, fontWeight: '600' },
    exerciseNotes: { fontSize: 14, opacity: 0.75 },
    exerciseSets: { fontSize: 16, fontWeight: '600', minWidth: 70, textAlign: 'right' },
});
