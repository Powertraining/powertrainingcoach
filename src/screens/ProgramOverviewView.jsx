import {
  useEffect,
  useRef,
  useState } from "react";
import { usePathname } from "expo-router";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import WhiteBottomMenu from "../components/profileComponents/WhiteBottomMenu.jsx";
import ActiveSessionView from "./ActiveSessionView.jsx";
import DayDetailView from "./DayDetailView.jsx";
import LaunchGateCheckInModal, {
  LAUNCH_GATE_CHECK_IN_TESTS,
} from "./LaunchGateCheckInModal.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import TrainingCheckInCard from "./TrainingCheckInCard.jsx";
import { getWeekdayNameFromIndex } from "../constants/weekdays.js";
import {
  getTrainingDayTypeColor,
  getTrainingDayTypeLabel,
} from "../constants/trainingDayTypes.js";
import TrainingDayTypeGradient from "../components/colorComponents/TrainingDayTypeGradient.jsx";
import {
  getCurrentTrainingWeek,
  getTrainingDayPreferredWeekday,
  getTrainingPlanPhaseOverview,
} from "../services/utils/trainingPlan.js";
import {
  PROGRAM_OVERVIEW_LOOKBACK_DAYS,
  PROGRAM_OVERVIEW_UPCOMING_DAYS_INCLUDING_TODAY,
  formatCurrentDateLabel,
  getPhaseRangeLabel,
  getProgramOverviewToday,
  isSameCalendarDay,
} from "../services/utils/programOverview.js";
import { useAndroidBackHandler } from "../services/utils/useAndroidBackHandler.js";
import {
  isPagesPhonePreview,
  useWebTestActions,
} from "../services/utils/webTestActions.js";
import { reactiveModel } from "../services/models/mobxReactiveModel.js";
import { fonts } from "../theme/colors.js";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
const WEEK_SCHEDULE_ITEM_WIDTH = 78.3;
const WEEK_SCHEDULE_TODAY_OFFSET =
  PROGRAM_OVERVIEW_LOOKBACK_DAYS * WEEK_SCHEDULE_ITEM_WIDTH;
const HEADER_SESSION_RING_SIZE = 76;
const HEADER_SESSION_RING_CENTER = HEADER_SESSION_RING_SIZE / 2;
const HEADER_SESSION_RING_RADIUS = 30;
const HEADER_SESSION_RING_STROKE = 6;
const HEADER_SESSION_RING_CIRCUMFERENCE =
  2 * Math.PI * HEADER_SESSION_RING_RADIUS;
const SKELETON_WEEK_SLOTS = Object.freeze(Array.from({ length: 8 }));
const SKELETON_DAY_CONTAINERS = Object.freeze([
  { height: 92 },
  { height: 150 },
  { height: 150 },
  { height: 118 },
]);
const WEEK_SCHEDULE_TILE_SMALL_HEIGHT = 110;
const WEEK_SCHEDULE_TILE_SMALL_WIDTH = 67.5;
const WEEK_SCHEDULE_TILE_LARGE_HEIGHT = 128;
const WEEK_SCHEDULE_TILE_LARGE_WIDTH = 78.3;
const SELECTED_DAY_SLIDE_DISTANCE = 44;
const PROGRAM_OVERVIEW_CONTENT_TOP_MARGIN = 16;
const PROGRAM_OVERVIEW_HEADER_TOP_PADDING = 14;
const PROGRAM_OVERVIEW_PANEL_TO_SCHEDULE_GAP =
  PROGRAM_OVERVIEW_CONTENT_TOP_MARGIN + PROGRAM_OVERVIEW_HEADER_TOP_PADDING;
const WEEK_SCHEDULE_DAY_FILL_OPACITY = 0.15;
const WEEK_SCHEDULE_SELECTED_REST_DAY_OPACITY = 0.5;
const WEEK_SCHEDULE_REST_DAY_COLOR = "#585858";

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

function getPlanPhaseForWeekNumber(phaseOverview = [], weekNumber) {
  const parsedWeekNumber = Number.parseInt(weekNumber, 10);

  if (!Number.isFinite(parsedWeekNumber)) {
    return null;
  }

  return (
    phaseOverview.find(
      (phase) =>
        parsedWeekNumber >= phase.weekStart &&
        parsedWeekNumber <= phase.weekEnd
    ) || null
  );
}

function formatTrainingMetaValue(value = "", fallback = "") {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return fallback;
  }

  const dayTypeLabel = getTrainingDayTypeLabel(normalizedValue);

  if (dayTypeLabel) {
    return dayTypeLabel;
  }

  const labelMap = {
    full_body: "Full body",
    lower_body: "Lower body",
    upper_body: "Upper body",
    core: "Core",
  };

  return (
    labelMap[normalizedValue] ||
    normalizedValue
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}

function getSelectedDayMetaLabel(day = null) {
  if (!day) {
    return "";
  }

  const exercises = Array.isArray(day.exercises) ? day.exercises : [];
  const exerciseCountLabel =
    exercises.length === 1 ? "1 exercise" : `${exercises.length} exercises`;
  const qualityLabel = formatTrainingMetaValue(
    day.sessionProfile?.qualities?.[0],
    isConditioningOnlyDay(day) ? "Conditioning" : ""
  );
  const regionLabel = formatTrainingMetaValue(day.sessionProfile?.regions?.[0]);

  return [exerciseCountLabel, qualityLabel, regionLabel]
    .filter(Boolean)
    .join(" - ");
}

function getSelectedDayGradientType(day = null, isRest = false) {
  if (isRest || !day) {
    return "rest";
  }

  const [primaryQuality] = Array.isArray(day.sessionProfile?.qualities)
    ? day.sessionProfile.qualities
    : [];

  return primaryQuality || (isConditioningOnlyDay(day) ? "conditioning" : "rest");
}

function hexToRgba(hexColor, alpha = 1) {
  const normalizedHex = String(hexColor || "").replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
    return hexColor;
  }

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getWeekScheduleTileColorStyle(day = null, selected = false) {
  const isRestDay = !day;
  const dayType = getSelectedDayGradientType(day, !day);
  const dayTypeColor = getTrainingDayTypeColor(
    dayType,
    WEEK_SCHEDULE_REST_DAY_COLOR
  );
  const selectedRestDayColor = hexToRgba(
    dayTypeColor,
    WEEK_SCHEDULE_SELECTED_REST_DAY_OPACITY
  );

  return {
    backgroundColor: selected
      ? isRestDay
        ? selectedRestDayColor
        : dayTypeColor
      : day
      ? hexToRgba(dayTypeColor, WEEK_SCHEDULE_DAY_FILL_OPACITY)
      : "transparent",
    borderColor: selected && isRestDay ? selectedRestDayColor : dayTypeColor,
  };
}

