import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StartView from "../views/StartView.jsx";
import InputFormView from "../views/InputFormView.jsx";
import ProgramOverviewView from "../views/ProgramOverviewView.jsx";
import DayDetailView from "../views/DayDetailView.jsx";
import LoadingView from "../views/LoadingView.jsx";
import ErrorView from "../views/ErrorView.jsx";
import QuestionnaireSportView from "../views/QuestionnaireSportView.jsx";
import QuestionnaireFrequencyView from "../views/QuestionnaireFrequencyView.jsx";
import { Subscription as SubscriptionPresenter } from "./SubscriptionPresenter.jsx";
import { observer } from "mobx-react-lite";
import { getFunctions, httpsCallable } from "firebase/functions";
import AuthGateView from "../views/AuthGateView.jsx";

const STEPS = Object.freeze({
  START: "start",
  Q_SPORT: "questionnaireSport",
  Q_FREQ: "questionnaireFrequency",
  INPUT: "input",
  SUBSCRIPTION: "subscription",
  OVERVIEW: "overview",
  DAY_DETAIL: "dayDetail",
});

const SPORT_OPTIONS = [
  "Boxing",
  "Wrestling",
  "BJJ",
  "Muay Thai / Kickboxing",
  "Judo",
  "MMA",
];

function makeMockPlan(input) {
  return {
    summary: `Mock plan for ${input.goal} (${input.experience}, ${
      input.daysPerWeek
    } days/week${
      input.primaryCombatSport ? `, ${input.primaryCombatSport}` : ""
    }${input.weightClass ? `, ${input.weightClass}` : ""}).`,
    weeks: [
      {
        week: 1,
        days: [
          {
            day: 1,
            exercises: [
              {
                name: "Shadowboxing + footwork",
                sets: "3",
                reps: "3 min",
                notes: "Light, focus on rhythm and guard.",
                videoUrl: "https://www.youtube.com/watch?v=U3tOoanB6og",
              },
              {
                name: "Heavy bag - straight punches",
                sets: "4",
                reps: "2 min",
                notes: "Power on the last two rounds.",
              },
              {
                name: "Core circuit",
                sets: "3",
                reps: "12-15",
                notes: "Plank, hollow hold, Russian twists.",
              },
            ],
          },
          {
            day: 2,
            exercises: [
              {
                name: "Strength: goblet squat",
                sets: "4",
                reps: "8",
                notes: "Controlled tempo, full depth.",
              },
              {
                name: "Push-ups",
                sets: "4",
                reps: "max",
                notes: "Leave 1-2 reps in reserve.",
              },
              {
                name: "Interval run",
                sets: "6",
                reps: "45s on / 60s off",
                notes: "Moderate-hard pace.",
              },
            ],
          },
        ],
      },
    ],
  };
}

