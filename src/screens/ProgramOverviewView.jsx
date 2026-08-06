import {
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import WhiteBottomMenu from "../components/profileComponents/WhiteBottomMenu.jsx";
import SessionMoveCalendar from "../components/planComponents/SessionMoveCalendar.jsx";
import ActiveSessionView, {
  getRecommendedLoadKg,
  getRecommendedRepCount,
  getSetLoggingConfig,
} from "./ActiveSessionView.jsx";
import DayDetailView from "./DayDetailView.jsx";
import LaunchGateCheckInModal, {
  LAUNCH_GATE_CHECK_IN_TESTS,
} from "./LaunchGateCheckInModal.jsx";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import TrainingCheckInCard from "./TrainingCheckInCard.jsx";
import ActiveSessionSetLoggingInputPanel from "../components/planComponents/ActiveSessionSetLoggingInputPanel.jsx";
import { getWeekdayNameFromIndex } from "../constants/weekdays.js";
import {
  getTrainingDayTypeColor,
  getTrainingDayTypeLabel,
} from "../constants/trainingDayTypes.js";
import { LinearGradient } from "expo-linear-gradient";
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
  getPlanWeekStartDate,
  getProgramOverviewToday,
  isSameCalendarDay,
} from "../services/utils/programOverview.js";
import { useAndroidBackHandler } from "../services/utils/useAndroidBackHandler.js";
import { getPrescribedSetCount } from "../services/utils/exerciseSets.js";
import { buildExerciseSessionSteps } from "../services/utils/exerciseSupersets.js";
import {
  getPendingProgramMaxAssessments,
  getStrengthAssessmentLiftKey,
  getStrengthAssessmentReferenceOneRepMaxKg,
} from "../services/utils/strengthAssessment.js";
import { reactiveModel } from "../services/models/mobxReactiveModel.js";
import { fonts } from "../theme/colors.js";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
import BugReportControl from "../components/feedbackComponents/BugReportControl.jsx";
const WEEK_SCHEDULE_ITEM_WIDTH = 86;
const WEEK_SCHEDULE_TODAY_OFFSET =
  PROGRAM_OVERVIEW_LOOKBACK_DAYS * WEEK_SCHEDULE_ITEM_WIDTH;
const SKELETON_WEEK_SLOTS = Object.freeze(Array.from({ length: 8 }));
const SKELETON_DAY_CONTAINERS = Object.freeze([
  { height: 92 },
  { height: 150 },
  { height: 150 },
  { height: 118 },
]);
const WEEK_SCHEDULE_TILE_SMALL_HEIGHT = 126;
const WEEK_SCHEDULE_TILE_SMALL_WIDTH = 72;
const WEEK_SCHEDULE_TILE_LARGE_HEIGHT = 132;
const WEEK_SCHEDULE_TILE_LARGE_WIDTH = 86;
const SELECTED_DAY_SLIDE_DISTANCE = 44;
const PROGRAM_OVERVIEW_CONTENT_TOP_MARGIN = 16;
const PROGRAM_OVERVIEW_HEADER_TOP_PADDING = 14;
const WEEK_SCHEDULE_DAY_FILL_OPACITY = 0.15;
const WEEK_SCHEDULE_SELECTED_REST_DAY_OPACITY = 0.5;
const WEEK_SCHEDULE_REST_DAY_COLOR = "#585858";
const WEEK_SCHEDULE_SURFACE = "#101010";
const WEEK_SCHEDULE_SURFACE_MUTED = "#0B0B0B";
const WEEK_SCHEDULE_BORDER = "#252525";
const PLAN_CARD_SURFACE = "#111111";
const PLAN_CARD_BORDER = "#252525";
const PLAN_CARD_TEXT_MUTED = "#9A9AA2";
const PLAN_CARD_BLUE = "#0A84FF";

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

