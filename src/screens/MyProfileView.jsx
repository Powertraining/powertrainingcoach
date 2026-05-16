import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Pressable,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RowCard from "../components/homeComponents/RowCard.jsx";
import SubscriptionCard from "../components/profileComponents/SubscriptionCard.jsx";
import BlackGradient from "../components/colorComponents/BlackGradient.jsx";
import ProfilePersonalDetailsView from "./profile/ProfilePersonalDetailsView.jsx";
import ProfilePlanAdjustmentsView from "./profile/ProfilePlanAdjustmentsView.jsx";
import TrainingPreferencesEventPreparationView from "./trainingPreferences/TrainingPreferencesEventPreparationView.jsx";
import TrainingPreferencesInjuriesView from "./trainingPreferences/TrainingPreferencesInjuriesView.jsx";

function ProfileNavigationCard({
  title,
  description,
  actionLabel,
  onPress,
  featured = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navigationCardButton,
        pressed ? styles.navigationCardButtonPressed : null,
      ]}
    >
      <RowCard style={styles.navigationCard}>
        <View style={styles.navigationCardContent}>
          <View style={styles.navigationCardCopy}>
            <Text numberOfLines={2} adjustsFontSizeToFit style={styles.navigationCardTitle}>
              {title}
            </Text>
            <Text numberOfLines={2} style={styles.navigationCardText}>
              {description}
            </Text>
          </View>
          <View style={[styles.navigationActionPill, featured ? styles.navigationActionPillFeatured : null]}>
            <Text style={[styles.navigationActionText, featured ? styles.navigationActionTextFeatured : null]}>
              {actionLabel}
            </Text>
            <Text style={[styles.navigationArrow, featured ? styles.navigationArrowFeatured : null]}>›</Text>
          </View>
        </View>
      </RowCard>
    </Pressable>
  );
}

