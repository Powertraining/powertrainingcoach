import {
  useEffect,
  useMemo,
  useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams,
  useRouter } from "expo-router";
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
import {
  pickProfileImage,
  uploadProfileImage,
} from "../../src/services/utils/mediaUpload.js";
import { getSafeReturnToPath } from "../../src/services/utils/navigation.js";
import { useAndroidBackHandler } from "../../src/services/utils/useAndroidBackHandler.js";

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
  const params = useLocalSearchParams();
  const returnTo = getSafeReturnToPath(params, "/(tabs)/profile");

  const user = model?.user || {};

  function isGoogleUserACB() {
    const providers = user?.providerData || [];
    return providers.some((p) => p?.providerId === "google.com");
  }

  const isGoogleUser = useMemo(isGoogleUserACB, [user?.providerData]);

  const [username, setUsername] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(user.photoURL || "");
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
      setProfilePhotoUrl(user.photoURL || "");
      setPassword("");
      setPasswordResetMessage(null);
      setTrainingPreferences(
        getSyncedTrainingPreferences(model.questionnaire || {}, model.sessionsPerWeek || 3)
      );
      setPrimaryCombatSport(model.primaryCombatSport || "");
      setSessionsPerWeek(model.sessionsPerWeek || 3);
    },
    [user.displayName, user.email, user.photoURL, model.primaryCombatSport, model.questionnaire, model.sessionsPerWeek]
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

  const subscriptionText = model.getSubscriptionSummaryText?.() ||
    "No active subscription";
  const isSubscriptionActive = model.isSubscribed?.() || false;
  const subscriptionPlanName = model.getSubscriptionPlanName?.() || "No Plan";

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

  useAndroidBackHandler(() => {
    if (mode === "main") {
      return false;
    }

    backToProfileACB();
  }, [mode, returnTo, router]);

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

  async function saveACB(overrides = {}) {
    setError(null);
    setPasswordResetMessage(null);
    setIsSubmitting(true);

    try {
      const nextTrainingPreferencesState =
        overrides.trainingPreferences || trainingPreferences;
      const nextPrimaryCombatSport =
        overrides.primaryCombatSport ?? primaryCombatSport;
      const nextSessionsPerWeek =
        overrides.sessionsPerWeek ?? sessionsPerWeek;

      await model.updateProfile({
        displayName: username,
        password: password,
        isGoogleUser: isGoogleUser,
      });
      const nextQuestionnaire = mergeTrainingPreferences(
        model.questionnaire,
        {
          ...nextTrainingPreferencesState,
          daysPerWeek: nextSessionsPerWeek,
          primaryCombatSport: nextPrimaryCombatSport,
          sessionsPerWeek: nextSessionsPerWeek,
        }
      );
      model.primaryCombatSport = nextPrimaryCombatSport;
      model.sessionsPerWeek = nextSessionsPerWeek;
      model.setQuestionnaire?.(nextQuestionnaire);
      model.applySportLoadSettingToFollowingWeek?.();
      setTrainingPreferences(
        getSyncedTrainingPreferences(nextQuestionnaire, nextSessionsPerWeek)
      );
      if (
        mode !== "main" &&
        mode !== "personalDetails" &&
        mode !== "planAdjustments" &&
        mode !== "eventPreparation" &&
        mode !== "injuries"
      ) {
        router.push("/(tabs)/profile");
      }
    } catch (e) {
      const message = e.message || "Could not save your profile. Please try again.";
      setError(message);
      model.showError?.(e, "Could not save your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
      setPassword("");
    }
  }

  function resetUnsavedChangesACB() {
    setError(null);
    setPasswordResetMessage(null);
    setUsername(user.displayName || "");
    setProfilePhotoUrl(user.photoURL || "");
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

  function openSubscriptionDetailsACB() {
    router.push("/(tabs)/profile-subscription-details");
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

  function openSavedPostsACB() {
    router.push("/(tabs)/profile-saved-posts");
  }

  function openMyPostsACB() {
    router.push("/(tabs)/profile-my-posts");
  }

  function backToProfileACB() {
    resetUnsavedChangesACB();
    router.replace(returnTo);
  }

  async function logoutACB() {
    setError(null);
    setPasswordResetMessage(null);
    setIsSubmitting(true);

    try {
      await model.submitLogout();
      router.replace("/(auth)/auth");
    } catch (e) {
      console.error(e);
      const message = e.message || "Could not log out. Please try again.";
      setError(message);
      model.showError?.(e, "Could not log out. Please try again.");
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
      const message = "No e-mail address is available for this account.";
      setError(message);
      model.showError?.(message);
      setPasswordResetMessage(null);
      return;
    }

    setError(null);
    setPasswordResetMessage(null);
    setIsSubmitting(true);

    try {
      await model.submitPasswordReset(resetEmail);
      setPasswordResetMessage("Password reset e-mail sent.");
      model.showSuccess?.("Password reset e-mail sent.");
    } catch (e) {
      const message = e.message || "Could not send password reset e-mail.";
      setError(message);
      model.showError?.(e, "Could not send password reset e-mail.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changeProfilePhotoACB() {
    setError(null);
    setPasswordResetMessage(null);

    try {
      const asset = await pickProfileImage();

      if (!asset) {
        return;
      }

      setIsSubmitting(true);
      const uploadedImage = await uploadProfileImage({
        asset,
        ownerId: model.user?.uid,
      });

      await model.updateProfile({
        displayName: user.displayName || username,
        password: "",
        isGoogleUser,
        photoURL: uploadedImage.url,
      });
      setProfilePhotoUrl(uploadedImage.url);
    } catch (e) {
      const message = e.message || "Could not update profile picture.";
      setError(message);
      model.showError?.(e, "Could not update profile picture.");
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
        userPhotoUrl={profilePhotoUrl}
        password={password}
        subscriptionPlanName={subscriptionPlanName}
        subscriptionText={subscriptionText}
        isSubscriptionActive={isSubscriptionActive}
        hasProgram={Boolean(model.trainingPlan)}
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
        onProfilePhotoChange={changeProfilePhotoACB}
        onTrainingPreferencesChange={setTrainingPreferences}
        onPrimaryCombatSportChange={setPrimaryCombatSport}
        onSessionsPerWeekChange={changeSessionsPerWeekACB}
        onClearEventPreparation={clearEventPreparationACB}
        onSave={saveACB}
        onCancel={cancelACB}
        onChangeSubscription={changeSubscriptionACB}
        onOpenSubscriptionDetails={openSubscriptionDetailsACB}
        onOpenPersonalDetails={openPersonalDetailsACB}
        onOpenPlanAdjustments={openPlanAdjustmentsACB}
        onOpenEventPreparation={openEventPreparationACB}
        onOpenInjuries={openInjuriesACB}
        onOpenSavedPosts={openSavedPostsACB}
        onOpenMyPosts={openMyPostsACB}
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
