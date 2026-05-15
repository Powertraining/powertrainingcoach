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

const ProfileScreen = observer(function ProfileScreen() {
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trainingPreferences, setTrainingPreferences] = useState(
    getTrainingPreferencesFormState(model.questionnaire || {})
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
      setTrainingPreferences(getTrainingPreferencesFormState(model.questionnaire || {}));
      setPrimaryCombatSport(model.primaryCombatSport || "");
      setSessionsPerWeek(model.sessionsPerWeek || 3);
    },
    [user.displayName, user.email, model.primaryCombatSport, model.questionnaire, model.sessionsPerWeek]
  );

  const persistedTrainingPreferences = useMemo(
    function persistedTrainingPreferencesACB() {
      return normalizeTrainingPreferences(model.questionnaire || {});
    },
    [model.questionnaire]
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
        return "No time remaining";
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
          primaryCombatSport,
          sessionsPerWeek,
        }
      );
      model.primaryCombatSport = primaryCombatSport;
      model.sessionsPerWeek = sessionsPerWeek;
      model.setQuestionnaire?.(nextQuestionnaire);
      model.applySportLoadSettingToFollowingWeek?.();
      setTrainingPreferences(getTrainingPreferencesFormState(nextQuestionnaire));
    } catch (e) {
      setError(e.message || "Update failed.");
    } finally {
      setIsSubmitting(false);
      setPassword("");
    }
  }

  function cancelACB() {
    setError(null);
    setUsername(user.displayName || "");
    setPassword("");
    setTrainingPreferences(getTrainingPreferencesFormState(model.questionnaire || {}));
    setPrimaryCombatSport(model.primaryCombatSport || "");
    setSessionsPerWeek(model.sessionsPerWeek || 3);
  }

  function changeSubscriptionACB() {
    router.push({
      pathname: "/(tabs)/subscription",
      params: { returnTo: "/(tabs)/profile" },
    });
  }

  async function logoutACB() {
    setError(null);
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

  return (
    <View style={styles.container}>
      <MyProfileView
        username={username}
        email={email}
        password={password}
        subscriptionPlanName={subscriptionPlanName}
        subscriptionTimeRemainingText={subscriptionTimeRemainingText}
        subscriptionText={subscriptionText}
        isSubscriptionActive={isSubscriptionActive}
        isSubmitting={isSubmitting}
        error={error}
        canSave={canSave}
        trainingPreferences={trainingPreferences}
        combatSportOptions={PRIMARY_COMBAT_SPORT_OPTIONS}
        primaryCombatSport={primaryCombatSport}
        sessionsPerWeek={sessionsPerWeek}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTrainingPreferencesChange={setTrainingPreferences}
        onPrimaryCombatSportChange={setPrimaryCombatSport}
        onSessionsPerWeekChange={setSessionsPerWeek}
        onSave={saveACB}
        onCancel={cancelACB}
        onChangeSubscription={changeSubscriptionACB}
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
