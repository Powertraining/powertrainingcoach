import {
  getCurrentTrainingPhase,
  getCurrentTrainingWeek,
} from "./trainingPlan.js";
import { DAY_IN_MS, startOfLocalDay } from "./dateUtils.js";

function parseEventDateFromText(value = "") {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const isoDateMatch = value.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoDateMatch) {
    return startOfLocalDay(`${isoDateMatch[0]}T00:00:00`);
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : startOfLocalDay(parsedDate);
}

function parseRelativeWeeksFromText(value = "") {
  if (typeof value !== "string") {
    return null;
  }

  const relativeWeeksMatch = value.toLowerCase().match(
    /\b(?:in\s*)?(\d{1,2})\s*(?:weeks?|wks?)\s*(?:out|away)?\b/
  );
  const parsedWeeks = relativeWeeksMatch
    ? Number.parseInt(relativeWeeksMatch[1], 10)
    : null;

  return Number.isFinite(parsedWeeks) && parsedWeeks > 0 ? parsedWeeks : null;
}

function getDaysUntil(targetDate) {
  const today = startOfLocalDay();
  const target = startOfLocalDay(targetDate);

  if (!today || !target) {
    return null;
  }

  return Math.max(0, Math.ceil((target - today) / DAY_IN_MS));
}

function getElapsedProgress(startDate, targetDate) {
  const start = startOfLocalDay(startDate);
  const target = startOfLocalDay(targetDate);
  const today = startOfLocalDay();

  if (!start || !target || !today || target <= start) {
    return 0;
  }

  const totalDays = Math.ceil((target - start) / DAY_IN_MS);
  const elapsedDays = Math.ceil((today - start) / DAY_IN_MS);

  return Math.max(0, Math.min(1, elapsedDays / totalDays));
}

function getProgramStartDate(plan = {}) {
  return startOfLocalDay(plan?.createdAt || plan?.generatedAt);
}

function getEventDate(questionnaire = {}, plan = {}) {
  const eventText =
    typeof questionnaire?.competitionTimeline === "string" &&
    questionnaire.competitionTimeline.trim()
      ? questionnaire.competitionTimeline
      : typeof questionnaire?.eventPreparation === "string"
        ? questionnaire.eventPreparation
        : "";
  const eventDate = parseEventDateFromText(eventText);

  if (eventDate) {
    return eventDate;
  }

  const relativeWeeks = parseRelativeWeeksFromText(eventText);
  const programStartDate = getProgramStartDate(plan);

  if (!relativeWeeks || !programStartDate) {
    return null;
  }

  const estimatedEventDate = new Date(programStartDate);
  estimatedEventDate.setDate(estimatedEventDate.getDate() + relativeWeeks * 7);
  return estimatedEventDate;
}

function getProgramEndDate(plan = {}) {
  const programStartDate = getProgramStartDate(plan);
  const plannedWeeks = Array.isArray(plan?.weeks) ? plan.weeks.length : 0;

  if (!programStartDate || plannedWeeks <= 0) {
    return null;
  }

  const endDate = new Date(programStartDate);
  endDate.setDate(endDate.getDate() + plannedWeeks * 7);
  return endDate;
}

export function getProgramCountdownStatus({ questionnaire, plan }) {
  const programStartDate = getProgramStartDate(plan);
  const eventDate = getEventDate(questionnaire, plan);
  const eventDays = eventDate ? getDaysUntil(eventDate) : null;

  if (eventDays !== null) {
    return {
      text: `${eventDays} ${eventDays === 1 ? "day" : "days"} until your competition`,
      progress: getElapsedProgress(programStartDate, eventDate),
    };
  }

  const programEndDate = getProgramEndDate(plan);
  const programDays = programEndDate ? getDaysUntil(programEndDate) : null;

  if (programDays !== null) {
    return {
      text: `${programDays} ${programDays === 1 ? "day" : "days"} until this program ends`,
      progress: getElapsedProgress(programStartDate, programEndDate),
    };
  }

  return {
    text: "Program in progress",
    progress: 0,
  };
}

export function getCurrentPhaseText(plan, completedDays) {
  if (!plan) {
    return "";
  }

  const currentWeek = getCurrentTrainingWeek(plan, completedDays);
  const currentPhase = getCurrentTrainingPhase(plan, completedDays);
  const phaseLabel = currentPhase?.label || "Building";
  const weekNumber = currentWeek?.week || 1;

  return `${phaseLabel} week ${weekNumber}`;
}
