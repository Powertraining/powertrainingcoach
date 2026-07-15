import test from "node:test";
import assert from "node:assert/strict";

import {
  applyMissedRepPlanAdjustment,
  applyTrainingCheckInAction,
  buildTrainingCheckInObjectiveSummary,
  buildTrainingCheckInRecommendation,
  createDefaultTrainingCheckInState,
  getTrainingCheckInBlockSize,
  getPendingTrainingCheckIn,
} from "../src/services/utils/trainingCheckIn.js";
import { createTrainingPerformanceEntry } from "../src/services/utils/trainingPerformance.js";

function createExercise(name, overrides = {}) {
  return {
    name,
    sets: "3",
    reps: "5",
    notes: "",
    substitutionOptions: [
      {
        id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_alt`,
        name: `${name} Variation`,
        sets: "3",
        reps: "5",
        notes: "Comparable option",
      },
    ],
    ...overrides,
  };
}

function createPrimaryLift(name = "Back Squat", loadingStrategy = "flat_loading") {
  return createExercise(name, {
    percentagePrescription: {
      referenceLiftName: name,
      loadingStrategy,
      workingSets: [
        {
          count: 3,
          reps: 5,
          percent1RM: 75,
          relativeIntensity: 85.7,
        },
      ],
    },
    substitutionOptions: [
      {
        id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_variation`,
        name: `${name} Variation`,
        sets: "3",
        reps: "5",
        notes: "Comparable option",
      },
    ],
  });
}

function createDay(dayNumber, loadingStrategy = "flat_loading") {
  return {
    day: dayNumber,
    sessionLabel: `Day ${dayNumber}`,
    preferredWeekday: ["Monday", "Wednesday", "Friday", "Saturday"][dayNumber - 1] || "",
    sessionProfile: {
      regions: ["lower_body"],
      qualities: ["force"],
      stressLevel: "high",
    },
    exercises: [
      createPrimaryLift("Back Squat", loadingStrategy),
      createExercise("Chest Supported Row"),
    ],
  };
}

function createPlan(totalWeeks = 4, loadingStrategy = "flat_loading") {
  return {
    summary: "Base before intensification.",
    phaseOverview: [
      {
        label: "Building",
        weekStart: 1,
        weekEnd: totalWeeks,
        focus: "Build the main lifts with repeatable structure.",
      },
    ],
    weeks: Array.from({ length: totalWeeks }, (_, weekIndex) => ({
      week: weekIndex + 1,
      days: [createDay(1, loadingStrategy), createDay(2, loadingStrategy)],
    })),
  };
}

function createTrackedTopSet({
  sessionKey,
  weekNumber,
  dayNumber,
  exerciseIndex = 0,
  liftName = "Back Squat",
  strategy = "fixed_rpe",
  repTarget = 5,
  targetRpe = 8,
  loadKg = 120,
  reps = 5,
  rpe = 8,
  performedAt = "2026-04-01T10:00:00.000Z",
} = {}) {
  return createTrainingPerformanceEntry({
    metadata: {
      strategy,
      liftName,
      repTarget,
      targetRpe,
      prompt: "",
    },
    result: {
      loadKg,
      reps,
      rpe,
    },
    sessionKey,
    weekNumber,
    dayNumber,
    exerciseIndex,
    sourceExerciseName: liftName,
    performedAt,
  });
}

test("weekly check-in becomes due after a full week is completed", () => {
  const pendingCheckIn = getPendingTrainingCheckIn({
    plan: createPlan(3),
    completedDays: ["1-1", "1-2"],
    questionnaire: { experience: "beginner" },
    trainingCheckInState: createDefaultTrainingCheckInState(),
  });

  assert.equal(pendingCheckIn.type, "weekly");
  assert.equal(pendingCheckIn.weekNumber, 1);
});

test("end-of-block check-in takes priority every 4 weeks", () => {
  const completedDays = [
    "1-1", "1-2",
    "2-1", "2-2",
    "3-1", "3-2",
    "4-1", "4-2",
  ];
  const pendingCheckIn = getPendingTrainingCheckIn({
    plan: createPlan(5),
    completedDays,
    questionnaire: { experience: "beginner" },
    trainingCheckInState: createDefaultTrainingCheckInState(),
  });

  assert.equal(getTrainingCheckInBlockSize("beginner"), 4);
  assert.equal(pendingCheckIn.type, "end_of_block");
  assert.equal(pendingCheckIn.weekNumber, 4);
  assert.deepEqual(pendingCheckIn.weeksInScope, [1, 2, 3, 4]);
});

