import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

import StartView from "../../src/screens/screens/StartView.jsx";
import QuestionnaireSportView from "../../src/screens/screens/QuestionnaireSportView.jsx";
import QuestionnaireFrequencyView from "../../src/screens/screens/QuestionnaireFrequencyView.jsx";
import InputFormView from "../../src/screens/screens/InputFormView.jsx";
import LoadingView from "../../src/screens/screens/LoadingView.jsx";
import ErrorView from "../../src/screens/screens/ErrorView.jsx";
import AuthGateView from "../../src/screens/screens/auth/AuthGateView.jsx";
import { refreshSubscriptionStatus } from "../../src/services/utils/stripeClient.js";

const STEPS = Object.freeze({
  START: "start",
  Q_SPORT: "questionnaireSport",
  Q_FREQ: "questionnaireFrequency",
  INPUT: "input",
});

const SPORT_OPTIONS = [
  "Boxing",
  "Wrestling",
  "BJJ",
  "Muay Thai / Kickboxing",
  "Judo",
  "MMA",
];

const HomeScreen = observer(function HomeScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [step, setStep] = useState(STEPS.START);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const subscriptionRefreshAttemptedRef = useRef("");

  function getParamValue(value) {
    return Array.isArray(value) ? value[0] : value;
  }

  function getSafeResumeStep() {
    const resume = getParamValue(params.resume);
    const allowedSteps = new Set([
      STEPS.START,
      STEPS.Q_SPORT,
      STEPS.Q_FREQ,
      STEPS.INPUT,
    ]);

    if (typeof resume !== "string" || !allowedSteps.has(resume)) {
      return "";
    }

    return resume;
  }

  const resumeStep = getSafeResumeStep();

  // If user already has a training plan, redirect to overview
  useEffect(() => {
    if (model.trainingPlan) {
      router.replace("/(tabs)/overview");
    }
  }, [model.trainingPlan, router]);

  useEffect(() => {
    if (!resumeStep || model.trainingPlan) {
      return;
    }

    setStep(resumeStep);
  }, [model.trainingPlan, resumeStep]);

  useEffect(() => {
    if (!model.user?.uid) {
      subscriptionRefreshAttemptedRef.current = "";
      return;
    }

    if (subscriptionRefreshAttemptedRef.current === model.user.uid) {
      return;
    }

    if (model.isSubscribed?.()) {
      return;
    }

    subscriptionRefreshAttemptedRef.current = model.user.uid;

    refreshSubscriptionStatus()
      .then((result) => {
        if (!result?.refreshed) {
          return;
        }

        model.applySubscriptionState?.({
          subscription: result.active,
          subscriptionEndDate: result.subscriptionEndDate,
        });
      })
      .catch((error) => {
        console.warn("Could not refresh Stripe subscription status:", error);
      });
  }, [model, model.ready, model.user, router]);

  if (!model.ready) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  // Check auth
  if (!model.user) {
    return (
      <AuthGateView
        onLogin={() => router.push("/(auth)/login")}
        onSignup={() => router.push("/(auth)/signup")}
      />
    );
  }

  function goBack() {
    switch (step) {
      case STEPS.Q_SPORT:
        setStep(STEPS.START);
        break;
      case STEPS.Q_FREQ:
        setStep(STEPS.Q_SPORT);
        break;
      case STEPS.INPUT:
        setStep(STEPS.Q_FREQ);
        break;
      default:
        setStep(STEPS.START);
    }
  }

  function buildQuestionnairePayload(input, pendingPlanGeneration) {
    return {
      ...input,
      primaryCombatSport: model.primaryCombatSport,
      sessionsPerWeek: model.sessionsPerWeek,
      trainingPlanBatch: model.getTrainingPlanBatch?.() || 1,
      pendingPlanGeneration,
    };
  }

  async function generatePlanFromQuestionnaire(questionnaire) {
    setLoading(true);
    setError(null);

    try {
      const normalizedQuestionnaire =
        model.buildTrainingPlanInput?.(questionnaire) || questionnaire;
      await model.generateTrainingPlan?.(normalizedQuestionnaire);
      model.setQuestionnaire?.({
        ...questionnaire,
        pendingPlanGeneration: false,
      });
      router.replace("/(tabs)/overview");
    } catch (e) {
      console.error("Error generating training plan:", e);
      setError(
        e.message || "Could not generate your personalized training plan."
      );
      setStep(STEPS.INPUT);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuestionnaireSubmit(input) {
    const requiresSubscription = !model.isSubscribed?.();
    const questionnaire = buildQuestionnairePayload(
      input,
      requiresSubscription
    );

    model.setQuestionnaire?.(questionnaire);

    if (requiresSubscription) {
      router.push({
        pathname: "/(tabs)/subscription",
        params: { returnTo: "/(tabs)?resume=input" },
      });
      return;
    }

    await generatePlanFromQuestionnaire(questionnaire);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingView />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorView
          message={error}
          onRetry={() => {
            setError(null);
            setStep(STEPS.INPUT);
          }}
        />
      </View>
    );
  }

  const renderByStep = {
    [STEPS.START]: () => <StartView onStart={() => setStep(STEPS.Q_SPORT)} />,

    [STEPS.Q_SPORT]: () => (
      <QuestionnaireSportView
        options={SPORT_OPTIONS}
        value={model.primaryCombatSport}
        onChange={(sport) => {
          model.primaryCombatSport = sport;
        }}
        onBack={goBack}
        onContinue={() => setStep(STEPS.Q_FREQ)}
      />
    ),

    [STEPS.Q_FREQ]: () => (
      <QuestionnaireFrequencyView
        value={model.sessionsPerWeek}
        onChange={(freq) => {
          model.sessionsPerWeek = freq;
        }}
        onBack={goBack}
        onContinue={() => setStep(STEPS.INPUT)}
      />
    ),

    [STEPS.INPUT]: () => (
      <InputFormView
        onSubmit={handleQuestionnaireSubmit}
        onBack={goBack}
        initialValues={model.questionnaire || {}}
        subscription={model.isSubscribed?.() || false}
        daysRemaining={model.getDaysRemainingInSubscription?.() || 0}
      />
    ),
  };

  const render = renderByStep[step];

  return <View style={styles.container}>{render ? render() : null}</View>;
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
