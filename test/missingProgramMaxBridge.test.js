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
          { name: "Trap Bar Deadlift", notes: "3-5 reps at RPE 8." },
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
  assert.equal(plan.weeks[0].days[0].exercises[1].strengthAssessment, undefined);
});

test("known Program Maxes and non-percentage plans are not bridged", () => {
  const sourcePlan = {
    weeks: [{
      week: 1,
      days: [{ day: 1, exercises: [{ name: "Back Squat", notes: "RPE 8" }] }],
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

test("missing Program Max bridge applies to every percentage reference method", () => {
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
      programMaxSetup: "auto_estimate",
      strengthAssessmentSummary: { latestByLift: [] },
    });
    const exercise = plan.weeks[0].days[0].exercises[0];

    assert.equal(exercise.strengthAssessment.method, "rpe_based_1rm");
    assert.equal(exercise.percentagePrescription, null);
    assert.match(exercise.notes, /RPE 7-9.*target 8/i);
  }
});

test("calibration week honors the selected max-test method", () => {
  const plan = applyMissingProgramMaxBridges({
    weeks: [{
      week: 1,
      days: [{ day: 1, exercises: [{ name: "Bench Press", sets: "3", reps: "3" }] }],
    }],
  }, {
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "multi_rm",
    programMaxSetup: "calibration_week",
  });

  assert.equal(
    plan.weeks[0].days[0].exercises[0].strengthAssessment.method,
    "multi_rm"
  );
});

test("calibration week keeps true 1RM testing within safety limits", () => {
  const plan = applyMissingProgramMaxBridges({
    weeks: [{
      week: 1,
      days: [{
        day: 1,
        exercises: [
          { name: "Back Squat", sets: "1", reps: "1" },
          { name: "Bench Press", sets: "1", reps: "1" },
        ],
      }],
    }],
  }, {
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "true_1rm",
    programMaxSetup: "calibration_week",
    experience: "intermediate",
  });
  const exercises = plan.weeks[0].days[0].exercises;

  assert.equal(exercises[0].strengthAssessment.method, "true_1rm");
  assert.equal(exercises[1].strengthAssessment.method, "multi_rm");

  const beginnerPlan = applyMissingProgramMaxBridges({
    weeks: [{
      week: 1,
      days: [{ day: 1, exercises: [{ name: "Back Squat", sets: "1", reps: "1" }] }],
    }],
  }, {
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "true_1rm",
    programMaxSetup: "calibration_week",
    experience: "beginner",
  });

  assert.equal(
    beginnerPlan.weeks[0].days[0].exercises[0].strengthAssessment.method,
    "multi_rm"
  );
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