function getWeekScheduleTileTextStyle(day = null, selected = false) {
  if (selected) {
    return { color: "#000" };
  }

  const dayType = getSelectedDayGradientType(day, !day);
  const color = getTrainingDayTypeColor(dayType, WEEK_SCHEDULE_REST_DAY_COLOR);

  return { color };
}

function getWeekScheduleDayTypeMeta(day = null, selected = false) {
  if (!day) {
    return null;
  }

  const dayType = getSelectedDayGradientType(day);
  const label = getTrainingDayTypeLabel(dayType);
  const color = getTrainingDayTypeColor(dayType);

  if (!label || !color) {
    return null;
  }

  return {
    dayType,
    iconColor: selected ? "#000" : color,
    label,
    textStyle: {
      color: selected ? "#000" : color,
      fontSize: label.length >= 11 ? 7 : 9,
      lineHeight: label.length >= 11 ? 9 : 11,
    },
  };
}

function WeekScheduleTypeIcon({ color = "#fff", type = "force" }) {
  if (type === "power") {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" fill={color} />
      </Svg>
    );
  }

  if (type === "fatigue" || type === "conditioning") {
    return (
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Circle
          cx={12}
          cy={12}
          r={8}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
        />
        <Path
          d="M7 12h2l1.5-3.5L13 15l1.5-3H17"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
        />
      </Svg>
    );
  }

  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M5 9v6M19 9v6M8 12h8M3.5 10.5v3M20.5 10.5v3"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
    </Svg>
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

function buildCompletedStepKeysForExercises(exercises = []) {
  return buildSessionSteps(exercises).map(
    (step) => `${step.exerciseIndex}:${step.setIndex}`
  );
}

function isConditioningOnlyDay(day = {}) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];

  return (
    exercises.length > 0 &&
    exercises.every((exercise) => Boolean(exercise?.endurancePrescription))
  );
}

function getSessionProgressPercent(day = {}, progress = {}, isComplete = false) {
  const steps = buildSessionSteps(day?.exercises);
  const completedStepKeys = new Set(
    Array.isArray(progress?.completedStepKeys) ? progress.completedStepKeys : []
  );

  if (steps.length === 0) {
    return isComplete ? 100 : 0;
  }

  if (isComplete && completedStepKeys.size === 0) {
    return 100;
  }

  const completedStepCount = steps.filter((step) =>
    completedStepKeys.has(`${step.exerciseIndex}:${step.setIndex}`)
  ).length;

  return Math.round((completedStepCount / steps.length) * 100);
}

function SkeletonBlock({ style }) {
  return <View style={[styles.skeletonBlock, style]} />;
}

function SkeletonDayDetailPreview() {
  return (
    <View style={styles.skeletonDayDetailCard}>
      {SKELETON_DAY_CONTAINERS.map((container, index) => (
        <SkeletonBlock
          key={`skeleton-day-container-${index}`}
          style={[
            styles.skeletonDayContainer,
            { height: container.height },
          ]}
        />
      ))}
    </View>
  );
}

