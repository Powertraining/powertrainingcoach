import { useEffect, useMemo, useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BlackGradient from "../components/colorComponents/BlackGradient.jsx";
import SubscriptionCard from "../components/profileComponents/SubscriptionCard.jsx";
import MembershipPlanOption from "../components/subscriptionComponents/MembershipPlanOption.jsx";
import {
  createCheckoutSession,
  listSubscriptionPlans,
} from "../services/utils/stripeClient.js";

const PLAN_OPTIONS = [
  {
    lookupKey: "expert_plan_setup",
    title: "EXPERT PLAN",
    badge: "SAVE 16%",
  },
  {
    lookupKey: "pro_plan_setup",
    title: "PRO PLAN",
    badge: "SAVE 12%",
  },
  {
    lookupKey: "starter_plan_setup",
    title: "STARTER PLAN",
  },
];
const DEFAULT_SELECTED_PLAN_KEY = "pro_plan_setup";

const TRUST_ITEMS = [
  { label: "CANCEL ANYTIME", icon: "shield" },
  { label: "7 DAYS FREE", icon: "recycle" },
  { label: "SECURE PAYMENTS", icon: "shield" },
];

function normalizeLookupKey(plan = {}) {
  return plan.lookupKey || plan.lookup_key || plan.key || "";
}

function normalizeTitle(value, fallback) {
  const title = typeof value === "string" && value.trim() ? value : fallback;
  return title.toUpperCase();
}

function TrustBenefitIcon({ type }) {
  if (type === "recycle") {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M17.7 7.1A7 7 0 0 0 5.9 8.8"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
        <Path
          d="M17.6 3.8v3.6h-3.6"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
        <Path
          d="M6.3 16.9a7 7 0 0 0 11.8-1.7"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
        <Path
          d="M6.4 20.2v-3.6h3.6"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.4}
        />
      </Svg>
    );
  }

  return (
    <Svg width={23} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.2 19 6v5.2c0 4.3-2.8 7.8-7 9.6-4.2-1.8-7-5.3-7-9.6V6l7-2.8Z"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.4}
      />
    </Svg>
  );
}

