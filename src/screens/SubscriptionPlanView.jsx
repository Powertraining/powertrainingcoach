import { useEffect, useState } from "react";
import { Linking, View, Text, TouchableOpacity, StyleSheet } from "react-native";

import {
  createCheckoutSession,
  listSubscriptionPlans,
} from "../services/utils/stripeClient.js";

export default function SubscriptionPlanView({ onCheckoutSuccess, returnTo = "" }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState(null);
  const [trialDays, setTrialDays] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setError(null);
    setLoadingPlans(true);

    listSubscriptionPlans()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setPlans(Array.isArray(data?.plans) ? data.plans : []);
        setTrialDays(Number.isFinite(data?.trialDays) ? data.trialDays : 0);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setError(err.message || "Failed to load subscription plans.");
        setPlans([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCheckout(planKey) {
    setLoadingPlan(planKey);
    setError(null);

    try {
      const checkoutData = await createCheckoutSession(planKey, returnTo);

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
      {trialDays > 0 ? (
        <Text style={styles.trialBanner}>
          First-time subscribers get a {trialDays}-day free trial before billing
          starts.
        </Text>
      ) : null}
      {loadingPlans ? (
        <Text style={styles.statusCopy}>Loading subscription plans...</Text>
      ) : null}
      {!loadingPlans && !error && plans.length === 0 ? (
        <Text style={styles.statusCopy}>
          No subscription plans are currently available.
        </Text>
      ) : null}

      {plans.map((plan, index) => (
        <View key={plan.lookupKey || plan.priceId || index}>
          <View style={styles.product}>
            <Text>💪</Text>
            <View style={styles.description}>
              <Text style={styles.planName}>
                {plan.name || "Subscription Plan"}
              </Text>
              {plan.description ? (
                <Text style={styles.planDescription}>{plan.description}</Text>
              ) : null}
              <Text style={styles.planPrice}>
                {plan.priceLabel || "Price unavailable"}
              </Text>
              <Text>Cancellable anytime</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleCheckout(plan.lookupKey)}
              disabled={Boolean(loadingPlan) || !plan.lookupKey}
            >
              <Text>
                {loadingPlan === plan.lookupKey ? "Processing..." : "Checkout"}
              </Text>
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
  trialBanner: {
    marginBottom: 12,
    paddingHorizontal: 16,
    color: "#065f46",
    fontSize: 14,
    fontWeight: "600",
  },
  statusCopy: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#374151",
    fontSize: 14,
  },
  product: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  description: { flex: 1, gap: 4 },
  planName: { fontSize: 16, fontWeight: "700" },
  planDescription: { fontSize: 13, color: "#4b5563" },
  planPrice: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)" },
});
