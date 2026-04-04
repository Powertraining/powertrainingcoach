const WEEKDAY_NAMES = Object.freeze([
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]);

const WEEKDAY_LOOKUP = Object.freeze({
  sun: "Sunday",
  sunday: "Sunday",
  mon: "Monday",
  monday: "Monday",
  tue: "Tuesday",
  tues: "Tuesday",
  tuesday: "Tuesday",
  wed: "Wednesday",
  wednesday: "Wednesday",
  thu: "Thursday",
  thur: "Thursday",
  thurs: "Thursday",
  thursday: "Thursday",
  fri: "Friday",
  friday: "Friday",
  sat: "Saturday",
  saturday: "Saturday",
});

export const WEEKDAY_OPTIONS = Object.freeze([
  { label: "No preference", value: "" },
  ...WEEKDAY_NAMES.slice(1).map((name) => ({ label: name, value: name })),
  { label: "Sunday", value: "Sunday" },
]);

export function getWeekdayNameFromIndex(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue)) {
    return "";
  }

  if (parsedValue === 0 || parsedValue === 7) {
    return "Sunday";
  }

  if (parsedValue >= 1 && parsedValue <= 6) {
    return WEEKDAY_NAMES[parsedValue];
  }

  return "";
}

export function getNormalizedWeekday(value) {
  if (typeof value === "number") {
    return getWeekdayNameFromIndex(value);
  }

  if (typeof value !== "string") {
    return "";
  }

  const normalizedValue = value.trim().toLowerCase();

  if (!normalizedValue) {
    return "";
  }

  if (WEEKDAY_LOOKUP[normalizedValue]) {
    return WEEKDAY_LOOKUP[normalizedValue];
  }

  const matchingWeekday = WEEKDAY_NAMES.find((name) => {
    const lowerCasedName = name.toLowerCase();

    return (
      normalizedValue.includes(lowerCasedName) ||
      normalizedValue.includes(lowerCasedName.slice(0, 3))
    );
  });

  return matchingWeekday || "";
}
