import { useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import StandardText from "../components/textComponents/StandardText.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import TrainingCheckInCard from "./TrainingCheckInCard.jsx";
import {
  getCurrentTrainingPhase,
  getCurrentTrainingWeek,
  getTrainingDayLabel,
  getTrainingDayPreferredWeekday,
  getTrainingPlanPhaseOverview,
} from "../services/utils/trainingPlan.js";

const WEEKDAY_NAMES = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

export default function ProgramOverviewView({
  plan,
  onSelectDay,
  completedDays,
  pendingTrainingCheckIn,
  onSubmitTrainingCheckIn,
  trainingCheckInSubmitting = false,
  questionnaire,
}) {
  const [detailsVisible, setDetailsVisible] = useState(false);

  if (!plan) {
    return (
      <QuestionnaireShell hideTabBar={false}>
        <View style={styles.center}>
          <View style={styles.card}>
            <StandardText style={styles.title} textColor="#111">
              No program yet.
            </StandardText>
            <StandardText style={styles.subtitle} textColor="#111">
              Generate a plan to see your weekly breakdown.
            </StandardText>
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
  const currentWeek = getCurrentTrainingWeek(plan, completedDayEntries);
  const currentPhase = getCurrentTrainingPhase(plan, completedDayEntries);
  const phaseOverview = getTrainingPlanPhaseOverview(plan);
  const currentDateLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date());
  const currentPhaseLabel = currentPhase?.label
    ? `${currentPhase.label} week ${currentWeek?.week || 1}`
    : `Week ${currentWeek?.week || 1}`;
  const parsedPlanStartDate = new Date(plan.createdAt || plan.generatedAt || Date.now());
  const planStartDate = Number.isNaN(parsedPlanStartDate.getTime())
    ? new Date()
    : parsedPlanStartDate;
  const rollingDates = Array.from({ length: 7 }, (_, dayOffset) => {
    const date = new Date(planStartDate);
    date.setDate(date.getDate() + dayOffset);

    return date;
  });
  const assignedTrainingDays = new Set();
  const currentWeekSchedule = rollingDates.map((date) => {
    const weekday = WEEKDAY_NAMES[date.getDay()];
    const trainingDay = currentWeek?.days?.find((day) => {
      if (assignedTrainingDays.has(day)) {
        return false;
      }

      return getTrainingDayPreferredWeekday(day) === weekday;
    });

    if (trainingDay) {
      assignedTrainingDays.add(trainingDay);
    }

    return { date, weekday, trainingDay };
  });

  currentWeek?.days
    ?.filter((day) => !assignedTrainingDays.has(day))
    .forEach((day) => {
      const restSlot = currentWeekSchedule.find((slot) => !slot.trainingDay);

      if (restSlot) {
        restSlot.trainingDay = day;
        assignedTrainingDays.add(day);
      }
    });

  function getPhaseRangeLabel(phase = {}) {
    if (phase.weekStart === phase.weekEnd) {
      return `Week ${phase.weekStart}`;
    }

    return `Weeks ${phase.weekStart}-${phase.weekEnd}`;
  }

  return (
    <QuestionnaireShell hideTabBar={false}>
      <ScrollView contentContainerStyle={styles.center}>
        <View style={styles.header}>
          <StandardText style={styles.headerDate}>{currentDateLabel}</StandardText>
          <StandardText style={styles.headerPhase}>{currentPhaseLabel}</StandardText>
          <TouchableOpacity
            style={styles.headerDetailsButton}
            onPress={() => setDetailsVisible((visible) => !visible)}
          >
            <StandardText style={styles.headerDetailsButtonText}>
              {detailsVisible ? "Hide details" : "Details"}
            </StandardText>
          </TouchableOpacity>
          {detailsVisible ? (
            <View style={styles.detailsCard}>
              {plan.summary ? (
                <StandardText style={styles.detailText} textColor="#111">
                  {plan.summary}
                </StandardText>
              ) : null}
              {phaseOverview.map((phase) => (
                <View
                  key={`${phase.weekStart}-${phase.weekEnd}-${phase.label}`}
                  style={styles.phaseDetail}
                >
                  <StandardText style={styles.phaseRange} textColor="#6b7280">
                    {getPhaseRangeLabel(phase)}
                  </StandardText>
                  <StandardText style={styles.phaseLabel} textColor="#111">
                    {phase.label}
                  </StandardText>
                  {phase.focus ? (
                    <StandardText style={styles.detailText} textColor="#374151">
                      {phase.focus}
                    </StandardText>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekScheduleScroller}
            contentContainerStyle={styles.weekSchedule}
          >
            {currentWeekSchedule.map(({ date, weekday, trainingDay }) => (
              <View key={date.toISOString()} style={styles.weekScheduleItem}>
                <TouchableOpacity
                  disabled={!trainingDay}
                  onPress={() => onSelectDay(currentWeek.week, trainingDay.day)}
                  style={[
                    styles.weekScheduleDay,
                    trainingDay && styles.weekScheduleTrainingDay,
                  ]}
                >
                  <StandardText style={styles.weekScheduleLabel}>
                    {trainingDay ? `Day ${trainingDay.day}` : "Rest"}
                  </StandardText>
                </TouchableOpacity>
                <StandardText style={styles.weekScheduleDate}>
                  {weekday.slice(0, 3)}
                  {"\n"}
                  {date.getDate()}
                </StandardText>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.headerStartButton}>
            <StandardText style={styles.headerStartButtonText}>Start</StandardText>
          </TouchableOpacity>

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
        </View>
      </ScrollView>
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    alignItems: "center",
    padding: 15,
    marginTop: 40,
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
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    lineHeight: 24,
  },
  header: {
    top : 0,
    alignSelf: "flex-start",
  },
  headerDate: {
    fontSize: 32,
    marginBottom: 8,
  },
  headerPhase: {
    fontSize: 22,
        marginBottom: 8, 
  },
  headerDetailsButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderRadius: 120,
    width: 80,
    height: 32,
    justifyContent: "center",
  },
  headerDetailsButtonText: {
    color: "#000",
    alignSelf: "center",
    fontSize: 16,
  },
  headerStartButton: {
    backgroundColor: "#fff",
        borderRadius: 120,
        justifyContent: "center", 
        height: 46,
        marginTop: 30,
  },
  headerStartButtonText: {
    color: "#000",
    alignSelf: "center",
    fontSize: 22,
  },
  detailsCard: {
    width: "100%",
    maxWidth: 960,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    gap: 12,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 21,
  },
  phaseDetail: {
    gap: 4,
  },
  phaseRange: {
    fontSize: 12,
    fontWeight: "700",
  },
  phaseLabel: {
    fontSize: 17,
    fontWeight: "700",
  },
  weekSchedule: {
    flexDirection: "row",
    gap: 6,
  },
  weekScheduleScroller: {
    flexGrow: 0,
    alignSelf: "flex-start",
    marginTop: 45,
  },
  weekScheduleItem: {
    alignItems: "center",
    gap: 6,
  },
  weekScheduleDay: {
    height: 55,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    padding: 6,
    gap: 2,
    borderColor: "#585858",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  weekScheduleTrainingDay: {
    backgroundColor: "#1E1E1E",
    borderStyle: "solid",
  },
  weekScheduleLabel: {
    fontSize: 16,
    textAlign: "center",
  },
  weekScheduleDate: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 15,
    textAlign: "center",
  },
});