test("4-week check-in exposes block review copy and scope for the frontend", () => {
  const pendingCheckIn = getPendingTrainingCheckIn({
    plan: createPlan(4),
    completedDays: [
      "1-1", "1-2",
      "2-1", "2-2",
      "3-1", "3-2",
      "4-1", "4-2",
    ],
    questionnaire: { experience: "beginner" },
    trainingCheckInState: createDefaultTrainingCheckInState(),
  });

  assert.equal(pendingCheckIn.type, "end_of_block");
  assert.equal(pendingCheckIn.title, "4-week check-in");
  assert.equal(
    pendingCheckIn.summary,
    "Review the last 4 weeks, then choose how the app should adjust the next part of your program."
  );
  assert.equal(pendingCheckIn.blockSize, 4);
  assert.deepEqual(pendingCheckIn.weeksInScope, [1, 2, 3, 4]);
});

test("completed end-of-block check-in replaces the weekly check-in at the block boundary", () => {
  const completedDays = [
    "1-1", "1-2",
    "2-1", "2-2",
    "3-1", "3-2",
    "4-1", "4-2",
  ];
  const pendingCheckIn = getPendingTrainingCheckIn({
    plan: createPlan(5),
    completedDays,
    questionnaire: { experience: "beginner" },
    trainingCheckInState: {
      history: [
        {
          type: "end_of_block",
          weekNumber: 4,
          title: "4-week check-in",
          createdAt: "2026-07-14T10:00:00.000Z",
        },
      ],
    },
  });

  assert.equal(pendingCheckIn, null);
});

test("fatigue-heavy answers recommend a deload before a scheme change", () => {
  const prompt = {
    type: "weekly",
    weekNumber: 1,
    title: "Weekly check-in",
    summary: "",
    weeksInScope: [1],
    objectiveSummary: {
      strengthTrend: "up",
      complianceTrend: "strong",
    },
  };
  const recommendation = buildTrainingCheckInRecommendation({
    prompt,
    questionnaire: { loadingStrategy: "flat_loading" },
    plan: createPlan(3),
    completedDays: ["1-1", "1-2"],
    answers: {
      progress: "improving",
      fatigue: "beat_up",
      enjoyment: "ok",
      pain: "none",
    },
    objectiveSummary: prompt.objectiveSummary,
  });

  assert.equal(recommendation.recommendedAction.type, "deload");
});

test("objective summary reports tracked strength and completion signals", () => {
  const objectiveSummary = buildTrainingCheckInObjectiveSummary({
    plan: createPlan(3),
    completedDays: ["1-1", "1-2"],
    prompt: {
      type: "weekly",
      weekNumber: 1,
      weeksInScope: [1],
    },
    trainingPerformanceState: {
      history: [
        createTrackedTopSet({
          sessionKey: "1-1",
          weekNumber: 1,
          dayNumber: 1,
          loadKg: 120,
          reps: 5,
          rpe: 8,
          performedAt: "2026-04-01T10:00:00.000Z",
        }),
        createTrackedTopSet({
          sessionKey: "1-2",
          weekNumber: 1,
          dayNumber: 2,
          loadKg: 122.5,
          reps: 5,
          rpe: 9,
          performedAt: "2026-04-03T10:00:00.000Z",
        }),
      ],
    },
  });

  assert.equal(objectiveSummary.performanceTrend, "up");
  assert.equal(objectiveSummary.strengthTrendSource, "performance");
  assert.equal(objectiveSummary.completionRate, 100);
  assert.equal(objectiveSummary.topSetCompletionRate, 100);
  assert.equal(objectiveSummary.averageRpeDrift, 0.5);
  assert.equal(objectiveSummary.rpeDriftTrend, "elevated");
  assert.match(objectiveSummary.summary, /Top-set logging sat at 100%/i);
  assert.match(objectiveSummary.summary, /RPE/i);
});

test("objective summary marks skipped tracked top sets as compliance drop", () => {
  const objectiveSummary = buildTrainingCheckInObjectiveSummary({
    plan: createPlan(3),
    completedDays: ["1-1", "1-2"],
    prompt: {
      type: "weekly",
      weekNumber: 1,
      weeksInScope: [1],
    },
    trainingPerformanceState: {
      history: [
        createTrackedTopSet({
          sessionKey: "1-1",
          weekNumber: 1,
          dayNumber: 1,
          loadKg: 120,
          reps: 5,
          rpe: 8,
        }),
      ],
    },
  });

  assert.equal(objectiveSummary.topSetCompletionRate, 50);
  assert.equal(objectiveSummary.skippedTopSetCount, 1);
  assert.equal(objectiveSummary.complianceTrend, "dropping");
});