function getSessionName(day = null) {
  if (!day) {
    return "";
  }

  return `Day ${day.day}`;
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

function getWeekScheduleType(day = null) {
  return getSelectedDayGradientType(day);
}

function getWeekScheduleTypeColor(day = null) {
  const dayType = getWeekScheduleType(day);

  return getTrainingDayTypeColor(dayType, WEEK_SCHEDULE_REST_DAY_COLOR);
}

function getWeekScheduleTypeLabel(day = null) {
  const dayType = getWeekScheduleType(day);

  return getTrainingDayTypeLabel(dayType);
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

  if (!isRestDay) {
    return {
      backgroundColor: hexToRgba(dayTypeColor, WEEK_SCHEDULE_DAY_FILL_OPACITY),
      borderColor: dayTypeColor,
      borderWidth: selected ? 2 : 1,
    };
  }

  return {
    backgroundColor: selected ? WEEK_SCHEDULE_SURFACE : WEEK_SCHEDULE_SURFACE_MUTED,
    borderColor: selected
      ? selectedRestDayColor
      : WEEK_SCHEDULE_BORDER,
    borderWidth: selected ? 1.5 : 1,
  };
}

function getWeekScheduleTileTextStyle(day = null, selected = false) {
  if (!day) {
    return { color: selected ? "#fff" : "#7E7E7E" };
  }

  return { color: "#fff" };
}

function getWeekScheduleDayTypeMeta(day = null, selected = false) {
  if (!day) {
    return null;
  }

  const dayType = getWeekScheduleType(day);
  const label = getWeekScheduleTypeLabel(day);
  const color = getWeekScheduleTypeColor(day);

  if (!label || !color) {
    return null;
  }

  return {
    dayType,
    iconColor: color,
    label,
    textStyle: {
      color,
      fontSize: label.length >= 11 ? 9 : 10,
      lineHeight: label.length >= 11 ? 10 : 12,
    },
  };
}

function WeekScheduleTypeIcon({ color = "#fff", type = "force", size = 20 }) {
  const strokeWidth = 2.4;

  if (type === "power") {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M13 2 4 14h7l-1 8 10-13h-7l1-7Z" fill={color} />
      </Svg>
    );
  }

  if (type === "fatigue" || type === "conditioning") {
    return <Ionicons color={color} name="footsteps" size={size} />;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5 9v6M19 9v6M8 12h8M3.5 10.5v3M20.5 10.5v3"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

function MoonRestIcon({ size = 30, color = "#7E7E7E" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20.65 14.53A8.5 8.5 0 0 1 9.47 3.35a.9.9 0 0 0-1.02-1.3A10.3 10.3 0 1 0 21.95 15.55a.9.9 0 0 0-1.3-1.02Z"
        fill={color}
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
  return getPrescribedSetCount(exercise);
}

function buildSessionSteps(exercises = []) {
  return buildExerciseSessionSteps(exercises);
}

function buildCompletedStepKeysForExercises(exercises = []) {
  return buildSessionSteps(exercises).map(
    (step) => `${step.exerciseIndex}:${step.setIndex}`
  );
}

function getExerciseLogDraftKey(exerciseIndex, setIndex = 0) {
  return `${exerciseIndex}:${setIndex}`;
}

function createExerciseLogDraft({
  exercise = {},
  exerciseIndex = 0,
  setIndex = 0,
  progress = {},
  initialPerformanceResults = [],
  initialAssessmentResults = [],
}) {
  const draftKey = getExerciseLogDraftKey(exerciseIndex, setIndex);
  const progressDraft = progress?.trackingDrafts?.[draftKey];

  if (progressDraft && typeof progressDraft === "object") {
    return {
      exerciseIndex,
      setIndex,
      loadKg: "",
      reps: "",
      durationMinutes: "",
      rpe: "",
      customValues: {},
      ...progressDraft,
      exerciseIndex,
      setIndex,
      customValues:
        progressDraft.customValues && typeof progressDraft.customValues === "object"
          ? progressDraft.customValues
          : {},
    };
  }

  const savedResult = [
    ...(Array.isArray(initialPerformanceResults) ? initialPerformanceResults : []),
    ...(Array.isArray(initialAssessmentResults) ? initialAssessmentResults : []),
  ].find(
    (result) =>
      result?.exerciseIndex === exerciseIndex &&
      (Number.isInteger(result?.setIndex) ? result.setIndex : 0) === setIndex
  );
  const recommendedRepCount = getRecommendedRepCount(exercise, setIndex);

  return {
    exerciseIndex,
    setIndex,
    loadKg: savedResult?.loadKg != null ? String(savedResult.loadKg) : "",
    reps:
      savedResult?.reps != null && savedResult.reps !== ""
        ? String(savedResult.reps)
        : String(recommendedRepCount),
    durationMinutes:
      savedResult?.durationMinutes != null
        ? String(savedResult.durationMinutes)
        : exercise?.endurancePrescription?.durationMinutes
          ? String(exercise.endurancePrescription.durationMinutes)
          : "",
    rpe: savedResult?.rpe != null ? String(savedResult.rpe) : "",
    customValues:
      savedResult?.customValues && typeof savedResult.customValues === "object"
        ? Object.fromEntries(
            Object.entries(savedResult.customValues).map(([key, value]) => [
              key,
              String(value ?? ""),
            ])
          )
        : {},
  };
}

function ExerciseLogSheetContent({
  exercise,
  exerciseIndex,
  setIndex,
  draft,
  onDraftChange,
  strengthReferenceOneRepMaxByLift,
  unitSystem = "metric",
}) {
  const {
    strengthAssessment,
    strengthRequirements,
    showLoad,
    showReps,
    showTime,
    showRpe,
    customFields,
  } = getSetLoggingConfig(exercise);
  const recommendedLoadKg = getRecommendedLoadKg(
    exercise,
    setIndex,
    strengthReferenceOneRepMaxByLift
  );

  return (
    <View style={styles.exerciseLogForm}>
      <ActiveSessionSetLoggingInputPanel
        exerciseIndex={exerciseIndex}
        setIndex={setIndex}
        draft={draft}
        showLoad={showLoad}
        showReps={showReps}
        showTime={showTime}
        showRpe={showRpe}
        strengthAssessment={strengthAssessment}
        strengthRequirements={strengthRequirements}
        customFields={customFields}
        recommendedLoadKg={recommendedLoadKg}
        unitSystem={unitSystem}
        onDraftChange={onDraftChange}
      />
    </View>
  );
}

function getNextExerciseLogTarget(exercises = [], progress = {}, requestedExerciseIndex = null) {
  const sessionSteps = buildSessionSteps(exercises);
  const completedStepKeys = new Set(
    Array.isArray(progress?.completedStepKeys) ? progress.completedStepKeys : []
  );
  const requestedIndex = Number.isInteger(requestedExerciseIndex)
    ? requestedExerciseIndex
    : null;
  const requestedExercise = requestedIndex != null
    ? exercises[requestedIndex]
    : null;

  if (requestedExercise) {
    const setCount = parsePrescribedSetCount(requestedExercise);
    const firstOpenSetIndex = Array.from({ length: setCount }).findIndex(
      (_, setIndex) => !completedStepKeys.has(`${requestedIndex}:${setIndex}`)
    );

    return {
      exerciseIndex: requestedIndex,
      setIndex: firstOpenSetIndex >= 0 ? firstOpenSetIndex : 0,
    };
  }

  const savedExerciseIndex = Number.isInteger(progress?.activeExerciseIndex)
    ? progress.activeExerciseIndex
    : null;
  const savedSetIndex = Number.isInteger(progress?.activeSetIndex)
    ? progress.activeSetIndex
    : 0;

  if (savedExerciseIndex != null && exercises[savedExerciseIndex]) {
    const savedStepKey = `${savedExerciseIndex}:${savedSetIndex}`;

    if (!completedStepKeys.has(savedStepKey)) {
      return {
        exerciseIndex: savedExerciseIndex,
        setIndex: savedSetIndex,
      };
    }
  }

  const nextOpenStep =
    sessionSteps.find(
      (step) => !completedStepKeys.has(`${step.exerciseIndex}:${step.setIndex}`)
    ) || sessionSteps[0];

  return {
    exerciseIndex: nextOpenStep?.exerciseIndex || 0,
    setIndex: nextOpenStep?.setIndex || 0,
  };
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

function getCompletedExerciseCount(day = {}, progress = {}, isComplete = false) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
  const completedStepKeys = new Set(
    Array.isArray(progress?.completedStepKeys) ? progress.completedStepKeys : []
  );

  if (exercises.length === 0) {
    return 0;
  }

  if (isComplete && completedStepKeys.size === 0) {
    return exercises.length;
  }

  return exercises.filter((exercise, exerciseIndex) => {
    const setCount = getPrescribedSetCount(exercise);

    return Array.from({ length: setCount }).every((_, setIndex) =>
      completedStepKeys.has(`${exerciseIndex}:${setIndex}`)
    );
  }).length;
}

function getSessionExerciseProgressPercent(day = {}, progress = {}, isComplete = false) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];

  if (exercises.length === 0) {
    return isComplete ? 100 : 0;
  }

  const completedExerciseCount =
    getCompletedExerciseCount(day, progress, isComplete);

  return Math.round((completedExerciseCount / exercises.length) * 100);
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

function MoveSessionActionIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M5 8.5h14M8 4.5v4M16 4.5v4M6.5 6.5h11c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2h-11c-1.1 0-2-.9-2-2v-9c0-1.1.9-2 2-2Z"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
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
  unitSystem = "metric",
  trainingPlanHistory = [],
  onSelectDay,
  completedDays,
  pendingTrainingCheckIn,
  onSubmitTrainingCheckIn,
  onReadinessInjuryReportChange,
  trainingCheckInSubmitting = false,
  questionnaire,
  selectedDay,
  selectedDayPerformanceResults,
  selectedDayAssessmentResults,
  strengthAssessmentSummary,
  onClearSelectedDay,
  onReplaceExercise,
  onFinishDay,
  onMoveDay,
  getActiveSessionProgress,
  onActiveSessionProgressChange,
  onActiveSessionProgressClear,
  onStrengthAssessmentSave,
  onCompletedSessionProgressSave,
  getCompletedSessionProgress,
  onTestSession,
  onTestProgramMaxSetup,
  updatingPlan = false,
  initialScrollToTopKey = "",
}) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [pushBackConfirmVisible, setPushBackConfirmVisible] = useState(false);
  const [selectedMoveDate, setSelectedMoveDate] = useState(null);
  const [rescheduleInfoVisible, setRescheduleInfoVisible] = useState(false);
  const [completeConfirmVisible, setCompleteConfirmVisible] = useState(false);
  const [activeSessionDay, setActiveSessionDay] = useState(null);
  const [exerciseLogSheet, setExerciseLogSheet] = useState(null);
  const [exerciseLogDraft, setExerciseLogDraft] = useState(null);
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
  const lastSelectedScheduleDateRef = useRef(null);
  const cardContentAnimation = useRef(new Animated.Value(1)).current;
  const cardContentTranslateX = useRef(new Animated.Value(0)).current;
  const cardSlideDirection = useRef(1);
  const strengthReferenceOneRepMaxByLift = useMemo(
    () =>
      (Array.isArray(strengthAssessmentSummary?.latestByLift)
        ? strengthAssessmentSummary.latestByLift
        : []
      ).reduce((accumulator, entry) => {
        const liftKey = getStrengthAssessmentLiftKey(entry?.liftName || "");
        const referenceOneRepMaxKg = getStrengthAssessmentReferenceOneRepMaxKg(entry);

        if (liftKey && referenceOneRepMaxKg) {
          accumulator[liftKey] = referenceOneRepMaxKg;
        }

        return accumulator;
      }, {}),
    [strengthAssessmentSummary]
  );

  function openLaunchGatePrompt(promptKey) {
    setLaunchGatePromptKey(promptKey);
  }

  function closeLaunchGatePrompt() {
    setLaunchGatePromptKey("");
  }

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

    if (exerciseLogSheet) {
      closeExerciseLogSheet();
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
    exerciseLogSheet,
    pushBackConfirmVisible,
    rescheduleInfoVisible,
    launchGatePromptKey,
    selectedArchivedDay,
    selectedDay,
    swapEditorVisible,
  ]);

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
  const moveWeek = plan?.weeks?.find(
    (week) => week.week === activeSelectedDay?.week
  );
  const phaseOverview = getTrainingPlanPhaseOverview(plan);
  const today = getProgramOverviewToday();
  const planStartDate = getPlanStartDate(plan);
  const shouldHideTabBarForCheckIn =
    Boolean(pendingTrainingCheckIn) || Boolean(launchGatePromptKey);
  const shouldHideTabBar =
    swapEditorVisible || shouldHideTabBarForCheckIn;
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
  const pendingProgramMaxAssessments = getPendingProgramMaxAssessments(
    selectedHeaderDay?.exercises,
    strengthAssessmentSummary
  );
  const isProgramMaxCalibration = pendingProgramMaxAssessments.some(
    (assessment) => assessment.method !== "rpe_based_1rm"
  );
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
  const selectedHeaderGradientColor = getTrainingDayTypeColor(
    selectedHeaderGradientType,
    WEEK_SCHEDULE_REST_DAY_COLOR
  );
  const selectedScheduleAnimationKey = selectedScheduleSlot
    ? [
        selectedScheduleSlot.dateKey,
        selectedScheduleSlot.trainingDay?.day || "rest",
        selectedScheduleSlot.isArchived ? "archived" : "current",
      ].join(":")
    : "";
  const selectedScheduleSlideDirection = selectedScheduleSlot
    ? (() => {
        const currentSelectedDate = startOfLocalDay(selectedScheduleSlot.date);
        const previousSelectedDate = lastSelectedScheduleDateRef.current;

        if (currentSelectedDate && previousSelectedDate) {
          return currentSelectedDate < previousSelectedDate ? -1 : 1;
        }

        return selectedScheduleSlot.date < today ? -1 : 1;
      })()
    : 0;
  useEffect(() => {
    cardContentAnimation.stopAnimation();
    cardContentTranslateX.stopAnimation();
    cardContentAnimation.setValue(0);
    cardContentTranslateX.setValue(28 * cardSlideDirection.current);

    Animated.parallel([
      Animated.timing(cardContentAnimation, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(cardContentTranslateX, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    cardContentAnimation,
    cardContentTranslateX,
    selectedScheduleAnimationKey,
  ]);
  useEffect(() => {
    lastSelectedScheduleDateRef.current = selectedScheduleSlot
      ? startOfLocalDay(selectedScheduleSlot.date)
      : null;
  }, [selectedScheduleSlot]);

  if (!plan) {
    return <ProgramOverviewSkeleton />;
  }

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
  const showPushedBackSessionStatus =
    Boolean(activeSelectedDay) && selectedDayIsPushedBack && !selectedRestSlot;
  const showRestSessionStatus = Boolean(selectedRestSlot);
  const showStartButton = showSelectedTrainingActions;
  const showCompleteButton = showSelectedTrainingActions && Boolean(onFinishDay);
  const showPushBackButton =
    showSelectedTrainingActions && Boolean(onMoveDay);
  const hasKnownSelectedCardContent =
    showStartButton ||
    showCompletedSessionStatus ||
    showPushedBackSessionStatus ||
    showRestSessionStatus ||
    Boolean(selectedArchivedDay);
  const showFallbackSessionStatus = !hasKnownSelectedCardContent;
  const selectedCardAccentColor =
    selectedHeaderDay && !selectedRestSlot
      ? selectedHeaderGradientColor
      : PLAN_CARD_BLUE;
  const selectedCardTitle =
    selectedHeaderDay && !selectedRestSlot
      ? getSessionName(selectedHeaderDay)
      : "Recovery day";
  const selectedDayMetaParts = selectedDayMetaLabel
    .split(" - ")
    .map((part) => part.trim())
    .filter(Boolean);
  const selectedCardConnectedSummary = [
    selectedPhaseLabel,
    selectedDayMetaParts[0],
  ]
    .filter(Boolean)
    .map((part) => part.replace(/ /g, "\u00A0"))
    .join("\u00A0·\u00A0");
  const selectedCardBaseDescription = [
    selectedCardConnectedSummary,
    ...selectedDayMetaParts.slice(1),
  ].filter(Boolean).join(" · ");
  const selectedCardDescription = (() => {
    if (showRestSessionStatus) {
      return `${selectedPhaseLabel} - No training session scheduled.`;
    }

    if (showPushedBackSessionStatus) {
      return selectedCardBaseDescription
        ? `${selectedCardBaseDescription} - Rescheduled.`
        : "This session was rescheduled in your plan.";
    }

    if (selectedArchivedDay) {
      return selectedCardBaseDescription
        ? `${selectedCardBaseDescription} - Archived plan session.`
        : "Archived plan session.";
    }

    if (showCompletedSessionStatus) {
      return selectedCardBaseDescription || "Completed session.";
    }

    if (showStartButton) {
      return selectedCardBaseDescription || "Ready when you are.";
    }

    if (activeSelectedDay && selectedTrainingSlotIsPast) {
      return selectedCardBaseDescription || "Past session.";
    }

    if (activeSelectedDay) {
      return selectedCardBaseDescription || "Saved session progress.";
    }

    return selectedCardBaseDescription || "Select a day in the schedule.";
  })();
  const primarySessionActionLabel =
    selectedDayHasStartedSession ? "Continue" : "Start";
  const showRescheduleInfoButton =
    Boolean(detailSelectedDay) &&
    !selectedRestSlot &&
    detailSelectedDay.status === "rescheduled";
  const canLogSelectedExercises =
    Boolean(activeSelectedDay) &&
    !selectedArchivedDay &&
    !selectedRestSlot &&
    !selectedDayIsComplete &&
    !selectedDayIsPushedBack &&
    Array.isArray(activeSelectedDay.exercises) &&
    activeSelectedDay.exercises.length > 0;
  const rescheduleInfoSummary =
    detailSelectedDay?.adjustmentSummary ||
    "This session was moved after a missed slot.";
  const rescheduleInfoMode = detailSelectedDay?.rescueMode
    ? detailSelectedDay.rescueMode.replace(/_/g, " ")
    : "";
  const completedSessionProgressPercent =
    getSessionProgressPercent(
      selectedHeaderDay,
      selectedDayCompletedSessionProgress,
      selectedDayIsComplete
    );
  const activeSessionProgressPercent =
    getSessionProgressPercent(selectedHeaderDay, selectedDaySessionProgress);
  const showSelectedCardProgress = Boolean(selectedHeaderDay) && !selectedRestSlot;
  const selectedCardProgressPercent = showCompletedSessionStatus
    ? completedSessionProgressPercent
    : activeSessionProgressPercent;
  const selectedCompletedExerciseCount = getCompletedExerciseCount(
    selectedHeaderDay,
    showCompletedSessionStatus
      ? selectedDayCompletedSessionProgress
      : selectedDaySessionProgress,
    showCompletedSessionStatus
  );
  const selectedCardProgressLabel =
    `${selectedCompletedExerciseCount} ` +
    `${selectedCompletedExerciseCount === 1 ? "exercise" : "exercises"} completed`;
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
  const showJumpToNextSessionButton =
    Boolean(nextTrainingSlot) &&
    (showRestSessionStatus ||
      (showFallbackSessionStatus && Boolean(activeSelectedDay)));
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
  const exerciseLogSheetDay = exerciseLogSheet?.day || null;
  const exerciseLogSheetKey = exerciseLogSheetDay
    ? `${exerciseLogSheetDay.week}-${exerciseLogSheetDay.day}`
    : "";
  const exerciseLogSheetExercise = exerciseLogSheetDay
    ? exerciseLogSheetDay.exercises?.[exerciseLogSheet.exerciseIndex]
    : null;
  const exerciseLogSheetSetCount = exerciseLogSheetExercise
    ? parsePrescribedSetCount(exerciseLogSheetExercise)
    : 0;
  const exerciseLogSheetTitle = exerciseLogSheetExercise?.name || "Log exercise";
  const exerciseLogSheetDescription =
    exerciseLogSheetSetCount > 1
      ? `Set ${exerciseLogSheet.setIndex + 1} of ${exerciseLogSheetSetCount}`
      : "Log this set";
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

  function handleJumpToNextSession() {
    if (!nextTrainingSlot?.trainingDay || !nextTrainingSlot?.weekNumber) {
      return;
    }

    cardSlideDirection.current =
      nextTrainingSlot.date < selectedHeaderDate ? -1 : 1;

    handleSelectTrainingDay(
      nextTrainingSlot.weekNumber,
      nextTrainingSlot.trainingDay.day,
      nextTrainingSlot.dateKey
    );

    const nextSlotIndex = currentWeekSchedule.findIndex(
      (slot) =>
        slot.dateKey === nextTrainingSlot.dateKey &&
        slot.weekNumber === nextTrainingSlot.weekNumber &&
        slot.trainingDay?.day === nextTrainingSlot.trainingDay.day
    );

    if (nextSlotIndex >= 0) {
      weekScheduleScrollRef.current?.scrollTo?.({
        x: Math.max(0, nextSlotIndex * WEEK_SCHEDULE_ITEM_WIDTH - WEEK_SCHEDULE_ITEM_WIDTH),
        y: 0,
        animated: true,
      });
    }
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

  function openExerciseLogSheet(requestedExerciseIndex = null) {
    if (!activeSelectedDay || selectedDayIsComplete || selectedDayIsPushedBack) {
      return;
    }

    const sessionKey = `${activeSelectedDay.week}-${activeSelectedDay.day}`;
    const progress = getActiveSessionProgress?.(sessionKey);
    const target = getNextExerciseLogTarget(
      activeSelectedDay.exercises,
      progress,
      requestedExerciseIndex
    );
    const targetExercise = activeSelectedDay.exercises[target.exerciseIndex] || {};

    onSelectDay(activeSelectedDay.week, activeSelectedDay.day);
    setExerciseLogDraft(
      createExerciseLogDraft({
        exercise: targetExercise,
        exerciseIndex: target.exerciseIndex,
        setIndex: target.setIndex,
        progress,
        initialPerformanceResults: selectedDayPerformanceResults,
        initialAssessmentResults: selectedDayAssessmentResults,
      })
    );
    setExerciseLogSheet({
      day: activeSelectedDay,
      exerciseIndex: target.exerciseIndex,
      setIndex: target.setIndex,
    });
  }

  function closeExerciseLogSheet() {
    setExerciseLogSheet(null);
    setExerciseLogDraft(null);
  }

  function updateExerciseLogDraft(exerciseIndex, setIndex, field, value, isCustomField = false) {
    setExerciseLogDraft((currentDraft) => {
      const safeDraft = currentDraft || {
        exerciseIndex,
        setIndex,
        loadKg: "",
        reps: "",
        durationMinutes: "",
        rpe: "",
        customValues: {},
      };

      return {
        ...safeDraft,
        exerciseIndex,
        setIndex,
        ...(isCustomField
          ? {
              customValues: {
                ...(safeDraft.customValues || {}),
                [field]: value,
              },
            }
          : {
              [field]: value,
            }),
      };
    });
  }

  function finishExerciseLogSheet() {
    if (!exerciseLogSheetDay || !exerciseLogSheetKey) {
      closeExerciseLogSheet();
      return;
    }

    const currentProgress = getActiveSessionProgress?.(exerciseLogSheetKey) || {};
    const completedStepKeys = new Set(
      Array.isArray(currentProgress.completedStepKeys)
        ? currentProgress.completedStepKeys
        : []
    );
    const draftKey = getExerciseLogDraftKey(
      exerciseLogSheet.exerciseIndex,
      exerciseLogSheet.setIndex
    );
    const nextTrackingDrafts = {
      ...(currentProgress.trackingDrafts || {}),
      [draftKey]: exerciseLogDraft || {
        exerciseIndex: exerciseLogSheet.exerciseIndex,
        setIndex: exerciseLogSheet.setIndex,
        customValues: {},
      },
    };

    completedStepKeys.add(draftKey);
    onActiveSessionProgressChange?.(exerciseLogSheetKey, {
      activeExerciseIndex: exerciseLogSheet.exerciseIndex,
      activeSetIndex: exerciseLogSheet.setIndex,
      completedStepKeys: Array.from(completedStepKeys),
      trackingDrafts: nextTrackingDrafts,
      updatedAt: new Date().toISOString(),
    });
    closeExerciseLogSheet();
  }

  function openPushBackConfirm() {
    if (updatingPlan) {
      return;
    }

    setSelectedMoveDate(null);
    setPushBackConfirmVisible(true);
  }

  function closePushBackConfirm() {
    setPushBackConfirmVisible(false);
    setSelectedMoveDate(null);
  }

  function openRescheduleInfo() {
    setRescheduleInfoVisible(true);
  }

  function closeRescheduleInfo() {
    setRescheduleInfoVisible(false);
  }

  function confirmPushBack() {
    if (!selectedMoveDate) {
      return;
    }

    setPushBackConfirmVisible(false);
    onMoveDay?.(selectedMoveDate);
    setSelectedMoveDate(null);
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
        unitSystem={unitSystem}
        day={activeSessionDay.dayData}
        exercises={activeSessionDay.exercises}
        initialPerformanceResults={selectedDayPerformanceResults}
        initialAssessmentResults={selectedDayAssessmentResults}
        strengthAssessmentSummary={strengthAssessmentSummary}
        initialSessionProgress={getActiveSessionProgress?.(activeSessionKey)}
        onSessionProgressChange={(progress) =>
          onActiveSessionProgressChange?.(activeSessionKey, progress)
        }
        onStrengthAssessmentSave={(trackedResults) =>
          onStrengthAssessmentSave?.(
            activeSessionDay.week,
            activeSessionDay.day,
            activeSessionDay.exercises,
            trackedResults
          )
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
              const scheduleDayTypeMeta =
                getWeekScheduleDayTypeMeta(
                  trainingDay,
                  isSelectedScheduleDay
                );
              const scheduleTileTextStyle =
                getWeekScheduleTileTextStyle(
                  trainingDay,
                  isSelectedScheduleDay
                );
              const scheduleDayKey =
                trainingDay && weekNumber ? `${weekNumber}-${trainingDay.day}` : "";
              const scheduleDayIsComplete =
                Boolean(scheduleDayKey) && completedDayEntries.includes(scheduleDayKey);
              const scheduleDayProgress =
                scheduleDayKey && !isArchived
                  ? getActiveSessionProgress?.(scheduleDayKey)
                  : null;
              const scheduleDayCompletedProgress =
                scheduleDayKey && !isArchived
                  ? getCompletedSessionProgress?.(scheduleDayKey)
                  : null;
              const scheduleDayProgressPercent = trainingDay
                ? getSessionExerciseProgressPercent(
                    trainingDay,
                    scheduleDayIsComplete
                      ? scheduleDayCompletedProgress
                      : scheduleDayProgress,
                    scheduleDayIsComplete
                  )
                : 0;

              return (
                <View key={date.toISOString()} style={styles.weekScheduleItem}>
                  <View
                    style={[
                      styles.weekScheduleDateContainer,
                      isToday && styles.weekScheduleTodayDateContainer,
                    ]}
                  >
                    <IBMPlexText defaultWhite style={styles.weekScheduleDate}>
                      {isToday ? "Today" : `${weekday.slice(0, 3)}\n${date.getDate()}`}
                    </IBMPlexText>
                  </View>
                  <View style={styles.weekScheduleTileSlot}>
                    <WeekScheduleTile
                      selected={isSelectedScheduleDay}
                      onPress={() => {
                        cardSlideDirection.current =
                          date < selectedHeaderDate ? -1 : 1;

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
                          <View
                            style={[
                              styles.weekScheduleTypeIconBadge,
                              { backgroundColor: scheduleDayTypeMeta.iconColor },
                            ]}
                          >
                            <WeekScheduleTypeIcon
                              color="#050505"
                              type={scheduleDayTypeMeta.dayType}
                            />
                          </View>
                        </View>
                      ) : (
                        <View style={styles.weekScheduleTypeIcon}>
                          <MoonRestIcon size={31} color="#6F6F6F" />
                        </View>
                      )}
                      <IBMPlexText
                        style={[
                          styles.weekScheduleLabel,
                          scheduleTileTextStyle,
                        ]}
                      >
                        {trainingDay ? `Day ${trainingDay.day}` : "Rest"}
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
                  {trainingDay ? (
                    <View style={styles.weekScheduleIndicatorTrack}>
                      <View
                        style={[
                          styles.weekScheduleIndicatorFill,
                          {
                            backgroundColor:
                              scheduleDayTypeMeta?.iconColor || "#2F80ED",
                            width: `${scheduleDayProgressPercent}%`,
                          },
                        ]}
                      />
                    </View>
                  ) : (
                    <View style={styles.weekScheduleIndicatorSpacer} />
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.todayPanel}>
            <LinearGradient
              pointerEvents="none"
              colors={[
                hexToRgba(selectedCardAccentColor, 0.18),
                "rgba(17, 17, 17, 0.98)",
                "rgba(10, 10, 10, 0.98)",
              ]}
              locations={[0, 0.42, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.todayPanelTint}
            />
            <Animated.View
              style={[
                styles.todayPanelContent,
                {
                  opacity: cardContentAnimation,
                  transform: [{ translateX: cardContentTranslateX }],
                },
              ]}
            >
              <View style={styles.todayPanelHeader}>
                <View
                  style={[
                    styles.todayIconHalo,
                    { backgroundColor: hexToRgba(selectedCardAccentColor, 0.14) },
                  ]}
                >
                  {selectedHeaderDay && !selectedRestSlot ? (
                    <WeekScheduleTypeIcon
                      color={selectedCardAccentColor}
                      type={selectedHeaderGradientType}
                      size={32}
                    />
                  ) : (
                    <MoonRestIcon size={39} color={PLAN_CARD_BLUE} />
                  )}
                </View>
                <View style={styles.todayCopy}>
                  <IBMPlexText
                    lines={1}
                    style={[styles.todayKicker, { color: selectedCardAccentColor }]}
                  >
                    {selectedDateLabel}
                  </IBMPlexText>
                  <View style={styles.todayTitleRow}>
                    <IBMPlexText defaultWhite lines={1} style={styles.todayTitle}>
                      {selectedCardTitle}
                    </IBMPlexText>
                    {pendingProgramMaxAssessments.length > 0 ? (
                      <View style={styles.programMaxEstimateChip}>
                        <IBMPlexText lines={1} style={styles.programMaxEstimateChipText}>
                          {isProgramMaxCalibration ? "Calibrating" : "Estimating"}{" "}
                          {pendingProgramMaxAssessments.length}{" "}
                          {pendingProgramMaxAssessments.length === 1 ? "max" : "maxes"}
                        </IBMPlexText>
                      </View>
                    ) : null}
                  </View>
                  <IBMPlexText lines={3} style={styles.todayDescription}>
                    {selectedCardDescription}
                  </IBMPlexText>
                </View>
              </View>

              {showSelectedCardProgress ? (
                <View style={styles.todayProgressBlock}>
                  <View style={styles.todayProgressTrack}>
                    <View
                      style={[
                        styles.todayProgressFill,
                        {
                          backgroundColor: selectedCardAccentColor,
                          width: `${selectedCardProgressPercent}%`,
                        },
                      ]}
                    />
                  </View>
                  <IBMPlexText style={styles.todayProgressText}>
                    {selectedCardProgressLabel}
                  </IBMPlexText>
                </View>
              ) : null}

              <View style={styles.sessionMoveRow}>
                {showStartButton ? (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.84}
                      onPress={handleStartSession}
                      style={[
                        styles.moveSessionButton,
                        styles.moveSessionButtonPrimary,
                      ]}
                    >
                      <IBMPlexText
                        defaultWhite
                        adjustsFontSizeToFit
                        lines={1}
                        minimumFontScale={0.78}
                        style={[
                          styles.moveSessionButtonText,
                          styles.primarySessionButtonText,
                        ]}
                      >
                        {primarySessionActionLabel}
                      </IBMPlexText>
                    </TouchableOpacity>
                    {showPushBackButton ? (
                      <TouchableOpacity
                        accessibilityLabel="Reschedule session"
                        accessibilityRole="button"
                        activeOpacity={0.78}
                        disabled={updatingPlan}
                        onPress={openPushBackConfirm}
                        style={[
                          styles.moveSessionIconButton,
                          updatingPlan && styles.currentSessionSecondaryButtonDisabled,
                        ]}
                      >
                        <MoveSessionActionIcon />
                      </TouchableOpacity>
                    ) : null}
                    {showCompleteButton ? (
                      <TouchableOpacity
                        accessibilityLabel="Complete session"
                        accessibilityRole="button"
                        activeOpacity={0.78}
                        onPress={openCompleteConfirm}
                        style={styles.moveSessionIconButton}
                      >
                        <CompleteActionIcon />
                      </TouchableOpacity>
                    ) : null}
                  </>
                ) : showJumpToNextSessionButton ? (
                  <TouchableOpacity
                    activeOpacity={0.84}
                    onPress={handleJumpToNextSession}
                    style={[
                      styles.moveSessionButton,
                      styles.moveSessionButtonPrimary,
                    ]}
                  >
                    <IBMPlexText
                      defaultWhite
                      adjustsFontSizeToFit
                      lines={1}
                      minimumFontScale={0.78}
                      style={[
                        styles.moveSessionButtonText,
                        styles.primarySessionButtonText,
                      ]}
                    >
                      Jump to next session
                    </IBMPlexText>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.planStatusPill}>
                    <IBMPlexText defaultWhite lines={1} style={styles.planStatusPillText}>
                      {showCompletedSessionStatus
                        ? "Completed"
                        : showRestSessionStatus
                          ? "No upcoming session"
                          : showPushedBackSessionStatus
                            ? "Rescheduled"
                            : selectedArchivedDay
                              ? "Archived session"
                              : activeSelectedDay
                                ? "Saved progress"
                                : "No session selected"}
                    </IBMPlexText>
                  </View>
                )}
              </View>
            </Animated.View>
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

          {detailSelectedDay ? (
            <SelectedDaySlide
              animationKey={selectedScheduleAnimationKey}
              direction={selectedScheduleSlideDirection}
              style={styles.dayDetailEdgeToEdge}
            >
              <DayDetailView
                week={detailSelectedDay.week}
                unitSystem={unitSystem}
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
                onMissed={undefined}
                onLogExercise={
                  canLogSelectedExercises ? openExerciseLogSheet : undefined
                }
                onSwapEditorVisibilityChange={setSwapEditorVisible}
                updatingPlan={selectedArchivedDay ? true : updatingPlan}
                showRescheduledNotice={false}
              />
            </SelectedDaySlide>
          ) : null}

          <View style={styles.programDetailsFooter}>
            {__DEV__ && onTestSession ? (
              <TouchableOpacity
                style={styles.testSessionButton}
                onPress={onTestSession}
              >
                <IBMPlexText defaultWhite lines={1} style={styles.testSessionButtonText}>
                  Test session
                </IBMPlexText>
              </TouchableOpacity>
            ) : null}
            {__DEV__
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
            {__DEV__ && onTestProgramMaxSetup ? (
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.testSessionButton}
                onPress={onTestProgramMaxSetup}
              >
                <IBMPlexText defaultWhite lines={1} style={styles.testSessionButtonText}>
                  Test Program Max setup
                </IBMPlexText>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.programDetailsFooterLink}
              onPress={() => setDetailsVisible(true)}
            >
              <IBMPlexText defaultWhite style={styles.programDetailsFooterLinkText}>
                Program details &gt;
              </IBMPlexText>
            </TouchableOpacity>
          </View>
          <BugReportControl screen="program-overview" />
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
        visible={Boolean(exerciseLogSheetDay)}
        onDismiss={closeExerciseLogSheet}
        sheetStyle={styles.exerciseLogSheet}
        contentStyle={styles.exerciseLogSheetContent}
        title={exerciseLogSheetTitle}
        description={exerciseLogSheetDescription}
        buttonText="Finish set"
        onButtonPress={finishExerciseLogSheet}
        bottomPadding={14}
        content={
          exerciseLogSheetExercise && exerciseLogDraft ? (
            <ExerciseLogSheetContent
              key={`${exerciseLogSheetKey}-${exerciseLogSheet.exerciseIndex}-${exerciseLogSheet.setIndex}`}
              exercise={exerciseLogSheetExercise}
              exerciseIndex={exerciseLogSheet.exerciseIndex}
              setIndex={exerciseLogSheet.setIndex}
              draft={exerciseLogDraft}
              onDraftChange={updateExerciseLogDraft}
              strengthReferenceOneRepMaxByLift={strengthReferenceOneRepMaxByLift}
              unitSystem={unitSystem}
            />
          ) : null
        }
      />
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
        initialInjuryReport={questionnaire?.injuriesInput}
        onSubmit={(answers) => {
          if (Object.prototype.hasOwnProperty.call(answers || {}, "injuryReport")) {
            onReadinessInjuryReportChange?.(answers.injuryReport || "");
          }
        }}
        promptKey={launchGatePromptKey}
        visible={Boolean(launchGatePromptKey)}
        onClose={closeLaunchGatePrompt}
      />
      <WhiteBottomMenu
        visible={pushBackConfirmVisible}
        onDismiss={closePushBackConfirm}
        title="Reschedule session"
        description="Choose an exact available date from this training week."
        content={
          <SessionMoveCalendar
            sourceDate={selectedTrainingSlot?.date}
            weekStartDate={getPlanWeekStartDate(plan, activeSelectedDay?.week)}
            selectedDate={selectedMoveDate}
            scheduledDays={
              moveWeek?.days
                ?.filter((day) => day.status !== "skipped") || []
            }
            onSelectDate={setSelectedMoveDate}
          />
        }
        buttonText={
          updatingPlan
            ? "Updating..."
            : selectedMoveDate && selectedTrainingSlot?.date
              ? selectedMoveDate > selectedTrainingSlot.date
                ? "Reschedule later"
                : "Move earlier"
              : "Select a day"
        }
        buttonDisabled={updatingPlan || !selectedMoveDate}
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
  exerciseLogSheet: {
    maxHeight: "78%",
  },
  exerciseLogSheetContent: {
    alignSelf: "stretch",
  },
  exerciseLogForm: {
    alignSelf: "stretch",
    paddingTop: 4,
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    position: "relative",
    justifyContent: "space-between",
  },
  headerActionPanelEmpty: {
    marginTop: 0,
  },
  headerActionPanelTopLeftTint: {
    ...StyleSheet.absoluteFillObject,
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
    gap: 8,
    minHeight: 56,
    width: "100%",
  },
  headerCompletedCopy: {
    gap: 4,
    minWidth: 0,
    width: "100%",
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
  headerCompletedProgressTrack: {
    backgroundColor: "#2a2a2a",
    borderRadius: 999,
    height: 10,
    overflow: "hidden",
    width: "100%",
  },
  headerCompletedProgressFill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: "100%",
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
  todayPanel: {
    backgroundColor: PLAN_CARD_SURFACE,
    borderColor: PLAN_CARD_BORDER,
    borderRadius: 18,
    borderWidth: 1,
    height: 270,
    marginTop: 22,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 18,
    position: "relative",
  },
  todayPanelTint: {
    ...StyleSheet.absoluteFillObject,
  },
  todayPanelContent: {
    flex: 1,
  },
  todayPanelHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 18,
    position: "relative",
    zIndex: 1,
  },
  todayIconHalo: {
    alignItems: "center",
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  todayCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  todayKicker: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  todayTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 9,
    minWidth: 0,
  },
  todayTitle: {
    flexShrink: 1,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 31,
  },
  todayDescription: {
    color: "#B8B8C2",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    maxWidth: 250,
  },
  programMaxEstimateChip: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(243, 208, 79, 0.14)",
    borderColor: "rgba(243, 208, 79, 0.32)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  programMaxEstimateChipText: {
    color: "#F8E7A2",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  todayProgressBlock: {
    gap: 6,
    marginTop: 10,
    position: "relative",
    zIndex: 1,
  },
  todayProgressTrack: {
    backgroundColor: "#202024",
    borderRadius: 999,
    height: 7,
    overflow: "hidden",
  },
  todayProgressFill: {
    borderRadius: 999,
    height: "100%",
  },
  todayProgressText: {
    color: PLAN_CARD_TEXT_MUTED,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  sessionMoveRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: "auto",
    paddingTop: 14,
    position: "relative",
    zIndex: 1,
  },
  moveSessionButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    flexDirection: "row",
    gap: 10,
    height: 58,
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 10,
  },
  moveSessionButtonPrimary: {
    backgroundColor: PLAN_CARD_BLUE,
  },
  moveSessionIconButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    borderColor: "#56565F",
    borderRadius: 16,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  moveSessionButtonText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
    textAlign: "center",
  },
  primarySessionButtonText: {
    fontSize: 16,
  },
  planStatusPill: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    borderColor: "#56565F",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    height: 58,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  planStatusPillText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
    textAlign: "center",
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
    gap: -8,
    paddingHorizontal: 2,
  },
  weekScheduleScroller: {
    flexGrow: 0,
    alignSelf: "stretch",
    marginHorizontal: -8,
    marginTop: 0,
  },
  dayDetailEdgeToEdge: {
    alignSelf: "stretch",
    marginHorizontal: -28,
    marginTop: 7,
  },
  weekScheduleItem: {
    alignItems: "center",
    gap: 0,
    width: WEEK_SCHEDULE_ITEM_WIDTH,
  },
  weekScheduleTileSlot: {
    height: WEEK_SCHEDULE_TILE_LARGE_HEIGHT,
    justifyContent: "center",
    position: "relative",
    zIndex: 2,
  },
  weekSchedulePressable: {
    height: WEEK_SCHEDULE_TILE_LARGE_HEIGHT,
    width: WEEK_SCHEDULE_TILE_LARGE_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },
  weekScheduleDay: {
    height: WEEK_SCHEDULE_TILE_SMALL_HEIGHT,
    width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 0,
    borderColor: WEEK_SCHEDULE_BORDER,
    borderWidth: 1,
    borderStyle: "solid",
  },
  weekScheduleArchivedDay: {
    opacity: 0.52,
  },
  weekScheduleToday: {
    borderStyle: "solid",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  weekScheduleLabel: {
    fontSize: 15, fontWeight: "800",
    lineHeight: 18,
    marginTop: 15,
    textAlign: "center",
  },
  weekScheduleTypeLabel: {
    bottom: 16,
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
  weekScheduleTypeIconBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 27,
    justifyContent: "center",
    width: 27,
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
    fontSize: 13, fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
  },
  weekScheduleDateContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    minHeight: 40,
    minWidth: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
    paddingHorizontal: 0,
    paddingVertical: 0,
    position: "relative",
    zIndex: 1,
  },
  weekScheduleTodayDateContainer: {
    backgroundColor: "transparent",
  },
  weekScheduleIndicatorTrack: {
    backgroundColor: "#171717",
    borderRadius: 999,
    height: 5,
    marginTop: 6,
    overflow: "hidden",
    width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
  },
  weekScheduleIndicatorFill: {
    borderRadius: 999,
    height: "100%",
  },
  weekScheduleIndicatorSpacer: {
    height: 5,
    marginTop: 6,
    width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
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
