import { useRef, useState } from "react";
import { Image, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import StandardText from "../components/textComponents/StandardText.jsx";
import ActiveSessionView from "./ActiveSessionView.jsx";
import DayDetailView from "./DayDetailView.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import TrainingCheckInCard from "./TrainingCheckInCard.jsx";
import checkIcon from "../assets/icons/check.png";
import {
  getCurrentTrainingPhase,
  getCurrentTrainingWeek,
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
const LOOKBACK_DAYS = 14;
const UPCOMING_DAYS_INCLUDING_TODAY = 7;
const WEEK_SCHEDULE_ITEM_WIDTH = 56;
const WEEK_SCHEDULE_TODAY_OFFSET = LOOKBACK_DAYS * WEEK_SCHEDULE_ITEM_WIDTH;

function isSameCalendarDay(leftDate, rightDate) {
  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function hasStartedSessionProgress(progress = {}) {
  const completedStepKeys = Array.isArray(progress?.completedStepKeys)
    ? progress.completedStepKeys
    : [];

  return (
    completedStepKeys.length > 0 ||
    Boolean(
      progress?.trackingDrafts &&
        Object.values(progress.trackingDrafts).some((draft) =>
          draft?.loadKg ||
          draft?.reps ||
          draft?.rpe ||
          Object.values(draft?.customValues || {}).some(Boolean)
        )
    )
  );
}

export default function ProgramOverviewView({
  plan,
  onSelectDay,
  completedDays,
  pendingTrainingCheckIn,
  onSubmitTrainingCheckIn,
  trainingCheckInSubmitting = false,
  questionnaire,
  selectedDay,
  selectedDayPerformanceResults,
  selectedDayAssessmentResults,
  strengthAssessmentSummary,
  onClearSelectedDay,
  onReplaceExercise,
  onFinishDay,
  onMissedDay,
  getActiveSessionProgress,
  onActiveSessionProgressChange,
  onActiveSessionProgressClear,
  updatingPlan = false,
}) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [activeSessionDay, setActiveSessionDay] = useState(null);
  const [selectedRestSlotKey, setSelectedRestSlotKey] = useState("");
  const [selectedTrainingSlotKey, setSelectedTrainingSlotKey] = useState("");
  const weekScheduleScrollRef = useRef(null);
  const lastWeekScheduleScrollDateRef = useRef("");

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDateKey = today.toDateString();
  const currentDateLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(today);
  const currentPhaseLabel = currentPhase?.label
    ? `${currentPhase.label} week ${currentWeek?.week || 1}`
    : `Week ${currentWeek?.week || 1}`;
  const rollingDates = Array.from(
    { length: LOOKBACK_DAYS + UPCOMING_DAYS_INCLUDING_TODAY },
    (_, index) => {
      const dayOffset = index - LOOKBACK_DAYS;
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      return date;
    }
  );
  const fallbackTrainingDays = currentWeek?.days?.filter(
    (day) => !getTrainingDayPreferredWeekday(day)
  ) || [];
  const assignedFallbackTrainingDays = new Set();
  const currentWeekSchedule = rollingDates.map((date, index) => {
    const weekday = WEEKDAY_NAMES[date.getDay()];
    let trainingDay = currentWeek?.days?.find(
      (day) => getTrainingDayPreferredWeekday(day) === weekday
    );

    if (!trainingDay && index >= LOOKBACK_DAYS) {
      trainingDay = fallbackTrainingDays.find((day) => {
        if (assignedFallbackTrainingDays.has(day)) {
          return false;
        }

        assignedFallbackTrainingDays.add(day);
        return true;
      });
    }

    return { date, dateKey: date.toDateString(), weekday, trainingDay };
  });
  const selectedRestSlot = selectedRestSlotKey
    ? currentWeekSchedule.find((slot) => slot.dateKey === selectedRestSlotKey)
    : null;
  const selectedRestSlotIndex = selectedRestSlot
    ? currentWeekSchedule.findIndex((slot) => slot.dateKey === selectedRestSlot.dateKey)
    : -1;
  const nextTrainingSlot =
    selectedRestSlotIndex >= 0
      ? currentWeekSchedule.find(
          (slot, index) => index > selectedRestSlotIndex && slot.trainingDay
        )
      : null;
  const selectedTrainingSlot =
    selectedDay && !selectedRestSlot
      ? currentWeekSchedule.find(
          (slot) =>
            selectedTrainingSlotKey &&
            slot.dateKey === selectedTrainingSlotKey &&
            slot.trainingDay?.day === selectedDay.day
        ) ||
        currentWeekSchedule.find(
          (slot) =>
            isSameCalendarDay(slot.date, today) &&
            slot.trainingDay?.day === selectedDay.day
        )
      : null;
  const selectedTrainingSlotIsToday =
    Boolean(selectedTrainingSlot) &&
    isSameCalendarDay(selectedTrainingSlot.date, today);
  const selectedTrainingSlotIsFuture =
    Boolean(selectedTrainingSlot) && selectedTrainingSlot.date > today;
  const selectedDayCompletionKey = selectedDay
    ? `${selectedDay.week}-${selectedDay.day}`
    : "";
  const selectedDaySessionProgress = selectedDayCompletionKey
    ? getActiveSessionProgress?.(selectedDayCompletionKey)
    : null;
  const selectedDayHasStartedSession =
    hasStartedSessionProgress(selectedDaySessionProgress);
  const selectedDayIsComplete =
    Boolean(selectedDayCompletionKey) &&
    completedDayEntries.includes(selectedDayCompletionKey);
  const showTodayTrainingActions =
    Boolean(selectedDay) && selectedTrainingSlotIsToday && !selectedDayIsComplete;
  const showFutureTrainingPushBack =
    Boolean(selectedDay) && selectedTrainingSlotIsFuture && !selectedDayIsComplete;
  const showCompletedSessionStatus =
    Boolean(selectedDay) && selectedDayIsComplete && !selectedRestSlot;
  const showStartButton = showTodayTrainingActions;
  const showCompleteButton = showTodayTrainingActions && Boolean(onFinishDay);
  const showPushBackButton =
    (showTodayTrainingActions || showFutureTrainingPushBack) &&
    Boolean(onMissedDay);
  const showActionButtons =
    showStartButton || showCompleteButton || showPushBackButton;
  const showActionContent = showActionButtons || showCompletedSessionStatus;

  function scrollWeekScheduleToToday() {
    if (lastWeekScheduleScrollDateRef.current === todayDateKey) {
      return;
    }

    weekScheduleScrollRef.current?.scrollTo?.({
      x: WEEK_SCHEDULE_TODAY_OFFSET,
      y: 0,
      animated: false,
    });
    lastWeekScheduleScrollDateRef.current = todayDateKey;
  }

  function getPhaseRangeLabel(phase = {}) {
    if (phase.weekStart === phase.weekEnd) {
      return `Week ${phase.weekStart}`;
    }

    return `Weeks ${phase.weekStart}-${phase.weekEnd}`;
  }

  function getRestSlotDateLabel(date) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(date);
  }

  function getNextTrainingSlotLabel(slot) {
    if (!slot?.trainingDay) {
      return "";
    }

    return `Day ${slot.trainingDay.day} on ${getRestSlotDateLabel(slot.date)}`;
  }

  function handleSelectTrainingDay(weekNumber, dayNumber, dateKey) {
    setSelectedRestSlotKey("");
    setSelectedTrainingSlotKey(dateKey);
    onSelectDay(weekNumber, dayNumber);
  }

  function handleSelectRestSlot(dateKey) {
    setSelectedRestSlotKey(dateKey);
    setSelectedTrainingSlotKey("");
    onClearSelectedDay?.();
  }

  function buildSessionDayPayload(dayData = {}, weekNumber = currentWeek?.week) {
    return {
      week: weekNumber,
      day: dayData.day,
      dayData,
      exercises: dayData.exercises || [],
      preferredWeekday: dayData.preferredWeekday || "",
      sessionLabel: dayData.sessionLabel || "",
      status: dayData.status || "pending",
      rescueMode: dayData.rescueMode || "",
      adjustmentSummary: dayData.adjustmentSummary || "",
    };
  }

  function handleStartSession() {
    const nextTrainingDay =
      selectedDay?.dayData ||
      currentWeekSchedule.find(
        (slot, index) => index >= LOOKBACK_DAYS && slot.trainingDay
      )?.trainingDay;
    const nextWeekNumber = selectedDay?.week || currentWeek?.week;

    if (!nextTrainingDay || !nextWeekNumber) {
      return;
    }

    onSelectDay(nextWeekNumber, nextTrainingDay.day);
    setActiveSessionDay(
      selectedDay || buildSessionDayPayload(nextTrainingDay, nextWeekNumber)
    );
  }

  if (activeSessionDay) {
    const activeSessionKey = `${activeSessionDay.week}-${activeSessionDay.day}`;

    return (
      <ActiveSessionView
        day={activeSessionDay.dayData}
        exercises={activeSessionDay.exercises}
        initialPerformanceResults={selectedDayPerformanceResults}
        initialAssessmentResults={selectedDayAssessmentResults}
        initialSessionProgress={getActiveSessionProgress?.(activeSessionKey)}
        onSessionProgressChange={(progress) =>
          onActiveSessionProgressChange?.(activeSessionKey, progress)
        }
        onBack={() => setActiveSessionDay(null)}
        onFinish={(trackedResults) => {
          onActiveSessionProgressClear?.(activeSessionKey);
          onFinishDay?.(trackedResults);
          setActiveSessionDay(null);
        }}
      />
    );
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
            ref={weekScheduleScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekScheduleScroller}
            contentContainerStyle={styles.weekSchedule}
            contentOffset={{ x: WEEK_SCHEDULE_TODAY_OFFSET, y: 0 }}
            onContentSizeChange={scrollWeekScheduleToToday}
          >
            {currentWeekSchedule.map(({ date, dateKey, weekday, trainingDay }, index) => {
              const isToday = isSameCalendarDay(date, today);
              const isSelectedTrainingDay =
                trainingDay &&
                !selectedRestSlotKey &&
                selectedDay?.week === currentWeek?.week &&
                selectedDay?.day === trainingDay.day &&
                (selectedTrainingSlotKey
                  ? selectedTrainingSlotKey === dateKey
                  : isToday);
              const isSelectedRestDay = !trainingDay && selectedRestSlotKey === dateKey;

              return (
                <View key={date.toISOString()} style={styles.weekScheduleItem}>
                  <View style={styles.weekScheduleTileSlot}>
                    <TouchableOpacity
                      onPress={() => {
                        if (trainingDay) {
                          handleSelectTrainingDay(currentWeek.week, trainingDay.day, dateKey);
                        } else {
                          handleSelectRestSlot(dateKey);
                        }
                      }}
                      style={[
                        styles.weekScheduleDay,
                        trainingDay && styles.weekScheduleTrainingDay,
                        isToday && styles.weekScheduleToday,
                        isSelectedTrainingDay && styles.weekScheduleSelectedDay,
                        isSelectedRestDay && styles.weekScheduleSelectedDay,
                      ]}
                    >
                      <StandardText
                        style={styles.weekScheduleLabel}
                        textColor={isToday ? "#000" : "#fff"}
                      >
                        {trainingDay ? `Day ${trainingDay.day}` : "Rest"}
                      </StandardText>
                    </TouchableOpacity>
                  </View>
                  <StandardText style={styles.weekScheduleDate}>
                    {weekday.slice(0, 3)}
                    {"\n"}
                    {date.getDate()}
                  </StandardText>
                </View>
              );
            })}
          </ScrollView>
          <View
            style={[
              styles.headerActionArea,
              !showActionContent && styles.headerActionAreaEmpty,
            ]}
          >
            {showCompletedSessionStatus ? (
              <View style={styles.headerCompletedStatus}>
                <View style={styles.headerCompletedIconBadge}>
                  <Image
                    source={checkIcon}
                    style={styles.headerCompletedIcon}
                    resizeMode="contain"
                  />
                </View>
                <StandardText style={styles.headerCompletedText}>
                  Session is complete.
                </StandardText>
              </View>
            ) : null}
            {showStartButton ? (
              <TouchableOpacity
                style={styles.headerStartButton}
                onPress={handleStartSession}
              >
                <StandardText style={styles.headerStartButtonText}>
                  {selectedDayHasStartedSession ? "Continue" : "Start"}
                </StandardText>
              </TouchableOpacity>
            ) : null}
            {showCompleteButton || showPushBackButton ? (
              <View
                style={[
                  styles.headerSessionActionRow,
                  !showCompleteButton && styles.headerSessionActionRowCentered,
                ]}
              >
                {showCompleteButton ? (
                  <TouchableOpacity
                    style={styles.headerCompleteButton}
                    onPress={() => onFinishDay()}
                  >
                    <StandardText style={styles.headerCompleteButtonText}>
                      Complete
                    </StandardText>
                  </TouchableOpacity>
                ) : null}
                {showCompleteButton && showPushBackButton ? (
                  <View style={styles.headerSessionActionDivider} />
                ) : null}
                {showPushBackButton ? (
                  <TouchableOpacity
                    style={[
                      styles.headerPushBackButton,
                      !showCompleteButton && styles.headerPushBackButtonSingle,
                      updatingPlan && styles.headerPushBackButtonDisabled,
                    ]}
                    onPress={onMissedDay}
                    disabled={updatingPlan}
                  >
                    <StandardText style={styles.headerPushBackText}>
                      {updatingPlan ? "Updating..." : "Push back"}
                    </StandardText>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
          <View style={styles.headerSessionActionRule} />

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

          {selectedRestSlot ? (
            <View style={styles.restDayCard}>
              <StandardText style={styles.restDayTitle}>Recovery day</StandardText>
              <StandardText style={styles.restDayText}>
                No strength session is scheduled for {getRestSlotDateLabel(selectedRestSlot.date)}.
              </StandardText>
              <StandardText style={styles.restDayText}>
                {nextTrainingSlot
                  ? `Your next planned session is ${getNextTrainingSlotLabel(nextTrainingSlot)}. Use this day to recover and prepare for that session.`
                  : "No later session is currently scheduled in this visible week window. Use this day for recovery."}
              </StandardText>
            </View>
          ) : null}

          {selectedDay && !selectedRestSlot ? (
            <View style={styles.dayDetailEdgeToEdge}>
              <DayDetailView
                week={selectedDay.week}
                day={selectedDay.dayData}
                exercises={selectedDay.exercises}
                preferredWeekday={selectedDay.preferredWeekday}
                sessionLabel={selectedDay.sessionLabel}
                status={selectedDay.status}
                rescueMode={selectedDay.rescueMode}
                adjustmentSummary={selectedDay.adjustmentSummary}
                initialPerformanceResults={selectedDayPerformanceResults}
                initialAssessmentResults={selectedDayAssessmentResults}
                strengthAssessmentSummary={strengthAssessmentSummary}
                onBack={onClearSelectedDay}
                onReplaceExercise={onReplaceExercise}
                onFinish={onFinishDay}
                onMissed={onMissedDay}
                updatingPlan={updatingPlan}
              />
            </View>
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
    marginTop: 40,
    paddingHorizontal: 28,
    paddingBottom: 120,
  },
  card: {
    width: "100%",
    maxWidth: 960,
    padding: 26,
    borderRadius: 14,
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
    alignSelf: "stretch",
    width: "100%",
    position: "relative",
  },
  headerDate: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 8,
  },
  headerPhase: {
    fontSize: 22,
    lineHeight: 28,
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
  headerActionArea: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 360,
    marginTop: 30,
  },
  headerActionAreaEmpty: {
    marginTop: 18,
  },
  headerStartButton: {
    backgroundColor: "#fff",
    borderRadius: 120,
    justifyContent: "center",
    height: 46,
  },
  headerStartButtonText: {
    color: "#000",
    alignSelf: "center",
    fontSize: 22,
  },
  headerCompletedStatus: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  headerCompletedIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerCompletedIcon: {
    width: 18,
    height: 18,
    tintColor: "#000",
  },
  headerCompletedText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
  },
  headerSessionActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 14,
  },
  headerSessionActionRowCentered: {
    alignSelf: "center",
    width: 180,
  },
  headerCompleteButton: {
    borderTopLeftRadius: 120,
    borderBottomLeftRadius: 120,
    flex: 1,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCompleteButtonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  headerSessionActionDivider: {
    width: 1,
    height: 31,
    backgroundColor: "#6b7280",
  },
  headerSessionActionRule: {
    height: 1,
    alignSelf: "stretch",
    marginHorizontal: -28,
    marginTop: 14,
    backgroundColor: "#6b7280",
  },
  headerPushBackButton: {
    borderTopRightRadius: 120,
    borderBottomRightRadius: 120,
    flex: 1,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  headerPushBackButtonSingle: {
    borderTopLeftRadius: 120,
    borderBottomLeftRadius: 120,
  },
  headerPushBackButtonDisabled: {
    opacity: 0.5,
  },
  headerPushBackText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
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
    alignSelf: "stretch",
    marginHorizontal: -28,
    marginTop: 45,
  },
  dayDetailEdgeToEdge: {
    alignSelf: "stretch",
    marginHorizontal: -28,
  },
  restDayCard: {
    alignSelf: "stretch",
    marginTop: 24,
    paddingVertical: 18,
    gap: 8,
  },
  restDayTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  restDayText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#d1d5db",
  },
  weekScheduleItem: {
    alignItems: "center",
    gap: 6,
  },
  weekScheduleTileSlot: {
    height: 66,
    justifyContent: "flex-end",
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
  weekScheduleToday: {
    backgroundColor: "#fff",
    borderColor: "#fff",
    borderStyle: "solid",
  },
  weekScheduleSelectedDay: {
    height: 66,
    width: 60,
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
