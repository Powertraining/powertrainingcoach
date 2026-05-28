import {
  useEffect,
  useMemo,
  useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

import {
  buildTrainingCheckInRecommendation,
  TRAINING_CHECK_IN_FIELD_OPTIONS,
} from "../services/utils/trainingCheckIn.js";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
const DEFAULT_ANSWERS = Object.freeze({
  progress: "not_sure",
  fatigue: "normal",
  enjoyment: "ok",
  pain: "none",
});

function ChoiceGroup({ label, value, options, onChange }) {
  return (
    <View style={styles.group}>
      <IBMPlexText style={styles.groupLabel}>{label}</IBMPlexText>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.choiceChip, selected && styles.choiceChipSelected]}
            >
              <IBMPlexText
                style={[
                  styles.choiceChipText,
                  selected && styles.choiceChipTextSelected,
                ]}
              >
                {option.label}
              </IBMPlexText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TrainingCheckInCard({
  prompt,
  questionnaire,
  plan,
  completedDays,
  isSubmitting = false,
  onSubmit,
}) {
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);

  useEffect(() => {
    setAnswers(DEFAULT_ANSWERS);
  }, [prompt?.type, prompt?.weekNumber]);

  const recommendation = useMemo(
    () =>
      buildTrainingCheckInRecommendation({
        prompt,
        questionnaire,
        plan,
        completedDays,
        answers,
        objectiveSummary: prompt?.objectiveSummary,
      }),
    [answers, completedDays, plan, prompt, questionnaire]
  );

  if (!prompt || !recommendation) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <IBMPlexText style={styles.eyebrow}>{prompt.type === "end_of_block" ? "Block Review" : "Weekly Review"}</IBMPlexText>
        <IBMPlexText style={styles.title}>{prompt.title}</IBMPlexText>
        <IBMPlexText style={styles.description}>{prompt.summary}</IBMPlexText>
      </View>

      {prompt.objectiveSummary?.summary ? (
        <View style={styles.detectedBox}>
          <IBMPlexText style={styles.detectedTitle}>What the app detected</IBMPlexText>
          <IBMPlexText style={styles.detectedText}>{prompt.objectiveSummary.summary}</IBMPlexText>
        </View>
      ) : null}

      <ChoiceGroup
        label="Progress"
        value={answers.progress}
        options={TRAINING_CHECK_IN_FIELD_OPTIONS.progress}
        onChange={(value) => setAnswers((current) => ({ ...current, progress: value }))}
      />

      <ChoiceGroup
        label="Effort / fatigue"
        value={answers.fatigue}
        options={TRAINING_CHECK_IN_FIELD_OPTIONS.fatigue}
        onChange={(value) => setAnswers((current) => ({ ...current, fatigue: value }))}
      />

      <ChoiceGroup
        label="Enjoyment / motivation"
        value={answers.enjoyment}
        options={TRAINING_CHECK_IN_FIELD_OPTIONS.enjoyment}
        onChange={(value) => setAnswers((current) => ({ ...current, enjoyment: value }))}
      />

      <ChoiceGroup
        label="Pain / irritation"
        value={answers.pain}
        options={TRAINING_CHECK_IN_FIELD_OPTIONS.pain}
        onChange={(value) => setAnswers((current) => ({ ...current, pain: value }))}
      />

      <View style={styles.recommendationBox}>
        <IBMPlexText style={styles.recommendationLabel}>Recommended next step</IBMPlexText>
        <IBMPlexText style={styles.recommendationTitle}>
          {recommendation.recommendedAction.label}
        </IBMPlexText>
        <IBMPlexText style={styles.recommendationText}>{recommendation.explanation}</IBMPlexText>
      </View>

      <View style={styles.actionColumn}>
        {recommendation.options.map((option, index) => {
          const recommended =
            option.type === recommendation.recommendedAction.type &&
            (option.targetLoadingStrategy || "") ===
              (recommendation.recommendedAction.targetLoadingStrategy || "");

          return (
            <TouchableOpacity
              key={`${option.type}-${option.targetLoadingStrategy || index}`}
              onPress={() => onSubmit?.({ prompt, answers, action: option })}
              disabled={isSubmitting}
              style={[
                styles.actionButton,
                recommended && styles.actionButtonRecommended,
              ]}
            >
              <IBMPlexText
                style={[
                  styles.actionButtonTitle,
                  recommended && styles.actionButtonTitleRecommended,
                ]}
              >
                {option.label}
                {recommended ? " (Recommended)" : ""}
              </IBMPlexText>
              {option.summary ? (
                <IBMPlexText
                  style={[
                    styles.actionButtonText,
                    recommended && styles.actionButtonTextRecommended,
                  ]}
                >
                  {option.summary}
                </IBMPlexText>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fbff",
    gap: 14,
  },
  header: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 12, fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#1d4ed8",
  },
  title: {
    fontSize: 24, fontWeight: "700",
    color: "#0f172a",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  detectedBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    gap: 4,
  },
  detectedTitle: {
    fontSize: 13, fontWeight: "700",
    color: "#1d4ed8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detectedText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1e3a8a",
  },
  group: {
    gap: 8,
  },
  groupLabel: {
    fontSize: 15, fontWeight: "700",
    color: "#0f172a",
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.14)",
    backgroundColor: "#ffffff",
  },
  choiceChipSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#2563eb",
  },
  choiceChipText: {
    fontSize: 13, fontWeight: "600",
    color: "#334155",
  },
  choiceChipTextSelected: {
    color: "#ffffff",
  },
  recommendationBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#0f172a",
    gap: 4,
  },
  recommendationLabel: {
    fontSize: 12, fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.9,
    color: "#93c5fd",
  },
  recommendationTitle: {
    fontSize: 18, fontWeight: "700",
    color: "#ffffff",
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#cbd5e1",
  },
  actionColumn: {
    gap: 10,
  },
  actionButton: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.12)",
    backgroundColor: "#ffffff",
    gap: 4,
  },
  actionButtonRecommended: {
    borderColor: "#1d4ed8",
    backgroundColor: "#eff6ff",
  },
  actionButtonTitle: {
    fontSize: 15, fontWeight: "700",
    color: "#111827",
  },
  actionButtonTitleRecommended: {
    color: "#1d4ed8",
  },
  actionButtonText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#475569",
  },
  actionButtonTextRecommended: {
    color: "#1e40af",
  },
});
