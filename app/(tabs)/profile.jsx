import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { MyProfileView } from "../../src/screens/MyProfileView.jsx";
import QuestionnaireFrequencyView from "../../src/screens/questionnaire/QuestionnaireFrequencyView.jsx";
import QuestionnaireSportView from "../../src/screens/questionnaire/QuestionnaireSportView.jsx";
import AuthGateView from "../../src/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/LoadingView.jsx";
import {
  areTrainingPreferencesEqual,
  getTrainingPreferencesFormState,
  mergeTrainingPreferences,
  normalizeTrainingPreferences,
} from "../../src/constants/trainingPreferences.js";
import { PRIMARY_COMBAT_SPORT_OPTIONS } from "../../src/constants/combatSports.js";

const PROFILE_EDIT_MODES = Object.freeze({
  MAIN: "main",
  SPORT: "sport",
  FREQUENCY: "frequency",
});

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
  const [editMode, setEditMode] = useState(PROFILE_EDIT_MODES.MAIN);

  // Keep form in sync if currentUser changes
  useEffect(
    function syncFormWithModelACB() {
      setUsername(user.displayName || "");
      setEmail(user.email || "");
      setPassword("");
      setTrainingPreferences(getTrainingPreferencesFormState(model.questionnaire || {}));
      setPrimaryCombatSport(model.primaryCombatSport || "");
      setSessionsPerWeek(model.sessionsPerWeek || 3);
      setEditMode(PROFILE_EDIT_MODES.MAIN);
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

  if (editMode === PROFILE_EDIT_MODES.SPORT) {
    return (
      <QuestionnaireSportView
        options={PRIMARY_COMBAT_SPORT_OPTIONS}
        value={primaryCombatSport}
        onChange={(sport) => setPrimaryCombatSport(sport || "")}
        onBack={() => setEditMode(PROFILE_EDIT_MODES.MAIN)}
        onContinue={() => setEditMode(PROFILE_EDIT_MODES.MAIN)}
      />
    );
  }

  if (editMode === PROFILE_EDIT_MODES.FREQUENCY) {
    return (
      <QuestionnaireFrequencyView
        value={sessionsPerWeek}
        onChange={setSessionsPerWeek}
        onBack={() => setEditMode(PROFILE_EDIT_MODES.MAIN)}
        onContinue={() => setEditMode(PROFILE_EDIT_MODES.MAIN)}
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
    setEditMode(PROFILE_EDIT_MODES.MAIN);
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
        subscriptionText={subscriptionText}
        isSubmitting={isSubmitting}
        error={error}
        canSave={canSave}
        trainingPreferences={trainingPreferences}
        primaryCombatSport={primaryCombatSport}
        sessionsPerWeek={sessionsPerWeek}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onTrainingPreferencesChange={setTrainingPreferences}
        onEditPrimaryCombatSport={() => setEditMode(PROFILE_EDIT_MODES.SPORT)}
        onEditTrainingFrequency={() => setEditMode(PROFILE_EDIT_MODES.FREQUENCY)}
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
