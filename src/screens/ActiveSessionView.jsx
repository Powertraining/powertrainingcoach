import { useEffect, useMemo, useState } from "react";
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

function ExerciseSessionStep({
  exercise,
  exerciseIndex,
  exerciseCount,
  draft,
  onBack,
  onNext,
  onDraftChange,
  isLastExercise,
}) {
  const performanceTarget = getExercisePerformanceTarget(exercise);
  const strengthAssessment = getExerciseStrengthAssessment(exercise);
  const strengthRequirements = strengthAssessment
    ? getStrengthAssessmentRequirements(strengthAssessment.method)
    : null;
  const inputDraft = draft || {
    exerciseIndex,
    loadKg: "",
    reps: "",
    rpe: "",
  };

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Exercise {exerciseIndex + 1} of {exerciseCount}
        </Text>
      </View>

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

      {(performanceTarget || strengthAssessment) ? (
        <View style={styles.trackedBox}>
          <View style={styles.trackedHeader}>
            <Text style={styles.trackedTitle}>Tracking target</Text>
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
        </View>
      ) : null}

      <View style={styles.inputPanel}>
        <Text style={styles.inputPanelTitle}>Exercise inputs</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>
              {strengthRequirements?.loadLabel || "Load used (kg)"}
            </Text>
            <TextInput
              value={inputDraft.loadKg}
              onChangeText={(value) => onDraftChange(exerciseIndex, "loadKg", value)}
              keyboardType="decimal-pad"
              placeholder="e.g. 150"
              style={styles.input}
            />
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>
              {strengthRequirements?.repsLabel || "Reps completed"}
            </Text>
            <TextInput
              value={inputDraft.reps}
              onChangeText={(value) => onDraftChange(exerciseIndex, "reps", value)}
              keyboardType="number-pad"
              placeholder={strengthAssessment ? "2-5" : "e.g. 8"}
              style={styles.input}
            />
          </View>

          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>
              {strengthRequirements?.rpeLabel || "RPE"}
            </Text>
            <TextInput
              value={inputDraft.rpe}
              onChangeText={(value) => onDraftChange(exerciseIndex, "rpe", value)}
              keyboardType="decimal-pad"
              placeholder="8-9"
              style={styles.input}
            />
          </View>
        </View>
      </View>

      <View style={styles.navigationRow}>
        <TouchableOpacity style={styles.stepBackButton} onPress={onBack}>
          <StandardText style={styles.stepBackButtonText}>Back</StandardText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <StandardText style={styles.nextButtonText}>
            {isLastExercise ? "Complete session" : "Complete exercise"}
          </StandardText>
        </TouchableOpacity>
      </View>
    </View>
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
  const normalizedExercises = useMemo(
    () =>
      Array.isArray(exercises)
        ? exercises.map((exercise) => normalizeExercise(exercise))
        : [],
    [exercises]
  );
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [trackingDrafts, setTrackingDrafts] = useState(() =>
    buildTrackingDrafts(
      normalizedExercises,
      initialPerformanceResults,
      initialAssessmentResults
    )
  );
  const dayLabel = getTrainingDayLabel(day);
  const activeExercise = normalizedExercises[activeExerciseIndex] || null;
  const isLastExercise = activeExerciseIndex >= normalizedExercises.length - 1;

  useEffect(() => {
    setTrackingDrafts(
      buildTrackingDrafts(
        normalizedExercises,
        initialPerformanceResults,
        initialAssessmentResults
      )
    );
  }, [initialAssessmentResults, initialPerformanceResults, normalizedExercises]);

  useEffect(() => {
    setActiveExerciseIndex((currentIndex) =>
      Math.min(currentIndex, Math.max(normalizedExercises.length - 1, 0))
    );
  }, [normalizedExercises.length]);

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

  function handleBack() {
    if (activeExerciseIndex > 0) {
      setActiveExerciseIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    onBack?.();
  }

  function handleCompleteCurrentExercise() {
    if (!isLastExercise) {
      setActiveExerciseIndex((currentIndex) =>
        Math.min(currentIndex + 1, normalizedExercises.length - 1)
      );
      return;
    }

    onFinish?.(getTrackedResultsFromDrafts(trackingDrafts));
  }

  return (
    <QuestionnaireShell hideTabBar={true}>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.header}>
          <View>
            <StandardText style={styles.eyebrow}>Active session</StandardText>
            <StandardText style={styles.title}>{dayLabel}</StandardText>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <StandardText style={styles.backButtonText}>Back</StandardText>
          </TouchableOpacity>
        </View>

        {activeExercise ? (
          <ExerciseSessionStep
            key={`${activeExercise.name}-${activeExerciseIndex}`}
            exercise={activeExercise}
            exerciseIndex={activeExerciseIndex}
            exerciseCount={normalizedExercises.length}
            draft={trackingDrafts[activeExerciseIndex]}
            onBack={handleBack}
            onNext={handleCompleteCurrentExercise}
            onDraftChange={updateTrackingDraft}
            isLastExercise={isLastExercise}
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
  exerciseCard: {
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#5A5A5A",
  },
  progressRow: {
    alignItems: "flex-start",
  },
  progressText: {
    color: "#7E7E7E",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
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
  inputPanel: {
    gap: 10,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#101010",
  },
  inputPanelTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
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
  navigationRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  stepBackButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "#5A5A5A",
    paddingHorizontal: 20,
  },
  stepBackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
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
    fontSize: 18,
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