function WeekScheduleTile({ onPress, tileStyle, children }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.84}
      style={styles.weekSchedulePressable}
    >
      <Animated.View
        style={[
          styles.weekScheduleDay,
          tileStyle,
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}

function SelectedDaySlide({ animationKey, direction = 0, style, children }) {
  const slideProgress = useRef(new Animated.Value(1)).current;
  const previousAnimationKeyRef = useRef(animationKey);

  useEffect(() => {
    if (!animationKey || previousAnimationKeyRef.current === animationKey) {
      previousAnimationKeyRef.current = animationKey;
      return;
    }

    previousAnimationKeyRef.current = animationKey;
    slideProgress.stopAnimation();
    slideProgress.setValue(0);
    Animated.timing(slideProgress, {
      toValue: 1,
      duration: 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animationKey, direction, slideProgress]);

  const translateX = slideProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      direction * SELECTED_DAY_SLIDE_DISTANCE,
      0,
    ],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: slideProgress,
          transform: [{ translateX }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

function HeaderSessionProgressRing({ progressPercent = 0 }) {
  const safeProgressPercent = Math.max(
    0,
    Math.min(100, Number.isFinite(progressPercent) ? progressPercent : 0)
  );
  const progressOffset =
    HEADER_SESSION_RING_CIRCUMFERENCE -
    HEADER_SESSION_RING_CIRCUMFERENCE * (safeProgressPercent / 100);

  return (
    <View style={styles.headerSessionProgressRing}>
      <Svg
        width={HEADER_SESSION_RING_SIZE}
        height={HEADER_SESSION_RING_SIZE}
        viewBox={`0 0 ${HEADER_SESSION_RING_SIZE} ${HEADER_SESSION_RING_SIZE}`}
      >
        <Circle
          cx={HEADER_SESSION_RING_CENTER}
          cy={HEADER_SESSION_RING_CENTER}
          r={HEADER_SESSION_RING_RADIUS}
          fill="none"
          stroke="#3f3f46"
          strokeWidth={HEADER_SESSION_RING_STROKE}
        />
        <Circle
          cx={HEADER_SESSION_RING_CENTER}
          cy={HEADER_SESSION_RING_CENTER}
          r={HEADER_SESSION_RING_RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth={HEADER_SESSION_RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${HEADER_SESSION_RING_CIRCUMFERENCE} ${HEADER_SESSION_RING_CIRCUMFERENCE}`}
          strokeDashoffset={progressOffset}
          rotation="-90"
          originX={HEADER_SESSION_RING_CENTER}
          originY={HEADER_SESSION_RING_CENTER}
        />
      </Svg>
      <View style={styles.headerSessionProgressRingContent}>
        <IBMPlexText style={styles.headerSessionProgressRingText}>
          {safeProgressPercent}%
        </IBMPlexText>
      </View>
    </View>
  );
}

function PushBackActionIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M6 5.5 11.5 12 6 18.5"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
      <Path
        d="M12.5 5.5 18 12l-5.5 6.5"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}

function CompleteActionIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M5 12.5 9.25 16.75 19 7"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.6}
      />
    </Svg>
  );
}

function ProgramOverviewSkeleton() {
  return (
    <QuestionnaireShell hideTabBar={false}>
      <View style={styles.skeletonLockedRoot}>
        <ScrollView
          style={styles.skeletonLockedContent}
          contentContainerStyle={styles.center}
        >
          <View style={styles.header}>
            <View style={[styles.headerActionPanel, styles.skeletonActionPanel]}>
              <View style={styles.skeletonHeaderCopy}>
                <SkeletonBlock style={styles.skeletonDateLine} />
                <SkeletonBlock style={styles.skeletonPhaseLine} />
                <SkeletonBlock style={styles.skeletonMetaLine} />
              </View>

              <SkeletonBlock style={styles.skeletonActionPanelContent} />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.weekScheduleScroller}
              contentContainerStyle={styles.weekSchedule}
              contentOffset={{ x: WEEK_SCHEDULE_TODAY_OFFSET, y: 0 }}
            >
              {SKELETON_WEEK_SLOTS.map((_, index) => (
                <View key={`skeleton-week-slot-${index}`} style={styles.weekScheduleItem}>
                  <View style={styles.weekScheduleTileSlot}>
                    <View
                      style={[
                        styles.weekScheduleDay,
                        styles.skeletonWeekTile,
                      ]}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dayDetailEdgeToEdge}>
              <SkeletonDayDetailPreview />
            </View>

            <View style={styles.programDetailsFooter}>
              <SkeletonBlock style={styles.skeletonFooterLink} />
            </View>
          </View>
        </ScrollView>
        <Pressable
          accessible={false}
          onMoveShouldSetResponder={() => true}
          onPress={() => {}}
          onStartShouldSetResponder={() => true}
          style={styles.skeletonInteractionBlocker}
        >
          <View style={styles.skeletonMessageCard}>
            <IBMPlexText defaultWhite style={styles.skeletonMessageTitle}>
              No program yet.
            </IBMPlexText>
            <IBMPlexText defaultWhite style={styles.skeletonMessageText}>
              Generate a plan to see your weekly breakdown.
            </IBMPlexText>
          </View>
        </Pressable>
      </View>
    </QuestionnaireShell>
  );
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
  onCompletedSessionProgressSave,
  getCompletedSessionProgress,
  onTestSession,
  updatingPlan = false,
  initialScrollToTopKey = "",
}) {
  const pathname = usePathname();
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [pushBackConfirmVisible, setPushBackConfirmVisible] = useState(false);
  const [rescheduleInfoVisible, setRescheduleInfoVisible] = useState(false);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  const [activeSessionDay, setActiveSessionDay] = useState(null);
  const [selectedArchivedDay, setSelectedArchivedDay] = useState(null);
  const [selectedRestSlotKey, setSelectedRestSlotKey] = useState("");
  const [restSlotSelectionDismissed, setRestSlotSelectionDismissed] = useState(false);
  const [selectedTrainingSlotKey, setSelectedTrainingSlotKey] = useState("");
  const [swapEditorVisible, setSwapEditorVisible] = useState(false);
  const [launchGatePromptKey, setLaunchGatePromptKey] = useState("");
  const overviewScrollRef = useRef(null);
  const weekScheduleScrollRef = useRef(null);
  const lastInitialScrollToTopKeyRef = useRef("");
  const initialScrollToTopPassesRemainingRef = useRef(0);
  const lastWeekScheduleScrollDateRef = useRef("");
  const isPhonePreview = isPagesPhonePreview();
  const isOverviewRoute =
    pathname === "/overview" || pathname === "/(tabs)/overview";

  function openLaunchGatePrompt(promptKey) {
    setLaunchGatePromptKey(promptKey);
  }

  function closeLaunchGatePrompt() {
    setLaunchGatePromptKey("");
  }

  useWebTestActions("program-overview", "Plan tests", [
    ...(onTestSession
      ? [
          {
            label: "Test session",
            onPress: onTestSession,
          },
        ]
      : []),
    ...LAUNCH_GATE_CHECK_IN_TESTS.map((testPrompt) => ({
      label: testPrompt.label,
      onPress: () => openLaunchGatePrompt(testPrompt.key),
    })),
  ], isOverviewRoute && !activeSessionDay);

  useEffect(() => {
    if (selectedDay) {
      setSelectedRestSlotKey("");
      setRestSlotSelectionDismissed(false);
    }
  }, [selectedDay?.week, selectedDay?.day]);

  useEffect(() => {
    if (
      !initialScrollToTopKey ||
      lastInitialScrollToTopKeyRef.current === initialScrollToTopKey
    ) {
      return;
    }

    lastInitialScrollToTopKeyRef.current = initialScrollToTopKey;
    initialScrollToTopPassesRemainingRef.current = 2;
    requestAnimationFrame(scrollOverviewToTop);
  }, [initialScrollToTopKey]);

  useAndroidBackHandler(() => {
    if (swapEditorVisible) {
      return false;
    }

    if (detailsVisible) {
      setDetailsVisible(false);
      return;
    }

    if (rescheduleInfoVisible) {
      closeRescheduleInfo();
      return;
    }

    if (pushBackConfirmVisible) {
      closePushBackConfirm();
      return;
    }

    if (completeConfirmVisible) {
      closeCompleteConfirm();
      return;
    }

    if (launchGatePromptKey) {
      closeLaunchGatePrompt();
      return;
    }

    if (activeSessionDay) {
      setActiveSessionDay(null);
      return;
    }

    if (selectedArchivedDay) {
      setSelectedArchivedDay(null);
      return;
    }

    if (selectedDay) {
      onClearSelectedDay?.();
      return;
    }

    return false;
  }, [
    activeSessionDay,
    completeConfirmVisible,
    detailsVisible,
    pushBackConfirmVisible,
    rescheduleInfoVisible,
    launchGatePromptKey,
    selectedArchivedDay,
    selectedDay,
    swapEditorVisible,
  ]);

  if (!plan) {
    return <ProgramOverviewSkeleton />;
  }

  const completedDayEntries =
    completedDays instanceof Set
      ? Array.from(completedDays)
      : Array.isArray(completedDays)
        ? completedDays
        : [];
  const activeSelectedDay =
    selectedRestSlotKey || selectedArchivedDay ? null : selectedDay;
  const detailSelectedDay = selectedRestSlotKey
    ? null
    : selectedArchivedDay || selectedDay;
  const currentWeek = getCurrentTrainingWeek(plan, completedDayEntries);
  const phaseOverview = getTrainingPlanPhaseOverview(plan);
  const today = getProgramOverviewToday();
  const planStartDate = getPlanStartDate(plan);
  const shouldHideTabBarForCheckIn =
    Boolean(pendingTrainingCheckIn) || Boolean(launchGatePromptKey);
  const shouldHideTabBar = swapEditorVisible || shouldHideTabBarForCheckIn;
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
  const rollingDates = Array.from(
    {
      length:
        PROGRAM_OVERVIEW_LOOKBACK_DAYS +
        PROGRAM_OVERVIEW_UPCOMING_DAYS_INCLUDING_TODAY,
    },
    (_, index) => {
      const dayOffset = index - PROGRAM_OVERVIEW_LOOKBACK_DAYS;
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
    const weekday = getWeekdayNameFromIndex(date.getDay());
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

    if (
      !trainingDay &&
      index >= PROGRAM_OVERVIEW_LOOKBACK_DAYS &&
      !archivedContext
    ) {
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
  const hasSelectedTrainingDay = Boolean(activeSelectedDay || selectedArchivedDay);
  const hasExplicitScheduleSelection = Boolean(
    selectedRestSlotKey ||
      selectedTrainingSlotKey ||
      hasSelectedTrainingDay
  );
  const fallbackSelectedRestSlotKey =
    !hasExplicitScheduleSelection &&
    !restSlotSelectionDismissed &&
    currentWeekSchedule.some(
      (slot) => slot.dateKey === todayDateKey && !slot.trainingDay
    )
      ? todayDateKey
      : "";
  const effectiveSelectedRestSlotKey = hasSelectedTrainingDay
    ? ""
    : selectedRestSlotKey || fallbackSelectedRestSlotKey;
  const selectedRestSlot = effectiveSelectedRestSlotKey
    ? currentWeekSchedule.find((slot) => slot.dateKey === effectiveSelectedRestSlotKey)
    : null;
  const selectedTrainingSlot =
    activeSelectedDay && !selectedRestSlot
      ? currentWeekSchedule.find(
          (slot) =>
            selectedTrainingSlotKey &&
            slot.dateKey === selectedTrainingSlotKey &&
            slot.weekNumber === activeSelectedDay.week &&
            slot.trainingDay?.day === activeSelectedDay.day
        ) ||
        currentWeekSchedule.find(
          (slot) =>
            slot.weekNumber === activeSelectedDay.week &&
            slot.trainingDay?.day === activeSelectedDay.day
        )
      : null;
  const selectedArchivedSlot =
    selectedArchivedDay && !selectedRestSlot
      ? currentWeekSchedule.find(
          (slot) =>
            selectedTrainingSlotKey &&
            slot.dateKey === selectedTrainingSlotKey &&
            slot.weekNumber === selectedArchivedDay.week &&
            slot.trainingDay?.day === selectedArchivedDay.day
        )
      : null;
  const selectedScheduleSlot =
    selectedRestSlot || selectedTrainingSlot || selectedArchivedSlot;
  const selectedHeaderDate =
    selectedScheduleSlot?.date instanceof Date ? selectedScheduleSlot.date : today;
  const selectedHeaderWeekNumber =
    selectedScheduleSlot?.weekNumber || activeSelectedDay?.week || currentWeek?.week || 1;
  const selectedHeaderPhase =
    getPlanPhaseForWeekNumber(phaseOverview, selectedHeaderWeekNumber);
  const selectedHeaderDay =
    selectedScheduleSlot?.trainingDay ||
    activeSelectedDay?.dayData ||
    selectedArchivedDay?.dayData ||
    null;
  const selectedDateLabel = formatCurrentDateLabel(selectedHeaderDate);
  const selectedPhaseLabel = selectedHeaderPhase?.label
    ? `${selectedHeaderPhase.label} week ${selectedHeaderWeekNumber}`
    : `Week ${selectedHeaderWeekNumber}`;
  const selectedDayMetaLabel =
    selectedHeaderDay && !selectedRestSlot
      ? getSelectedDayMetaLabel(selectedHeaderDay)
      : "";
  const selectedHeaderGradientType = getSelectedDayGradientType(
    selectedHeaderDay,
    Boolean(selectedRestSlot)
  );
  const selectedScheduleAnimationKey = selectedScheduleSlot
    ? [
        selectedScheduleSlot.dateKey,
        selectedScheduleSlot.trainingDay?.day || "rest",
        selectedScheduleSlot.isArchived ? "archived" : "current",
      ].join(":")
    : "";
  const selectedScheduleSlideDirection = selectedScheduleSlot
    ? isSameCalendarDay(selectedScheduleSlot.date, today)
      ? 0
      : selectedScheduleSlot.date < today
        ? -1
        : 1
    : 0;
  const selectedTrainingSlotIsToday =
    Boolean(selectedTrainingSlot) &&
    isSameCalendarDay(selectedTrainingSlot.date, today);
  const selectedTrainingSlotIsFuture =
    Boolean(selectedTrainingSlot) && selectedTrainingSlot.date > today;
  const selectedTrainingSlotIsPast =
    Boolean(selectedTrainingSlot) && selectedTrainingSlot.date < today;
  const selectedDayCompletionKey = activeSelectedDay
    ? `${activeSelectedDay.week}-${activeSelectedDay.day}`
    : "";
  const selectedDaySessionProgress = selectedDayCompletionKey
    ? getActiveSessionProgress?.(selectedDayCompletionKey)
    : null;
  const selectedDayCompletedSessionProgress = selectedDayCompletionKey
    ? getCompletedSessionProgress?.(selectedDayCompletionKey)
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
  const showSelectedTrainingActions =
    showTodayTrainingActions || showFutureTrainingPushBack;
  const showCompletedSessionStatus =
    Boolean(activeSelectedDay) &&
    selectedDayIsComplete &&
    !selectedRestSlot &&
    !selectedDayIsPushedBack;
  const showPreviousSessionStatus =
    Boolean(activeSelectedDay) &&
    selectedTrainingSlotIsPast &&
    !selectedDayIsComplete &&
    !selectedRestSlot &&
    !selectedDayIsPushedBack;
  const showPushedBackSessionStatus =
    Boolean(activeSelectedDay) && selectedDayIsPushedBack && !selectedRestSlot;
  const showRestSessionStatus = Boolean(selectedRestSlot);
  const showStartButton = showSelectedTrainingActions;
  const showCompleteButton = showSelectedTrainingActions && Boolean(onFinishDay);
  const showPushBackButton =
    showSelectedTrainingActions && Boolean(onMissedDay);
  const hasKnownHeaderActionContent =
    showStartButton ||
    showCompletedSessionStatus ||
    showPreviousSessionStatus ||
    showPushedBackSessionStatus ||
    showRestSessionStatus;
  const showFallbackSessionStatus = !hasKnownHeaderActionContent;
  const showHeaderActionContent =
    hasKnownHeaderActionContent || showFallbackSessionStatus;
  const showRescheduleInfoButton =
    Boolean(detailSelectedDay) &&
    !selectedRestSlot &&
    detailSelectedDay.status === "rescheduled";
  const rescheduleInfoSummary =
    detailSelectedDay?.adjustmentSummary ||
    "This session was moved after a missed slot.";
  const rescheduleInfoMode = detailSelectedDay?.rescueMode
    ? detailSelectedDay.rescueMode.replace(/_/g, " ")
    : "";
  const completedSessionProgressPercent =
    getSessionProgressPercent(
      activeSelectedDay,
      selectedDayCompletedSessionProgress,
      selectedDayIsComplete
    );
  const activeSessionProgressPercent =
    getSessionProgressPercent(activeSelectedDay, selectedDaySessionProgress);
  const previousSessionProgressPercent =
    selectedDayCompletedSessionProgress
      ? completedSessionProgressPercent
      : activeSessionProgressPercent;
  const nextTrainingSlot = currentWeekSchedule.find((slot) => {
    if (!slot.trainingDay || slot.isArchived || !(slot.date instanceof Date)) {
      return false;
    }

    if (slot.date <= today) {
      return false;
    }

    const slotKey = `${slot.weekNumber}-${slot.trainingDay.day}`;
    return (
      !completedDayEntries.includes(slotKey) &&
      slot.trainingDay.status !== "skipped"
    );
  });
  const nextSessionDayCount = nextTrainingSlot
    ? Math.max(
        0,
        Math.ceil(
          (startOfLocalDay(nextTrainingSlot.date) - startOfLocalDay(today)) /
            (24 * 60 * 60 * 1000)
        )
      )
    : null;
  const nextSessionText =
    Number.isFinite(nextSessionDayCount)
      ? nextSessionDayCount === 1
        ? "Next session in 1 day"
        : `Next session in ${nextSessionDayCount} days`
      : "Next session coming up";

  function scrollOverviewToTop() {
    overviewScrollRef.current?.scrollTo?.({
      x: 0,
      y: 0,
      animated: false,
    });

    if (initialScrollToTopPassesRemainingRef.current > 0) {
      initialScrollToTopPassesRemainingRef.current -= 1;
    }
  }

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

  function handleSelectTrainingDay(weekNumber, dayNumber, dateKey) {
    setSelectedArchivedDay(null);
    setSelectedRestSlotKey("");
    setRestSlotSelectionDismissed(false);
    setSelectedTrainingSlotKey(dateKey);
    onSelectDay(weekNumber, dayNumber);
  }

  function handleSelectArchivedTrainingDay(weekNumber, dayData = {}, dateKey) {
    setSelectedRestSlotKey("");
    setRestSlotSelectionDismissed(false);
    setSelectedTrainingSlotKey(dateKey);
    setSelectedArchivedDay(buildSessionDayPayload(dayData, weekNumber));
    onClearSelectedDay?.();
  }

  function handleSelectRestSlot(dateKey) {
    if (effectiveSelectedRestSlotKey === dateKey) {
      setSelectedArchivedDay(null);
      setSelectedRestSlotKey("");
      setRestSlotSelectionDismissed(true);
      setSelectedTrainingSlotKey("");
      onClearSelectedDay?.();
      return;
    }

    setSelectedArchivedDay(null);
    setSelectedRestSlotKey(dateKey);
    setRestSlotSelectionDismissed(false);
    setSelectedTrainingSlotKey("");
    onClearSelectedDay?.("rest");
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
        (slot, index) =>
          index >= PROGRAM_OVERVIEW_LOOKBACK_DAYS && slot.trainingDay
      )?.trainingDay;
    const nextWeekNumber = activeSelectedDay?.week || currentWeek?.week;

    if (!nextTrainingDay || !nextWeekNumber) {
      return;
    }

    onSelectDay(nextWeekNumber, nextTrainingDay.day);
    reactiveModel.setForumTabBarHidden?.(true);
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

  function openRescheduleInfo() {
    setRescheduleInfoVisible(true);
  }

  function closeRescheduleInfo() {
    setRescheduleInfoVisible(false);
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
        strengthAssessmentSummary={strengthAssessmentSummary}
        initialSessionProgress={getActiveSessionProgress?.(activeSessionKey)}
        onSessionProgressChange={(progress) =>
          onActiveSessionProgressChange?.(activeSessionKey, progress)
        }
        onBack={() => setActiveSessionDay(null)}
        onFinish={(trackedResults, completedProgress = {}) => {
          onCompletedSessionProgressSave?.(activeSessionKey, {
            completedStepKeys:
              completedProgress.completedStepKeys ||
              buildCompletedStepKeysForExercises(activeSessionDay.exercises),
            trackingDrafts: completedProgress.trackingDrafts || {},
          });
          onActiveSessionProgressClear?.(activeSessionKey);
          onFinishDay?.(trackedResults);
          setActiveSessionDay(null);
        }}
      />
    );
  }

  return (
    <QuestionnaireShell hideTabBar={shouldHideTabBar}>
      <ScrollView
        ref={overviewScrollRef}
        style={swapEditorVisible ? styles.blurredContent : null}
        contentContainerStyle={styles.center}
        onContentSizeChange={() => {
          if (initialScrollToTopPassesRemainingRef.current > 0) {
            scrollOverviewToTop();
          }
        }}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.headerActionPanel,
              !showHeaderActionContent && styles.headerActionPanelEmpty,
            ]}
          >
            <TrainingDayTypeGradient type={selectedHeaderGradientType} />

            <View style={styles.headerActionPanelHeading}>
              <IBMPlexText defaultWhite style={styles.headerDate}>{selectedDateLabel}</IBMPlexText>
              <IBMPlexText defaultWhite style={styles.headerPhase}>{selectedPhaseLabel}</IBMPlexText>
              {selectedDayMetaLabel ? (
                <IBMPlexText defaultWhite lines={1} style={styles.headerMeta}>
                  {selectedDayMetaLabel}
                </IBMPlexText>
              ) : null}
            </View>

            <SelectedDaySlide
              animationKey={selectedScheduleAnimationKey}
              direction={selectedScheduleSlideDirection}
              style={[
                styles.headerActionArea,
                !showHeaderActionContent && styles.headerActionAreaEmpty,
              ]}
            >
              {showCompletedSessionStatus ? (
                <View style={styles.headerCompletedStatus}>
                  <View style={styles.headerCompletedCopy}>
                    <IBMPlexText defaultWhite style={styles.headerCompletedTitle}>
                      Session complete.
                    </IBMPlexText>
                    <IBMPlexText defaultWhite style={styles.headerCompletedSubtitle}>
                      {nextSessionText}
                    </IBMPlexText>
                  </View>
                  <View style={styles.headerCompletedRingSlot}>
                    <HeaderSessionProgressRing
                      progressPercent={completedSessionProgressPercent}
                    />
                  </View>
                </View>
              ) : null}
              {showPreviousSessionStatus ? (
                <View style={styles.headerCompletedStatus}>
                  <View style={styles.headerCompletedCopy}>
                    <IBMPlexText defaultWhite style={styles.headerCompletedTitle}>
                      Previous session
                    </IBMPlexText>
                    <IBMPlexText defaultWhite style={styles.headerCompletedSubtitle}>
                      Session progress
                    </IBMPlexText>
                  </View>
                  <View style={styles.headerCompletedRingSlot}>
                    <HeaderSessionProgressRing
                      progressPercent={previousSessionProgressPercent}
                    />
                  </View>
                </View>
              ) : null}
              {showRestSessionStatus ? (
                <View style={styles.restSessionContent}>
                  <IBMPlexText defaultWhite lines={1} style={styles.restSessionText}>
                    Rest
                  </IBMPlexText>
                </View>
              ) : null}
              {showPushedBackSessionStatus ? (
                <View style={styles.restSessionContent}>
                  <IBMPlexText defaultWhite lines={1} style={styles.restSessionText}>
                    Pushed back
                  </IBMPlexText>
                </View>
              ) : null}
              {showFallbackSessionStatus ? (
                activeSelectedDay ? (
                  <View style={styles.headerCompletedStatus}>
                    <View style={styles.headerCompletedCopy}>
                      <IBMPlexText defaultWhite style={styles.headerCompletedTitle}>
                        Session progress
                      </IBMPlexText>
                      <IBMPlexText defaultWhite style={styles.headerCompletedSubtitle}>
                        Saved progress
                      </IBMPlexText>
                    </View>
                    <View style={styles.headerCompletedRingSlot}>
                      <HeaderSessionProgressRing
                        progressPercent={previousSessionProgressPercent}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.restSessionContent}>
                    <IBMPlexText defaultWhite lines={1} style={styles.restSessionText}>
                      No session selected
                    </IBMPlexText>
                  </View>
                )
              ) : null}
              {showStartButton ? (
                <View style={styles.currentSessionContent}>
                  <View style={styles.currentSessionActions}>
                    <TouchableOpacity
                      style={styles.headerStartButton}
                      onPress={handleStartSession}
                    >
                      <IBMPlexText defaultWhite lines={1} style={styles.headerStartButtonText}>
                        {selectedDayHasStartedSession ? "Continue" : "Start"}
                      </IBMPlexText>
                    </TouchableOpacity>
                    {showPushBackButton ? (
                      <TouchableOpacity
                        accessibilityLabel="Push back session"
                        accessibilityRole="button"
                        style={[
                          styles.currentSessionSecondaryButton,
                          updatingPlan && styles.currentSessionSecondaryButtonDisabled,
                        ]}
                        onPress={openPushBackConfirm}
                        disabled={updatingPlan}
                      >
                        <PushBackActionIcon />
                      </TouchableOpacity>
                    ) : null}
                    {showCompleteButton ? (
                      <TouchableOpacity
                        accessibilityLabel="Complete session"
                        accessibilityRole="button"
                        style={styles.currentSessionSecondaryButton}
                        onPress={openCompleteConfirm}
                      >
                        <CompleteActionIcon />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </SelectedDaySlide>
          </View>

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
              const isSelectedRestDay =
                !trainingDay && effectiveSelectedRestSlotKey === dateKey;
              const isSelectedScheduleDay =
                isSelectedTrainingDay ||
                isSelectedArchivedDay ||
                isSelectedRestDay;
              const showConditioningMarker = isConditioningOnlyDay(trainingDay);
              const scheduleTileColorStyle =
                getWeekScheduleTileColorStyle(
                  trainingDay,
                  isSelectedScheduleDay
                );
              const scheduleDayTypeMeta = getWeekScheduleDayTypeMeta(
                trainingDay,
                isSelectedScheduleDay
              );
              const scheduleTileTextStyle = getWeekScheduleTileTextStyle(
                trainingDay,
                isSelectedScheduleDay
              );

              return (
                <View key={date.toISOString()} style={styles.weekScheduleItem}>
                  <View style={styles.weekScheduleTileSlot}>
                    <WeekScheduleTile
                      selected={isSelectedScheduleDay}
                      onPress={() => {
                        if (isSelectableCurrentTrainingDay) {
                          handleSelectTrainingDay(weekNumber, trainingDay.day, dateKey);
                        } else if (trainingDay && isArchived) {
                          handleSelectArchivedTrainingDay(weekNumber, trainingDay, dateKey);
                        } else {
                          handleSelectRestSlot(dateKey);
                        }
                      }}
                      tileStyle={[
                        scheduleTileColorStyle,
                        isArchived && styles.weekScheduleArchivedDay,
                        isToday && styles.weekScheduleToday,
                      ]}
                    >
                      {showConditioningMarker ? (
                        <View style={styles.weekScheduleConditioningMarker} />
                      ) : null}
                      {scheduleDayTypeMeta ? (
                        <View style={styles.weekScheduleTypeIcon}>
                          <WeekScheduleTypeIcon
                            color={scheduleDayTypeMeta.iconColor}
                            type={scheduleDayTypeMeta.dayType}
                          />
                        </View>
                      ) : null}
                      <IBMPlexText
                        style={[
                          styles.weekScheduleLabel,
                          scheduleTileTextStyle,
                        ]}
                      >
                        {trainingDay ? `Day\n${trainingDay.day}` : "Rest"}
                      </IBMPlexText>
                      {scheduleDayTypeMeta ? (
                        <IBMPlexText
                          adjustsFontSizeToFit
                          lines={1}
                          minimumFontScale={0.82}
                          style={[
                            styles.weekScheduleTypeLabel,
                            scheduleDayTypeMeta.textStyle,
                          ]}
                        >
                          {scheduleDayTypeMeta.label}
                        </IBMPlexText>
                      ) : null}
                    </WeekScheduleTile>
                  </View>
                  <View
                    style={[
                      styles.weekScheduleDateContainer,
                      isToday && styles.weekScheduleTodayDateContainer,
                    ]}
                  >
                    <IBMPlexText defaultWhite style={styles.weekScheduleDate}>
                      {weekday.slice(0, 3)}
                      {"\n"}
                      {date.getDate()}
                    </IBMPlexText>
                  </View>
                </View>
              );
            })}
          </ScrollView>

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

          {detailSelectedDay ? (
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
                isSessionComplete={selectedArchivedDay ? false : selectedDayIsComplete}
                completedSessionProgress={selectedDayCompletedSessionProgress}
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
                showRescheduledNotice={false}
              />
            </View>
          ) : null}

          <View style={styles.programDetailsFooter}>
            {onTestSession && !isPhonePreview ? (
              <TouchableOpacity
                style={styles.testSessionButton}
                onPress={onTestSession}
              >
                <IBMPlexText defaultWhite lines={1} style={styles.testSessionButtonText}>
                  Test session
                </IBMPlexText>
              </TouchableOpacity>
            ) : null}
            {!isPhonePreview
              ? LAUNCH_GATE_CHECK_IN_TESTS.map((testPrompt) => (
                  <TouchableOpacity
                    key={testPrompt.key}
                    style={styles.testSessionButton}
                    onPress={() => openLaunchGatePrompt(testPrompt.key)}
                  >
                    <IBMPlexText defaultWhite lines={1} style={styles.testSessionButtonText}>
                      {testPrompt.label}
                    </IBMPlexText>
                  </TouchableOpacity>
                ))
              : null}
            <TouchableOpacity
              style={styles.programDetailsFooterLink}
              onPress={() => setDetailsVisible(true)}
            >
              <IBMPlexText defaultWhite style={styles.programDetailsFooterLinkText}>
                Program details &gt;
              </IBMPlexText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {showRescheduleInfoButton ? (
        <TouchableOpacity
          accessibilityLabel="Show rescheduled session information"
          accessibilityRole="button"
          onPress={openRescheduleInfo}
          style={styles.rescheduleInfoButton}
        >
          <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            style={styles.rescheduleInfoButtonIcon}
          >
            <Path
              d="M6.5 5.5 12 12l-5.5 6.5"
              fill="none"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
            />
            <Path
              d="M12.5 5.5 18 12l-5.5 6.5"
              fill="none"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.4}
            />
          </Svg>
        </TouchableOpacity>
      ) : null}
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
              <IBMPlexText defaultWhite style={styles.detailText} textColor="#111">
                {plan.summary}
              </IBMPlexText>
            ) : null}
            {phaseOverview.map((phase) => (
              <View
                key={`${phase.weekStart}-${phase.weekEnd}-${phase.label}`}
                style={styles.phaseDetail}
              >
                <IBMPlexText defaultWhite style={styles.phaseRange} textColor="#6b7280">
                  {getPhaseRangeLabel(phase)}
                </IBMPlexText>
                <IBMPlexText defaultWhite style={styles.phaseLabel} textColor="#111">
                  {phase.label}
                </IBMPlexText>
                {phase.focus ? (
                  <IBMPlexText defaultWhite style={styles.detailText} textColor="#374151">
                    {phase.focus}
                  </IBMPlexText>
                ) : null}
              </View>
            ))}
          </ScrollView>
        }
      />
      <WhiteBottomMenu
        visible={rescheduleInfoVisible}
        onDismiss={closeRescheduleInfo}
        title="Rescheduled session"
        description={rescheduleInfoSummary}
        buttonText="Close"
        onButtonPress={closeRescheduleInfo}
        content={
          rescheduleInfoMode ? (
            <IBMPlexText defaultWhite style={styles.rescheduleInfoMeta} textColor="#525252">
              Mode: {rescheduleInfoMode}
            </IBMPlexText>
          ) : null
        }
      />
      <LaunchGateCheckInModal
        promptKey={launchGatePromptKey}
        visible={Boolean(launchGatePromptKey)}
        onClose={closeLaunchGatePrompt}
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
    marginTop: PROGRAM_OVERVIEW_CONTENT_TOP_MARGIN,
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
    fontSize: 28, fontWeight: "700",
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
    paddingTop: PROGRAM_OVERVIEW_HEADER_TOP_PADDING,
    width: "100%",
    position: "relative",
  },
  headerDate: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34, fontWeight: "700",
    marginBottom: 6,
  },
  headerPhase: {
    fontSize: 18,
    lineHeight: 24,
    color: "#d1d5db",
    marginBottom: 4,
  },
  headerMeta: {
    color: "#858585",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  programDetailsFooter: {
    alignItems: "center",
    alignSelf: "stretch",
    gap: 14,
    marginBottom: 28,
    marginTop: "auto",
    paddingTop: 28,
  },
  testSessionButton: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#fff",
    borderRadius: 120,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  testSessionButtonText: {
    color: "#000",
    fontSize: 15, fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  programDetailsFooterLink: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  programDetailsFooterLinkText: {
    color: "#9ca3af",
    fontSize: 13, fontWeight: "700",
  },
  rescheduleInfoButton: {
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    borderColor: "#585858",
    borderWidth: 1,
    borderRadius: 120,
    bottom: 100,
    elevation: 10,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
    right: 30,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    width: 48,
    zIndex: 10,
  },
  rescheduleInfoButtonIcon: {
    marginLeft: 1,
  },
  rescheduleInfoMeta: {
    fontSize: 13, fontWeight: "800",
    lineHeight: 18,
    textTransform: "capitalize",
  },
  headerActionPanel: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "#101010",
    borderRadius: 18,
    borderColor: "#252525",
    borderWidth: 1,
    overflow: "hidden",
    marginHorizontal: -8,
    marginTop: 0,
    minHeight: 188,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    position: "relative",
    justifyContent: "space-between",
  },
  headerActionPanelEmpty: {
    marginTop: 0,
  },
  headerActionPanelHeading: {
    alignSelf: "stretch",
  },
  headerActionArea: {
    alignSelf: "center",
    marginTop: 0,
    width: "100%",
  },
  headerActionAreaEmpty: {
    marginTop: 0,
    minHeight: 0,
  },
  headerStartButton: {
    backgroundColor: "#fff",
    borderRadius: 120,
    flex: 1,
    justifyContent: "center",
    height: 36,
    minWidth: 0,
    paddingHorizontal: 16,
  },
  headerStartButtonText: {
    color: "#000",
    alignSelf: "center",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
  headerCompletedStatus: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    width: "100%",
  },
  headerCompletedCopy: {
    gap: 6,
    minWidth: 0,
    width: "50%",
  },
  headerCompletedRingSlot: {
    alignItems: "center",
    justifyContent: "center",
    width: "50%",
  },
  headerCompletedTitle: {
    color: "#fff",
    fontSize: 18, fontWeight: "800",
    lineHeight: 22,
  },
  headerCompletedSubtitle: {
    color: "#9ca3af",
    fontSize: 13, fontWeight: "700",
    lineHeight: 16,
  },
  headerSessionProgressRing: {
    alignItems: "center",
    flexShrink: 0,
    height: HEADER_SESSION_RING_SIZE,
    justifyContent: "center",
    width: HEADER_SESSION_RING_SIZE,
  },
  headerSessionProgressRingContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSessionProgressRingText: {
    color: "#fff",
    fontSize: 13, fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
  },
  restSessionContent: {
    alignItems: "center",
    alignSelf: "stretch",
    justifyContent: "center",
    minHeight: 64,
    width: "100%",
  },
  restSessionText: {
    color: "#7E7E7E",
    fontSize: 13, fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  currentSessionContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  currentSessionActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minWidth: 0,
    width: "100%",
  },
  currentSessionSecondaryButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 34,
  },
  currentSessionSecondaryButtonDisabled: {
    opacity: 0.5,
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
    fontSize: 12, fontWeight: "700",
  },
  phaseLabel: {
    fontSize: 17, fontWeight: "700",
  },
  weekSchedule: {
    flexDirection: "row",
    gap: 0,
    paddingHorizontal: 28,
  },
  weekScheduleScroller: {
    flexGrow: 0,
    alignSelf: "stretch",
    marginHorizontal: -28,
    marginTop: PROGRAM_OVERVIEW_PANEL_TO_SCHEDULE_GAP,
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
    height: WEEK_SCHEDULE_TILE_LARGE_HEIGHT,
    justifyContent: "flex-end",
  },
  weekSchedulePressable: {
    height: WEEK_SCHEDULE_TILE_LARGE_HEIGHT,
    width: WEEK_SCHEDULE_TILE_LARGE_WIDTH,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  weekScheduleDay: {
    height: WEEK_SCHEDULE_TILE_SMALL_HEIGHT,
    width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: 18,
    padding: 6,
    gap: 2,
    borderColor: "#585858",
    borderWidth: 1,
    borderStyle: "solid",
  },
  weekScheduleArchivedDay: {
    opacity: 0.62,
  },
  weekScheduleToday: {
    borderStyle: "solid",
  },
  weekScheduleLabel: {
    fontSize: 13, fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  weekScheduleTypeLabel: {
    bottom: 18,
    fontWeight: "800",
    paddingHorizontal: 2,
    position: "absolute",
    textAlign: "center",
    width: "100%",
  },
  weekScheduleTypeIcon: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 18,
    width: "100%",
  },
  weekScheduleConditioningMarker: {
    position: "absolute",
    top: 7,
    left: 7,
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#2F80ED",
  },
  weekScheduleDate: {
    fontSize: 12, fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  weekScheduleDateContainer: {
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 3,
    minWidth: 34,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  weekScheduleTodayDateContainer: {
    backgroundColor: "#0F0F0F",
  },
  skeletonBlock: {
    backgroundColor: "#242424",
    borderColor: "#353535",
    borderWidth: 1,
    opacity: 0.88,
  },
  skeletonLockedRoot: {
    flex: 1,
    position: "relative",
  },
  skeletonLockedContent: {
    filter: [{ blur: 3 }],
  },
  skeletonInteractionBlocker: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(12, 12, 12, 0.58)",
    justifyContent: "center",
    paddingHorizontal: 28,
    zIndex: 10,
  },
  skeletonMessageCard: {
    alignItems: "center",
    gap: 10,
    maxWidth: 340,
  },
  skeletonMessageTitle: {
    color: "#fff",
    fontSize: 28, fontWeight: "700",
    lineHeight: 34,
    textAlign: "center",
  },
  skeletonMessageText: {
    color: "#C9B259",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  skeletonHeaderCopy: {
    alignSelf: "stretch",
    gap: 8,
  },
  skeletonDateLine: {
    borderRadius: 8,
    height: 30,
    width: 210,
  },
  skeletonPhaseLine: {
    borderRadius: 7,
    height: 20,
    width: 142,
  },
  skeletonMetaLine: {
    borderRadius: 6,
    height: 16,
    width: 250,
  },
  skeletonWeekTile: {
    backgroundColor: "#242424",
    borderWidth: 0,
  },
  skeletonActionPanel: {
    backgroundColor: "#242424",
    borderRadius: 18,
    marginTop: 0,
    minHeight: 188,
    paddingTop: 18,
    paddingBottom: 18,
    justifyContent: "space-between",
  },
  skeletonActionPanelContent: {
    alignSelf: "stretch",
    borderRadius: 0,
    height: 64,
    marginTop: 0,
  },
  skeletonDayDetailCard: {
    alignSelf: "stretch",
    gap: 14,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 28,
  },
  skeletonDayContainer: {
    borderColor: "#262626",
    borderRadius: 18,
    borderWidth: 1,
  },
  skeletonFooterLink: {
    borderRadius: 6,
    height: 15,
    width: 112,
  },
});
