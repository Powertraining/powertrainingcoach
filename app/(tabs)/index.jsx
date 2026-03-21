import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

import StartView from "../../src/screens/screens/StartView.jsx";
import QuestionnaireSportView from "../../src/screens/screens/QuestionnaireSportView.jsx";
import QuestionnaireFrequencyView from "../../src/screens/screens/QuestionnaireFrequencyView.jsx";
import InputFormView from "../../src/screens/screens/InputFormView.jsx";
import PlanSelectionView from "../../src/screens/screens/PlanSelectionView.jsx";
import LoadingView from "../../src/screens/screens/LoadingView.jsx";
import ErrorView from "../../src/screens/screens/ErrorView.jsx";
import AuthGateView from "../../src/screens/screens/AuthGateView.jsx";
import { refreshSubscriptionStatus } from "../../src/services/utils/stripeClient.js";

import {
  fetchBaseTrainingPlans,
  filterTrainingPlans,
  extractFirstWeekPreview,
} from "../../src/services/models/trainingPlanService.js";

const STEPS = Object.freeze({
  START: "start",
  Q_SPORT: "questionnaireSport",
  Q_FREQ: "questionnaireFrequency",
  INPUT: "input",
  SUBSCRIPTION: "subscription",
  PLAN_SELECTION: "planSelection",
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

  // State for plan selection
  const [planPreviews, setPlanPreviews] = useState([]);
  const [allFetchedPlans, setAllFetchedPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(null);
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
      STEPS.PLAN_SELECTION,
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
      case STEPS.PLAN_SELECTION:
        setStep(STEPS.INPUT);
        break;
      default:
        setStep(STEPS.START);
    }
  }

  async function handleFetchPlans(input) {
    setPlansLoading(true);
    setPlansError(null);

    const filters = {
      ...input,
      primaryCombatSport: model.primaryCombatSport,
      sessionsPerWeek: model.sessionsPerWeek,
    };
    setCurrentFilters(filters);

    try {
      console.log("Fetching base training plans from Firebase Storage...");
      const plans = await fetchBaseTrainingPlans();
      setAllFetchedPlans(plans);

      console.log("Filtering plans with criteria:", filters);
      const filtered = filterTrainingPlans(plans, filters);

      console.log(`Found ${filtered.length} matching plans`);
      const previews = filtered.map(extractFirstWeekPreview);
      setPlanPreviews(previews);

      setStep(STEPS.PLAN_SELECTION);
    } catch (e) {
      console.error("Error fetching training plans:", e);
      setPlansError(`Could not load training plans: ${e.message}`);
      setStep(STEPS.PLAN_SELECTION);
    } finally {
      setPlansLoading(false);
    }
  }

  function handleSelectPlan(planId) {
    const selectedPlan = allFetchedPlans.find((p) => p.id === planId);

    if (!selectedPlan) {
      console.error("Selected plan not found:", planId);
      setPlansError("Selected plan not found. Please try again.");
      return;
    }

    console.log("User selected plan:", selectedPlan.name || planId);
    model.trainingPlan = selectedPlan;
    model.completedDays = [];

    // Navigate to overview
    router.replace("/(tabs)/overview");
  }

  function handleRetryFetchPlans() {
    if (currentFilters) {
      handleFetchPlans(currentFilters);
    } else {
      setStep(STEPS.INPUT);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingView text="Loading..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorView message={error} onRetry={() => setStep(STEPS.INPUT)} />
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
        onSubmit={handleFetchPlans}
        onBack={goBack}
        subscription={model.isSubscribed?.() || false}
        daysRemaining={model.getDaysRemainingInSubscription?.() || 0}
        onPaymentClick={() =>
          router.push({
            pathname: "/(tabs)/subscription",
            params: { returnTo: "/(tabs)?resume=input" },
          })
        }
      />
    ),

    [STEPS.PLAN_SELECTION]: () => (
      <PlanSelectionView
        planPreviews={planPreviews}
        loading={plansLoading}
        error={plansError}
        onSelectPlan={handleSelectPlan}
        onBack={() => setStep(STEPS.INPUT)}
        onRetry={handleRetryFetchPlans}
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
    backgroundColor: "#f5f5f7",
  },
});
