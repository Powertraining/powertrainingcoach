import { DAY_IN_MS, startOfLocalDay } from "./dateUtils.js";

export const DEFAULT_TRAINING_CYCLE_WEEKS = 12;

function parsePositiveInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function parseEventDateFromText(value = "") {
  const text = normalizeString(value);

  if (!text) {
    return null;
  }

  const isoDateMatch = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoDateMatch) {
    const parsedIsoDate = new Date(`${isoDateMatch[0]}T00:00:00`);
    return Number.isNaN(parsedIsoDate.getTime()) ? null : parsedIsoDate;
  }

  const parsedDate = new Date(text);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function parseRelativeWeeksFromText(value = "") {
  const text = normalizeString(value).toLowerCase();
  const relativeWeeksMatch = text.match(
    /\b(?:in\s*)?(\d{1,2})\s*(?:weeks?|wks?)\s*(?:out|away)?\b/
  );

  return relativeWeeksMatch ? parsePositiveInteger(relativeWeeksMatch[1]) : null;
}

export function getWeeksUntilEvent(value = "", today = new Date()) {
  const relativeWeeks = parseRelativeWeeksFromText(value);
  if (relativeWeeks) {
    return relativeWeeks;
  }

  const eventDate = parseEventDateFromText(value);
  const currentDate = startOfLocalDay(today);

  if (!eventDate || !currentDate) {
    return null;
  }

  const eventStart = startOfLocalDay(eventDate);
  const daysUntilEvent = Math.ceil(
    (eventStart - currentDate) / DAY_IN_MS
  );

  return daysUntilEvent > 0
    ? Math.max(1, Math.ceil(daysUntilEvent / 7))
    : null;
}

export function resolveTrainingCycleWeeks({
  trainingPhase = "",
  competitionTimeline = "",
  eventPreparation = "",
  requestedWeeks = null,
  subscriptionWeeks = null,
  today = new Date(),
} = {}) {
  const explicitRequestedWeeks = parsePositiveInteger(requestedWeeks);
  const maxWeeks =
    parsePositiveInteger(subscriptionWeeks) || DEFAULT_TRAINING_CYCLE_WEEKS;
  const baseWeeks = Math.min(
    explicitRequestedWeeks || DEFAULT_TRAINING_CYCLE_WEEKS,
    maxWeeks
  );
  const eventText = normalizeString(competitionTimeline) ||
    normalizeString(eventPreparation);
  const weeksUntilEvent = getWeeksUntilEvent(eventText, today);

  if (weeksUntilEvent && weeksUntilEvent < baseWeeks) {
    return Math.max(1, weeksUntilEvent);
  }

  return baseWeeks;
}
