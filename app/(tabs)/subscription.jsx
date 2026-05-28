import {
  useState,
  useEffect,
  useRef } from "react";
import { observer } from "mobx-react-lite";
import { useRouter,
  useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import SubscriptionPlanView from "../../src/screens/SubscriptionPlanView";
import PaymentSuccessView from "../../src/screens/PaymentSuccessView.jsx";
import MessageView from "../../src/screens/MessageView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import BlackGradient from "../../src/components/colorComponents/BlackGradient.jsx";
import { verifyCheckoutSession } from "../../src/services/utils/stripeClient.js";
import {
  normalizeStripeCheckoutSessionId,
} from "../../src/services/utils/inputValidation.js";
import { getClosestActiveTrainingDay } from "../../src/services/utils/trainingPlan.js";
import {
  getParamValue,
  getSafeReturnToPath,
} from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const INVALID_CHECKOUT_SESSION_MESSAGE =
  "Stripe returned an invalid checkout session. Please try checkout again.";

const SubscriptionScreen = observer(function SubscriptionScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const handledSessionIdRef = useRef("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [verifyingSession, setVerifyingSession] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const returnTo = getSafeReturnToPath(params);

  function clearPendingPlanGenerationFlag() {
    const savedQuestionnaire =
      model.questionnaire && typeof model.questionnaire === "object" ?
        model.questionnaire :
        {};

    model.setQuestionnaire?.({
      ...savedQuestionnaire,
      pendingPlanGeneration: false,
    });
  }

  useEffect(() => {
    const successParam = getParamValue(params.success);
    const sessionIdParam = getParamValue(params.session_id);
    const canceledParam = getParamValue(params.canceled);

    console.log("SubscriptionScreen DEBUG - Params:", {
      success: successParam,
      session_id: sessionIdParam,
      canceled: canceledParam,
    });

    if (canceledParam === "true") {
      setVerifyingSession(false);
      setSuccess(false);
      setSessionId("");
      setMessage(
        "Order canceled. You can review the plans and try checkout again when you're ready."
      );
      return;
    }

    if (successParam !== "true") {
      return;
    }

    if (!sessionIdParam) {
      setSuccess(false);
      setMessage(
        "Stripe returned without a session identifier. Please try the checkout again."
      );
      return;
    }

    const normalizedSessionId = normalizeStripeCheckoutSessionId(sessionIdParam);

    if (!normalizedSessionId) {
      if (handledSessionIdRef.current !== sessionIdParam) {
        handledSessionIdRef.current = sessionIdParam;
        setVerifyingSession(false);
        setSuccess(false);
        setMessage(INVALID_CHECKOUT_SESSION_MESSAGE);
      }
      return;
    }

    if (
      !model.user ||
      !model.ready ||
      handledSessionIdRef.current === normalizedSessionId
    ) {
      return;
    }

    const verificationUid = model.user.uid;
    handledSessionIdRef.current = normalizedSessionId;
    setVerifyingSession(true);
    setSuccess(false);
    setMessage("");

    verifyCheckoutSession(normalizedSessionId)
      .then(async (verification) => {
        if (model.user?.uid !== verificationUid) {
          return;
        }

        model.applySubscriptionState?.({
          subscription: verification.active,
          subscriptionEndDate: verification.subscriptionEndDate,
          subscriptionStartDate: verification.subscriptionStartDate,
          subscriptionType: verification.subscriptionType,
          lookupKey: verification.lookupKey,
        });

        const shouldAutoGeneratePlan =
          Boolean(model.questionnaire?.pendingPlanGeneration) &&
          !model.trainingPlan;

        if (shouldAutoGeneratePlan) {
          setGeneratingPlan(true);
          clearPendingPlanGenerationFlag();

          try {
            const trainingPlanInput = model.buildTrainingPlanInput?.();

            if (!trainingPlanInput) {
              throw new Error(
                "We couldn't restore your onboarding answers. Please return to the questionnaire and try again."
              );
            }

            const generatedPlan = await model.generateTrainingPlan?.(trainingPlanInput);
            if (model.user?.uid !== verificationUid) {
              return;
            }

            const currentTrainingDay =
              getClosestActiveTrainingDay(generatedPlan || model.trainingPlan, []) ||
              model.getCurrentTrainingDay?.([]);
            const weekNumber = Number.parseInt(currentTrainingDay?.week, 10);
            const dayNumber = Number.parseInt(currentTrainingDay?.day, 10);

            if (Number.isFinite(weekNumber) && Number.isFinite(dayNumber)) {
              router.replace({
                pathname: "/(tabs)/overview",
                params: {
                  week: String(weekNumber),
                  day: String(dayNumber),
                  returnTo: "/(tabs)",
                },
              });
              return;
            }

            router.replace("/(tabs)/overview");
            return;
          } catch (error) {
            console.error(
              "Training plan generation failed after subscription:",
              error
            );
            setSuccess(false);
            setSessionId("");
            setCustomerId("");
            setMessage(
              error.message ||
                "Your subscription is active, but we couldn't generate your training plan yet. Please return to the questionnaire and try again."
            );
            return;
          } finally {
            setGeneratingPlan(false);
          }
        }

        if (returnTo && returnTo !== "/(tabs)/subscription") {
          router.replace(returnTo);
          return;
        }

        setCustomerId(verification.customerId || "");
        setSessionId(normalizedSessionId);
        setSuccess(true);
      })
      .catch((error) => {
        console.error("Subscription verification failed:", error);
        setSuccess(false);
        setMessage(
          error.message ||
            "We couldn't verify the payment yet. Please wait a moment and try again."
        );
      })
      .finally(() => {
        setVerifyingSession(false);
      });
  }, [model, model.ready, model.user, params, returnTo, router]);

  useAndroidBackHandler(handleBack, [returnTo, router]);

  if (!model.ready) {
    return (
      <View style={[styles.container, styles.centered]}>
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

  function handleBack() {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    router.replace("/(tabs)");
  }

  function handleContinue() {
    router.replace(returnTo || "/(tabs)");
  }

  function handleCheckoutSuccess() {
    setSuccess(false);
    setMessage("");
    setSessionId("");
    setCustomerId("");
  }

  if (generatingPlan) {
    return (
      <View style={[styles.container, styles.planGenerationContainer]}>
        <BlackGradient />
        <LoadingView label="Generating" />
      </View>
    );
  }

  if (verifyingSession) {
    return (
      <View style={[styles.container, styles.centered]}>
        <LoadingView />
      </View>
    );
  } else if (!success && message === "") {
    console.log("📋 Rendering SubscriptionPlanView");
    return (
      <View style={styles.container}>
        <SubscriptionPlanView
          currentPlanKey={model.getActiveSubscriptionLookupKey?.() || ""}
          isSubscribed={model.isSubscribed?.() || false}
          onBack={handleBack}
          onCheckoutSuccess={handleCheckoutSuccess}
          returnTo={returnTo}
        />
      </View>
    );
  } else if (success) {
    console.log("✅ Rendering PaymentSuccessView with sessionId:", sessionId);
    return (
      <View style={styles.container}>
        <PaymentSuccessView
          customerId={customerId}
          sessionId={sessionId}
          onContinue={handleContinue}
        />
      </View>
    );
  } else {
    console.log("⚠️ Rendering MessageView with message:", message);
    return (
      <View style={styles.container}>
        <MessageView message={message} onBack={handleBack} />
      </View>
    );
  }
});

export default SubscriptionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
  planGenerationContainer: {
    overflow: "hidden",
  },
});
