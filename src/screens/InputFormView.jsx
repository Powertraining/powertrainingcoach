// npx expo install @react-native-picker/picker

import {
  useEffect,
  useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import QuestionnaireBottomActionButton from "../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import TrainingPreferencesFields, {
    CONFIDENCE_STEP_KEYS,
    getTrainingPreferencesSectionCount,
    getTrainingPreferencesStepKey,
} from "./TrainingPreferencesFields.jsx";

import {
    getTrainingPreferencesFormState,
    normalizeTrainingPreferences,
} from "../constants/trainingPreferences.js";
import { useAndroidBackHandler } from "../services/utils/useAndroidBackHandler.js";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";

function getEventDescription(value = "") {
    const match = /Description:\s*([^;]+)/i.exec(String(value));
    return match ? match[1].trim() : "";
}

function hasInitialValue(source, key) {
    return Object.prototype.hasOwnProperty.call(source ?? {}, key);
}

function getNullableInitialValue(source, formState, key) {
    return hasInitialValue(source, key) ? formState[key] : null;
}

const CONFIDENCE_STEP_KEY_VALUES = new Set(Object.values(CONFIDENCE_STEP_KEYS));

export default function InputFormView({
    onSubmit,
    onBack,
    useApi,
    onToggleUseApi,
    hasApiKey,
    subscription,
    daysRemaining,
    initialValues = {},
    initialActiveStep = 0,
    onActiveStepChange,
    onDraftChange,
    onClose,
}) {
    const [trainingPreferences, setTrainingPreferences] = useState(() => {
        const formState = getTrainingPreferencesFormState(initialValues);

        return {
            ...formState,
            experience: getNullableInitialValue(initialValues, formState, "experience"),
            desiredTraining: getNullableInitialValue(initialValues, formState, "desiredTraining"),
            preferredEnduranceModalities: hasInitialValue(
                initialValues,
                "preferredEnduranceModalities"
            )
                ? formState.preferredEnduranceModalities
                : [],
            enduranceSessionsPerWeek: getNullableInitialValue(
                initialValues,
                formState,
                "enduranceSessionsPerWeek"
            ) ?? 1,
            preferredEnduranceFormat: getNullableInitialValue(
                initialValues,
                formState,
                "preferredEnduranceFormat"
            ),
            sessionDuration: getNullableInitialValue(
                initialValues,
                formState,
                "sessionDuration"
            ) ?? "15_min",
            equipment: getNullableInitialValue(initialValues, formState, "equipment"),
            trainingPhase: getNullableInitialValue(initialValues, formState, "trainingPhase"),
            combatTrainingIntensity: getNullableInitialValue(
                initialValues,
                formState,
                "combatTrainingIntensity"
            ) ?? "light",
            liftIntensityMethod: getNullableInitialValue(
                initialValues,
                formState,
                "liftIntensityMethod"
            ),
            percentageReferenceMethod: getNullableInitialValue(
                initialValues,
                formState,
                "percentageReferenceMethod"
            ),
            deloadStrategy: getNullableInitialValue(initialValues, formState, "deloadStrategy"),
            loadingStrategy:
                getNullableInitialValue(initialValues, formState, "loadingStrategy") ??
                formState.loadingStrategy,
            trainingCapabilities: {
                ...formState.trainingCapabilities,
                compoundLifts: initialValues?.trainingCapabilities?.compoundLifts ?? null,
                singleLegLifts: initialValues?.trainingCapabilities?.singleLegLifts ?? null,
                pullingWork: initialValues?.trainingCapabilities?.pullingWork ?? null,
                olympicLiftVariations: initialValues?.trainingCapabilities?.olympicLiftVariations ?? null,
                plyometrics: initialValues?.trainingCapabilities?.plyometrics ?? null,
                ballisticTraining: initialValues?.trainingCapabilities?.ballisticTraining ?? null,
                runningSprinting: initialValues?.trainingCapabilities?.runningSprinting ?? null,
                bikeRowerAssaultBike: initialValues?.trainingCapabilities?.bikeRowerAssaultBike ?? null,
                circuitTraining: initialValues?.trainingCapabilities?.circuitTraining ?? null,
                heavyBag: initialValues?.trainingCapabilities?.heavyBag ?? null,
            },
        };
    });
    const [activeStep, setActiveStep] = useState(initialActiveStep);
    const [isEventDescriptionEditorOpen, setIsEventDescriptionEditorOpen] = useState(false);
    const [isEnduranceMethodsInfoOpen, setIsEnduranceMethodsInfoOpen] = useState(false);
    const sectionCount = getTrainingPreferencesSectionCount(trainingPreferences);
    const activeStepKey = getTrainingPreferencesStepKey(trainingPreferences, activeStep);
    const activeConfidenceKey = CONFIDENCE_STEP_KEY_VALUES.has(activeStepKey)
        ? activeStepKey
        : "";
    const confidenceStepSelected = Boolean(
        activeConfidenceKey &&
        trainingPreferences.trainingCapabilities?.[activeConfidenceKey]
    );
    const isDesiredTrainingStep = activeStepKey === "desiredTraining";
    const desiredTrainingStepSelected = Boolean(trainingPreferences.desiredTraining);
    const isTrainingPhaseStep = activeStepKey === "trainingPhase";
    const trainingPhaseStepSelected = Boolean(trainingPreferences.trainingPhase);
    const isEventDescriptionStep = activeStepKey === "eventDescription";
    const isInjuriesStep = activeStepKey === "injuries";
    const isEnduranceCircuitGoalStep = activeStepKey === "enduranceCircuitGoal";
    const isEnduranceStyleStep = activeStepKey === "enduranceStyle";
    const enduranceStyleStepSelected = Boolean(trainingPreferences.preferredEnduranceFormat);
    const isEnduranceSprintingFocusStep = activeStepKey === "enduranceSprintingFocus";
    const enduranceSprintingFocusStepSelected = Boolean(trainingPreferences.sprintingTarget);
    const isEquipmentStep = activeStepKey === "equipment";
    const equipmentStepSelected = Boolean(trainingPreferences.equipment);
    const isCombatTrainingIntensityStep =
        activeStepKey === "combatTrainingIntensity";
    const isLiftIntensityMethodStep = activeStepKey === "liftIntensityMethod";
    const isPercentageReferenceMethodStep = activeStepKey === "percentageReferenceMethod";
    const isDeloadStrategyStep = activeStepKey === "deloadStrategy";
    const liftIntensityMethodStepSelected = Boolean(trainingPreferences.liftIntensityMethod);
    const percentageReferenceMethodStepSelected = Boolean(
        trainingPreferences.percentageReferenceMethod
    );
    const deloadStrategyStepSelected = Boolean(trainingPreferences.deloadStrategy);
    const eventDescriptionStepSelected = Boolean(
        getEventDescription(trainingPreferences.eventPreparation)
    );
    const requiresSelection =
        Boolean(activeConfidenceKey) ||
        isDesiredTrainingStep ||
        isTrainingPhaseStep ||
        isEventDescriptionStep ||
        isLiftIntensityMethodStep ||
        isPercentageReferenceMethodStep ||
        isDeloadStrategyStep;
    const canContinue =
        activeConfidenceKey ? confidenceStepSelected :
            isDesiredTrainingStep ? desiredTrainingStepSelected :
                isTrainingPhaseStep ? trainingPhaseStepSelected :
                    isEventDescriptionStep ? eventDescriptionStepSelected :
                        isLiftIntensityMethodStep ? liftIntensityMethodStepSelected :
                            isPercentageReferenceMethodStep ? percentageReferenceMethodStepSelected :
                                isDeloadStrategyStep ? deloadStrategyStepSelected :
                                    undefined;

    useEffect(() => {
        setActiveStep((currentStep) =>
            currentStep === initialActiveStep ? currentStep : initialActiveStep
        );
        setIsEnduranceMethodsInfoOpen(false);
    }, [initialActiveStep]);

    useEffect(() => {
        onDraftChange?.(trainingPreferences);
    }, [trainingPreferences, onDraftChange]);

    useEffect(() => {
        onActiveStepChange?.(activeStep);
    }, [activeStep, onActiveStepChange]);

    useEffect(() => {
        const maxStep = Math.max(sectionCount - 1, 0);

        setActiveStep((currentStep) =>
            currentStep > maxStep ? maxStep : currentStep
        );
    }, [sectionCount]);

    function updateTrainingPreferences(nextPreferencesOrUpdater) {
        setTrainingPreferences((currentPreferences) => {
            const nextPreferences =
                typeof nextPreferencesOrUpdater === "function"
                    ? nextPreferencesOrUpdater(currentPreferences)
                    : nextPreferencesOrUpdater;

            return nextPreferences;
        });
    }

    function updateActiveStep(nextStepOrUpdater) {
        setActiveStep((currentStep) => {
            const nextStep =
                typeof nextStepOrUpdater === "function"
                    ? nextStepOrUpdater(currentStep)
                    : nextStepOrUpdater;

            return nextStep;
        });
    }

    function handleSubmit() {
        onSubmit(normalizeTrainingPreferences(trainingPreferences));
    }

    function handleContinue() {
        setIsEventDescriptionEditorOpen(false);
        setIsEnduranceMethodsInfoOpen(false);

        if (activeStep >= sectionCount - 1) {
            handleSubmit();
            return;
        }

        updateActiveStep((currentStep) => currentStep + 1);
    }

    function handleStepBack() {
        setIsEventDescriptionEditorOpen(false);
        setIsEnduranceMethodsInfoOpen(false);

        if (activeStep === 0) {
            onBack?.();
            return;
        }

        updateActiveStep((currentStep) => currentStep - 1);
    }

    useAndroidBackHandler(handleStepBack, [
        activeStep,
        isEventDescriptionEditorOpen,
        isEnduranceMethodsInfoOpen,
        onBack,
        sectionCount,
    ]);

    function handleEventDescriptionSkip() {
        setIsEventDescriptionEditorOpen(false);
        updateActiveStep((currentStep) => Math.min(currentStep + 2, sectionCount - 1));
    }

    function handleInjuriesSkip() {
        updateTrainingPreferences((currentPreferences) => ({
            ...currentPreferences,
            injuriesInput: "",
        }));
        handleContinue();
    }

    function handleEnduranceCircuitGoalSkip() {
        updateTrainingPreferences((currentPreferences) => ({
            ...currentPreferences,
            circuitTrainingGoalInput: "",
        }));
        handleContinue();
    }

    return (
        <QuestionnaireShell
            onClose={onClose}
            topBackgroundColor={
                isInjuriesStep || isEnduranceCircuitGoalStep ? "#141414" : null
            }
        >
            {isEventDescriptionEditorOpen ? (
                <View pointerEvents="none" style={styles.eventEditorDimLayer} />
            ) : null}
            <View
                style={[
                    styles.center,
                    isEnduranceStyleStep ||
                    isEnduranceCircuitGoalStep ||
                    isLiftIntensityMethodStep ||
                    isPercentageReferenceMethodStep ||
                    isDeloadStrategyStep
                        ? styles.centerFullHeight
                        : null,
                    isCombatTrainingIntensityStep
                        ? styles.centerCombatTrainingIntensity
                        : null,
                    isEventDescriptionEditorOpen ? styles.centerAboveDimLayer : null,
                ]}
            >
                <View style={styles.card}>
                    <View style={styles.form}>
                        {/* {!subscription && (
                            <View style={styles.subscriptionAlert}>
                                <IBMPlexText style={styles.alertText}>📋 Subscription Required{"\n"}You need an active subscription to generate training plans.</IBMPlexText>
                                <TouchableOpacity onPress={handleSubmit} style={styles.subscribeButton}>
                                    <IBMPlexText style={styles.subscribeButtonText}>Subscribe & Generate</IBMPlexText>
                                </TouchableOpacity>
                            </View>
                        )}

                        {subscription && (
                            <View style={styles.subscriptionActive}>
                                <IBMPlexText style={styles.activeText}>✅ Subscription Active ({daysRemaining} days remaining)</IBMPlexText>
                            </View>
                        )} */}

                        <TrainingPreferencesFields
                            values={trainingPreferences}
                            onChange={updateTrainingPreferences}
                            appLogicTitle="App Logic Settings"
                            appLogicDescription="Choose the strength-planning logic you want the app to use for this athlete profile."
                            activeStep={activeStep}
                            onEventDescriptionSkip={handleEventDescriptionSkip}
                            onEventDescriptionEditorChange={setIsEventDescriptionEditorOpen}
                            onEnduranceMethodsInfoVisibilityChange={setIsEnduranceMethodsInfoOpen}
                            onEnduranceCircuitGoalContinue={handleContinue}
                            onEnduranceCircuitGoalSkip={handleEnduranceCircuitGoalSkip}
                            onInjuriesContinue={handleContinue}
                            onInjuriesSkip={handleInjuriesSkip}
                        />

                    </View>
                </View>
            </View>
            {!isEventDescriptionEditorOpen && !isEnduranceMethodsInfoOpen && !isInjuriesStep && !isEnduranceCircuitGoalStep ? (
                <QuestionnaireBottomActionButton
                    layout={requiresSelection ? "single" : "stacked"}
                    canContinue={canContinue}
                    hideBack
                    text={activeStep >= sectionCount - 1
                        ? (subscription ? "Generate Plan" : "Subscribe & Generate Plan")
                        : (
                            (isEnduranceStyleStep && !enduranceStyleStepSelected) ||
                            (isEnduranceSprintingFocusStep && !enduranceSprintingFocusStepSelected) ||
                            (isEquipmentStep && !equipmentStepSelected)
                        )
                            ? "Skip"
                        : "Continue"}
                    onContinue={handleContinue}
                    onBack={handleStepBack}
                />
            ) : null}
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        paddingBottom: 120,
    },
    centerFullHeight: {
        paddingBottom: 0,
    },
    centerCombatTrainingIntensity: {
        justifyContent: "flex-start",
        paddingBottom: 0,
    },
    centerAboveDimLayer: {
        position: "relative",
        zIndex: 2,
    },
    card: {
        width: "100%",
        padding: 0,
        borderRadius: 0,
        borderWidth: 0,
        gap: 14,
    },
    header: { gap: 6 },
    title: { fontSize: 30, fontWeight: "700" },
    subtitle: { fontSize: 17, opacity: 0.8, lineHeight: 25 },
    form: { gap: 14, marginTop: 4 },
    eventEditorDimLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.48)",
        zIndex: 1,
    },
    subscriptionAlert: {
        padding: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#ef4444",
        backgroundColor: "#fee2e2",
        gap: 12,
    },
    alertText: { fontSize: 14, color: "#991b1b", lineHeight: 22 },
    subscribeButton: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
        alignSelf: "flex-start",
    },
    subscribeButtonText: { color: "white", fontWeight: "600", fontSize: 14 },
    subscriptionActive: {
        padding: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#10b981",
        backgroundColor: "#ecfdf5",
    },
    activeText: { fontSize: 14, color: "#065f46", lineHeight: 22 },
    actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, gap: 12, flexWrap: "wrap" },
});