export default function SubscriptionPlanView({
  onBack,
  onCheckoutSuccess,
  returnTo = "",
}) {
  const insets = useSafeAreaInsets();
  const [remotePlans, setRemotePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState(null);
  const [selectedPlanKey, setSelectedPlanKey] = useState(
    DEFAULT_SELECTED_PLAN_KEY
  );

  useEffect(() => {
    let cancelled = false;

    setError(null);
    setLoadingPlans(true);

    listSubscriptionPlans()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setRemotePlans(Array.isArray(data?.plans) ? data.plans : []);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setError(err.message || "Failed to load subscription plans.");
        setRemotePlans([]);
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

  const plans = useMemo(() => {
    const remotePlanByKey = new Map(
      remotePlans
        .map((plan) => [normalizeLookupKey(plan), plan])
        .filter(([lookupKey]) => Boolean(lookupKey))
    );

    return PLAN_OPTIONS.map((option) => {
      const remotePlan = remotePlanByKey.get(option.lookupKey) || {};

      return {
        ...option,
        title: normalizeTitle(remotePlan.name, option.title),
        description: remotePlan.description || "",
        price: loadingPlans
          ? "Loading price..."
          : remotePlan.priceLabel || "Price unavailable",
        priceId: remotePlan.priceId,
        isAvailable:
          loadingPlans ||
          remotePlanByKey.has(option.lookupKey),
      };
    });
  }, [loadingPlans, remotePlans]);

  const visiblePlans = useMemo(
    () => plans.filter((plan) => loadingPlans || plan.isAvailable),
    [loadingPlans, plans]
  );
  const selectedPlan = plans.find((plan) => plan.lookupKey === selectedPlanKey);
  const isCheckoutDisabled =
    loadingPlans ||
    Boolean(loadingPlan) ||
    !selectedPlan?.lookupKey ||
    !selectedPlan?.isAvailable;
  const showCheckoutBar = Boolean(
    selectedPlan?.lookupKey && selectedPlan?.isAvailable
  );

  useEffect(() => {
    if (loadingPlans) {
      return;
    }

    if (
      selectedPlanKey &&
      !selectedPlan?.isAvailable &&
      visiblePlans[0]?.lookupKey
    ) {
      setSelectedPlanKey(visiblePlans[0].lookupKey);
    }
  }, [loadingPlans, selectedPlan?.isAvailable, selectedPlanKey, visiblePlans]);

  async function handleCheckout() {
    if (!selectedPlan?.lookupKey || isCheckoutDisabled) {
      return;
    }

    setLoadingPlan(selectedPlan.lookupKey);
    setError(null);

    try {
      const checkoutData = await createCheckoutSession(
        selectedPlan.lookupKey,
        returnTo
      );

      if (!checkoutData?.checkoutUrl) {
        throw new Error("Stripe did not return a valid Checkout URL.");
      }

      onCheckoutSuccess?.({
        planKey: selectedPlan.lookupKey,
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
      <BlackGradient />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: Math.max(insets.bottom + 26, 44),
          },
        ]}
      >
        {onBack ? (
          <View style={styles.pageHeader}>
            <TouchableOpacity
              onPress={onBack}
              disabled={Boolean(loadingPlan)}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.headerBenefitsSection}>
          <SubscriptionCard
            planName="BECOME A MEMBER TO GENERATE YOUR PLAN"
            planLabelStyle={styles.subscriptionCardPlanLabel}
            showBackground={false}
            showActions={false}
            showBraces={false}
            isSubmitting={Boolean(loadingPlan)}
          />
        </View>

        <View style={styles.planSection}>
          {visiblePlans.map((plan) => (
            <MembershipPlanOption
              key={plan.lookupKey}
              title={plan.title}
              price={plan.price}
              badge={plan.badge}
              selected={selectedPlanKey === plan.lookupKey}
              disabled={Boolean(loadingPlan) || !plan.isAvailable}
              onPress={() => {
                if (plan.isAvailable) {
                  setSelectedPlanKey((currentPlanKey) =>
                    currentPlanKey === plan.lookupKey ? "" : plan.lookupKey
                  );
                }
              }}
            />
          ))}
        </View>

        {!loadingPlans && !error && visiblePlans.length === 0 ? (
          <Text style={styles.statusCopy}>
            No subscription plans are currently available.
          </Text>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.trustRow}>
          {TRUST_ITEMS.map((item) => (
            <View key={item.label} style={styles.trustItem}>
              <View style={styles.trustIcon}>
                <TrustBenefitIcon type={item.icon} />
              </View>
              <Text
                numberOfLines={1}
                style={styles.trustText}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {showCheckoutBar ? (
        <View
          style={[
            styles.checkoutBar,
            { paddingBottom: Math.max(insets.bottom, 14) },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.82}
            disabled={isCheckoutDisabled}
            onPress={handleCheckout}
            style={[
              styles.checkoutButton,
              isCheckoutDisabled ? styles.checkoutButtonDisabled : null,
            ]}
          >
            <Text style={styles.checkoutButtonText}>
              {loadingPlan ? "PROCESSING..." : "CHECKOUT"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 20,
  },
  pageHeader: {
    gap: 14,
  },
  backButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  subscriptionCardPlanLabel: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  headerBenefitsSection: {
    flex: 1,
    justifyContent: "center",
  },
  planSection: {
    gap: 12,
  },
  statusCopy: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },
  trialCopy: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 18,
    textAlign: "center",
  },
  error: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    marginTop: 18,
    textAlign: "center",
  },
  checkoutBar: {
    bottom: 0,
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    position: "absolute",
    right: 0,
  },
  checkoutButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    justifyContent: "center",
    marginBottom: 18,
    minHeight: 60,
    paddingHorizontal: 20,
    paddingVertical: 14,
    width: "82%",
  },
  checkoutButtonDisabled: {
    opacity: 0.58,
  },
  checkoutButtonText: {
    color: "#141414",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 21,
  },
  trustRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
    marginTop: 24,
    paddingTop: 12,
  },
  trustItem: {
    alignItems: "center",
    flex: 1,
    gap: 7,
    minWidth: 0,
  },
  trustIcon: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  trustText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 13,
    textAlign: "center",
  },
});
