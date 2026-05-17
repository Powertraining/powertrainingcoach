import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";

import SubscriptionDetailsView from "../../src/screens/profile/SubscriptionDetailsView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import {
  createPortalSession,
  refreshSubscriptionStatus,
} from "../../src/services/utils/stripeClient.js";

const PLAN_NAME_BY_LOOKUP_KEY = {
  starter_plan_setup: "Starter Plan",
  pro_plan_setup: "Pro Plan",
  expert_plan_setup: "Expert Plan",
};

function parseDateOnly(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function formatSubscribedDuration(startDateValue) {
  const startDate = parseDateOnly(startDateValue);

  if (!startDate) {
    return "";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const elapsedDays = Math.max(
    0,
    Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
  );

  if (elapsedDays === 0) {
    return "Member since today";
  }

  if (elapsedDays === 1) {
    return "Member for 1 day";
  }

  return `Member for ${elapsedDays} days`;
}

function formatNextBilling(value) {
  const date = parseDateOnly(value);

  if (!date) {
    return "Next billing date unavailable";
  }

  return `Next billing: ${new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date)}`;
}

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

  const planName = useMemo(
    () => PLAN_NAME_BY_LOOKUP_KEY[model.stripePriceLookupKey] || "Pro Plan",
    [model.stripePriceLookupKey]
  );
  const subscribedText = useMemo(
    () => formatSubscribedDuration(model.subscriptionStartDate),
    [model.subscriptionStartDate]
  );
  const nextBillingText = useMemo(
    () => formatNextBilling(model.subscriptionEndDate),
    [model.subscriptionEndDate]
  );

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
