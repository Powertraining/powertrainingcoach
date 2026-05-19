export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function startOfLocalDay(value = new Date()) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

export function isSameCalendarDay(leftDate, rightDate) {
  if (!(leftDate instanceof Date) || !(rightDate instanceof Date)) {
    return false;
  }

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

export function formatDateValue(date) {
  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDateValue(today = new Date()) {
  return formatDateValue(startOfLocalDay(today) || today);
}

export function getDaysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

export function formatDateParts(year, month, day) {
  return [
    String(year),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function parseDateParts(value = "") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return null;
  }

  const maxDay = getDaysInMonth(month, year);
  if (day < 1 || day > maxDay) {
    return null;
  }

  return { year, month, day };
}

function datePartsToDate(year, month, day) {
  return new Date(year, month - 1, day);
}

export function clampDatePartsToRange(year, month, day, minDate, maxDate) {
  if (datePartsToDate(year, month, day) < minDate) {
    return {
      year: minDate.getFullYear(),
      month: minDate.getMonth() + 1,
      day: minDate.getDate(),
    };
  }

  if (datePartsToDate(year, month, day) > maxDate) {
    return {
      year: maxDate.getFullYear(),
      month: maxDate.getMonth() + 1,
      day: maxDate.getDate(),
    };
  }

  return { year, month, day };
}
