import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { MyProfileView } from "../../src/screens/MyProfileView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import {
  areTrainingPreferencesEqual,
  getTrainingPreferencesFormState,
  mergeTrainingPreferences,
  normalizeTrainingPreferences,
} from "../../src/constants/trainingPreferences.js";
import { PRIMARY_COMBAT_SPORT_OPTIONS } from "../../src/constants/combatSports.js";

function getSyncedTrainingPreferences(questionnaire = {}, sessionsPerWeek = 3) {
  const resolvedSessionsPerWeek = Number.parseInt(sessionsPerWeek, 10) || 3;
  const formState = getTrainingPreferencesFormState({
    ...questionnaire,
    daysPerWeek: resolvedSessionsPerWeek,
  });

  return {
    ...formState,
    preferredWeekdays: Array.from(
      { length: resolvedSessionsPerWeek },
      (_, index) => formState.preferredWeekdays[index] || ""
    ),
  };
}

export const ProfileScreen = observer(function ProfileScreen({ mode = "main" }) {
  const model = reactiveModel;
  const router = useRouter();

  const user = model?.user || {};

  function isGoogleUserACB() {
    const providers = user?.providerData || [];
    return providers.some((p) => p?.providerId === "google.com");
  }

  const isGoogleUser = useMemo(isGoogleUserACB, [user?.providerData]);

  const [username, setUsername] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [passwordResetMessage, setPasswordResetMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trainingPreferences, setTrainingPreferences] = useState(
    getSyncedTrainingPreferences(model.questionnaire || {}, model.sessionsPerWeek || 3)
  );
  const [primaryCombatSport, setPrimaryCombatSport] = useState(
    model.primaryCombatSport || ""
  );
  const [sessionsPerWeek, setSessionsPerWeek] = useState(model.sessionsPerWeek || 3);

  // Keep form in sync if currentUser changes
  useEffect(
    function syncFormWithModelACB() {
      setUsername(user.displayName || "");
      setEmail(user.email || "");
      setPassword("");
      setPasswordResetMessage(null);
      setTrainingPreferences(
        getSyncedTrainingPreferences(model.questionnaire || {}, model.sessionsPerWeek || 3)
      );
      setPrimaryCombatSport(model.primaryCombatSport || "");
      setSessionsPerWeek(model.sessionsPerWeek || 3);
    },
    [user.displayName, user.email, model.primaryCombatSport, model.questionnaire, model.sessionsPerWeek]
  );

  const persistedTrainingPreferences = useMemo(
    function persistedTrainingPreferencesACB() {
      return normalizeTrainingPreferences({
        ...(model.questionnaire || {}),
        daysPerWeek: model.sessionsPerWeek || 3,
      });
    },
    [model.questionnaire, model.sessionsPerWeek]
  );

  const subscriptionText = useMemo(
    function subscriptionTextACB() {
      const daysRemaining = model.getDaysRemainingInSubscription?.() || 0;

      if (daysRemaining <= 0) {
        return "No active subscription";
      }

      const endDate = model.getSubscriptionEndDate?.();
      if (daysRemaining === 1) {
        return `Active - expires ${endDate} (1 day remaining)`;
      } else {
        return `Active - expires ${endDate} (${daysRemaining} days remaining)`;
      }
    },
    [model.subscription, model.subscriptionEndDate]
  );

  const subscriptionDaysRemaining = useMemo(
    function subscriptionDaysRemainingACB() {
      return model.getDaysRemainingInSubscription?.() || 0;
    },
    [model.subscription, model.subscriptionEndDate]
  );

  const isSubscriptionActive = useMemo(
    function isSubscriptionActiveACB() {
      return subscriptionDaysRemaining > 0;
    },
    [subscriptionDaysRemaining]
  );

  const subscriptionPlanName = useMemo(
    function subscriptionPlanNameACB() {
      return isSubscriptionActive ? "Pro Plan" : "No Plan";
    },
    [isSubscriptionActive]
  );

  const subscriptionTimeRemainingText = useMemo(
    function subscriptionTimeRemainingTextACB() {
      if (!isSubscriptionActive) {
        return "No subscription";
      }

      return subscriptionDaysRemaining === 1
        ? "1 day remaining"
        : `${subscriptionDaysRemaining} days remaining`;
    },
    [isSubscriptionActive, subscriptionDaysRemaining]
  );

  const canSave = useMemo(
    function canSaveACB() {
      const changed =
        username !== (user.displayName || "") ||
        (!isGoogleUser && password.length > 0) ||
        primaryCombatSport !== (model.primaryCombatSport || "") ||
        sessionsPerWeek !== (model.sessionsPerWeek || 3) ||
        !areTrainingPreferencesEqual(
          trainingPreferences,
          persistedTrainingPreferences
        );

      const valid = username.trim().length > 0;
      return changed && valid;
    },
    [
      isGoogleUser,
      password,
      persistedTrainingPreferences,
      primaryCombatSport,
      sessionsPerWeek,
      trainingPreferences,
      model.primaryCombatSport,
      model.sessionsPerWeek,
      user.displayName,
      username,
    ]
  );

  if (!model.ready) {
    return (
      <View style={styles.container}>
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

  async function saveACB() {
    setError(null);
    setPasswordResetMessage(null);
    setIsSubmitting(true);

    try {
      await model.updateProfile({
        displayName: username,
        password: password,
        isGoogleUser: isGoogleUser,
      });
      const nextQuestionnaire = mergeTrainingPreferences(
        model.questionnaire,
        {
          ...trainingPreferences,
          daysPerWeek: sessionsPerWeek,
          primaryCombatSport,
          sessionsPerWeek,
        }
      );
      model.primaryCombatSport = primaryCombatSport;
      model.sessionsPerWeek = sessionsPerWeek;
      model.setQuestionnaire?.(nextQuestionnaire);
      model.applySportLoadSettingToFollowingWeek?.();
      setTrainingPreferences(
        getSyncedTrainingPreferences(nextQuestionnaire, sessionsPerWeek)
      );
      if (
        mode !== "main" &&
        mode !== "personalDetails" &&
        mode !== "planAdjustments" &&
        mode !== "eventPreparation"
      ) {
        router.push("/(tabs)/profile");
      }
    } catch (e) {
      setError(e.message || "Update failed.");
    } finally {
      setIsSubmitting(false);
      setPassword("");
    }
  }

  function resetUnsavedChangesACB() {
    setError(null);
    setPasswordResetMessage(null);
    setUsername(user.displayName || "");
    setPassword("");
    setTrainingPreferences(
      getSyncedTrainingPreferences(model.questionnaire || {}, model.sessionsPerWeek || 3)
    );
    setPrimaryCombatSport(model.primaryCombatSport || "");
    setSessionsPerWeek(model.sessionsPerWeek || 3);
  }

  function cancelACB() {
    resetUnsavedChangesACB();
    if (
      mode !== "main" &&
      mode !== "personalDetails" &&
      mode !== "planAdjustments" &&
      mode !== "eventPreparation"
    ) {
      router.push("/(tabs)/profile");
    }
  }

  function changeSessionsPerWeekACB(nextSessionsPerWeek) {
    setSessionsPerWeek(nextSessionsPerWeek);
    setTrainingPreferences((currentPreferences) =>
      getSyncedTrainingPreferences(currentPreferences, nextSessionsPerWeek)
    );
  }

  function clearEventPreparationACB() {
    const nextTrainingPreferences = {
      ...trainingPreferences,
      eventPreparation: "",
    };
    const nextQuestionnaire = mergeTrainingPreferences(model.questionnaire, {
      ...nextTrainingPreferences,
      daysPerWeek: sessionsPerWeek,
      primaryCombatSport,
      sessionsPerWeek,
    });

    model.primaryCombatSport = primaryCombatSport;
    model.sessionsPerWeek = sessionsPerWeek;
    model.setQuestionnaire?.(nextQuestionnaire);
    setTrainingPreferences(
      getSyncedTrainingPreferences(nextQuestionnaire, sessionsPerWeek)
    );
  }

  function changeSubscriptionACB() {
    router.push({
      pathname: "/(tabs)/subscription",
      params: { returnTo: "/(tabs)/profile" },
    });
  }

  function openPersonalDetailsACB() {
    router.push("/(tabs)/profile-personal-details");
  }

  function openPlanAdjustmentsACB() {
    router.push("/(tabs)/profile-plan-adjustments");
  }

  function openEventPreparationACB() {
    router.push("/(tabs)/profile-event-preparation");
  }

  function openInjuriesACB() {
    router.push("/(tabs)/profile-injuries");
  }

  function backToProfileACB() {
    resetUnsavedChangesACB();
    router.push("/(tabs)/profile");
  }

  async function logoutACB() {
    setError(null);
    setPasswordResetMessage(null);
    setIsSubmitting(true);

    try {
      await model.submitLogout();
    } catch (e) {
      console.error(e);
      setError(e.message || "Logout failed.");
      setIsSubmitting(false);
      return;
    }

    if (model.user) {
      setIsSubmitting(false);
    }
  }

  async function sendPasswordResetACB() {
    const resetEmail = (email || user.email || "").trim();

    if (!resetEmail) {
      setError("No e-mail address is available for this account.");
      setPasswordResetMessage(null);
      return;
    }

    setError(null);
    setPasswordResetMessage(null);
    setIsSubmitting(true);

    try {
      await model.submitPasswordReset(resetEmail);
      setPasswordResetMessage("Password reset e-mail sent.");
    } catch (e) {
      setError(e.message || "Could not send password reset e-mail.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <MyProfileView
        mode={mode}
        username={username}
        email={email}
        password={password}
        subscriptionPlanName={subscriptionPlanName}
        subscriptionTimeRemainingText={subscriptionTimeRemainingText}
        subscriptionText={subscriptionText}
        isSubscriptionActive={isSubscriptionActive}
        isSubmitting={isSubmitting}
        error={error}
        passwordResetMessage={passwordResetMessage}
        canSave={canSave}
        trainingPreferences={trainingPreferences}
        combatSportOptions={PRIMARY_COMBAT_SPORT_OPTIONS}
        primaryCombatSport={primaryCombatSport}
        sessionsPerWeek={sessionsPerWeek}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onPasswordReset={sendPasswordResetACB}
        onTrainingPreferencesChange={setTrainingPreferences}
        onPrimaryCombatSportChange={setPrimaryCombatSport}
        onSessionsPerWeekChange={changeSessionsPerWeekACB}
        onClearEventPreparation={clearEventPreparationACB}
        onSave={saveACB}
        onCancel={cancelACB}
        onChangeSubscription={changeSubscriptionACB}
        onOpenPersonalDetails={openPersonalDetailsACB}
        onOpenPlanAdjustments={openPlanAdjustmentsACB}
        onOpenEventPreparation={openEventPreparationACB}
        onOpenInjuries={openInjuriesACB}
        onBack={backToProfileACB}
        onLogout={logoutACB}
        hidePassword={isGoogleUser}
      />
    </View>
  );
});

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
