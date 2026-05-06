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
        };
      }
    });
  });

  return drafts;
}

function getTrackedResultsFromDrafts(drafts = {}) {
  return Object.values(drafts)
    .filter((draft) => draft?.loadKg || draft?.reps || draft?.rpe)
    .sort((left, right) => {
      const exerciseOrder = (left.exerciseIndex || 0) - (right.exerciseIndex || 0);

      if (exerciseOrder !== 0) {
        return exerciseOrder;
      }

      return (left.setIndex || 0) - (right.setIndex || 0);
    });
}

function ExerciseSessionStep({
  exercise,
  exerciseIndex,
  setIndex,
  setCount,
  stepIndex,
  stepCount,
  exerciseCount,
  draft,
  prescribedSets,
  onSelectSet,
  onBack,
  onNext,
  onDraftChange,
  isLastStep,
}) {
  const performanceTarget = getExercisePerformanceTarget(exercise);
  const strengthAssessment = getExerciseStrengthAssessment(exercise);
  const strengthRequirements = strengthAssessment
    ? getStrengthAssessmentRequirements(strengthAssessment.method)
    : null;
  const inputDraft = draft || {
    exerciseIndex,
    setIndex,
    loadKg: "",
    reps: "",
    rpe: "",
  };

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Exercise {exerciseIndex + 1} of {exerciseCount} | Set {setIndex + 1} of {setCount}
        </Text>
        <Text style={styles.progressSubText}>
          Step {stepIndex + 1} of {stepCount}
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

      {setCount > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.setTabsContainer}
        >
          {prescribedSets.map((prescribedSet) => {
            const isActive = prescribedSet.setIndex === setIndex;

            return (
              <TouchableOpacity
                key={prescribedSet.setIndex}
                style={[
                  styles.setTabButton,
                  isActive ? styles.setTabButtonActive : styles.setTabButtonInactive,
                ]}
                onPress={() => onSelectSet(prescribedSet.setIndex)}
              >
                <StandardText
                  style={[
                    styles.setTabButtonText,
                    isActive ? styles.setTabButtonTextActive : styles.setTabButtonTextInactive,
                  ]}
                >
                  Set {prescribedSet.setIndex + 1}
                </StandardText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
        <Text style={styles.inputPanelSubtitle}>
          Prescribed set {setIndex + 1}; log only what happened for this set.
        </Text>
        <View style={styles.inputRow}>
          <View style={styles.inputField}>
            <Text style={styles.inputLabel}>
              {strengthRequirements?.loadLabel || "Load used (kg)"}
            </Text>
            <TextInput
              value={inputDraft.loadKg}
              onChangeText={(value) => onDraftChange(exerciseIndex, setIndex, "loadKg", value)}
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
              onChangeText={(value) => onDraftChange(exerciseIndex, setIndex, "reps", value)}
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
              onChangeText={(value) => onDraftChange(exerciseIndex, setIndex, "rpe", value)}
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
            {isLastStep ? "Complete session" : "Complete set"}
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
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [trackingDrafts, setTrackingDrafts] = useState(() =>
    buildTrackingDrafts(
      normalizedExercises,
      initialPerformanceResults,
      initialAssessmentResults
    )
  );
  const dayLabel = getTrainingDayLabel(day);
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
    setTrackingDrafts(
      buildTrackingDrafts(
        normalizedExercises,
        initialPerformanceResults,
        initialAssessmentResults
      )
    );
  }, [initialAssessmentResults, initialPerformanceResults, normalizedExercises]);

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

  function updateTrackingDraft(exerciseIndex, setIndex, field, value) {
    const draftKey = getDraftKey(exerciseIndex, setIndex);

    setTrackingDrafts((currentDrafts) => ({
      ...currentDrafts,
      [draftKey]: {
        exerciseIndex,
        setIndex,
        ...(currentDrafts[draftKey] || {}),
        [field]: value,
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

  function handleBack() {
    if (resolvedActiveStepIndex > 0) {
      goToStep(resolvedActiveStepIndex - 1);
      return;
    }

    onBack?.();
  }

  function handleCompleteCurrentSet() {
    if (!isLastStep) {
      goToStep(resolvedActiveStepIndex + 1);
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
            key={`${activeExercise.name}-${activeStep.exerciseIndex}-${activeStep.setIndex}`}
            exercise={activeExercise}
            exerciseIndex={activeStep.exerciseIndex}
            setIndex={activeStep.setIndex}
            setCount={activeStep.setCount}
            stepIndex={resolvedActiveStepIndex}
            stepCount={sessionSteps.length}
            exerciseCount={normalizedExercises.length}
            draft={trackingDrafts[getDraftKey(activeStep.exerciseIndex, activeStep.setIndex)]}
            prescribedSets={activeExerciseSetTabs}
            onSelectSet={(setIndex) => {
              setActiveExerciseIndex(activeStep.exerciseIndex);
              setActiveSetIndex(setIndex);
            }}
            onBack={handleBack}
            onNext={handleCompleteCurrentSet}
            onDraftChange={updateTrackingDraft}
            isLastStep={isLastStep}
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
  progressSubText: {
    color: "#9ca3af",
    fontSize: 12,
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
  inputPanelSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 18,
  },
  setTabsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  setTabButton: {
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  setTabButtonActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  setTabButtonInactive: {
    backgroundColor: "#101010",
    borderColor: "#374151",
  },
  setTabButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  setTabButtonTextActive: {
    color: "#111827",
  },
  setTabButtonTextInactive: {
    color: "#fff",
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
