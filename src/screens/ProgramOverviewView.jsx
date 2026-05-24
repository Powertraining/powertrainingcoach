import { useRef, useState } from "react";
import { Image, Text, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import StandardText from "../components/textComponents/StandardText.jsx";
import WhiteBottomMenu from "../components/profileComponents/WhiteBottomMenu.jsx";
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

function startOfLocalDay(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getPlanStartDate(plan = {}) {
  return startOfLocalDay(plan?.createdAt || plan?.generatedAt);
}

function isDateInRange(date, startDate, endDate = null) {
  if (!(date instanceof Date) || !(startDate instanceof Date)) {
    return false;
  }

  return date >= startDate && (!endDate || date < endDate);
}

function getPlanWeekForDate(plan = {}, date) {
  const weeks = Array.isArray(plan?.weeks) ? plan.weeks : [];
  const planStartDate = getPlanStartDate(plan);

  if (!weeks.length || !(date instanceof Date) || !planStartDate) {
    return null;
  }

  const elapsedDays = Math.max(
    0,
    Math.floor((date - planStartDate) / (24 * 60 * 60 * 1000))
  );
  const firstWeekNumber = weeks[0]?.week || 1;
  const targetWeekNumber = firstWeekNumber + Math.floor(elapsedDays / 7);

  return (
    weeks.find((week) => week.week === targetWeekNumber) ||
    weeks[weeks.length - 1]
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

function getExerciseDisplayName(exercise = {}) {
  return String(exercise?.name || "")
    .replace(/^\s*\d+[a-z]?\.\s*/i, "")
    .trim();
}

function parsePrescribedSetCount(exercise = {}) {
  const parsedValue = Number.parseInt(exercise?.sets, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return 1;
  }

  return Math.min(parsedValue, 12);
}

function buildSessionSteps(exercises = []) {
  return (Array.isArray(exercises) ? exercises : []).flatMap((exercise, exerciseIndex) =>
    Array.from({ length: parsePrescribedSetCount(exercise) }).map((_, setIndex) => ({
      exercise,
      exerciseIndex,
      setIndex,
    }))
  );
}

function getSessionActionSummary(day = {}, progress = {}) {
  const steps = buildSessionSteps(day?.exercises);
  const completedStepKeys = new Set(
    Array.isArray(progress?.completedStepKeys) ? progress.completedStepKeys : []
  );
  const completedStepCount = steps.filter((step) =>
    completedStepKeys.has(`${step.exerciseIndex}:${step.setIndex}`)
  ).length;
  const progressPercent =
    steps.length > 0
      ? Math.min(100, Math.round((completedStepCount / steps.length) * 100))
      : 0;
  const activeStep =
    steps.find(
      (step) =>
        step.exerciseIndex === progress?.activeExerciseIndex &&
        step.setIndex === progress?.activeSetIndex &&
        !completedStepKeys.has(`${step.exerciseIndex}:${step.setIndex}`)
    ) ||
    steps.find(
      (step) => !completedStepKeys.has(`${step.exerciseIndex}:${step.setIndex}`)
    ) ||
    steps[0];

  return {
    nextExerciseName: getExerciseDisplayName(activeStep?.exercise) || "Session",
    progressPercent,
  };
}

export default function ProgramOverviewView({
  plan,
  trainingPlanHistory = [],
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
  const [pushBackConfirmVisible, setPushBackConfirmVisible] = useState(false);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  const [activeSessionDay, setActiveSessionDay] = useState(null);
  const [selectedArchivedDay, setSelectedArchivedDay] = useState(null);
  const [selectedRestSlotKey, setSelectedRestSlotKey] = useState("");
  const [selectedTrainingSlotKey, setSelectedTrainingSlotKey] = useState("");
  const [swapEditorVisible, setSwapEditorVisible] = useState(false);
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
  const activeSelectedDay = selectedArchivedDay ? null : selectedDay;
  const detailSelectedDay = selectedArchivedDay || selectedDay;
  const currentWeek = getCurrentTrainingWeek(plan, completedDayEntries);
  const currentPhase = getCurrentTrainingPhase(plan, completedDayEntries);
  const phaseOverview = getTrainingPlanPhaseOverview(plan);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const planStartDate = getPlanStartDate(plan);
  const archivedPlanContexts = Array.isArray(trainingPlanHistory)
    ? trainingPlanHistory
        .map((entry = {}) => ({
          ...entry,
          startedAt: getPlanStartDate(entry.plan),
          endedAt: startOfLocalDay(entry.archivedAt),
        }))
        .filter((entry) => entry.plan?.weeks?.length && entry.startedAt)
    : [];
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
    const archivedContext = archivedPlanContexts
      .slice()
      .reverse()
      .find((entry) => isDateInRange(date, entry.startedAt, entry.endedAt));
    const sourcePlan = archivedContext?.plan || plan;
    const sourceWeek = getPlanWeekForDate(sourcePlan, date) || currentWeek;
    const sourceWeekNumber = sourceWeek?.week || currentWeek?.week;
    const isBeforeCurrentPlanStart =
      !archivedContext && planStartDate instanceof Date && date < planStartDate;

    if (isBeforeCurrentPlanStart) {
      return {
        date,
        dateKey: date.toDateString(),
        weekday,
        trainingDay: null,
        weekNumber: null,
        isArchived: false,
      };
    }

    let trainingDay = sourceWeek?.days?.find(
      (day) => getTrainingDayPreferredWeekday(day) === weekday
    );

    if (!trainingDay && index >= LOOKBACK_DAYS && !archivedContext) {
      trainingDay = fallbackTrainingDays.find((day) => {
        if (assignedFallbackTrainingDays.has(day)) {
          return false;
        }

        assignedFallbackTrainingDays.add(day);
        return true;
      });
    }

    return {
      date,
      dateKey: date.toDateString(),
      weekday,
      trainingDay,
      weekNumber: sourceWeekNumber,
      isArchived: Boolean(archivedContext),
    };
  });
  const selectedRestSlot = selectedRestSlotKey
    ? currentWeekSchedule.find((slot) => slot.dateKey === selectedRestSlotKey)
    : null;
  const selectedTrainingSlot =
    activeSelectedDay && !selectedRestSlot
      ? currentWeekSchedule.find(
          (slot) =>
            selectedTrainingSlotKey &&
            slot.dateKey === selectedTrainingSlotKey &&
            slot.trainingDay?.day === activeSelectedDay.day
        ) ||
        currentWeekSchedule.find(
          (slot) =>
            isSameCalendarDay(slot.date, today) &&
            slot.trainingDay?.day === activeSelectedDay.day
        )
      : null;
  const selectedTrainingSlotIsToday =
    Boolean(selectedTrainingSlot) &&
    isSameCalendarDay(selectedTrainingSlot.date, today);
  const selectedTrainingSlotIsFuture =
    Boolean(selectedTrainingSlot) && selectedTrainingSlot.date > today;
  const selectedDayCompletionKey = activeSelectedDay
    ? `${activeSelectedDay.week}-${activeSelectedDay.day}`
    : "";
  const selectedDaySessionProgress = selectedDayCompletionKey
    ? getActiveSessionProgress?.(selectedDayCompletionKey)
    : null;
  const selectedDayHasStartedSession =
    hasStartedSessionProgress(selectedDaySessionProgress);
  const selectedDayIsComplete =
    Boolean(selectedDayCompletionKey) &&
    completedDayEntries.includes(selectedDayCompletionKey);
  const selectedDayIsPushedBack = activeSelectedDay?.status === "skipped";
  const showTodayTrainingActions =
    Boolean(activeSelectedDay) &&
    selectedTrainingSlotIsToday &&
    !selectedDayIsComplete &&
    !selectedDayIsPushedBack;
  const showFutureTrainingPushBack =
    Boolean(activeSelectedDay) &&
    selectedTrainingSlotIsFuture &&
    !selectedDayIsComplete &&
    !selectedDayIsPushedBack;
  const showCompletedSessionStatus =
    Boolean(activeSelectedDay) &&
    selectedDayIsComplete &&
    !selectedRestSlot &&
    !selectedDayIsPushedBack;
  const showPushedBackSessionStatus =
    Boolean(activeSelectedDay) && selectedDayIsPushedBack && !selectedRestSlot;
  const showRestSessionStatus = Boolean(selectedRestSlot);
  const showFutureSessionStatus = showFutureTrainingPushBack && !showTodayTrainingActions;
  const showStartButton = showTodayTrainingActions;
  const showCompleteButton = showTodayTrainingActions && Boolean(onFinishDay);
  const showPushBackButton =
    (showTodayTrainingActions || showFutureTrainingPushBack) &&
    Boolean(onMissedDay);
  const showHeaderActionContent =
    showStartButton ||
    showCompletedSessionStatus ||
    showPushedBackSessionStatus ||
    showRestSessionStatus ||
    showFutureSessionStatus;
  const sessionActionSummary = getSessionActionSummary(
    activeSelectedDay,
    selectedDaySessionProgress
  );

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

  function handleSelectTrainingDay(weekNumber, dayNumber, dateKey) {
    setSelectedArchivedDay(null);
    setSelectedRestSlotKey("");
    setSelectedTrainingSlotKey(dateKey);
    onSelectDay(weekNumber, dayNumber);
  }

  function handleSelectArchivedTrainingDay(weekNumber, dayData = {}, dateKey) {
    setSelectedRestSlotKey("");
    setSelectedTrainingSlotKey(dateKey);
    setSelectedArchivedDay(buildSessionDayPayload(dayData, weekNumber));
    onClearSelectedDay?.();
  }

  function handleSelectRestSlot(dateKey) {
    setSelectedArchivedDay(null);
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
      activeSelectedDay?.dayData ||
      currentWeekSchedule.find(
        (slot, index) => index >= LOOKBACK_DAYS && slot.trainingDay
      )?.trainingDay;
    const nextWeekNumber = activeSelectedDay?.week || currentWeek?.week;

    if (!nextTrainingDay || !nextWeekNumber) {
      return;
    }

    onSelectDay(nextWeekNumber, nextTrainingDay.day);
    setActiveSessionDay(
      activeSelectedDay || buildSessionDayPayload(nextTrainingDay, nextWeekNumber)
    );
  }

  function openPushBackConfirm() {
    if (updatingPlan) {
      return;
    }

    setPushBackConfirmVisible(true);
  }

  function closePushBackConfirm() {
    setPushBackConfirmVisible(false);
  }

  function confirmPushBack() {
    setPushBackConfirmVisible(false);
    onMissedDay?.();
  }

  function openCompleteConfirm() {
    setCompleteConfirmVisible(true);
  }

  function closeCompleteConfirm() {
    setCompleteConfirmVisible(false);
  }

  function confirmComplete() {
    setCompleteConfirmVisible(false);
    onFinishDay?.();
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
      <ScrollView
        style={swapEditorVisible ? styles.blurredContent : null}
        contentContainerStyle={styles.center}
      >
        <View style={styles.header}>
          <StandardText style={styles.headerDate}>{currentDateLabel}</StandardText>
          <StandardText style={styles.headerPhase}>{currentPhaseLabel}</StandardText>
          <ScrollView
            ref={weekScheduleScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.weekScheduleScroller}
            contentContainerStyle={styles.weekSchedule}
            contentOffset={{ x: WEEK_SCHEDULE_TODAY_OFFSET, y: 0 }}
            onContentSizeChange={scrollWeekScheduleToToday}
          >
            {currentWeekSchedule.map(({ date, dateKey, weekday, trainingDay, weekNumber, isArchived }, index) => {
              const isToday = isSameCalendarDay(date, today);
              const isSelectableCurrentTrainingDay = trainingDay && !isArchived;
              const isSelectedTrainingDay =
                isSelectableCurrentTrainingDay &&
                !selectedRestSlotKey &&
                activeSelectedDay?.week === weekNumber &&
                activeSelectedDay?.day === trainingDay.day &&
                (selectedTrainingSlotKey
                  ? selectedTrainingSlotKey === dateKey
                  : isToday);
              const isSelectedArchivedDay =
                isArchived &&
                !selectedRestSlotKey &&
                selectedArchivedDay?.week === weekNumber &&
                selectedArchivedDay?.day === trainingDay?.day &&
                selectedTrainingSlotKey === dateKey;
              const isSelectedRestDay = !trainingDay && selectedRestSlotKey === dateKey;

              return (
                <View key={date.toISOString()} style={styles.weekScheduleItem}>
                  <View style={styles.weekScheduleTileSlot}>
                    <TouchableOpacity
                      onPress={() => {
                        if (isSelectableCurrentTrainingDay) {
                          handleSelectTrainingDay(weekNumber, trainingDay.day, dateKey);
                        } else if (trainingDay && isArchived) {
                          handleSelectArchivedTrainingDay(weekNumber, trainingDay, dateKey);
                        } else {
                          handleSelectRestSlot(dateKey);
                        }
                      }}
                      style={[
                        styles.weekScheduleDay,
                        trainingDay && styles.weekScheduleTrainingDay,
                        isArchived && styles.weekScheduleArchivedDay,
                        isToday && styles.weekScheduleToday,
                        isSelectedTrainingDay && styles.weekScheduleSelectedDay,
                        isSelectedArchivedDay && styles.weekScheduleSelectedDay,
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
              styles.headerActionPanel,
              !showHeaderActionContent && styles.headerActionPanelEmpty,
            ]}
          >
            <View
              style={[
                styles.headerActionArea,
                !showHeaderActionContent && styles.headerActionAreaEmpty,
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
              {showRestSessionStatus ? (
                <View style={styles.restSessionContent}>
                  <Text numberOfLines={1} style={styles.currentSessionTitle}>
                    This session
                  </Text>
                  <StandardText lines={1} style={styles.restSessionText}>
                    Rest
                  </StandardText>
                </View>
              ) : null}
              {showPushedBackSessionStatus ? (
                <View style={styles.restSessionContent}>
                  <Text numberOfLines={1} style={styles.currentSessionTitle}>
                    This session
                  </Text>
                  <StandardText lines={1} style={styles.restSessionText}>
                    Pushed back
                  </StandardText>
                </View>
              ) : null}
              {showFutureSessionStatus ? (
                <View style={styles.restSessionContent}>
                  <Text numberOfLines={1} style={styles.currentSessionTitle}>
                    This session
                  </Text>
                  {showPushBackButton ? (
                    <TouchableOpacity
                      style={[
                        styles.futureSessionPushBackButton,
                        updatingPlan && styles.currentSessionSecondaryButtonDisabled,
                      ]}
                      onPress={openPushBackConfirm}
                      disabled={updatingPlan}
                    >
                      <StandardText
                        lines={1}
                        style={styles.futureSessionPushBackButtonText}
                      >
                        {updatingPlan ? "Updating" : "Push back"}
                      </StandardText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
              {showStartButton ? (
                <View style={styles.currentSessionContent}>
                  <View style={styles.currentSessionSummary}>
                    <Text numberOfLines={1} style={styles.currentSessionTitle}>
                      This session
                    </Text>
                    <View style={styles.currentSessionMeta}>
                      <StandardText lines={1} style={styles.currentSessionMetaLabel}>
                        Next exercise:
                      </StandardText>
                      <StandardText lines={2} style={styles.currentSessionMetaValue}>
                        {sessionActionSummary.nextExerciseName}
                      </StandardText>
                    </View>
                  </View>
                  <View style={styles.currentSessionActions}>
                    <TouchableOpacity
                      style={styles.headerStartButton}
                      onPress={handleStartSession}
                    >
                      <StandardText lines={1} style={styles.headerStartButtonText}>
                        {selectedDayHasStartedSession ? "Continue" : "Start"}
                      </StandardText>
                    </TouchableOpacity>
                    <View style={styles.currentSessionSecondaryActions}>
                      {showPushBackButton ? (
                        <TouchableOpacity
                          style={[
                            styles.currentSessionSecondaryButton,
                            updatingPlan && styles.currentSessionSecondaryButtonDisabled,
                          ]}
                          onPress={openPushBackConfirm}
                          disabled={updatingPlan}
                        >
                          <StandardText
                            lines={1}
                            style={styles.currentSessionSecondaryButtonText}
                          >
                            {updatingPlan ? "Updating" : "Push back"}
                          </StandardText>
                        </TouchableOpacity>
                      ) : null}
                      {showCompleteButton ? (
                        <TouchableOpacity
                          style={styles.currentSessionSecondaryButton}
                          onPress={openCompleteConfirm}
                        >
                          <StandardText
                            lines={1}
                            style={styles.currentSessionSecondaryButtonText}
                          >
                            Complete
                          </StandardText>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          </View>

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

          {detailSelectedDay && !selectedRestSlot ? (
            <View style={styles.dayDetailEdgeToEdge}>
              <DayDetailView
                week={detailSelectedDay.week}
                day={detailSelectedDay.dayData}
                exercises={detailSelectedDay.exercises}
                preferredWeekday={detailSelectedDay.preferredWeekday}
                sessionLabel={detailSelectedDay.sessionLabel}
                status={detailSelectedDay.status}
                rescueMode={detailSelectedDay.rescueMode}
                adjustmentSummary={detailSelectedDay.adjustmentSummary}
                initialPerformanceResults={
                  selectedArchivedDay ? [] : selectedDayPerformanceResults
                }
                initialAssessmentResults={
                  selectedArchivedDay ? [] : selectedDayAssessmentResults
                }
                strengthAssessmentSummary={strengthAssessmentSummary}
                onBack={
                  selectedArchivedDay
                    ? () => setSelectedArchivedDay(null)
                    : onClearSelectedDay
                }
                onReplaceExercise={selectedArchivedDay ? undefined : onReplaceExercise}
                onFinish={selectedArchivedDay ? undefined : onFinishDay}
                onMissed={selectedArchivedDay ? undefined : onMissedDay}
                onSwapEditorVisibilityChange={setSwapEditorVisible}
                updatingPlan={selectedArchivedDay ? true : updatingPlan}
              />
            </View>
          ) : null}

          <View style={styles.programDetailsFooter}>
            <TouchableOpacity
              style={styles.programDetailsFooterLink}
              onPress={() => setDetailsVisible(true)}
            >
              <StandardText style={styles.programDetailsFooterLinkText}>
                Program details &gt;
              </StandardText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <WhiteBottomMenu
        visible={detailsVisible}
        onDismiss={() => setDetailsVisible(false)}
        title="Program details"
        buttonText="Close"
        onButtonPress={() => setDetailsVisible(false)}
        contentStyle={styles.detailsSheetContent}
        sheetStyle={styles.detailsSheet}
        content={
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.detailsSheetScrollContent}
          >
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
          </ScrollView>
        }
      />
      <WhiteBottomMenu
        visible={pushBackConfirmVisible}
        onDismiss={closePushBackConfirm}
        title="Push back session?"
        description="This moves the session forward and updates the plan around the missed slot."
        buttonText={updatingPlan ? "Updating..." : "Yes, push back"}
        buttonDisabled={updatingPlan}
        onButtonPress={confirmPushBack}
        secondaryButtonText="Cancel"
        secondaryButtonDisabled={updatingPlan}
        onSecondaryButtonPress={closePushBackConfirm}
      />
      <WhiteBottomMenu
        visible={completeConfirmVisible}
        onDismiss={closeCompleteConfirm}
        title="Complete this session?"
        description="This will mark the selected workout as done without opening the tracker. Only complete it if you finished the session."
        buttonText="Complete session"
        onButtonPress={confirmComplete}
        secondaryButtonText="Cancel"
        onSecondaryButtonPress={closeCompleteConfirm}
      />
    </QuestionnaireShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flexGrow: 1,
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 28,
    paddingBottom: 120,
  },
  blurredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
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
    flexGrow: 1,
    paddingTop: 28,
    width: "100%",
    position: "relative",
  },
  headerDate: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "700",
    marginBottom: 6,
  },
  headerPhase: {
    fontSize: 18,
    lineHeight: 24,
    color: "#d1d5db",
    marginBottom: 14,
  },
  programDetailsFooter: {
    alignItems: "center",
    alignSelf: "stretch",
    marginBottom: 28,
    marginTop: "auto",
    paddingTop: 28,
  },
  programDetailsFooterLink: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  programDetailsFooterLinkText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
  },
  headerActionPanel: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "#101010",
    borderBottomWidth: 1,
    borderColor: "#1E1E1E",
    borderTopWidth: 1,
    marginHorizontal: -28,
    marginTop: 56,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerActionPanelEmpty: {
    marginTop: 14,
    paddingVertical: 0,
  },
  headerActionArea: {
    alignSelf: "center",
    width: "100%",
  },
  headerActionAreaEmpty: {
    minHeight: 0,
  },
  headerStartButton: {
    backgroundColor: "#fff",
    borderRadius: 120,
    justifyContent: "center",
    height: 38,
    paddingHorizontal: 14,
    width: "100%",
  },
  headerStartButtonText: {
    color: "#000",
    alignSelf: "center",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
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
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  restSessionContent: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: 22,
    justifyContent: "flex-start",
    minHeight: 76,
    width: "100%",
  },
  restSessionText: {
    color: "#7E7E7E",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  futureSessionPushBackButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 120,
    height: 34,
    justifyContent: "center",
    paddingHorizontal: 16,
    width: 112,
  },
  futureSessionPushBackButtonText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  currentSessionContent: {
    alignItems: "center",
    flexDirection: "row",
    width: "100%",
  },
  currentSessionSummary: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: 22,
    justifyContent: "flex-start",
    minWidth: 0,
    width: "50%",
  },
  currentSessionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
    textAlign: "center",
  },
  currentSessionMeta: {
    alignItems: "center",
    gap: 2,
  },
  currentSessionMetaLabel: {
    color: "#858585",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  currentSessionMetaValue: {
    color: "#858585",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  currentSessionActions: {
    alignItems: "center",
    gap: 22,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8,
    width: "50%",
  },
  currentSessionSecondaryActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    width: "100%",
  },
  currentSessionSecondaryButton: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  currentSessionSecondaryButtonDisabled: {
    opacity: 0.5,
  },
  currentSessionSecondaryButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
    textTransform: "uppercase",
  },
  detailsSheet: {
    maxHeight: "72%",
  },
  detailsSheetContent: {
    maxHeight: 420,
  },
  detailsSheetScrollContent: {
    gap: 14,
    paddingBottom: 4,
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
    gap: 8,
    paddingHorizontal: 28,
  },
  weekScheduleScroller: {
    flexGrow: 0,
    alignSelf: "stretch",
    marginHorizontal: -28,
    marginTop: 28,
  },
  dayDetailEdgeToEdge: {
    alignSelf: "stretch",
    marginHorizontal: -28,
    marginTop: 28,
  },
  weekScheduleItem: {
    alignItems: "center",
    gap: 6,
  },
  weekScheduleTileSlot: {
    height: 64,
    justifyContent: "flex-end",
  },
  weekScheduleDay: {
    height: 55,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
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
  weekScheduleArchivedDay: {
    opacity: 0.62,
  },
  weekScheduleToday: {
    backgroundColor: "#fff",
    borderColor: "#fff",
    borderStyle: "solid",
  },
  weekScheduleSelectedDay: {
    height: 64,
    width: 58,
  },
  weekScheduleLabel: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  weekScheduleDate: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
});