export function MyProfileView(props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [isUsernameEditing, setIsUsernameEditing] = useState(false);
  const [isPasswordResetMenuVisible, setIsPasswordResetMenuVisible] = useState(false);
  const actionBarProgress = useRef(new Animated.Value(0)).current;
  const passwordResetSheetTranslateY = useRef(new Animated.Value(0)).current;
  const mode = props.mode || "main";
  const isMainMode = mode === "main";
  const isPersonalDetailsMode = mode === "personalDetails";
  const isPlanAdjustmentsMode = mode === "planAdjustments";
  const isEventPreparationMode = mode === "eventPreparation";
  const isInjuriesMode = mode === "injuries";
  const showInlineActions =
    !isPersonalDetailsMode && (!isMainMode || props.canSave || props.isSubmitting);
  const showFloatingActions = false;

  useEffect(
    function animateActionBarACB() {
      Animated.timing(actionBarProgress, {
        toValue: showFloatingActions ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [actionBarProgress, showFloatingActions]
  );

  useEffect(
    function resetPasswordResetSheetPositionACB() {
      if (isPasswordResetMenuVisible) {
        passwordResetSheetTranslateY.setValue(0);
      }
    },
    [isPasswordResetMenuVisible, passwordResetSheetTranslateY]
  );

  const actionBarTranslateY = actionBarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [96, 0],
  });
  const actionBarOpacity = actionBarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const passwordResetSheetDragResponder = useMemo(
    function passwordResetSheetDragResponderACB() {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            passwordResetSheetTranslateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 70 || gestureState.vy > 0.75) {
            Animated.timing(passwordResetSheetTranslateY, {
              toValue: Math.max(windowHeight / 3, 220),
              duration: 160,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start(closePasswordResetMenuACB);
            return;
          }

          Animated.spring(passwordResetSheetTranslateY, {
            toValue: 0,
            damping: 18,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        },
      });
    },
    [passwordResetSheetTranslateY, windowHeight]
  );

  function closeUsernameEditorACB() {
    Keyboard.dismiss();
    setIsUsernameEditing(false);
  }

  function openUsernameEditorACB() {
    setIsPasswordResetMenuVisible(false);
    setIsUsernameEditing(true);
  }

  function openPasswordResetMenuACB() {
    Keyboard.dismiss();
    setIsUsernameEditing(false);
    setIsPasswordResetMenuVisible(true);
  }

  function closePasswordResetMenuACB() {
    passwordResetSheetTranslateY.setValue(0);
    setIsPasswordResetMenuVisible(false);
  }

  function saveProfileACB() {
    closeUsernameEditorACB();
    props.onSave?.();
  }

  function cancelProfileACB() {
    closeUsernameEditorACB();
    props.onCancel?.();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        scrollEnabled={!isScrollLocked}
        style={[
          styles.scroll,
          isUsernameEditing ? styles.blurredContent : null,
        ]}
        contentContainerStyle={[
          styles.content,
          isPersonalDetailsMode ? styles.personalDetailsContentContainer : null,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: isMainMode
              ? Math.max(insets.bottom + 96, 120)
              : isPersonalDetailsMode
              ? Math.max(insets.bottom + 132, 156)
              : 24,
          },
        ]}
      >
        {isMainMode ? (
          <SubscriptionCard
            planName={props.subscriptionPlanName}
            timeRemainingText={props.subscriptionTimeRemainingText}
            subscriptionText={props.subscriptionText}
            isActive={props.isSubscriptionActive}
            isSubmitting={props.isSubmitting}
            onPress={props.onChangeSubscription}
          />
        ) : null}

        {isMainMode ? (
          <View style={styles.navigationRow}>
            <ProfileNavigationCard
              title="Personal Details"
              description="Account and login info"
              actionLabel="View"
              onPress={props.onOpenPersonalDetails}
            />

            <ProfileNavigationCard
              title="Plan Adjustments"
              description="Sport, schedule, and training logic"
              actionLabel="Adjust"
              onPress={props.onOpenPlanAdjustments}
              featured
            />
          </View>
        ) : null}

        {isMainMode ? (
          <View style={styles.navigationRow}>
            <ProfileNavigationCard
              title="Register Event"
              description="Competition date and details"
              actionLabel="Register"
              onPress={props.onOpenEventPreparation}
            />

            <ProfileNavigationCard
              title="Report Injury"
              description="Injuries and limitations"
              actionLabel="Report"
              onPress={props.onOpenInjuries}
            />
          </View>
        ) : null}

        {isMainMode ? (
          <TouchableOpacity
            onPress={props.onLogout}
            disabled={props.isSubmitting}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>Log out</Text>
          </TouchableOpacity>
        ) : null}

        {!isMainMode ? (
          <View style={styles.pageHeader}>
            <TouchableOpacity
              onPress={props.onBack}
              disabled={props.isSubmitting}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isPersonalDetailsMode ? (
          <View style={styles.profileIdentity}>
            <View style={styles.profileGradientCircle}>
              <BlackGradient />
            </View>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {props.email || props.emailPlaceholder || ""}
            </Text>
          </View>
        ) : null}

        {isPersonalDetailsMode ? <View style={styles.personalDetailsSpacer} /> : null}

        {isPersonalDetailsMode ? (
          <ProfilePersonalDetailsView
            username={props.username}
            usernamePlaceholder={props.usernamePlaceholder}
            password={props.password}
            hidePassword={props.hidePassword}
            isSubmitting={props.isSubmitting}
            onUsernameChange={props.onUsernameChange}
            onUsernameEdit={openUsernameEditorACB}
            onPasswordChange={props.onPasswordChange}
            onPasswordResetMenuOpen={openPasswordResetMenuACB}
          />
        ) : null}

        {isPlanAdjustmentsMode ? (
          <ProfilePlanAdjustmentsView
            trainingPreferences={props.trainingPreferences}
            combatSportOptions={props.combatSportOptions}
            primaryCombatSport={props.primaryCombatSport}
            sessionsPerWeek={props.sessionsPerWeek}
            onTrainingPreferencesChange={props.onTrainingPreferencesChange}
            onPrimaryCombatSportChange={props.onPrimaryCombatSportChange}
            onSessionsPerWeekChange={props.onSessionsPerWeekChange}
            onCombatIntensityDragChange={setIsScrollLocked}
          />
        ) : null}

        {isEventPreparationMode ? (
          <TrainingPreferencesEventPreparationView
            value={props.trainingPreferences?.eventPreparation}
            onChange={(value) =>
              props.onTrainingPreferencesChange?.({
                ...(props.trainingPreferences || {}),
                eventPreparation: value,
              })
            }
          />
        ) : null}

        {isInjuriesMode ? (
          <TrainingPreferencesInjuriesView
            value={props.trainingPreferences?.injuriesInput}
            onChange={(value) =>
              props.onTrainingPreferencesChange?.({
                ...(props.trainingPreferences || {}),
                injuriesInput: value,
              })
            }
          />
        ) : null}

        {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}

        {showInlineActions ? (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={saveProfileACB}
              disabled={props.isSubmitting || !props.canSave}
              style={[
                styles.primaryButton,
                props.isSubmitting || !props.canSave ? styles.buttonDisabled : null,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {props.isSubmitting ? "Saving..." : "Save changes"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cancelProfileACB}
              disabled={props.isSubmitting}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {isPersonalDetailsMode && isUsernameEditing ? (
        <Pressable
          onPress={cancelProfileACB}
          style={styles.usernameEditorDimLayer}
        />
      ) : null}

      {isPersonalDetailsMode && isUsernameEditing ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          pointerEvents="box-none"
          style={[
            styles.usernameEditorLayer,
            {
              height: Math.max(windowHeight / 2, 260),
              paddingTop: Math.max(insets.top + 20, 32),
            },
          ]}
        >
          <View style={styles.usernameEditorCard}>
            <View style={styles.usernameEditorContent}>
              <Text style={styles.usernameEditorLabel}>Username</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!props.isSubmitting}
                onChangeText={props.onUsernameChange}
                onSubmitEditing={closeUsernameEditorACB}
                placeholder="Username"
                placeholderTextColor="#64748b"
                returnKeyType="done"
                selectionColor="#ffffff"
                style={styles.usernameEditorInput}
                value={props.username || ""}
              />
            </View>
          </View>
          <View style={styles.usernameEditorActions}>
            <TouchableOpacity
              onPress={saveProfileACB}
              disabled={props.isSubmitting || !props.canSave}
              style={[
                styles.usernameEditorSaveButton,
                props.isSubmitting || !props.canSave
                  ? styles.usernameEditorButtonDisabled
                  : null,
              ]}
            >
              <Text style={styles.usernameEditorSaveButtonText}>
                {props.isSubmitting ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cancelProfileACB}
              disabled={props.isSubmitting}
              style={[
                styles.usernameEditorCancelButton,
                props.isSubmitting ? styles.usernameEditorButtonDisabled : null,
              ]}
            >
              <Text style={styles.usernameEditorCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      {isPersonalDetailsMode && isPasswordResetMenuVisible ? (
        <Pressable
          onPress={closePasswordResetMenuACB}
          style={styles.passwordResetDismissLayer}
        />
      ) : null}

      {isPersonalDetailsMode && isPasswordResetMenuVisible ? (
        <Animated.View
          style={[
            styles.passwordResetSheet,
            {
              height: Math.max(windowHeight / 3, 220),
              paddingBottom: Math.max(insets.bottom + 18, 28),
              transform: [{ translateY: passwordResetSheetTranslateY }],
            },
          ]}
        >
          <View
            style={styles.passwordResetHandleHitArea}
            {...passwordResetSheetDragResponder.panHandlers}
          >
            <View style={styles.passwordResetHandle} />
          </View>
          <Text style={styles.passwordResetTitle}>
            Did you forget your password?
          </Text>
          <Text style={styles.passwordResetText}>
            We will send a reset link to {props.email || "your e-mail address"}.
          </Text>

          <TouchableOpacity
            onPress={props.onPasswordReset}
            disabled={props.isSubmitting}
            style={[
              styles.passwordResetButton,
              props.isSubmitting ? styles.passwordResetButtonDisabled : null,
            ]}
          >
            <Text style={styles.passwordResetButtonText}>
              {props.isSubmitting ? "Sending..." : "Reset password"}
            </Text>
          </TouchableOpacity>

          {props.passwordResetMessage ? (
            <Text style={styles.passwordResetSuccessText}>
              {props.passwordResetMessage}
            </Text>
          ) : null}

          {props.error ? (
            <Text style={styles.passwordResetErrorText}>{props.error}</Text>
          ) : null}
        </Animated.View>
      ) : null}

      {showFloatingActions ? (
        <Animated.View
          pointerEvents={showFloatingActions ? "auto" : "none"}
          style={[
            styles.floatingActionsWrap,
            isUsernameEditing ? styles.blurredContent : null,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              opacity: actionBarOpacity,
              transform: [{ translateY: actionBarTranslateY }],
            },
          ]}
        >
          <View style={styles.floatingActionsBar}>
            <TouchableOpacity
              onPress={saveProfileACB}
              disabled={props.isSubmitting || !props.canSave}
              style={[
                styles.floatingSaveButton,
                props.isSubmitting || !props.canSave
                  ? styles.floatingSaveButtonDisabled
                  : null,
              ]}
            >
              <Text style={styles.floatingSaveButtonText}>
                {props.isSubmitting ? "Saving..." : "Save changes"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cancelProfileACB}
              disabled={props.isSubmitting}
              style={styles.floatingCancelButton}
            >
              <Text
                style={[
                  styles.floatingCancelButtonText,
                  props.isSubmitting ? styles.floatingCancelButtonTextDisabled : null,
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  blurredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  content: {
    padding: 20,
    gap: 14,
  },
  personalDetailsContentContainer: {
    flexGrow: 1,
  },
  navigationRow: {
    flexDirection: "row",
    gap: 14,
  },
  navigationCardButton: {
    flex: 1,
  },
  navigationCardButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  navigationCard: {
    backgroundColor: "#141414",
  },
  navigationCardContent: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  navigationCardCopy: {
    gap: 5,
  },
  navigationCardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  navigationCardTitleFeatured: {
    color: "#f8e7a2",
  },
  navigationCardText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  navigationActionPill: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    flexDirection: "row",
    gap: 5,
    minHeight: 32,
    minWidth: 74,
    justifyContent: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  navigationActionPillFeatured: {
    backgroundColor: "#fff",
  },
  navigationActionText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  navigationActionTextFeatured: {
    color: "#000000",
  },
  navigationArrow: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 18,
  },
  navigationArrowFeatured: {
    color: "#000000",
  },
  pageHeader: {
    gap: 14,
  },
  profileIdentity: {
    alignItems: "center",
    gap: 10,
  },
  personalDetailsSpacer: {
    flex: 1,
    minHeight: 24,
  },
  profileGradientCircle: {
    alignSelf: "center",
    aspectRatio: 1,
    borderRadius: 999,
    overflow: "hidden",
    width: "40%",
  },
  profileEmail: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "100%",
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: 12,
    paddingBottom: 12,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.18)",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  floatingActionsWrap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    paddingHorizontal: 20,
  },
  floatingActionsBar: {
    flexDirection: "row",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1e293b",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  floatingSaveButton: {
    flex: 3,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
  },
  floatingSaveButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  floatingSaveButtonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  floatingCancelButton: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
  },
  floatingCancelButtonText: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  floatingCancelButtonTextDisabled: {
    color: "#94a3b8",
  },
  usernameEditorLayer: {
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    paddingHorizontal: 20,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  usernameEditorDimLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    zIndex: 19,
  },
  usernameEditorCard: {
    alignSelf: "stretch",
    backgroundColor: "#111111",
    borderColor: "#222222",
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 84,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  usernameEditorContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  usernameEditorLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  usernameEditorInput: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 4,
    minHeight: 20,
    padding: 0,
  },
  usernameEditorActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-start",
    marginTop: 10,
  },
  usernameEditorSaveButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  usernameEditorCancelButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  usernameEditorButtonDisabled: {
    opacity: 0.52,
  },
  usernameEditorSaveButtonText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
  },
  usernameEditorCancelButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  passwordResetSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    gap: 12,
    left: 0,
    paddingHorizontal: 22,
    paddingTop: 12,
    position: "absolute",
    right: 0,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 16,
    zIndex: 21,
  },
  passwordResetDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 20,
  },
  passwordResetHandle: {
    alignSelf: "center",
    backgroundColor: "#d1d5db",
    borderRadius: 999,
    height: 5,
    marginBottom: 12,
    width: 48,
  },
  passwordResetHandleHitArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    minHeight: 28,
  },
  passwordResetTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
  },
  passwordResetText: {
    color: "#4b5563",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  passwordResetButton: {
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  passwordResetButtonDisabled: {
    opacity: 0.58,
  },
  passwordResetButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  passwordResetSuccessText: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  passwordResetErrorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  logoutButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 48,
    minWidth: 92,
    alignSelf: "center",
  },
  logoutButtonText: {
    color: "#fff",
    opacity: 0.5,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