const AppPresenter = observer(function AppPresenter(props) {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.START);
  const [plan, setPlan] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [totalDays, setTotalDays] = useState(0);
  const [completedDays, setCompletedDays] = useState(new Set());

  function computeTotalDays(currentPlan) {
    if (!currentPlan?.weeks) return 0;
    return currentPlan.weeks.reduce((acc, week) => acc + (week.days?.length || 0), 0);
  }

  function flattenPlanDays(currentPlan) {
    if (!currentPlan?.weeks) return [];
    return currentPlan.weeks
      .slice()
      .sort((a, b) => a.week - b.week)
      .flatMap((week) =>
        (week.days || []).slice().sort((a, b) => a.day - b.day).map((day) => ({
          week: week.week,
          day: day.day,
        }))
      );
  }

  useEffect(() => {
    function handleGoHome() {
      setStep(STEPS.START);
      setPlan(null);
      setSelectedDay(null);
      setLoading(false);
      setError(null);
      // Don't reset questionnaire values - they're persistent in the model
    }

    window.addEventListener("app:go-home", handleGoHome);
    return () => window.removeEventListener("app:go-home", handleGoHome);
  }, []);

  // Load plan from model on mount or when model.trainingPlan changes
  useEffect(() => {
    if (props.model.trainingPlan) {
      setPlan(props.model.trainingPlan);
      setStep(STEPS.OVERVIEW);
      const totalDays = computeTotalDays(props.model.trainingPlan);
      setTotalDays(totalDays);
      setCompletedDays(new Set());
    } else {
      setTotalDays(0);
      setCompletedDays(new Set());
    }
  }, [props.model.trainingPlan]);

  if (!props.model.user) {
    return (
      <AuthGateView
        onLogin={() => navigate("/login")}
        onSignup={() => navigate("/signup")}
      />
    );
  }

  async function handleGenerate(input, oldPlan = props.model.trainingPlan) {
    setLoading(true);
    setError(null);
    try {
      const enrichedInput = {
        ...input,
        primaryCombatSport: props.model.primaryCombatSport,
        daysPerWeek: props.model.sessionsPerWeek,
        focusEmphasis: input.preferences?.[0] ?? "mixed",
        // Calculate weeks based on subscription (max 8 weeks per batch)
        numWeeks: props.model.getPlannedWeeksFromSubscription?.() || 1,
        // Pass current batch number for progressive training
        trainingPlanBatch: props.model.getTrainingPlanBatch?.() || 1,
      };

      // If user has active subscription, call OpenAI API via Cloud Function
      if (props.model.subscription) {
        console.log("Calling generateTrainingPlan Cloud Function with input:", enrichedInput);
        const functions = getFunctions();
        const generateTrainingPlanFn = httpsCallable(functions, "generateTrainingPlan");
        const result = await generateTrainingPlanFn(enrichedInput);
        
        console.log("Generated plan from OpenAI:", result.data);
        if (result.data.success && result.data.plan) {
          // Save plan to model (which triggers Firestore persistence)
          props.model.trainingPlan = result.data.plan;
          setPlan(result.data.plan);
          
          // Set days finished based on weeks in plan
          const totalDays = computeTotalDays(result.data.plan);
          setTotalDays(totalDays);
          setCompletedDays(new Set());
          
          setStep(STEPS.OVERVIEW);
        } else {
          throw new Error("Invalid plan response from server");
        }
      } else {
        // Fallback to mock data if no subscription (should not reach here due to gating)
        console.log("Using mock training plan (no subscription)");
        const mock = makeMockPlan(enrichedInput);
        setPlan(mock);
        const totalMockDays = computeTotalDays(mock);
        setTotalDays(totalMockDays);
        setCompletedDays(new Set());
        setStep(STEPS.OVERVIEW);
      }
    } catch (e) {
      console.error("Error generating plan:", e);
      setError(`Could not generate program: ${e.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectDayACB(weekNumber, dayNumber) {
    if (!plan) return;

    const week = plan.weeks.find((w) => w.week === weekNumber);
    if (!week) return;

    const day = week.days.find((d) => d.day === dayNumber);
    if (!day) return;

    setSelectedDay({
      week: weekNumber,
      day: dayNumber,
      exercises: day.exercises,
    });
    setStep(STEPS.DAY_DETAIL);
  }
  function finishedDayACB() {
    if (!selectedDay) return;
    const key = `${selectedDay.week}-${selectedDay.day}`;

    setCompletedDays((prev) => {
      const alreadyDone = prev.has(key);
      const next = alreadyDone ? new Set(prev) : new Set(prev).add(key);
      const remaining = Math.max(totalDays - next.size, 0);
      console.log("Days remaining in batch:", remaining);

      if (remaining <= 0 && totalDays > 0) {
        const totalWeeksAvailable = props.model.getPlannedWeeksFromSubscription?.() || 0;
        const weeksInCurrentPlan = plan?.weeks?.length || 0;

        if (totalWeeksAvailable > weeksInCurrentPlan) {
          props.model.completeCurrentBatch(weeksInCurrentPlan);
          setSelectedDay(null);
          setStep(STEPS.INPUT);
        } else {
          props.model.setFinishedWorkout(3);
          window.location.hash = "#/feedback";
        }
      } else {
        setSelectedDay(null);
        setStep(STEPS.OVERVIEW);
      }

      return next;
    });
  }

  const flattenedDays = flattenPlanDays(plan);
  const currentDayPointer = flattenedDays.find((d) => !completedDays.has(`${d.week}-${d.day}`)) || null;

  if (loading) return <LoadingView text="Generating program..." />;
  if (error)
    return <ErrorView message={error} onRetry={() => setStep(STEPS.INPUT)} />;

  const renderByStep = {
    [STEPS.START]: () => <StartView onStart={() => setStep(STEPS.Q_SPORT)} />,

    [STEPS.Q_SPORT]: () => (
      <QuestionnaireSportView
        options={SPORT_OPTIONS}
        value={props.model.primaryCombatSport}
        onChange={(sport) => { props.model.primaryCombatSport = sport; }}
        onLogoClick={() => setStep(STEPS.START)}
        onBack={() => setStep(STEPS.START)}
        onContinue={() => setStep(STEPS.Q_FREQ)}
      />
    ),

    [STEPS.Q_FREQ]: () => (
      <QuestionnaireFrequencyView
        value={props.model.sessionsPerWeek}
        onChange={(freq) => { props.model.sessionsPerWeek = freq; }}
        onBack={() => setStep(STEPS.Q_SPORT)}
        onLogoClick={() => setStep(STEPS.START)}
        onContinue={() => setStep(STEPS.INPUT)}
      />
    ),

    [STEPS.INPUT]: () => (
      <InputFormView
        onSubmit={handleGenerate}
        onBack={() => setStep(STEPS.Q_FREQ)}
        subscription={props.model.subscription}
        daysRemaining={props.model.getDaysRemainingInSubscription?.() || 0}
        onPaymentClick={() => setStep(STEPS.SUBSCRIPTION)}
      />
    ),

    [STEPS.SUBSCRIPTION]: () => (
      <SubscriptionPresenter
        model={props.model}
        onBack={() => setStep(STEPS.INPUT)}
      />
    ),

    [STEPS.OVERVIEW]: () => (
      <ProgramOverviewView
        plan={plan}
        onSelectDay={handleSelectDayACB}
        onBack={() => setStep(STEPS.INPUT)}
        currentDay={currentDayPointer}
        completedDays={completedDays}
        finishedPlan={props.finishedPlan}
      />
    ),

    [STEPS.DAY_DETAIL]: () => (
      <DayDetailView
        week={selectedDay?.week}
        day={selectedDay?.day}
        exercises={selectedDay?.exercises}
        onBack={() => { setSelectedDay(null); setStep(STEPS.OVERVIEW); }}
        onFinish={finishedDayACB}
      />
    ),
  };

  const render = renderByStep[step];
  return render ? render() : null;
});

export { AppPresenter };
