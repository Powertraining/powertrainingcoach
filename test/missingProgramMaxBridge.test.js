import test from "node:test";
import assert from "node:assert/strict";

import {
  applyMissingProgramMaxBridges,
  applyProgramMaxToFutureExposures,
} from "../src/services/utils/missingProgramMaxBridge.js";

test("percentage RPE plans repair missing Week 1 assessment metadata", () => {
  const plan = applyMissingProgramMaxBridges({
    weeks: [{
      week: 1,
      days: [{
        day: 1,
        exercises: [
          {
            name: "Trap Bar Deadlift",
            notes: "3-5 reps at RPE 8.",
            percentagePrescription: {
              referenceLiftName: "Trap Bar Deadlift",
              workingSets: [{ count: 3, reps: 5, percent1RM: 75 }],
            },
          },
          { name: "Biceps Curl", notes: "8 reps at RPE 8." },
        ],
      }],
    }],
  }, {
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "rpe_based_1rm",
    strengthAssessmentSummary: { latestByLift: [] },
  });

  assert.equal(
    plan.weeks[0].days[0].exercises[0].strengthAssessment.method,
    "rpe_based_1rm"
  );
  assert.equal(plan.weeks[0].days[0].exercises[0].sets, "1");
  assert.equal(plan.weeks[0].days[0].exercises[0].reps, "3-5");
  assert.equal(plan.weeks[0].days[0].exercises[0].strengthAssessment.minimumRpe, 8);
  assert.equal(plan.weeks[0].days[0].exercises[1].strengthAssessment, undefined);
});

test("missing lifts stay RPE-based in later weeks until a Program Max is saved", () => {
  const plan = applyMissingProgramMaxBridges({
    weeks: [1, 2].map((week) => ({
      week,
      days: [{
        day: 1,
        exercises: [{
          name: "Back Squat",
          notes: "Controlled working sets.",
          percentagePrescription: {
            referenceLiftName: "Back Squat",
            workingSets: [{ count: 3, reps: 5, percent1RM: 75 }],
          },
        }],
      }],
    })),
  }, {
    liftIntensityMethod: "percentage",
    strengthAssessmentSummary: { latestByLift: [] },
  });
  const weekOneExercise = plan.weeks[0].days[0].exercises[0];
  const weekTwoExercise = plan.weeks[1].days[0].exercises[0];

  assert.equal(weekOneExercise.strengthAssessment.method, "rpe_based_1rm");
  assert.equal(weekOneExercise.percentagePrescription, null);
  assert.equal(weekTwoExercise.strengthAssessment, undefined);
  assert.equal(weekTwoExercise.percentagePrescription, undefined);
  assert.match(weekTwoExercise.notes, /RPE 8-10/i);
});

test("known Program Maxes and non-percentage plans are not bridged", () => {
  const sourcePlan = {
    weeks: [{
      week: 1,
      days: [{ day: 1, exercises: [{
        name: "Back Squat",
        notes: "RPE 8",
        percentagePrescription: {
          referenceLiftName: "Back Squat",
          workingSets: [{ count: 3, reps: 5, percent1RM: 75 }],
        },
      }] }],
    }],
  };
  const knownMaxPlan = applyMissingProgramMaxBridges(sourcePlan, {
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "rpe_based_1rm",
    strengthAssessmentSummary: {
      latestByLift: [{ liftName: "Back Squat", trainingMaxKg: 120 }],
    },
  });

  assert.equal(
    knownMaxPlan.weeks[0].days[0].exercises[0].strengthAssessment,
    undefined
  );
  assert.equal(
    knownMaxPlan.weeks[0].days[0].exercises[0].percentagePrescription
      .referenceLiftName,
    "Back Squat"
  );
  assert.equal(applyMissingProgramMaxBridges(sourcePlan, {
    liftIntensityMethod: "rpe",
  }), sourcePlan);
});

