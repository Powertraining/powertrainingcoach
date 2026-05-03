import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import StandardText from "../components/textComponents/StandardText.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import {
  getExercisePerformanceTarget,
  getExerciseStrengthAssessment,
  getTrainingDayLabel,
  normalizeExercise,
} from "../services/utils/trainingPlan.js";
import {
  getStrengthAssessmentMethodLabel,
  getStrengthAssessmentRequirements,
} from "../services/utils/strengthAssessment.js";

function getExerciseDisplayName(exercise = {}) {
  return String(exercise.name || "").replace(/^\s*\d+[a-z]?\.\s*/i, "");
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

function getTrackedResultsFromDrafts(drafts = {}) {
  return Object.values(drafts).filter((draft) =>
    draft?.loadKg || draft?.reps || draft?.rpe
  );
}

export default function ActiveSessionView({
  day,
  exercises = [],
  initialPerformanceResults = [],
  initialAssessmentResults = [],
  onBack,
  onFinish,
}) {
  const normalizedExercises = Array.isArray(exercises)
    ? exercises.map((exercise) => normalizeExercise(exercise))
    : [];
  const [trackingDrafts, setTrackingDrafts] = useState(() =>
    buildTrackingDrafts(
      normalizedExercises,
      initialPerformanceResults,
      initialAssessmentResults
    )
  );
  const dayLabel = getTrainingDayLabel(day);

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
        <View style={styles.header}>
          <View>
            <StandardText style={styles.eyebrow}>Active session</StandardText>
            <StandardText style={styles.title}>{dayLabel}</StandardText>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <StandardText style={styles.backButtonText}>Back</StandardText>
          </TouchableOpacity>
        </View>

        <View style={styles.exerciseList}>
          {normalizedExercises.map((exercise, exerciseIndex) => {
            const performanceTarget = getExercisePerformanceTarget(exercise);
            const strengthAssessment = getExerciseStrengthAssessment(exercise);
            const strengthRequirements = strengthAssessment
              ? getStrengthAssessmentRequirements(strengthAssessment.method)
              : null;
            const requiresReps = Boolean(
              performanceTarget || strengthRequirements?.requiresReps
            );
            const requiresRpe = Boolean(
              performanceTarget || strengthRequirements?.requiresRpe
            );
            const draft = trackingDrafts[exerciseIndex] || {
              exerciseIndex,
              loadKg: "",
              reps: "",
              rpe: "",
            };
            const isTracked = Boolean(performanceTarget || strengthAssessment);

            return (
              <View key={`${exercise.name}-${exerciseIndex}`} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <Text style={styles.exerciseIndex}>{exerciseIndex + 1}</Text>
                  <View style={styles.exerciseTitleBlock}>
                    <Text style={styles.exerciseName}>{getExerciseDisplayName(exercise)}</Text>
                    <Text style={styles.exercisePrescription}>
                      {exercise.sets ? `${exercise.sets} x ` : ""}
                      {exercise.reps || ""}
                    </Text>
                  </View>
                </View>

                {exercise.notes ? (
                  <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                ) : null}

                {isTracked ? (
                  <View style={styles.trackedBox}>
                    <View style={styles.trackedHeader}>
                      <Text style={styles.trackedTitle}>Tracked top set</Text>
                      {strengthAssessment ? (
                        <Text style={styles.trackedTag}>
                          {getStrengthAssessmentMethodLabel(strengthAssessment.method)}
                        </Text>
                      ) : performanceTarget ? (
                        <Text style={styles.trackedTag}>
                          {performanceTarget.strategy.replace(/_/g, " ")}
                        </Text>
                      ) : null}
                    </View>
                    {performanceTarget?.prompt ? (
                      <Text style={styles.trackedPrompt}>{performanceTarget.prompt}</Text>
                    ) : null}
                    {strengthAssessment?.prompt &&
                    strengthAssessment.prompt !== performanceTarget?.prompt ? (
                      <Text style={styles.trackedPrompt}>{strengthAssessment.prompt}</Text>
                    ) : null}
                    <View style={styles.inputRow}>
                      <View style={styles.inputField}>
                        <Text style={styles.inputLabel}>
                          {strengthRequirements?.loadLabel || "Load used (kg)"}
                        </Text>
                        <TextInput
                          value={draft.loadKg}
                          onChangeText={(value) =>
                            updateTrackingDraft(exerciseIndex, "loadKg", value)
                          }
                          keyboardType="decimal-pad"
                          placeholder="e.g. 150"
                          style={styles.input}
                        />
                      </View>
                      {requiresReps ? (
                        <View style={styles.inputField}>
                          <Text style={styles.inputLabel}>
                            {strengthRequirements?.repsLabel || "Reps completed"}
                          </Text>
                          <TextInput
                            value={draft.reps}
                            onChangeText={(value) =>
                              updateTrackingDraft(exerciseIndex, "reps", value)
                            }
                            keyboardType="number-pad"
                            placeholder="2-5"
                            style={styles.input}
                          />
                        </View>
                      ) : null}
                      {requiresRpe ? (
                        <View style={styles.inputField}>
                          <Text style={styles.inputLabel}>
                            {strengthRequirements?.rpeLabel || "RPE"}
                          </Text>
                          <TextInput
                            value={draft.rpe}
                            onChangeText={(value) =>
                              updateTrackingDraft(exerciseIndex, "rpe", value)
                            }
                            keyboardType="decimal-pad"
                            placeholder="8-9"
                            style={styles.input}
                          />
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {onFinish ? (
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => onFinish(getTrackedResultsFromDrafts(trackingDrafts))}
          >
            <StandardText style={styles.finishButtonText}>Complete session</StandardText>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  eyebrow: {
    color: "#7E7E7E",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  exerciseList: {
    gap: 14,
  },
  exerciseCard: {
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#5A5A5A",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  exerciseIndex: {
    color: "#7E7E7E",
    fontSize: 14,
    fontWeight: "700",
    minWidth: 24,
  },
  exerciseTitleBlock: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  exercisePrescription: {
    color: "#7E7E7E",
    fontSize: 15,
  },
  exerciseNotes: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 20,
  },
  trackedBox: {
    gap: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#101010",
  },
  trackedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  trackedTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  trackedTag: {
    color: "#7E7E7E",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  trackedPrompt: {
    color: "#d1d5db",
    fontSize: 13,
    lineHeight: 18,
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
    color: "#7E7E7E",
    fontSize: 12,
    fontWeight: "700",
  },
  input: {
    minHeight: 42,
    borderRadius: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#111827",
  },
  finishButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
    backgroundColor: "#fff",
  },
  finishButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "700",
  },
});
