import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import TrainingCheckInCard from "./TrainingCheckInCard.jsx";
import {
  getCurrentTrainingPhase,
  getCurrentTrainingWeek,
  getTrainingDayLabel,
  getTrainingDayPreferredWeekday,
  getTrainingDayStatus,
  getTrainingPlanPhaseOverview,
  getTrainingPlanSpacingAdvisories,
} from "../services/utils/trainingPlan.js";

export default function ProgramOverviewView({
  plan,
  onSelectDay,
  onBack,
  currentDay,
  completedDays,
  pendingTrainingCheckIn,
  onSubmitTrainingCheckIn,
  trainingCheckInSubmitting = false,
  questionnaire,
}) {
  if (!plan) {
    return (
      <QuestionnaireShell>
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>No program yet.</Text>
            <Text style={styles.subtitle}>Generate a plan to see your weekly breakdown.</Text>
          </View>
        </View>
      </QuestionnaireShell>
    );
  }

  const completedDayEntries =
    completedDays instanceof Set
      ? Array.from(completedDays)
      : Array.isArray(completedDays)
        ? completedDays
        : [];
  const completedDaySet = new Set(completedDayEntries);
  const currentWeek = getCurrentTrainingWeek(plan, completedDayEntries);
  const currentPhase = getCurrentTrainingPhase(plan, completedDayEntries);
  const phaseOverview = getTrainingPlanPhaseOverview(plan);
  const spacingAdvisories = getTrainingPlanSpacingAdvisories(plan);
  const visibleWeeks = currentWeek ? [currentWeek] : [];

  function getPhaseRangeLabel(phase = {}) {
    if (phase.weekStart === phase.weekEnd) {
      return `Week ${phase.weekStart}`;
    }

    return `Weeks ${phase.weekStart}-${phase.weekEnd}`;
  }

  return (
    <QuestionnaireShell>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <Text style={styles.title}>Training Program – Overview</Text>
              {plan.summary && <Text style={styles.subtitle}>{plan.summary}</Text>}
            </View>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}
          </View>

          {phaseOverview.length > 0 ? (
            <View style={styles.phaseSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Program Rationale</Text>
                {currentPhase ? (
                  <Text style={styles.sectionBadge}>
                    Current phase: {currentPhase.label}
                  </Text>
                ) : null}
              </View>
              <View style={styles.phaseList}>
                {phaseOverview.map((phase) => {
                  const phaseKey = `${phase.weekStart}-${phase.weekEnd}-${phase.label}`;
                  const isActivePhase =
                    currentPhase &&
                    currentPhase.weekStart === phase.weekStart &&
                    currentPhase.weekEnd === phase.weekEnd &&
                    currentPhase.label === phase.label;

                  return (
                    <View
                      key={phaseKey}
                      style={[
                        styles.phaseCard,
                        isActivePhase && styles.phaseCardActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.phaseRange,
                          isActivePhase && styles.phaseRangeActive,
                        ]}
                      >
                        {getPhaseRangeLabel(phase)}
                      </Text>
                      <Text
                        style={[
                          styles.phaseLabel,
                          isActivePhase && styles.phaseLabelActive,
                        ]}
                      >
                        {phase.label}
                      </Text>
                      {phase.focus ? (
                        <Text
                          style={[
                            styles.phaseFocus,
                            isActivePhase && styles.phaseFocusActive,
                          ]}
                        >
                          {phase.focus}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {pendingTrainingCheckIn ? (
            <TrainingCheckInCard
              prompt={pendingTrainingCheckIn}
              questionnaire={questionnaire}
              plan={plan}
              completedDays={completedDayEntries}
              isSubmitting={trainingCheckInSubmitting}
              onSubmit={onSubmitTrainingCheckIn}
            />
          ) : null}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {currentWeek ? `Current Week: Week ${currentWeek.week}` : "Current Week"}
            </Text>
          </View>

          <View style={styles.weeks}>
            {visibleWeeks.map((week) => {
              const weekSpacingAdvisories = spacingAdvisories.filter(
                (advisory) => advisory.week === week.week
              );

              return (
                <View key={week.week} style={styles.weekBlock}>
                  <Text style={styles.weekHeader}>Week {week.week}</Text>
                  <View style={styles.daysGrid}>
                    {week.days?.map((day) => {
                      const key = `${week.week}-${day.day}`;
                      const isCurrent =
                        currentDay &&
                        currentDay.week === week.week &&
                        currentDay.day === day.day;
                      const isDone = completedDaySet.has(key);
                      const dayStatus = getTrainingDayStatus(day);
                      const isSkipped = dayStatus === "skipped";
                      const isRescheduled = dayStatus === "rescheduled";
                      const dayLabel = getTrainingDayLabel(day);
                      const preferredWeekday = getTrainingDayPreferredWeekday(day);

                      return (
                        <TouchableOpacity
                          key={day.day}
                          onPress={() => onSelectDay(week.week, day.day)}
                          style={[
                            styles.dayButton,
                            isCurrent && !isSkipped && styles.dayButtonCurrent,
                            isDone && styles.dayButtonDone,
                            isSkipped && styles.dayButtonSkipped,
                            isRescheduled && styles.dayButtonRescheduled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              isSkipped && styles.dayButtonSkippedText,
                              isRescheduled && styles.dayButtonRescheduledText,
                              isDone && styles.dayButtonDoneText,
                            ]}
                          >
                            {dayLabel}
                          </Text>
                          {preferredWeekday ? (
                            <Text
                              style={[
                                styles.dayPreferenceText,
                                (isSkipped || isRescheduled) &&
                                  styles.dayPreferenceTextMuted,
                              ]}
                            >
                              Preferred {preferredWeekday}
                            </Text>
                          ) : null}
                          {isDone && <Text style={styles.doneTag}>Finished</Text>}
                          {!isDone && !isSkipped && isCurrent && (
                            <Text style={styles.currentTag}>Current</Text>
                          )}
                          {!isDone && isSkipped && (
                            <Text style={styles.skippedTag}>Skipped</Text>
                          )}
                          {!isDone && !isSkipped && isRescheduled && (
                            <Text style={styles.rescheduledTag}>Rescheduled</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {weekSpacingAdvisories.length > 0 ? (
                    <View style={styles.spacingBox}>
                      <Text style={styles.spacingTitle}>Spacing advisory</Text>
                      {weekSpacingAdvisories.map((advisory) => (
                        <Text key={advisory.key} style={styles.spacingText}>
                          {advisory.message}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 960,
    padding: 26,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "white",
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  header: {
    flex: 1,
    gap: 6,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111",
  },
  backButtonText: {
    fontSize: 16,
    color: "#111",
    fontWeight: "500",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 24,
  },
  weeks: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  sectionBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#065f46",
    backgroundColor: "#d1fae5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  phaseSection: {
    gap: 12,
  },
  phaseList: {
    gap: 10,
  },
  phaseCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#f9fafb",
    gap: 6,
  },
  phaseCardActive: {
    borderColor: "#10b981",
    backgroundColor: "#ecfdf5",
  },
  phaseRange: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  phaseRangeActive: {
    color: "#047857",
  },
  phaseLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  phaseLabelActive: {
    color: "#065f46",
  },
  phaseFocus: {
    fontSize: 14,
    lineHeight: 21,
    color: "#374151",
  },
  phaseFocusActive: {
    color: "#065f46",
  },
  weekBlock: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#f9f9f9",
    gap: 10,
  },
  weekHeader: {
    fontSize: 18,
    fontWeight: "700",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#111",
    backgroundColor: "#111",
    minWidth: 100,
    alignItems: "center",
  },
  dayButtonCurrent: {
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  dayButtonDone: {
    borderColor: "#6b7280",
    backgroundColor: "#1f2937",
  },
  dayButtonSkipped: {
    borderColor: "#9ca3af",
    backgroundColor: "#f3f4f6",
  },
  dayButtonRescheduled: {
    borderColor: "#0f766e",
    backgroundColor: "#ecfeff",
  },
  dayButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  dayPreferenceText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 4,
  },
  dayPreferenceTextMuted: {
    color: "#6b7280",
  },
  spacingBox: {
    marginTop: 2,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb",
    gap: 6,
  },
  spacingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#92400e",
  },
  spacingText: {
    fontSize: 13,
    lineHeight: 19,
    color: "#78350f",
  },
  dayButtonDoneText: {
    color: "#e5e7eb",
  },
  dayButtonSkippedText: {
    color: "#374151",
  },
  dayButtonRescheduledText: {
    color: "#134e4a",
  },
  currentTag: {
    fontSize: 10,
    color: "#10b981",
    marginTop: 4,
    fontWeight: "700",
  },
  doneTag: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 4,
    fontWeight: "700",
  },
  skippedTag: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "700",
  },
  rescheduledTag: {
    fontSize: 10,
    color: "#0f766e",
    marginTop: 4,
    fontWeight: "700",
  },
});
