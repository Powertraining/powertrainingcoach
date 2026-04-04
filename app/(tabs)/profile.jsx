import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";

import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { MyProfileView } from "../../src/screens/screens/MyProfileView.jsx";
import AuthGateView from "../../src/screens/screens/auth/AuthGateView.jsx";
import LoadingView from "../../src/screens/screens/LoadingView.jsx";
import {
  areAppLogicSettingsEqual,
  getAppLogicSettingsFormState,
  mergeAppLogicSettings,
  normalizeAppLogicSettings,
} from "../../src/constants/appLogicSettings.js";

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
  const [appLogicSettings, setAppLogicSettings] = useState(
    getAppLogicSettingsFormState(model.questionnaire || {})
  );

  // Keep form in sync if currentUser changes
  useEffect(
    function syncFormWithModelACB() {
      setUsername(user.displayName || "");
      setEmail(user.email || "");
      setPassword("");
      setAppLogicSettings(getAppLogicSettingsFormState(model.questionnaire || {}));
    },
    [user.displayName, user.email, model.questionnaire]
  );

  const persistedAppLogicSettings = useMemo(
    function persistedAppLogicSettingsACB() {
      return normalizeAppLogicSettings(model.questionnaire || {});
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
        !areAppLogicSettingsEqual(appLogicSettings, persistedAppLogicSettings);

      const valid = username.trim().length > 0;
      return changed && valid;
    },
    [
      appLogicSettings,
      isGoogleUser,
      password,
      persistedAppLogicSettings,
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
      const nextQuestionnaire = mergeAppLogicSettings(
        model.questionnaire,
        appLogicSettings
      );
      model.setQuestionnaire?.(nextQuestionnaire);
      setAppLogicSettings(getAppLogicSettingsFormState(nextQuestionnaire));
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
    setAppLogicSettings(getAppLogicSettingsFormState(model.questionnaire || {}));
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
        appLogicSettings={appLogicSettings}
        onUsernameChange={setUsername}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onAppLogicSettingsChange={setAppLogicSettings}
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
