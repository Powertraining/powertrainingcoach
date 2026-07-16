import {
  buildExerciseSessionSteps,
  getExerciseDisplayName,
  getExerciseOrderLabel,
  getExerciseSupersetKey,
} from "../src/services/utils/exerciseSupersets.js";

describe("exercise superset helpers", () => {
  test("reads structured and legacy order labels", () => {
    expect(getExerciseOrderLabel({ orderLabel: "1A" }, 0)).toBe("1a");
    expect(getExerciseOrderLabel({ name: "2b. Chest-supported row" }, 1)).toBe("2b");
    expect(getExerciseDisplayName({ name: "2b. Chest-supported row" })).toBe(
      "Chest-supported row"
    );
    expect(getExerciseSupersetKey({ orderLabel: "2b" }, 1)).toBe("2");
  });

  test("falls back to ordinary numeric ordering", () => {
    expect(getExerciseOrderLabel({ name: "Back squat" }, 2)).toBe("3");
    expect(getExerciseSupersetKey({ name: "Back squat" }, 2)).toBe("");
  });

  test("alternates paired exercises set by set", () => {
    const steps = buildExerciseSessionSteps([
      { orderLabel: "1a", name: "Bench press", sets: "3" },
      { orderLabel: "1b", name: "Barbell row", sets: "3" },
      { orderLabel: "2", name: "Split squat", sets: "2" },
    ]);

    expect(steps.map(({ exerciseIndex, setIndex }) => [exerciseIndex, setIndex])).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
      [1, 2],
      [2, 0],
      [2, 1],
    ]);
  });

  test("keeps extra sets when superset prescriptions are uneven", () => {
    const steps = buildExerciseSessionSteps([
      { orderLabel: "1a", name: "Jump", sets: "3" },
      { orderLabel: "1b", name: "Throw", sets: "2" },
    ]);

    expect(steps.map(({ exerciseIndex, setIndex }) => [exerciseIndex, setIndex])).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ]);
  });
});
