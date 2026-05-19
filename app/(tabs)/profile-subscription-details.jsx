import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";

import SubscriptionDetailsView from "../../src/screens/profile/SubscriptionDetailsView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import {
  createPortalSession,
  refreshSubscriptionStatus,
} from "../../src/services/utils/stripeClient.js";

const ProfileSubscriptionDetailsScreen = observer(function ProfileSubscriptionDetailsScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const refreshAttemptedRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (
      !model.ready ||
      !model.user ||
      model.getDaysRemainingInSubscription?.() <= 0 ||
      (model.subscriptionStartDate && model.stripePriceLookupKey) ||
      refreshAttemptedRef.current
    ) {
      return;
    }

    refreshAttemptedRef.current = true;
    refreshSubscriptionStatus()
      .then((result) => {
        if (!result?.refreshed) {
          return;
        }

        model.applySubscriptionState?.({
          subscription: result.active,
          subscriptionEndDate: result.subscriptionEndDate,
          subscriptionStartDate: result.subscriptionStartDate,
          subscriptionType: result.subscriptionType,
          lookupKey: result.lookupKey,
        });
      })
      .catch((refreshError) => {
        console.warn("Could not refresh Stripe subscription status:", refreshError);
      });
  }, [
    model,
    model.ready,
    model.user,
    model.subscriptionStartDate,
    model.stripePriceLookupKey,
    model.subscriptionEndDate,
  ]);

  const planName = model.getSubscriptionPlanName?.() || "No Plan";
  const subscribedText = model.getSubscriptionMemberDurationText?.() || "";
  const nextBillingText =
    model.getSubscriptionNextBillingText?.() || "Next billing date unavailable";

  function backToProfile() {
    router.push("/(tabs)/profile");
  }

  async function openBillingPortal() {
    setIsSubmitting(true);
    setError(null);

    try {
      await createPortalSession({});
    } catch (portalError) {
      setError(portalError.message || "Could not open billing settings.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SubscriptionDetailsView
      planName={planName}
      subscribedText={subscribedText}
      nextBillingText={nextBillingText}
      isSubmitting={isSubmitting}
      error={error}
      onBack={backToProfile}
      onChangePaymentMethod={openBillingPortal}
      onCancelSubscription={openBillingPortal}
    />
  );
});

export default ProfileSubscriptionDetailsScreen;
