import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { persistModelImmediately } from "../../src/services/models/firebaseModel.js";
import ProgramMaxSetupFlowView from "../../src/screens/ProgramMaxSetupFlowView.jsx";
import { getClosestActiveTrainingDay } from "../../src/services/utils/trainingPlan.js";
import { getParamValue } from "../../src/services/utils/navigation.js";
import {
  getRequiredProgramMaxLifts,
  shouldRequireProgramMaxSetup,
} from "../../src/services/utils/strengthAssessment.js";

const DEVELOPER_PREVIEW_LIFTS = Object.freeze([
  { liftKey: "back_squat", liftName: "Back Squat", programMaxKg: null },
  { liftKey: "bench_press", liftName: "Bench Press", programMaxKg: null },
  { liftKey: "trap_bar_deadlift", liftName: "Trap-Bar Deadlift", programMaxKg: null },
  { liftKey: "overhead_press", liftName: "Overhead Press", programMaxKg: null },
]);

const ProgramMaxSetupScreen = observer(function ProgramMaxSetupScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const developerPreview =
    __DEV__ && getParamValue(params.developerPreview) === "1";
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const strengthAssessmentSummary = useMemo(
    () => model.getStrengthAssessmentSummary?.() || { latestByLift: [] },
    [model, model.strengthAssessmentState]
  );
  const planRequiredLifts = useMemo(
    () => getRequiredProgramMaxLifts(model.trainingPlan, strengthAssessmentSummary),
    [model.trainingPlan, strengthAssessmentSummary]
  );
  const requiredLifts = developerPreview
    ? DEVELOPER_PREVIEW_LIFTS
    : planRequiredLifts;
  const requiresSetup = shouldRequireProgramMaxSetup({
    plan: model.trainingPlan,
    liftIntensityMethod: model.questionnaire?.liftIntensityMethod,
    strengthAssessmentSummary,
    completedDays: model.completedDays,
  });

  useEffect(() => {
    if (!model.ready || developerPreview || requiresSetup) {
      return;
    }

    router.replace(model.trainingPlan ? "/(tabs)/overview" : "/(tabs)");
  }, [developerPreview, model.ready, model.trainingPlan, requiresSetup, router]);

  async function handleComplete(payload) {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (developerPreview) {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/(tabs)/overview");
        }
        return;
      }

      await Promise.resolve(model.saveProgramMaxSetup?.(payload));
      await persistModelImmediately(model);
      const currentTrainingDay =
        getClosestActiveTrainingDay(model.trainingPlan, model.completedDays) ||
        model.getCurrentTrainingDay?.(model.completedDays);
      const weekNumber = Number.parseInt(currentTrainingDay?.week, 10);
      const dayNumber = Number.parseInt(currentTrainingDay?.day, 10);

      if (Number.isFinite(weekNumber) && Number.isFinite(dayNumber)) {
        router.replace({
          pathname: "/(tabs)/overview",
          params: { week: String(weekNumber), day: String(dayNumber) },
        });
        return;
      }

      router.replace("/(tabs)/overview");
    } catch (error) {
      setErrorMessage(
        error?.message || "Could not save your Program Max setup. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)/overview");
  }

  if (
    !model.ready ||
    (!developerPreview && !requiresSetup) ||
    requiredLifts.length === 0
  ) {
    return null;
  }

  return (
    <ProgramMaxSetupFlowView
      onBack={handleBack}
      onComplete={handleComplete}
      developerPreview={developerPreview}
      errorMessage={errorMessage}
      requiredLifts={requiredLifts}
      submitting={submitting}
      unitSystem={model.unitSystem}
    />
  );
});

export default ProgramMaxSetupScreen;
