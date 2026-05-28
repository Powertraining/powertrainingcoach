import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import SubscriptionDetailsView from "../../src/screens/profile/SubscriptionDetailsView.jsx";
import ExpandingRouteView from "../../src/components/navigation/ExpandingRouteView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { getAnalysisForumSlotFromExerciseId } from "../../src/services/models/forumModel.js";
import {
  createPortalSession,
  refreshSubscriptionStatus,
} from "../../src/services/utils/stripeClient.js";
import { getSafeReturnToPath } from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

const ProfileSubscriptionDetailsScreen = observer(function ProfileSubscriptionDetailsScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const returnTo = getSafeReturnToPath(params, "/(tabs)/profile");
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

    const refreshUid = model.user.uid;
    refreshAttemptedRef.current = true;
    refreshSubscriptionStatus()
      .then((result) => {
        if (!result?.refreshed || model.user?.uid !== refreshUid) {
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
  const currentMonthAnalysisPosts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return (model.forumAnalysisPosts || []).filter((post) => {
      const createdAt = Date.parse(post?.createdAt || "");

      if (!Number.isFinite(createdAt)) {
        return false;
      }

      const createdDate = new Date(createdAt);
      return (
        createdDate.getMonth() === currentMonth &&
        createdDate.getFullYear() === currentYear
      );
    });
  }, [model.forumAnalysisPosts]);
  const analysisPostsBySlot = useMemo(() => {
    return currentMonthAnalysisPosts.reduce((postsBySlot, post) => {
      const slot = getAnalysisForumSlotFromExerciseId(post?.exerciseId);

      if (slot && !postsBySlot[slot]) {
        postsBySlot[slot] = post;
      }

      return postsBySlot;
    }, {});
  }, [currentMonthAnalysisPosts]);
  const analysesLeftThisMonth = Math.max(0, 4 - currentMonthAnalysisPosts.length);

  useFocusEffect(
    useCallback(() => {
      if (!model.ready || !model.user) {
        return undefined;
      }

      model.loadMyAnalysisForumPosts?.().catch((analysisError) => {
        console.warn("Could not load exercise analysis posts:", analysisError);
      });

      return undefined;
    }, [model, model.ready, model.user])
  );

  function backToProfile() {
    router.replace(returnTo);
  }

  useAndroidBackHandler(backToProfile, [returnTo, router]);

  function openExerciseAnalysisForm(slot, existingPost = null) {
    if (existingPost?.id) {
      router.push({
        pathname: "/(tabs)/profile-exercise-analysis-post",
        params: {
          postId: existingPost.id,
          returnTo: "/(tabs)/profile-subscription-details",
        },
      });
      return;
    }

    router.push({
      pathname: "/(tabs)/profile-exercise-analysis",
      params: {
        returnTo: "/(tabs)/profile-subscription-details",
        slot: String(slot || ""),
      },
    });
  }

  function openExerciseAnalysisArchive() {
    router.push({
      pathname: "/(tabs)/profile-exercise-analyses",
      params: {
        returnTo: "/(tabs)/profile-subscription-details",
      },
    });
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
    <ExpandingRouteView routeKey="profile-subscription-details">
      <SubscriptionDetailsView
        planName={planName}
        subscribedText={subscribedText}
        nextBillingText={nextBillingText}
        isSubmitting={isSubmitting}
        error={error}
        onBack={backToProfile}
        onChangePaymentMethod={openBillingPortal}
        onCancelSubscription={openBillingPortal}
        onPressAnalysisSlot={openExerciseAnalysisForm}
        analysisPostsBySlot={analysisPostsBySlot}
        analysesLeftThisMonth={analysesLeftThisMonth}
        onShowAllAnalyses={openExerciseAnalysisArchive}
      />
    </ExpandingRouteView>
  );
});

export default ProfileSubscriptionDetailsScreen;
