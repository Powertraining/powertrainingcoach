import { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../../services/models/mobxReactiveModel.js";
import SubscriptionPlanView from "../../../screens/screens/SubscriptionPlanView.jsx";
import PaymentSuccessView from "../../../screens/screens/PaymentSuccessView.jsx";
import MessageView from "../../../screens/screens/MessageView.jsx";
import AuthGateView from "../../../screens/screens/AuthGateView.jsx";

const SubscriptionScreen = observer(function SubscriptionScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [planType, setPlanType] = useState("");

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const successParam = params.success;
    const sessionIdParam = params.session_id;

    console.log("SubscriptionScreen DEBUG - Params:", {
      success: successParam,
      session_id: sessionIdParam,
    });

    if (successParam === "true") {
      console.log("✅ Payment success detected, setting success state");
      setSuccess(true);
      setSessionId(sessionIdParam || "");

      // Get the plan type from async storage or params
      const plan = params.plan || "";
      setPlanType(plan);

      // Update the model subscription with the plan end date
      if (plan && model.user && model.user.uid && model.ready) {
        console.log("[SubscriptionScreen] User is ready, updating subscription via model");
        model.setSubscriptionWithPlan?.(plan);
        console.log("✅ Subscription updated in model:", {
          subscription: true,
          subscriptionEndDate: model.subscriptionEndDate,
          plan: plan,
          userId: model.user.uid,
        });
      }
    }

    if (params.canceled === "true") {
      setSuccess(false);
      setMessage(
        "Order canceled -- continue to check your subscription and checkout when you're ready."
      );
    }
  }, [params, model.user, model.ready]);

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
    router.back();
  }

  function handleContinue() {
    router.replace("/(tabs)");
  }

  if (!success && message === "") {
    console.log("📋 Rendering SubscriptionPlanView");
    return (
      <View style={styles.container}>
        <SubscriptionPlanView onBack={handleBack} />
      </View>
    );
  } else if (success) {
    console.log("✅ Rendering PaymentSuccessView with sessionId:", sessionId);
    return (
      <View style={styles.container}>
        <PaymentSuccessView sessionId={sessionId} onContinue={handleContinue} />
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
    backgroundColor: "#f5f5f7",
  },
});
