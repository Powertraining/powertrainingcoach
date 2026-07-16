import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";
import Dotted from "../../components/colorComponents/Dotted.jsx";
import { PowertrainingLogo } from "../../components/homeComponents/ProgramProgressRing.jsx";
import { getWeekdayNameFromIndex } from "../../constants/weekdays.js";
import {
    getTrainingDayTypeColor,
    getTrainingDayTypeLabel,
} from "../../constants/trainingDayTypes.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
import {
    getCurrentTrainingWeek,
    getTrainingDayPreferredWeekday,
} from "../../services/utils/trainingPlan.js";
import {
    PROGRAM_OVERVIEW_LOOKBACK_DAYS,
    PROGRAM_OVERVIEW_UPCOMING_DAYS_INCLUDING_TODAY,
    getProgramOverviewToday,
    isSameCalendarDay,
} from "../../services/utils/programOverview.js";
import { getPrescribedSetCount } from "../../services/utils/exerciseSets.js";
import { buildExerciseSessionSteps } from "../../services/utils/exerciseSupersets.js";
import {
    isPagesPhonePreview,
    useWebTestActions,
} from "../../services/utils/webTestActions.js";
import { fonts } from "../../theme/colors.js";

const TAB_BAR_HEIGHT = 72;
const GRID_TO_TAB_BAR_GAP = 10;
const MIN_TAB_BAR_BOTTOM_OFFSET = 12;
const WEEK_SCHEDULE_ITEM_WIDTH = 86;
const WEEK_SCHEDULE_TODAY_OFFSET =
    PROGRAM_OVERVIEW_LOOKBACK_DAYS * WEEK_SCHEDULE_ITEM_WIDTH;
const WEEK_SCHEDULE_TILE_SMALL_HEIGHT = 126;
const WEEK_SCHEDULE_TILE_SMALL_WIDTH = 72;
const WEEK_SCHEDULE_TILE_LARGE_HEIGHT = 132;
const WEEK_SCHEDULE_TILE_LARGE_WIDTH = 86;
const WEEK_SCHEDULE_SELECTED_REST_DAY_OPACITY = 0.5;
const WEEK_SCHEDULE_REST_DAY_COLOR = "#585858";
const WEEK_SCHEDULE_SURFACE = "#101010";
const WEEK_SCHEDULE_BORDER = "#252525";
const HOME_BACKGROUND = "#050505";
const HOME_SURFACE = "#111111";
const HOME_BORDER = "#252525";
const HOME_TEXT_MUTED = "#9A9AA2";
const HOME_BLUE = "#0A84FF";
const HOME_GREEN = "#34C759";
const HOME_YELLOW = "#F3D04F";

function getHomeBottomPadding(bottomInset = 0) {
    return Math.max(Math.round(bottomInset / 2), MIN_TAB_BAR_BOTTOM_OFFSET) +
        TAB_BAR_HEIGHT +
        GRID_TO_TAB_BAR_GAP;
}

