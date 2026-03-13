import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";

import { createCheckoutSession } from "../../services/utils/stripeClient.js";

const plans = [
  { key: "starter_plan", name: "Starter Plan (1 week)", price: "20.00 SEK / week" },
  { key: "pro_plan", name: "Pro Plan (1 month)", price: "70.00 SEK / month" },
  { key: "expert_plan", name: "Expert Plan (1 year)", price: "800.00 SEK / year" },
];

export default function SubscriptionPlanView({ onCheckoutSuccess }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState(null);

  async function handleCheckout(planKey) {
    setLoadingPlan(planKey);
    setError(null);

    try {
      const checkoutData = await createCheckoutSession(planKey);

      if (!checkoutData?.clientSecret || !checkoutData?.customerId || !checkoutData?.ephemeralKey) {
        throw new Error("Stripe did not return a valid mobile checkout payload.");
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: "PowerTrainingCoach",
        paymentIntentClientSecret: checkoutData.clientSecret,
        customerId: checkoutData.customerId,
        customerEphemeralKeySecret: checkoutData.ephemeralKey,
        allowsDelayedPaymentMethods: true,
        returnURL: "powertrainingcoach://stripe-redirect",
      });

      if (initError) {
        throw new Error(initError.message || "Failed to initialize the payment sheet.");
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        const errorCode = String(paymentError.code || "").toLowerCase();

        if (errorCode !== "canceled") {
          throw new Error(paymentError.message || "Payment could not be completed.");
        }

        return;
      }

      onCheckoutSuccess?.({
        planKey,
        customerId: checkoutData.customerId,
        subscriptionId: checkoutData.subscriptionId,
      });
    } catch (err) {
      setError(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan("");
    }
  }

  return (
    <View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {plans.map((plan, index) => (
        <View key={plan.key}>
          <View style={styles.product}>
            <Text>💪</Text>
            <View style={styles.description}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text>Cancellable anytime</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCheckout(plan.key)}
              disabled={Boolean(loadingPlan)}
            >
              <Text>{loadingPlan === plan.key ? "Processing..." : "Checkout"}</Text>
            </TouchableOpacity>
          </View>
          {index < plans.length - 1 ? <View style={styles.divider} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { color: "#dc2626" },
  product: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  description: { flex: 1, gap: 4 },
  planName: { fontSize: 16, fontWeight: "700" },
  planPrice: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)" },
});
