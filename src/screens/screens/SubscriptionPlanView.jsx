import { useState } from "react";
import { Linking, View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { createCheckoutSession } from "../../services/utils/stripeClient.js";

const plans = [
  { key: "starter_plan_setup", name: "Starter Plan (1 week)", price: "80.00 SEK / week" },
  { key: "pro_plan_setup", name: "Pro Plan (1 month)", price: "290.00 SEK / month" },
  { key: "expert_plan_setup", name: "Expert Plan (1 year)", price: "2990.00 SEK / year" },
];

export default function SubscriptionPlanView({ onCheckoutSuccess }) {
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState(null);

  async function handleCheckout(planKey) {
    setLoadingPlan(planKey);
    setError(null);

    try {
      const checkoutData = await createCheckoutSession(planKey);

      if (!checkoutData?.checkoutUrl) {
        throw new Error("Stripe did not return a valid Checkout URL.");
      }

      onCheckoutSuccess?.({
        planKey,
        checkoutSessionId: checkoutData.sessionId,
      });

      await Linking.openURL(checkoutData.checkoutUrl);
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
