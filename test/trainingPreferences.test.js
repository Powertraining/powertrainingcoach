import {
  getTrainingPreferencesFormState,
  normalizeTrainingPreferences,
} from "../src/constants/trainingPreferences.js";

test("training preferences use questionnaire session frequency for preferred weekday slots", () => {
  const formState = getTrainingPreferencesFormState({
    sessionsPerWeek: 5,
    preferredWeekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  });

  expect(formState.daysPerWeek).toBe(5);
  expect(formState.preferredWeekdays).toEqual([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
});

test("explicit days per week still controls preferred weekday slot count", () => {
  const normalized = normalizeTrainingPreferences({
    sessionsPerWeek: 5,
    daysPerWeek: 2,
    preferredWeekdays: ["Monday", "Friday", "Sunday"],
  });

  expect(normalized.daysPerWeek).toBe(2);
  expect(normalized.preferredWeekdays).toEqual(["Monday", "Friday"]);
});
