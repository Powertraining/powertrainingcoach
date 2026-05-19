// npx expo install @react-native-picker/picker

import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import QuestionnaireShell from "./questionnaire/QuestionnaireShell.jsx";
import QuestionnaireBottomActionButton from "../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import TrainingPreferencesFields, {
    CONFIDENCE_STEP_KEYS,
    DESIRED_TRAINING_STEP_INDEX,
    getTrainingPreferencesSectionCount,
    TRAINING_PHASE_STEP_INDEX,
} from "./TrainingPreferencesFields.jsx";

import {
    getTrainingPreferencesFormState,
    normalizeTrainingPreferences,
} from "../constants/trainingPreferences.js";

export default function InputFormView({
    onSubmit,
    onBack,
    useApi,
    onToggleUseApi,
    hasApiKey,
    subscription,
    daysRemaining,
    initialValues = {},
    onClose,
}) {
    const [trainingPreferences, setTrainingPreferences] = useState(() => {
        const formState = getTrainingPreferencesFormState(initialValues);

        return {
            ...formState,
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
    const [activeStep, setActiveStep] = useState(0);
    const sectionCount = getTrainingPreferencesSectionCount(trainingPreferences);
    const activeConfidenceKey = CONFIDENCE_STEP_KEYS[activeStep];
    const confidenceStepSelected = Boolean(
        activeConfidenceKey &&
        trainingPreferences.trainingCapabilities?.[activeConfidenceKey]
    );
    const isDesiredTrainingStep = activeStep === DESIRED_TRAINING_STEP_INDEX;
    const desiredTrainingStepSelected = Boolean(trainingPreferences.desiredTraining);
    const isTrainingPhaseStep = activeStep === TRAINING_PHASE_STEP_INDEX;
    const trainingPhaseStepSelected = Boolean(trainingPreferences.trainingPhase);
    const requiresSelection =
        Boolean(activeConfidenceKey) || isDesiredTrainingStep || isTrainingPhaseStep;
    const canContinue =
        activeConfidenceKey ? confidenceStepSelected :
            isDesiredTrainingStep ? desiredTrainingStepSelected :
                isTrainingPhaseStep ? trainingPhaseStepSelected :
                undefined;

    function handleSubmit() {
        onSubmit(normalizeTrainingPreferences(trainingPreferences));
    }

    function handleContinue() {
        if (activeStep >= sectionCount - 1) {
            handleSubmit();
            return;
        }

        setActiveStep((currentStep) => currentStep + 1);
    }

    function handleStepBack() {
        if (activeStep === 0) {
            onBack?.();
            return;
        }

        setActiveStep((currentStep) => currentStep - 1);
    }

    return (
        <QuestionnaireShell onClose={onClose}>
            <View style={styles.center}>
                <View style={styles.card}>
                    <View style={styles.form}>
                        {/* {!subscription && (
                            <View style={styles.subscriptionAlert}>
                                <Text style={styles.alertText}>📋 Subscription Required{"\n"}You need an active subscription to generate training plans.</Text>
                                <TouchableOpacity onPress={handleSubmit} style={styles.subscribeButton}>
                                    <Text style={styles.subscribeButtonText}>Subscribe & Generate</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {subscription && (
                            <View style={styles.subscriptionActive}>
                                <Text style={styles.activeText}>✅ Subscription Active ({daysRemaining} days remaining)</Text>
                            </View>
                        )} */}

                        <TrainingPreferencesFields
                            values={trainingPreferences}
                            onChange={setTrainingPreferences}
                            appLogicTitle="App Logic Settings"
                            appLogicDescription="Choose the strength-planning logic you want the app to use for this athlete profile."
                            activeStep={activeStep}
                        />

                    </View>
                </View>
            </View>
            <QuestionnaireBottomActionButton
                layout={requiresSelection ? "single" : "stacked"}
                canContinue={canContinue}
                hideBack
                text={activeStep >= sectionCount - 1
                    ? (subscription ? "Generate My Plan" : "Subscribe & Generate Plan")
                    : "Continue"}
                onContinue={handleContinue}
                onBack={handleStepBack}
            />
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        paddingBottom: 120,
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