test("missing Program Max bridge always uses the RPE-based estimate regardless of percentageReferenceMethod", () => {
  for (const percentageReferenceMethod of ["true_1rm", "multi_rm", "rpe_based_1rm"]) {
    const plan = applyMissingProgramMaxBridges({
      weeks: [{
        week: 1,
        days: [{
          day: 1,
          exercises: [{
            name: "Back Squat",
            sets: "3",
            reps: "5",
            notes: "Controlled working sets.",
            percentagePrescription: {
              referenceLiftName: "Back Squat",
              loadingStrategy: "flat_loading",
              workingSets: [{ count: 3, reps: 5, percent1RM: 75 }],
            },
          }],
        }],
      }],
    }, {
      liftIntensityMethod: "percentage",
      percentageReferenceMethod,
      strengthAssessmentSummary: { latestByLift: [] },
    });
    const exercise = plan.weeks[0].days[0].exercises[0];

    assert.equal(exercise.strengthAssessment.method, "rpe_based_1rm");
    assert.equal(exercise.percentagePrescription, null);
    assert.match(exercise.notes, /RPE 8-10.*target 8/i);
  }
});

test("saved Program Max activates percentage loading on future lift exposures", () => {
  const plan = applyProgramMaxToFutureExposures({
    weeks: [
      {
        week: 1,
        days: [{
          day: 1,
          exercises: [{
            name: "Back Squat",
            sets: "3",
            reps: "5",
            notes: "Use RPE 8.",
            strengthAssessment: { method: "rpe_based_1rm", liftName: "Back Squat" },
          }],
        }],
      },
      {
        week: 2,
        days: [{
          day: 1,
          exercises: [{
            name: "Back Squat",
            sets: "4",
            reps: "5",
            notes: "Use RPE 8.",
          }],
        }],
      },
    ],
  }, {
    liftName: "Back Squat",
    afterWeekNumber: 1,
    afterDayNumber: 1,
    loadingStrategy: "ascending_pyramid",
  });
  const assessmentExercise = plan.weeks[0].days[0].exercises[0];
  const futureExercise = plan.weeks[1].days[0].exercises[0];

  assert.equal(assessmentExercise.percentagePrescription, undefined);
  assert.equal(futureExercise.strengthAssessment, undefined);
  assert.equal(futureExercise.percentagePrescription.loadingStrategy, "ascending_pyramid");
  assert.equal(futureExercise.percentagePrescription.workingSets.length, 4);
});

test("a Week 1 estimate stays RPE-based for the rest of Week 1", () => {
  const plan = applyProgramMaxToFutureExposures({
    weeks: [{
      week: 1,
      days: [1, 2].map((day) => ({
        day,
        exercises: [{
          name: "Back Squat",
          sets: "1",
          reps: "3-5",
          strengthAssessment: { method: "rpe_based_1rm", liftName: "Back Squat" },
        }],
      })),
    }, {
      week: 2,
      days: [{ day: 1, exercises: [{ name: "Back Squat", sets: "3", reps: "5" }] }],
    }],
  }, {
    liftName: "Back Squat",
    afterWeekNumber: 1,
    afterDayNumber: Number.MAX_SAFE_INTEGER,
  });

  assert.ok(plan.weeks[0].days[1].exercises[0].strengthAssessment);
  assert.equal(plan.weeks[0].days[1].exercises[0].percentagePrescription, undefined);
  assert.ok(plan.weeks[1].days[0].exercises[0].percentagePrescription);
});

test("a manual Program Max activates percentage loading from Week 1", () => {
  const plan = applyProgramMaxToFutureExposures({
    weeks: [{
      week: 1,
      days: [{
        day: 1,
        exercises: [{
          name: "Back Squat",
          sets: "3",
          reps: "5",
          notes: "Controlled working sets. Use RPE 7-9 (target 8).",
          strengthAssessment: {
            method: "rpe_based_1rm",
            liftName: "Back Squat",
          },
        }],
      }],
    }],
  }, {
    liftName: "Back Squat",
    afterWeekNumber: 0,
    afterDayNumber: 0,
  });
  const exercise = plan.weeks[0].days[0].exercises[0];

  assert.equal(exercise.strengthAssessment, undefined);
  assert.ok(exercise.percentagePrescription);
  assert.doesNotMatch(exercise.notes, /Use RPE 7-9/i);
});