test("weekly flat trend with no extra flags recommends a micro-adjust first", () => {
  const prompt = {
    type: "weekly",
    weekNumber: 1,
    title: "Weekly check-in",
    summary: "",
    weeksInScope: [1],
    objectiveSummary: {
      performanceTrend: "flat",
      strengthTrend: "flat",
      complianceTrend: "strong",
      rpeDriftTrend: "on_target",
    },
  };
  const recommendation = buildTrainingCheckInRecommendation({
    prompt,
    questionnaire: { loadingStrategy: "flat_loading" },
    plan: createPlan(3),
    completedDays: ["1-1", "1-2"],
    answers: {
      progress: "flat",
      fatigue: "normal",
      enjoyment: "ok",
      pain: "none",
    },
    objectiveSummary: prompt.objectiveSummary,
  });

  assert.equal(recommendation.recommendedAction.type, "micro_adjust");
});

test("end-of-block flat trend with boredom can recommend a scheme change", () => {
  const prompt = {
    type: "end_of_block",
    weekNumber: 4,
    title: "End-of-block check-in",
    summary: "",
    weeksInScope: [1, 2, 3, 4],
    objectiveSummary: {
      performanceTrend: "flat",
      strengthTrend: "flat",
      complianceTrend: "strong",
      rpeDriftTrend: "on_target",
    },
  };
  const recommendation = buildTrainingCheckInRecommendation({
    prompt,
    questionnaire: { loadingStrategy: "flat_loading" },
    plan: createPlan(5),
    completedDays: [
      "1-1", "1-2",
      "2-1", "2-2",
      "3-1", "3-2",
      "4-1", "4-2",
    ],
    answers: {
      progress: "flat",
      fatigue: "normal",
      enjoyment: "bored",
      pain: "none",
    },
    objectiveSummary: prompt.objectiveSummary,
  });

  assert.equal(recommendation.recommendedAction.type, "change_scheme");
});

test("missed reps freeze progression before scheme changes", () => {
  const prompt = {
    type: "end_of_block",
    weekNumber: 4,
    title: "End-of-block check-in",
    summary: "",
    weeksInScope: [4],
    objectiveSummary: {
      performanceTrend: "flat",
      strengthTrend: "flat",
      complianceTrend: "strong",
      missedRepCount: 1,
      repeatedMissedRepCount: 1,
    },
  };
  const recommendation = buildTrainingCheckInRecommendation({
    prompt,
    questionnaire: { loadingStrategy: "flat_loading" },
    plan: createPlan(5),
    completedDays: [
      "1-1", "1-2",
      "2-1", "2-2",
      "3-1", "3-2",
      "4-1", "4-2",
    ],
    answers: {
      progress: "flat",
      fatigue: "normal",
      enjoyment: "bored",
      pain: "none",
    },
    objectiveSummary: prompt.objectiveSummary,
  });

  assert.equal(recommendation.recommendedAction.type, "freeze_progression");
  assert.equal(recommendation.allowSchemeChange, false);
});

test("deload action reduces the next week's volume", () => {
  const adjustment = applyTrainingCheckInAction({
    plan: createPlan(3),
    completedDays: ["1-1", "1-2"],
    action: {
      type: "deload",
      label: "Deload 1 week",
    },
  });

  const updatedPrimaryLift =
    adjustment.plan.weeks[1].days[0].exercises[0];

  assert.equal(updatedPrimaryLift.percentagePrescription.workingSets[0].count, 2);
  assert.match(updatedPrimaryLift.notes, /Deload week/i);
});

test("scheme change action rewrites the next week's loading strategy", () => {
  const adjustment = applyTrainingCheckInAction({
    plan: createPlan(3, "flat_loading"),
    completedDays: ["1-1", "1-2"],
    action: {
      type: "change_scheme",
      label: "Switch to ascending pyramid",
      targetLoadingStrategy: "ascending_pyramid",
    },
  });

  const updatedPrimaryLift =
    adjustment.plan.weeks[1].days[0].exercises[0];

  assert.equal(
    updatedPrimaryLift.percentagePrescription.loadingStrategy,
    "ascending_pyramid"
  );
  assert.equal(updatedPrimaryLift.percentagePrescription.workingSets.length, 3);
});

test("missed rep plan adjustment lowers the next matching percentage exposure", () => {
  const plan = createPlan(3);
  const adjustment = applyMissedRepPlanAdjustment({
    plan,
    completedDays: [],
    sessionKey: "1-1",
    questionnaire: { liftIntensityMethod: "percentage" },
    entries: [
      {
        missedRep: true,
        missedRepReason: "too_heavy",
        liftName: "Back Squat",
        missedRepRecommendation: {
          planAdjustment: {
            type: "reduce_load",
            loadReductionPercent: 5,
          },
        },
      },
    ],
  });

  const nextExposure = adjustment.plan.weeks[0].days[1].exercises[0];

  assert.equal(
    nextExposure.percentagePrescription.workingSets[0].percent1RM,
    70
  );
  assert.match(nextExposure.notes, /Missed-rep adjustment/i);
});
