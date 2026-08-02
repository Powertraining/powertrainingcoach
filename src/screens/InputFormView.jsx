// npx expo install @react-native-picker/picker

import {
  useEffect,
  useState } from "react";
import { ScrollView, View, TouchableOpacity, StyleSheet } from "react-native";
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
import { PREFERRED_MAX_TEST_METHOD_OPTIONS } from "../constants/appLogicSettings.js";
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
    onDesiredTrainingContinue,
    onBackToFrequency,
    unitSystem = "metric",
}) {
    const [trainingPreferences, setTrainingPreferences] = useState(() => {
        const formState = getTrainingPreferencesFormState(initialValues);

        return {
            ...formState,
            experience: getNullableInitialValue(initialValues, formState, "experience"),
            desiredTraining: getNullableInitialValue(initialValues, formState, "desiredTraining"),
            hybridSessionStructure: getNullableInitialValue(
                initialValues,
                formState,
                "hybridSessionStructure"
            ),
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
            percentageReferenceMethod: (() => {
                const initialMethod = getNullableInitialValue(
                    initialValues,
                    formState,
                    "percentageReferenceMethod"
                );

                return PREFERRED_MAX_TEST_METHOD_OPTIONS.some(
                    (option) => option.value === initialMethod
                )
                    ? initialMethod
                    : null;
            })(),
            deloadStrategy: getNullableInitialValue(initialValues, formState, "deloadStrategy"),
            loadingStrategy:
                getNullableInitialValue(initialValues, formState, "loadingStrategy") ??
                formState.loadingStrategy,
            trainingCapabilities: {
                ...formState.trainingCapabilities,
                compoundLifts: initialValues?.trainingCapabilities?.compoundLifts ?? null,
                singleLegLifts:
                    initialValues?.trainingCapabilities?.singleLegLifts ??
                    formState.trainingCapabilities.singleLegLifts,
                pullingWork: initialValues?.trainingCapabilities?.pullingWork ?? null,
                olympicLiftVariations: initialValues?.trainingCapabilities?.olympicLiftVariations ?? null,
                plyometrics: initialValues?.trainingCapabilities?.plyometrics ?? null,
                ballisticTraining:
                    initialValues?.trainingCapabilities?.ballisticTraining ??
                    formState.trainingCapabilities.ballisticTraining,
                runningSprinting:
                    initialValues?.trainingCapabilities?.runningSprinting ??
                    formState.trainingCapabilities.runningSprinting,
                bikeRowerAssaultBike:
                    initialValues?.trainingCapabilities?.bikeRowerAssaultBike ??
                    formState.trainingCapabilities.bikeRowerAssaultBike,
                circuitTraining:
                    initialValues?.trainingCapabilities?.circuitTraining ??
                    formState.trainingCapabilities.circuitTraining,
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
    const isHybridSessionStructureStep = activeStepKey === "hybridSessionStructure";
    const hybridSessionStructureStepSelected = Boolean(
        trainingPreferences.hybridSessionStructure
    );
    const isTrainingPhaseStep = activeStepKey === "trainingPhase";
    const trainingPhaseStepSelected = Boolean(trainingPreferences.trainingPhase);
    const isEventDescriptionStep = activeStepKey === "eventDescription";
    const isInjuriesStep = activeStepKey === "injuries";
    const isEnduranceCircuitFocusStep = activeStepKey === "enduranceCircuitFocus";
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
    const isLoadingStrategyStep = activeStepKey === "loadingStrategy";
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
        isHybridSessionStructureStep ||
        isTrainingPhaseStep ||
        isEventDescriptionStep ||
        isLiftIntensityMethodStep ||
        isPercentageReferenceMethodStep ||
        isDeloadStrategyStep;
    const canContinue =
        activeConfidenceKey ? confidenceStepSelected :
            isDesiredTrainingStep ? desiredTrainingStepSelected :
                isHybridSessionStructureStep ? hybridSessionStructureStepSelected :
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

        if (
            isDesiredTrainingStep &&
            trainingPreferences.desiredTraining === "strength_power_endurance"
        ) {
            updateActiveStep((currentStep) => currentStep + 1);
            return;
        }

        if (
            (isDesiredTrainingStep || isHybridSessionStructureStep) &&
            onDesiredTrainingContinue
        ) {
            const nextStep = activeStep + 1;
            onActiveStepChange?.(nextStep);
            onDesiredTrainingContinue(nextStep);
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

        const firstStepAfterFrequency =
            trainingPreferences.desiredTraining === "strength_power_endurance" ? 3 : 2;

        if (activeStep === firstStepAfterFrequency && onBackToFrequency) {
            onBackToFrequency(activeStep);
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

    return (
        <QuestionnaireShell
            onClose={onClose}
            topBackgroundColor={
                isInjuriesStep || isEnduranceCircuitFocusStep ? "#141414" : null
            }
        >
            {isEventDescriptionEditorOpen ? (
                <View pointerEvents="none" style={styles.eventEditorDimLayer} />
            ) : null}
            <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={[
                    styles.center,
                    isEnduranceStyleStep ||
                    isEnduranceSprintingFocusStep ||
                    isEnduranceCircuitFocusStep ||
                    isLiftIntensityMethodStep ||
                    isPercentageReferenceMethodStep ||
                    isDeloadStrategyStep ||
                    isLoadingStrategyStep
                        ? styles.centerFullHeight
                        : null,
                    isCombatTrainingIntensityStep
                        ? styles.centerCombatTrainingIntensity
                        : null,
                    isEventDescriptionEditorOpen ? styles.centerAboveDimLayer : null,
                ]}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
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
                            unitSystem={unitSystem}
                            onChange={updateTrainingPreferences}
                            appLogicTitle="App Logic Settings"
                            appLogicDescription="Choose the strength-planning logic you want the app to use for this athlete profile."
                            activeStep={activeStep}
                            onEventDescriptionSkip={handleEventDescriptionSkip}
                            onEventDescriptionEditorChange={setIsEventDescriptionEditorOpen}
                            onEnduranceMethodsInfoVisibilityChange={setIsEnduranceMethodsInfoOpen}
                            onEnduranceCircuitFocusContinue={handleContinue}
                            onEnduranceCircuitFocusBack={handleStepBack}
                            onInjuriesContinue={handleContinue}
                            onInjuriesSkip={handleInjuriesSkip}
                        />

                    </View>
                </View>
            </ScrollView>
            {!isEventDescriptionEditorOpen && !isEnduranceMethodsInfoOpen && !isInjuriesStep && !isEnduranceCircuitFocusStep ? (
                <QuestionnaireBottomActionButton
                    layout={requiresSelection ? "single" : "stacked"}
                    canContinue={canContinue}
                    hideBack
                    text={activeStep >= sectionCount - 1
                        ? (subscription ? "Build Program" : "Continue to subscription")
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
    contentScroll: {
        flex: 1,
        minHeight: 0,
    },
    center: {
        flexGrow: 1,
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
