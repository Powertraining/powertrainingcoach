import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from "react-native";
import { Picker } from "@react-native-picker/picker";
import QuestionnaireShell from "./QuestionnaireShell.jsx";
import {
    getExerciseStrengthAssessment,
    getExerciseSubstitutionOptions,
    getTrainingDayLabel,
    getTrainingDayPreferredWeekday,
    normalizeExercise,
} from "../../services/utils/trainingPlan.js";
import {
    getStrengthAssessmentMethodLabel,
    getStrengthAssessmentRequirements,
} from "../../services/utils/strengthAssessment.js";

function buildAssessmentDrafts(exercises = [], initialAssessmentResults = []) {
    const drafts = {};
    const normalizedResults = Array.isArray(initialAssessmentResults)
        ? initialAssessmentResults
        : [];

    normalizedResults.forEach((result) => {
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
        if (!strengthAssessment) {
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

export default function DayDetailView({
    week,
    day,
    preferredWeekday,
    sessionLabel,
    status = "pending",
    rescueMode = "",
    adjustmentSummary = "",
    exercises = [],
    initialAssessmentResults = [],
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
    const [assessmentDrafts, setAssessmentDrafts] = useState(() =>
        buildAssessmentDrafts(normalizedExercises, initialAssessmentResults)
    );
    const activeExerciseIndex = Math.min(
        selectedExerciseIndex,
        Math.max(normalizedExercises.length - 1, 0)
    );

    useEffect(() => {
        setAssessmentDrafts(
            buildAssessmentDrafts(normalizedExercises, initialAssessmentResults)
        );
    }, [initialAssessmentResults, normalizedExercises]);

    const resolvedDay =
        day && typeof day === "object"
            ? day
            : { day, preferredWeekday, sessionLabel, status, rescueMode, adjustmentSummary };
    const dayLabel = getTrainingDayLabel(resolvedDay);
    const preferredWeekdayLabel = getTrainingDayPreferredWeekday(resolvedDay);
    const selectedExercise = normalizedExercises[activeExerciseIndex];
    const substitutionOptions = selectedExercise
        ? getExerciseSubstitutionOptions(selectedExercise)
        : [];
    const summaryText = selectedExercise
        ? `${selectedExercise.name} – ${selectedExercise.sets} x ${selectedExercise.reps}`
        : `No exercises available for ${dayLabel} yet.`;
    const isSkipped = status === "skipped";
    const isRescheduled = status === "rescheduled";
    const assessmentExercises = normalizedExercises
        .map((exercise, exerciseIndex) => ({
            exercise,
            exerciseIndex,
            strengthAssessment: getExerciseStrengthAssessment(exercise),
        }))
        .filter((item) => item.strengthAssessment);
    const savedAssessmentResults = new Map(
        (Array.isArray(initialAssessmentResults) ? initialAssessmentResults : [])
            .filter((result) => Number.isInteger(result?.exerciseIndex))
            .map((result) => [result.exerciseIndex, result])
    );

    function updateAssessmentDraft(exerciseIndex, field, value) {
        setAssessmentDrafts((currentDrafts) => ({
            ...currentDrafts,
            [exerciseIndex]: {
                exerciseIndex,
                ...(currentDrafts[exerciseIndex] || {}),
                [field]: value,
            },
        }));
    }

    return (
        <QuestionnaireShell>
            <ScrollView contentContainerStyle={styles.center}>
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.heading}>
                            <Text style={styles.eyebrow}>Suggested workout</Text>
                            <Text style={styles.title}>{dayLabel} • Week {week}</Text>
                            {preferredWeekdayLabel ? (
                                <Text style={styles.scheduleHint}>
                                    Preferred {preferredWeekdayLabel}
                                </Text>
                            ) : null}
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
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
                                        assessmentExercises.map(({ exerciseIndex }) => ({
                                            exerciseIndex,
                                            ...(assessmentDrafts[exerciseIndex] || {
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
                        <View style={styles.tabsContainer}>
                            {normalizedExercises.map((ex, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.tabButton, i === activeExerciseIndex ? styles.tabButtonActive : styles.tabButtonInactive]}
                                    onPress={() => setSelectedExerciseIndex(i)}
                                >
                                    <View style={styles.tabButtonContent}>
                                        <View style={styles.tabButtonNumber}>
                                            <Text style={{ fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                                        </View>
                                        <View style={styles.tabButtonText}>
                                            <Text style={styles.tabButtonName}>{ex.name}</Text>
                                            <Text style={styles.tabButtonSets}>{ex.sets} x {ex.reps}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {assessmentExercises.length > 0 ? (
                        <View style={styles.assessmentBox}>
                            <Text style={styles.assessmentTitle}>Strength check-in</Text>
                            <Text style={styles.assessmentDescription}>
                                This session includes a tracked top set. Save the result here so future percentage-based loading can adapt.
                            </Text>
                            {assessmentExercises.map(({ exercise, exerciseIndex, strengthAssessment }) => {
                                const requirements = getStrengthAssessmentRequirements(
                                    strengthAssessment.method
                                );
                                const draft = assessmentDrafts[exerciseIndex] || {
                                    exerciseIndex,
                                    loadKg: "",
                                    reps: "",
                                    rpe: "",
                                };
                                const savedResult = savedAssessmentResults.get(exerciseIndex);

                                return (
                                    <View
                                        key={`strength-assessment-${exerciseIndex}`}
                                        style={styles.assessmentCard}
                                    >
                                        <View style={styles.assessmentHeader}>
                                            <Text style={styles.assessmentLiftName}>
                                                {strengthAssessment.liftName || exercise.name}
                                            </Text>
                                            <Text style={styles.assessmentMethodTag}>
                                                {getStrengthAssessmentMethodLabel(
                                                    strengthAssessment.method
                                                )}
                                            </Text>
                                        </View>
                                        <Text style={styles.assessmentPrompt}>
                                            {strengthAssessment.prompt}
                                        </Text>
                                        <View style={styles.assessmentInputRow}>
                                            <View style={styles.assessmentField}>
                                                <Text style={styles.assessmentFieldLabel}>
                                                    {requirements.loadLabel}
                                                </Text>
                                                <TextInput
                                                    value={draft.loadKg}
                                                    onChangeText={(value) =>
                                                        updateAssessmentDraft(
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

                                            {requirements.requiresReps ? (
                                                <View style={styles.assessmentField}>
                                                    <Text style={styles.assessmentFieldLabel}>
                                                        {requirements.repsLabel}
                                                    </Text>
                                                    <TextInput
                                                        value={draft.reps}
                                                        onChangeText={(value) =>
                                                            updateAssessmentDraft(
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

                                            {requirements.requiresRpe ? (
                                                <View style={styles.assessmentField}>
                                                    <Text style={styles.assessmentFieldLabel}>
                                                        {requirements.rpeLabel}
                                                    </Text>
                                                    <TextInput
                                                        value={draft.rpe}
                                                        onChangeText={(value) =>
                                                            updateAssessmentDraft(
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
                                        {savedResult ? (
                                            <Text style={styles.assessmentSaved}>
                                                Saved estimate: {savedResult.estimatedOneRepMaxKg} kg 1RM, {savedResult.trainingMaxKg} kg training max.
                                            </Text>
                                        ) : (
                                            <Text style={styles.assessmentSaved}>
                                                Leave blank if you did not perform the assessment today.
                                            </Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ) : null}

                    <View style={styles.listBlock}>
                        <Text style={styles.listLabel}>Complete workout breakdown:</Text>
                        {normalizedExercises.map((ex, i) => (
                            <View key={i} style={styles.exerciseRow}>
                                <View>
                                    <Text style={styles.exerciseName}>{ex.name}</Text>
                                    {ex.notes ? <Text style={styles.exerciseNotes}>{ex.notes}</Text> : null}
                                </View>
                                <Text style={styles.exerciseSets}>{ex.sets} x {ex.reps}</Text>
                            </View>
                        ))}
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
    tabsContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    tabButton: { borderRadius: 10 },
    tabButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
    tabButtonNumber: { alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6 },
    tabButtonText: { flexDirection: 'column', gap: 2 },
    tabButtonName: { fontSize: 13, fontWeight: '600' },
    tabButtonSets: { fontSize: 11, opacity: 0.7 },
    tabButtonActive: { backgroundColor: '#111' },
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
    exerciseName: { fontSize: 16, fontWeight: '600' },
    exerciseNotes: { fontSize: 14, opacity: 0.75 },
    exerciseSets: { fontSize: 16, fontWeight: '600', minWidth: 70, textAlign: 'right' },
});
