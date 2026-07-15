import { getWeekdayNameFromIndex } from "../../constants/weekdays.js";
import { isSameCalendarDay, startOfLocalDay } from "./dateUtils.js";
import { getTrainingDayPreferredWeekday } from "./trainingPlan.js";

export const PROGRAM_OVERVIEW_LOOKBACK_DAYS = 14;
export const PROGRAM_OVERVIEW_UPCOMING_DAYS_INCLUDING_TODAY = 7;

export function getProgramOverviewToday(value = new Date()) {
  return startOfLocalDay(value) || startOfLocalDay();
}

export function getPlanWeekStartDate(plan = {}, weekNumber = 1) {
  const planStartDate = startOfLocalDay(plan?.createdAt || plan?.generatedAt);
  const parsedWeekNumber = Number.parseInt(weekNumber, 10);

  if (!planStartDate || !Number.isFinite(parsedWeekNumber) || parsedWeekNumber < 1) {
    return null;
  }

  planStartDate.setDate(planStartDate.getDate() + (parsedWeekNumber - 1) * 7);
  return planStartDate;
}

export function formatCurrentDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getPhaseRangeLabel(phase = {}) {
  if (phase.weekStart === phase.weekEnd) {
    return `Week ${phase.weekStart}`;
  }

  return `Weeks ${phase.weekStart}-${phase.weekEnd}`;
}

export function getRestSlotDateLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getNextTrainingSlotLabel(slot) {
  if (!slot?.trainingDay) {
    return "";
  }

  return `Day ${slot.trainingDay.day} on ${getRestSlotDateLabel(slot.date)}`;
}

export function buildCurrentWeekSchedule(
  currentWeek,
  {
    today = getProgramOverviewToday(),
    lookbackDays = PROGRAM_OVERVIEW_LOOKBACK_DAYS,
    upcomingDaysIncludingToday = PROGRAM_OVERVIEW_UPCOMING_DAYS_INCLUDING_TODAY,
  } = {}
) {
  const rollingDates = Array.from(
    { length: lookbackDays + upcomingDaysIncludingToday },
    (_, index) => {
      const dayOffset = index - lookbackDays;
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      return date;
    }
  );
  const fallbackTrainingDays =
    currentWeek?.days?.filter((day) => !getTrainingDayPreferredWeekday(day)) || [];
  const assignedFallbackTrainingDays = new Set();

  return rollingDates.map((date, index) => {
    const weekday = getWeekdayNameFromIndex(date.getDay());
    let trainingDay = currentWeek?.days?.find(
      (day) => getTrainingDayPreferredWeekday(day) === weekday
    );

    if (!trainingDay && index >= lookbackDays) {
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
}

export { isSameCalendarDay };
