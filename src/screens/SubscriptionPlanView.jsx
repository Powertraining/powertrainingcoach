import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import {
  createCheckoutSession,
  listSubscriptionPlans,
} from "../services/utils/stripeClient.js";
import StandardText from "../components/textComponents/StandardText.jsx";
import QuestionnaireBottomActionButton from "../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import GoldGradient from "../components/colorComponents/GoldGradient.jsx";

const refreshIcon = require("../assets/icons/refresh.png");
const securityIcon = require("../assets/icons/security.png");

const MEMBERSHIP_BENEFITS = [
  {
    title: "Video analysis",
    description: "4 video analyses per month from our professional trainers",
  },
  {
    title: "Program",
    description:
      "Personalized research based programs that are continuously optimized",
  },
  {
    title: "Community",
    description: "Access to an exclusive forum with professionals active",
  },
];

const PLAN_LABELS = ["Expert plan", "Pro plan", "Starter plan"];
const PLAN_PRICE_LABELS = ["2990 kr / year", "290 kr / month", "80 kr / week"];
const PLAN_SAVINGS_LABELS = ["save 16%", "save 12 %", ""];
const BENEFIT_ITEM_WIDTH = 100;
const BENEFIT_ITEM_GAP = 26;
const BENEFIT_ROW_WIDTH =
  MEMBERSHIP_BENEFITS.length * BENEFIT_ITEM_WIDTH +
  (MEMBERSHIP_BENEFITS.length - 1) * BENEFIT_ITEM_GAP;

export default function SubscriptionPlanView({ onCheckoutSuccess, returnTo = "" }) {
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [selectedPlanKey, setSelectedPlanKey] = useState("");
  const [error, setError] = useState(null);

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
    <View style={styles.screen}>
      <View style={styles.heading}>
        <StandardText fontSize={30} center>
          Become a member to get generate your plan
        </StandardText>
        <View style={styles.benefitList}>
          {MEMBERSHIP_BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefitItem}>
              <StandardText fontSize={18} center>
                {benefit.title}
              </StandardText>
              <View style={styles.benefitUnderline} />
              <StandardText style={styles.benefitDescription} fontSize={13} center>
                {benefit.description}
              </StandardText>
            </View>
          ))}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loadingPlans ? (
        <Text style={styles.statusCopy}>Loading subscription plans...</Text>
      ) : null}
      {!loadingPlans && !error && plans.length === 0 ? (
        <Text style={styles.statusCopy}>
          No subscription plans are currently available.
        </Text>
      ) : null}

      <View style={styles.planOptions}>
        {plans.map((plan, index) => (
          <View key={plan.lookupKey || plan.priceId || index} style={styles.planRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (!loadingPlan && plan.lookupKey) {
                  setSelectedPlanKey(plan.lookupKey);
                }
              }}
              disabled={Boolean(loadingPlan) || !plan.lookupKey}
              style={styles.product}
            >
              <View style={styles.description}>
                <StandardText style={styles.planName} fontSize={22}>
                  {PLAN_LABELS[index] || plan.name || "Subscription plan"}
                </StandardText>
                <View style={styles.priceRow}>
                  <StandardText style={styles.planPrice} fontSize={16}>
                    {PLAN_PRICE_LABELS[index] ||
                      plan.priceLabel ||
                      "Price unavailable"}
                  </StandardText>
                  {PLAN_SAVINGS_LABELS[index] ? (
                    <View style={styles.savingsPill}>
                      <GoldGradient style={styles.savingsGradient}>
                        <StandardText
                          style={styles.savingsLabel}
                          fontSize={14}
                          textColor="#000000"
                          center
                        >
                          {PLAN_SAVINGS_LABELS[index]}
                        </StandardText>
                      </GoldGradient>
                    </View>
                  ) : null}
                </View>
              </View>
              <View
                style={[
                  styles.selectionCircle,
                  selectedPlanKey === plan.lookupKey
                    ? styles.selectionCircleSelected
                    : null,
                ]}
              >
                {selectedPlanKey === plan.lookupKey ? (
                  <View style={styles.selectionDot} />
                ) : null}
              </View>
            </TouchableOpacity>
            {index < plans.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
      {selectedPlanKey ? (
        <>
          <View style={styles.checkoutNotes}>
            <View style={styles.checkoutNoteItem}>
              <Image source={securityIcon} style={styles.checkoutNoteIcon} />
              <StandardText style={styles.checkoutNoteText} fontSize={13} center>
                Cancelable anytime
              </StandardText>
            </View>
            <View style={styles.checkoutNoteItem}>
              <Image source={refreshIcon} style={styles.checkoutNoteIcon} />
              <StandardText style={styles.checkoutNoteText} fontSize={13} center>
                First 7 days for free
              </StandardText>
            </View>
            <View style={styles.checkoutNoteItem}>
              <Image source={securityIcon} style={styles.checkoutNoteIcon} />
              <StandardText style={styles.checkoutNoteText} fontSize={13} center>
                Secure payments
              </StandardText>
            </View>
          </View>
          <QuestionnaireBottomActionButton
            text={loadingPlan ? "Processing..." : "Checkout"}
            canContinue
            onContinue={() => {
              if (!loadingPlan) {
                handleCheckout(selectedPlanKey);
              }
            }}
            onBack={() => {}}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 100,
  },
  heading: {
    minHeight: 320,
    justifyContent: "center",
    paddingHorizontal: 26,
    gap: 56,
  },
  benefitList: {
    flexDirection: "row",
    justifyContent: "center",
    gap: BENEFIT_ITEM_GAP,
  },
  benefitItem: {
    width: BENEFIT_ITEM_WIDTH,
    alignItems: "center",
    gap: 6,
  },
  benefitUnderline: {
    width: "100%",
    height: 1,
    backgroundColor: "#ffffff",
  },
  benefitDescription: {
    lineHeight: 16,
  },
  error: { color: "#dc2626" },
  statusCopy: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#374151",
    fontSize: 14,
  },
  planOptions: {
    position: "absolute",
    bottom: 172,
    alignSelf: "center",
  },
  planRow: {
    width: BENEFIT_ROW_WIDTH,
    alignSelf: "center",
  },
  product: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  description: { flex: 1, gap: 4 },
  planName: {
    color: "#ffffff",
  },
  planPrice: { fontSize: 14, fontWeight: "600" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  savingsPill: {
    width: 72,
    height: 24,
    borderRadius: 999,
    overflow: "hidden",
    position: "relative",
  },
  savingsGradient: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  savingsLabel: {
    lineHeight: 18,
  },
  selectionCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#585858",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  selectionCircleSelected: {
    borderColor: "#ffffff",
  },
  selectionDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D4AF37",
  },
  checkoutNotes: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: BENEFIT_ROW_WIDTH,
    gap: 10,
  },
  checkoutNoteItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  checkoutNoteIcon: {
    width: 18,
    height: 18,
    tintColor: "#ffffff",
  },
  checkoutNoteText: {
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  divider: { height: 1, backgroundColor: "rgba(0,0,0,0.1)" },
});
