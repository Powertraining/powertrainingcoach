import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../../services/models/mobxReactiveModel.js";

import StartView from "../../../screens/screens/StartView.jsx";
import QuestionnaireSportView from "../../../screens/screens/QuestionnaireSportView.jsx";
import QuestionnaireFrequencyView from "../../../screens/screens/QuestionnaireFrequencyView.jsx";
import InputFormView from "../../../screens/screens/InputFormView.jsx";
import PlanSelectionView from "../../../screens/screens/PlanSelectionView.jsx";
import LoadingView from "../../../screens/screens/LoadingView.jsx";
import ErrorView from "../../../screens/screens/ErrorView.jsx";
import AuthGateView from "../../../screens/screens/AuthGateView.jsx";

import {
  fetchBaseTrainingPlans,
  filterTrainingPlans,
  extractFirstWeekPreview,
} from "../../../services/models/trainingPlanService.js";

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

  const [step, setStep] = useState(STEPS.START);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for plan selection
  const [planPreviews, setPlanPreviews] = useState([]);
  const [allFetchedPlans, setAllFetchedPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(null);

  // If user already has a training plan, redirect to overview
  useEffect(() => {
    if (model.trainingPlan) {
      router.replace("/(tabs)/overview");
    }
  }, [model.trainingPlan]);

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
        subscription={model.subscription}
        daysRemaining={model.getDaysRemainingInSubscription?.() || 0}
        onPaymentClick={() => router.push("/(tabs)/subscription")}
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