function getHomeContentHeight(windowHeight = 0, bottomInset = 0) {
    return Math.max(
        windowHeight -
            (Math.max(Math.round(bottomInset / 2), MIN_TAB_BAR_BOTTOM_OFFSET) +
                TAB_BAR_HEIGHT),
        0
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
    return date instanceof Date &&
        startDate instanceof Date &&
        date >= startDate &&
        (!endDate || date < endDate);
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

    return weeks.find((week) => week.week === targetWeekNumber) || weeks[weeks.length - 1];
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

    return labelMap[normalizedValue] ||
        normalizedValue
            .replace(/_/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isConditioningOnlyDay(day = {}) {
    const exercises = Array.isArray(day?.exercises) ? day.exercises : [];

    return exercises.length > 0 &&
        exercises.every((exercise) => Boolean(exercise?.endurancePrescription));
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

    return [exerciseCountLabel, qualityLabel, regionLabel].filter(Boolean).join(" - ");
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

    return getHomeTypeColor(dayType, WEEK_SCHEDULE_REST_DAY_COLOR);
}

function getWeekScheduleTypeLabel(day = null) {
    return getHomeTypeLabel(day);
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
    const dayTypeColor = day ? getWeekScheduleTypeColor(day) : WEEK_SCHEDULE_REST_DAY_COLOR;
    const selectedRestDayColor = hexToRgba(
        dayTypeColor,
        WEEK_SCHEDULE_SELECTED_REST_DAY_OPACITY
    );

    if (day) {
        return {
            backgroundColor: WEEK_SCHEDULE_SURFACE,
            borderColor: dayTypeColor,
            borderWidth: selected ? 2 : 1.25,
        };
    }

    return {
        backgroundColor: WEEK_SCHEDULE_SURFACE,
        borderColor: selected ? selectedRestDayColor : WEEK_SCHEDULE_BORDER,
        borderWidth: selected ? 1.5 : 1.25,
    };
}

function getWeekScheduleTileTextStyle(day = null, selected = false) {
    if (!day) {
        return { color: selected ? "#EDEDED" : "#8A8A8A" };
    }

    return { color: "#fff" };
}

function getWeekScheduleDayTypeMeta(day = null) {
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
    const iconNames = {
        conditioning: "pulse",
        fatigue: "pulse",
        hypertrophy: "body",
        power: "flash",
        recovery: "heart",
        speed: "speedometer",
    };

    return (
        <Ionicons
            color={color}
            name={iconNames[type] || "barbell"}
            size={size}
        />
    );
}

function MoonRestIcon({ size = 30, color = "#7E7E7E" }) {
    return <Ionicons color={color} name="moon" size={size} />;
}

function InjuryCrossIcon({ size = 30, color = HOME_GREEN }) {
    const barThickness = Math.max(7, Math.round(size * 0.27));
    const barLength = Math.max(22, Math.round(size * 0.8));

    return (
        <View style={[styles.injuryCrossIcon, { height: size, width: size }]}>
            <View
                style={[
                    styles.injuryCrossHorizontal,
                    {
                        backgroundColor: color,
                        borderRadius: Math.round(barThickness / 2),
                        height: barThickness,
                        width: barLength,
                    },
                ]}
            />
            <View
                style={[
                    styles.injuryCrossVertical,
                    {
                        backgroundColor: color,
                        borderRadius: Math.round(barThickness / 2),
                        height: barLength,
                        width: barThickness,
                    },
                ]}
            />
        </View>
    );
}

function CalendarIcon({ size = 30, color = HOME_YELLOW }) {
    return (
        <Ionicons
            color={color}
            name="calendar"
            size={size}
        />
    );
}

function getHomeTypeColor(typeOrDay = "", fallback = HOME_BLUE) {
    const type = typeof typeOrDay === "string" ? typeOrDay : getWeekScheduleType(typeOrDay);

    return getTrainingDayTypeColor(type, fallback) || fallback;
}

function getHomeTypeLabel(day = null) {
    if (!day) {
        return "";
    }

    const dayType = getWeekScheduleType(day);

    if (dayType === "fatigue" || dayType === "conditioning") {
        return "Endurance";
    }

    return getTrainingDayTypeLabel(dayType);
}

function formatScheduleDateLabel(date, weekday) {
    return `${weekday.slice(0, 3)}\n${date.getDate()}`;
}

function getSessionName(day = null) {
    if (!day) {
        return "";
    }

    return `Day ${day.day}`;
}

function HomeBrandHeader() {
    return (
        <View style={styles.homeHeader}>
            <View style={styles.homeBrand}>
                <PowertrainingLogo color="#FFFFFF" style={styles.homeBrandLogo} />
                <IBMPlexText defaultWhite lines={1} style={styles.homeBrandText}>
                    PowerTraining
                </IBMPlexText>
            </View>
        </View>
    );
}

function HomeMenuAction({
    accentColor,
    actionLabel,
    description,
    disabled = false,
    icon,
    onPress,
    title,
}) {
    const isDisabled = disabled || !onPress;
    const iconNames = {
        adjust: "calendar",
        calendar: "calendar",
        posts: "chatbubble-ellipses",
        registerEvent: "trophy",
        reportInjury: "add",
    };
    const IconComponent = icon === "reportInjury"
        ? InjuryCrossIcon
        : icon === "calendar"
            ? CalendarIcon
            : null;
    const resolvedIconColor = accentColor || HOME_BLUE;

    return (
        <TouchableOpacity
            activeOpacity={0.78}
            disabled={isDisabled}
            onPress={onPress}
            style={[
                styles.homeMenuAction,
                isDisabled ? styles.homeMenuActionDisabled : null,
            ]}
        >
            <View style={styles.homeMenuIcon}>
                {IconComponent ? (
                    <IconComponent color={resolvedIconColor} size={26} />
                ) : (
                    <Ionicons
                        color={resolvedIconColor}
                        name={iconNames[icon] || "ellipse"}
                        size={26}
                    />
                )}
            </View>
            <View style={styles.homeMenuCopy}>
                <IBMPlexText
                    defaultWhite
                    adjustsFontSizeToFit
                    lines={1}
                    minimumFontScale={0.82}
                    style={styles.homeMenuTitle}
                >
                    {title}
                </IBMPlexText>
                <IBMPlexText lines={3} style={styles.homeMenuDescription}>
                    {description}
                </IBMPlexText>
                <IBMPlexText
                    lines={1}
                    style={[styles.homeMenuActionLabel, { color: resolvedIconColor }]}
                >
                    {actionLabel} &gt;
                </IBMPlexText>
            </View>
        </TouchableOpacity>
    );
}

function hasStartedSessionProgress(progress = {}) {
    const completedStepKeys = Array.isArray(progress?.completedStepKeys)
        ? progress.completedStepKeys
        : [];

    return completedStepKeys.length > 0 ||
        Boolean(
            progress?.trackingDrafts &&
                Object.values(progress.trackingDrafts).some((draft) =>
                    draft?.loadKg ||
                    draft?.reps ||
                    draft?.rpe ||
                    Object.values(draft?.customValues || {}).some(Boolean)
                )
        );
}

function buildSessionSteps(exercises = []) {
    return buildExerciseSessionSteps(exercises);
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

function WeekScheduleTile({ onPress, tileStyle, children }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.84}
            style={styles.weekSchedulePressable}
        >
            <View style={[styles.weekScheduleDay, tileStyle]}>
                {children}
            </View>
        </TouchableOpacity>
    );
}

function HomeSetupPanel({ questionnaire, onStart }) {
    return (
        <View style={styles.headerActionPanel}>
            <LinearGradient
                pointerEvents="none"
                colors={["rgba(88, 88, 88, 0.32)", "rgba(0, 0, 0, 0.95)", "#000000"]}
                locations={[0, 0.34, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerActionPanelTopLeftTint}
            />
            <View style={styles.headerActionPanelHeading}>
                <IBMPlexText defaultWhite style={styles.headerDate}>
                    Control panel
                </IBMPlexText>
                <IBMPlexText defaultWhite style={styles.headerPhase}>
                    {questionnaire ? "Continue generating your plan" : "Create your training plan"}
                </IBMPlexText>
            </View>
            <View style={styles.headerActionArea}>
                <TouchableOpacity style={styles.headerStartButton} onPress={onStart}>
                    <IBMPlexText defaultWhite lines={1} style={styles.headerStartButtonText}>
                        {questionnaire ? "Continue" : "Start"}
                    </IBMPlexText>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function HomePlanSchedule({
    plan,
    trainingPlanHistory = [],
    completedDays,
    activeSessionProgressByKey,
    completedSessionProgressByKey,
    onMoveSession,
    onOpenOverview,
    onStartSession,
}) {
    const completedDayEntries =
        completedDays instanceof Set
            ? Array.from(completedDays)
            : Array.isArray(completedDays)
                ? completedDays
                : [];
    const currentWeek = getCurrentTrainingWeek(plan, completedDayEntries);
    const today = getProgramOverviewToday();
    const todayDateKey = today.toDateString();
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
    const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
    const cardContentAnimation = useRef(new Animated.Value(1)).current;
    const cardContentTranslateX = useRef(new Animated.Value(0)).current;
    const cardSlideDirection = useRef(1);

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
    }, [cardContentAnimation, cardContentTranslateX, selectedDateKey]);

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
    const selectedScheduleSlot =
        currentWeekSchedule.find((slot) => slot.dateKey === selectedDateKey) ||
        currentWeekSchedule.find((slot) => slot.dateKey === todayDateKey) ||
        currentWeekSchedule[PROGRAM_OVERVIEW_LOOKBACK_DAYS] ||
        currentWeekSchedule[0];
    const selectedHeaderDate =
        selectedScheduleSlot?.date instanceof Date ? selectedScheduleSlot.date : today;
    const selectedHeaderDay = selectedScheduleSlot?.trainingDay || null;
    const selectedDayMetaLabel = selectedHeaderDay
        ? getSelectedDayMetaLabel(selectedHeaderDay)
        : "";
    const selectedHeaderType = getSelectedDayGradientType(
        selectedHeaderDay,
        !selectedHeaderDay
    );
    const selectedAccentColor = selectedHeaderDay
        ? getHomeTypeColor(selectedHeaderType, HOME_BLUE)
        : HOME_BLUE;
    const selectedDayCompletionKey =
        selectedHeaderDay && selectedScheduleSlot?.weekNumber
            ? `${selectedScheduleSlot.weekNumber}-${selectedHeaderDay.day}`
            : "";
    const selectedDaySessionProgress = selectedDayCompletionKey
        ? activeSessionProgressByKey?.[selectedDayCompletionKey]
        : null;
    const selectedDayCompletedSessionProgress = selectedDayCompletionKey
        ? completedSessionProgressByKey?.[selectedDayCompletionKey]
        : null;
    const selectedDayHasStartedSession =
        hasStartedSessionProgress(selectedDaySessionProgress);
    const selectedDayIsComplete =
        Boolean(selectedDayCompletionKey) &&
        completedDayEntries.includes(selectedDayCompletionKey);
    const selectedDayIsPushedBack = selectedHeaderDay?.status === "skipped";
    const completedSessionProgressPercent =
        getSessionProgressPercent(
            selectedHeaderDay,
            selectedDayCompletedSessionProgress,
            selectedDayIsComplete
        );
    const activeSessionProgressPercent =
        getSessionProgressPercent(selectedHeaderDay, selectedDaySessionProgress);
    const selectedCompletedExerciseCount = getCompletedExerciseCount(
        selectedHeaderDay,
        selectedDayIsComplete
            ? selectedDayCompletedSessionProgress
            : selectedDaySessionProgress,
        selectedDayIsComplete
    );
    const selectedCompletedExerciseLabel =
        `${selectedCompletedExerciseCount} ` +
        `${selectedCompletedExerciseCount === 1 ? "exercise" : "exercises"} completed`;
    const selectedKicker = isSameCalendarDay(selectedHeaderDate, today)
        ? "TODAY"
        : new Intl.DateTimeFormat("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        }).format(selectedHeaderDate).toUpperCase();
    const selectedPanelTitle = selectedHeaderDay
        ? getSessionName(selectedHeaderDay)
        : "Recovery day";
    const selectedPanelSubtitle = selectedHeaderDay
        ? selectedDayMetaLabel || "Keep this session focused and clean."
        : "Focus on recovery and be ready for your next session.";
    const canUseSelectedSession =
        selectedHeaderDay &&
        selectedScheduleSlot?.weekNumber &&
        !selectedDayIsPushedBack;
    const canMoveSelectedSession =
        canUseSelectedSession &&
        !selectedDayIsComplete &&
        selectedHeaderDate >= today &&
        Boolean(onMoveSession);
    const primarySessionActionLabel =
        selectedDayIsComplete
            ? "Open session"
            : selectedDayHasStartedSession
                ? "Continue"
                : "Start";

    function openSelectedDay() {
        if (!selectedHeaderDay || !selectedScheduleSlot?.weekNumber) {
            onOpenOverview?.();
            return;
        }

        onOpenOverview?.(selectedScheduleSlot.weekNumber, selectedHeaderDay.day);
    }

    function handlePrimarySessionAction() {
        if (!selectedHeaderDay || !selectedScheduleSlot?.weekNumber) {
            return;
        }

        if (selectedDayIsComplete) {
            openSelectedDay();
            return;
        }

        onStartSession?.(selectedScheduleSlot.weekNumber, selectedHeaderDay.day);
    }

    function openMoveSessionCalendar() {
        if (!selectedHeaderDay || !selectedScheduleSlot?.weekNumber) {
            return;
        }

        onMoveSession?.(
            selectedScheduleSlot.weekNumber,
            selectedHeaderDay.day,
            selectedHeaderDate
        );
    }

    return (
        <>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.weekScheduleScroller}
                contentContainerStyle={styles.weekSchedule}
                contentOffset={{ x: WEEK_SCHEDULE_TODAY_OFFSET, y: 0 }}
            >
                {currentWeekSchedule.map(({ date, dateKey, weekday, trainingDay, weekNumber, isArchived }) => {
                    const isSelectedScheduleDay = selectedScheduleSlot?.dateKey === dateKey;
                    const showConditioningMarker = isConditioningOnlyDay(trainingDay);
                    const scheduleTileColorStyle =
                        getWeekScheduleTileColorStyle(trainingDay, isSelectedScheduleDay);
                    const scheduleDayTypeMeta = getWeekScheduleDayTypeMeta(trainingDay);
                    const scheduleTileTextStyle =
                        getWeekScheduleTileTextStyle(trainingDay, isSelectedScheduleDay);
                    const scheduleDayKey =
                        trainingDay && weekNumber ? `${weekNumber}-${trainingDay.day}` : "";
                    const scheduleDayIsComplete =
                        Boolean(scheduleDayKey) && completedDayEntries.includes(scheduleDayKey);
                    const scheduleDayProgress =
                        scheduleDayKey && !isArchived
                            ? activeSessionProgressByKey?.[scheduleDayKey]
                            : null;
                    const scheduleDayCompletedProgress =
                        scheduleDayKey && !isArchived
                            ? completedSessionProgressByKey?.[scheduleDayKey]
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
                            <View style={styles.weekScheduleDateContainer}>
                                <IBMPlexText defaultWhite style={styles.weekScheduleDate}>
                                    {formatScheduleDateLabel(date, weekday)}
                                </IBMPlexText>
                            </View>
                            <View style={styles.weekScheduleTileSlot}>
                                <WeekScheduleTile
                                    onPress={() => {
                                        cardSlideDirection.current =
                                            date < selectedHeaderDate ? -1 : 1;
                                        setSelectedDateKey(dateKey);
                                    }}
                                    tileStyle={[
                                        scheduleTileColorStyle,
                                        isArchived && styles.weekScheduleArchivedDay,
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
                                            <MoonRestIcon size={28} color="#6F6F6F" />
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
                                                    scheduleDayTypeMeta?.iconColor || HOME_BLUE,
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
                        hexToRgba(selectedAccentColor, 0.18),
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
                            transform: [
                                {
                                    translateX: cardContentTranslateX,
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.todayPanelHeader}>
                        <View
                            style={[
                                styles.todayIconHalo,
                                { backgroundColor: hexToRgba(selectedAccentColor, 0.14) },
                            ]}
                        >
                            {selectedHeaderDay ? (
                                <WeekScheduleTypeIcon
                                    color={selectedAccentColor}
                                    type={selectedHeaderType}
                                    size={32}
                                />
                            ) : (
                                <MoonRestIcon size={39} color={HOME_BLUE} />
                            )}
                        </View>
                        <View style={styles.todayCopy}>
                            <IBMPlexText lines={1} style={[styles.todayKicker, { color: selectedAccentColor }]}>
                                {selectedKicker}
                            </IBMPlexText>
                            <IBMPlexText defaultWhite lines={2} style={styles.todayTitle}>
                                {selectedPanelTitle}
                            </IBMPlexText>
                            <IBMPlexText lines={3} style={styles.todayDescription}>
                                {selectedPanelSubtitle}
                            </IBMPlexText>
                        </View>
                    </View>

                    {selectedDayIsComplete || (selectedHeaderDay && !selectedDayIsPushedBack) ? (
                        <View style={styles.todayProgressBlock}>
                            <View style={styles.todayProgressTrack}>
                                <View
                                    style={[
                                        styles.todayProgressFill,
                                        {
                                            backgroundColor: selectedAccentColor,
                                            width: `${selectedDayIsComplete ? completedSessionProgressPercent : activeSessionProgressPercent}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <IBMPlexText style={styles.todayProgressText}>
                                {selectedCompletedExerciseLabel}
                            </IBMPlexText>
                        </View>
                    ) : null}

                    <View style={styles.sessionMoveRow}>
                        {canUseSelectedSession ? (
                            <>
                                {canMoveSelectedSession ? (
                                    <TouchableOpacity
                                        activeOpacity={0.78}
                                        accessibilityLabel="Reschedule session"
                                        onPress={openMoveSessionCalendar}
                                        style={[
                                            styles.moveSessionButton,
                                            styles.moveSessionButtonSecondary,
                                        ]}
                                    >
                                        <IBMPlexText
                                            defaultWhite
                                            adjustsFontSizeToFit
                                            lines={1}
                                            minimumFontScale={0.72}
                                            style={styles.moveSessionButtonText}
                                        >
                                            Reschedule
                                        </IBMPlexText>
                                    </TouchableOpacity>
                                ) : null}
                                <TouchableOpacity
                                    activeOpacity={0.84}
                                    onPress={handlePrimarySessionAction}
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
                            </>
                        ) : (
                            <TouchableOpacity
                                activeOpacity={0.84}
                                onPress={openSelectedDay}
                                style={[
                                    styles.moveSessionButton,
                                    styles.moveSessionButtonPrimary,
                                ]}
                            >
                                <IBMPlexText
                                    defaultWhite
                                    lines={1}
                                    style={[
                                        styles.moveSessionButtonText,
                                        styles.primarySessionButtonText,
                                    ]}
                                >
                                    View plan
                                </IBMPlexText>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </View>
        </>
    );
}

export default function StartView({
    hasProgram = false,
    plan,
    trainingPlanHistory = [],
    questionnaire,
    completedDays,
    activeSessionProgressByKey,
    completedSessionProgressByKey,
    onStart,
    onStartSession,
    onOpenOverview,
    onAdjustPlan,
    onOpenEventPreparation,
    onOpenMyPosts,
    onOpenWellness,
    onMoveSession,
    onNavigateQuestionnaire,
    onResetUserProgress,
}) {
    const insets = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();
    const bottomPadding = getHomeBottomPadding(insets.bottom);
    const contentHeight = getHomeContentHeight(windowHeight, insets.bottom);
    const firstScreenHeight = contentHeight;
    const topPadding = Math.max(insets.top + 22, 42);
    const isPhonePreview = isPagesPhonePreview();
    useWebTestActions("home", "Home tests", [
        {
            label: "Test questionnaire",
            onPress: onStart,
        },
        {
            label: "Navigate questionnaire",
            onPress: onNavigateQuestionnaire,
        },
        {
            label: "Reset user",
            onPress: onResetUserProgress,
        },
    ]);

    return (
        <View style={styles.homeRoot}>
            <BlackGradient />
            <Dotted>
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingBottom: bottomPadding },
                    ]}
                    showsVerticalScrollIndicator={false}
                    style={styles.column}
                >
                    <View
                        style={[
                            styles.firstScreenContent,
                            { minHeight: firstScreenHeight },
                        ]}
                    >
                        <View style={[styles.homeCards, { paddingTop: topPadding }]}>
                            <HomeBrandHeader />
                            {hasProgram ? (
                                <HomePlanSchedule
                                    plan={plan}
                                    trainingPlanHistory={trainingPlanHistory}
                                    completedDays={completedDays}
                                    activeSessionProgressByKey={activeSessionProgressByKey}
                                    completedSessionProgressByKey={completedSessionProgressByKey}
                                    onMoveSession={onMoveSession}
                                    onOpenOverview={onOpenOverview}
                                    onStartSession={onStartSession}
                                />
                            ) : (
                                <HomeSetupPanel
                                    questionnaire={questionnaire}
                                    onStart={onStart}
                                />
                            )}
                            <View style={styles.homeMenuSection}>
                                <View style={styles.homeMenuRow}>
                                    <HomeMenuAction
                                        accentColor={HOME_YELLOW}
                                        actionLabel="Open"
                                        description="Change sport, schedule, goals or preferences."
                                        disabled={!hasProgram}
                                        icon="adjust"
                                        onPress={onAdjustPlan}
                                        title="Adjust plan"
                                    />
                                    <HomeMenuAction
                                        accentColor={HOME_GREEN}
                                        actionLabel="Report"
                                        description="Injuries and limitations."
                                        disabled={!hasProgram}
                                        icon="reportInjury"
                                        onPress={onOpenWellness}
                                        title="Report Injury"
                                    />
                                </View>
                                <View style={styles.homeMenuRow}>
                                    <HomeMenuAction
                                        accentColor={HOME_YELLOW}
                                        actionLabel="Register"
                                        description="Competition date and event details."
                                        disabled={!hasProgram}
                                        icon="registerEvent"
                                        onPress={onOpenEventPreparation}
                                        title="Register Event"
                                    />
                                    <HomeMenuAction
                                        accentColor={HOME_BLUE}
                                        actionLabel="View"
                                        description="Forum posts you created."
                                        icon="posts"
                                        onPress={onOpenMyPosts}
                                        title="My posts"
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                    {!isPhonePreview ? (
                        <>
                            <TouchableOpacity style={styles.testButton} onPress={onStart}>
                                <IBMPlexText defaultWhite textColor="#000" fontSize={18}>
                                    Test questionnaire
                                </IBMPlexText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.testButton, styles.navigateQuestionnaireButton]}
                                onPress={onNavigateQuestionnaire}
                            >
                                <IBMPlexText defaultWhite textColor="#000" fontSize={18}>
                                    Navigate questionnaire
                                </IBMPlexText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.testButton, styles.resetUserButton]}
                                onPress={onResetUserProgress}
                            >
                                <IBMPlexText defaultWhite style={styles.resetUserButtonText}>
                                    Reset user
                                </IBMPlexText>
                            </TouchableOpacity>
                        </>
                    ) : null}
                </ScrollView>
            </Dotted>
        </View>
    );
}

// import QuestionnaireShell from "./QuestionnaireShell.jsx";

// export default function StartView({ onStart }) {
//     return (
//         <QuestionnaireShell>
//             <div className="start-view-center">
//                 <div className="start-view-card">
//                     <p className="start-view-eyebrow">Welcome</p>
//                     <h1 className="start-view-title">Combat Training Planner</h1>
//                     <p className="start-view-subtitle">
//                         Create a personalized training program for martial arts based on your goals and schedule.
//                     </p>

//                     <div className="start-view-actions">
//                         <button className="primary-button" onClick={onStart}>
//                             Create Training Program
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         </QuestionnaireShell>
//     );
// }

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },
    firstScreenContent: {
        flexGrow: 1,
        justifyContent: "flex-start",
    },
    testButton: {
        alignSelf: "center",
        marginTop: 24,
        paddingHorizontal: 22,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    navigateQuestionnaireButton: {
        marginTop: 10,
    },
    resetUserButton: {
        backgroundColor: "#231f20",
        borderColor: "#fff",
        borderWidth: 1,
        marginTop: 10,
        marginBottom: 20,
    },
    resetUserButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
    },
    column: {
        flex: 1,
    },
    homeCards: {
        gap: 12,
        marginHorizontal: 20,
        marginTop: 0,
        marginBottom: 0,
    },
    homeActionRow: {
        alignItems: "stretch",
        flexDirection: "row",
        gap: 12,
    },
    headerActionPanel: {
        alignSelf: "stretch",
        alignItems: "center",
        backgroundColor: "#101010",
        borderRadius: 18,
        borderColor: "#252525",
        borderWidth: 1,
        minHeight: 190,
        overflow: "hidden",
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 18,
        position: "relative",
        justifyContent: "space-between",
    },
    headerActionPanelTopLeftTint: {
        ...StyleSheet.absoluteFillObject,
    },
    headerActionPanelHeading: {
        alignSelf: "stretch",
    },
    headerDate: {
        fontFamily: fonts.display,
        fontSize: 30,
        fontWeight: "700",
        lineHeight: 34,
        marginBottom: 6,
    },
    headerPhase: {
        color: "#d1d5db",
        fontSize: 18,
        lineHeight: 24,
        marginBottom: 4,
    },
    headerMeta: {
        color: "#858585",
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 16,
    },
    headerActionArea: {
        alignSelf: "center",
        gap: 10,
        width: "100%",
    },
    headerStartButton: {
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 120,
        justifyContent: "center",
        height: 36,
        minWidth: 0,
        paddingHorizontal: 16,
    },
    headerStartButtonText: {
        alignSelf: "center",
        color: "#000",
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
        fontSize: 18,
        fontWeight: "800",
        lineHeight: 22,
    },
    headerCompletedSubtitle: {
        color: "#9ca3af",
        fontSize: 13,
        fontWeight: "700",
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
        fontSize: 13,
        fontWeight: "700",
        lineHeight: 16,
        textAlign: "center",
    },
    weekSchedule: {
        flexDirection: "row",
        gap: -8,
        paddingHorizontal: 2,
    },
    weekScheduleScroller: {
        alignSelf: "stretch",
        flexGrow: 0,
        marginHorizontal: -8,
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
        alignItems: "center",
        height: WEEK_SCHEDULE_TILE_LARGE_HEIGHT,
        justifyContent: "center",
        position: "relative",
        width: WEEK_SCHEDULE_TILE_LARGE_WIDTH,
        zIndex: 2,
    },
    weekScheduleDay: {
        alignItems: "center",
        borderColor: WEEK_SCHEDULE_BORDER,
        borderRadius: 20,
        borderStyle: "solid",
        borderWidth: 1,
        gap: 0,
        height: WEEK_SCHEDULE_TILE_SMALL_HEIGHT,
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingVertical: 12,
        position: "relative",
        width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
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
        fontSize: 15,
        fontWeight: "800",
        lineHeight: 18,
        textAlign: "center",
        marginTop: 15,
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
        fontSize: 13,
        fontWeight: "800",
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
    homeRoot: {
        backgroundColor: HOME_BACKGROUND,
        flex: 1,
    },
    homeCards: {
        gap: 22,
        marginHorizontal: 24,
        marginBottom: 0,
        marginTop: 0,
    },
    homeHeader: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },
    homeBrand: {
        alignItems: "center",
        flexDirection: "row",
        gap: 10,
        minWidth: 0,
    },
    homeBrandLogo: {
        aspectRatio: 497 / 426,
        width: 34,
    },
    homeBrandText: {
        fontSize: 23,
        fontWeight: "800",
        lineHeight: 29,
    },
    homeMenuSection: {
        gap: 10,
        marginTop: 0,
    },
    homeMenuRow: {
        flexDirection: "row",
        gap: 10,
    },
    homeMenuAction: {
        alignItems: "stretch",
        backgroundColor: HOME_SURFACE,
        borderColor: HOME_BORDER,
        borderRadius: 16,
        borderWidth: 1,
        flex: 1,
        gap: 12,
        minHeight: 184,
        minWidth: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    homeMenuActionDisabled: {
        opacity: 0.42,
    },
    homeMenuIcon: {
        alignItems: "center",
        height: 30,
        justifyContent: "center",
        width: 30,
    },
    injuryCrossIcon: {
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    injuryCrossHorizontal: {
        position: "absolute",
    },
    injuryCrossVertical: {
        position: "absolute",
    },
    homeMenuCopy: {
        flex: 1,
        minWidth: 0,
    },
    homeMenuTitle: {
        fontSize: 16,
        fontWeight: "800",
        lineHeight: 20,
        marginBottom: 3,
    },
    homeMenuDescription: {
        color: HOME_TEXT_MUTED,
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 15,
    },
    homeMenuActionLabel: {
        fontSize: 13,
        fontWeight: "800",
        lineHeight: 17,
        marginTop: "auto",
        paddingTop: 12,
    },
    headerActionPanel: {
        alignSelf: "stretch",
        alignItems: "flex-start",
        backgroundColor: HOME_SURFACE,
        borderColor: HOME_BORDER,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: "space-between",
        minHeight: 220,
        overflow: "hidden",
        paddingHorizontal: 22,
        paddingTop: 22,
        paddingBottom: 20,
        position: "relative",
    },
    headerDate: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "800",
        lineHeight: 30,
        marginBottom: 6,
    },
    headerPhase: {
        color: HOME_TEXT_MUTED,
        fontSize: 17,
        fontWeight: "600",
        lineHeight: 24,
    },
    headerStartButton: {
        alignItems: "center",
        backgroundColor: HOME_BLUE,
        borderRadius: 16,
        height: 52,
        justifyContent: "center",
        minWidth: 150,
        paddingHorizontal: 18,
    },
    headerStartButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "800",
        lineHeight: 22,
        textAlign: "center",
    },
    weekScheduleScroller: {
        alignSelf: "stretch",
        flexGrow: 0,
        marginHorizontal: -12,
    },
    weekSchedule: {
        flexDirection: "row",
        paddingHorizontal: 12,
    },
    weekScheduleItem: {
        alignItems: "center",
        width: WEEK_SCHEDULE_ITEM_WIDTH,
    },
    weekScheduleDateContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 3,
        minHeight: 40,
        minWidth: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
    },
    weekScheduleDate: {
        color: "#F7F7FA",
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 18,
        textAlign: "center",
    },
    weekScheduleTileSlot: {
        height: WEEK_SCHEDULE_TILE_LARGE_HEIGHT,
        justifyContent: "center",
        position: "relative",
        zIndex: 2,
    },
    weekSchedulePressable: {
        alignItems: "center",
        height: WEEK_SCHEDULE_TILE_LARGE_HEIGHT,
        justifyContent: "center",
        position: "relative",
        width: WEEK_SCHEDULE_TILE_LARGE_WIDTH,
        zIndex: 2,
    },
    weekScheduleDay: {
        alignItems: "center",
        backgroundColor: WEEK_SCHEDULE_SURFACE,
        borderColor: WEEK_SCHEDULE_BORDER,
        borderRadius: 18,
        borderWidth: 1,
        height: WEEK_SCHEDULE_TILE_SMALL_HEIGHT,
        justifyContent: "center",
        paddingHorizontal: 7,
        paddingVertical: 12,
        position: "relative",
        width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
    },
    weekScheduleLabel: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
        lineHeight: 20,
        marginTop: 18,
        textAlign: "center",
    },
    weekScheduleTypeLabel: {
        bottom: 21,
        fontWeight: "700",
        paddingHorizontal: 2,
        position: "absolute",
        textAlign: "center",
        width: "100%",
    },
    weekScheduleTypeIcon: {
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: 25,
        width: "100%",
    },
    weekScheduleTypeIconBadge: {
        alignItems: "center",
        borderRadius: 999,
        height: 30,
        justifyContent: "center",
        width: 30,
    },
    weekScheduleConditioningMarker: {
        backgroundColor: HOME_BLUE,
        borderRadius: 999,
        height: 6,
        left: 8,
        position: "absolute",
        top: 8,
        width: 6,
    },
    weekScheduleIndicatorTrack: {
        backgroundColor: "#191919",
        borderRadius: 999,
        height: 4,
        marginTop: 5,
        overflow: "hidden",
        width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
    },
    weekScheduleIndicatorFill: {
        borderRadius: 999,
        height: "100%",
    },
    weekScheduleIndicatorSpacer: {
        height: 4,
        marginTop: 5,
        width: WEEK_SCHEDULE_TILE_SMALL_WIDTH,
    },
    todayPanel: {
        backgroundColor: HOME_SURFACE,
        borderColor: HOME_BORDER,
        borderRadius: 18,
        borderWidth: 1,
        height: 270,
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
    },
    todayTitle: {
        fontSize: 24,
        fontWeight: "800",
        lineHeight: 31,
        marginBottom: 9,
    },
    todayDescription: {
        color: "#B8B8C2",
        fontSize: 15,
        fontWeight: "600",
        lineHeight: 22,
        maxWidth: 250,
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
        color: HOME_TEXT_MUTED,
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
    moveSessionButtonSecondary: {
        backgroundColor: "rgba(0, 0, 0, 0.18)",
        borderColor: "#56565F",
        borderWidth: 1,
    },
    moveSessionButtonPrimary: {
        backgroundColor: HOME_BLUE,
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

})
