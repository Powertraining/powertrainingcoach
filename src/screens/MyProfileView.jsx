import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  PanResponder,
  Pressable,
  Platform,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SubscriptionCard from "../components/profileComponents/SubscriptionCard.jsx";
import ProfileNavigationCard from "../components/profileComponents/ProfileNavigationCard.jsx";
import WhiteBottomMenu from "../components/profileComponents/WhiteBottomMenu.jsx";
import BlackGradient from "../components/colorComponents/BlackGradient.jsx";
import ExpandingRouteView from "../components/navigation/ExpandingRouteView.jsx";
import ProfilePersonalDetailsView from "./profile/ProfilePersonalDetailsView.jsx";
import ProfilePlanAdjustmentsView from "./profile/ProfilePlanAdjustmentsView.jsx";
import RegisterEventView from "./profile/RegisterEventView.jsx";
import ProfileReportInjuryView from "./profile/ProfileReportInjuryView.jsx";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";

const FLOATING_ACTION_SLIDE_DISTANCE = 86;

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
    !isPersonalDetailsMode &&
    !isPlanAdjustmentsMode &&
    !isEventPreparationMode &&
    !isInjuriesMode &&
    (!isMainMode || props.canSave || props.isSubmitting);
  const showFloatingActions =
    isPlanAdjustmentsMode && (props.canSave || props.isSubmitting);
  const shouldRenderFloatingActions = isPlanAdjustmentsMode;
  const shouldObscurePlanActions = !props.hasProgram;

  useEffect(
    function animateActionBarACB() {
      Animated.timing(actionBarProgress, {
        toValue: showFloatingActions ? 1 : 0,
        duration: showFloatingActions ? 230 : 180,
        easing: showFloatingActions ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
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
    outputRange: [FLOATING_ACTION_SLIDE_DISTANCE, 0],
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

  function saveEventPreparationACB(value) {
    const nextTrainingPreferences = {
      ...(props.trainingPreferences || {}),
      eventPreparation: value,
    };

    props.onTrainingPreferencesChange?.(nextTrainingPreferences);
    props.onSave?.({ trainingPreferences: nextTrainingPreferences });
  }

  function saveInjuryReportACB(value) {
    const nextTrainingPreferences = {
      ...(props.trainingPreferences || {}),
      injuriesInput: value,
    };

    props.onTrainingPreferencesChange?.(nextTrainingPreferences);
    props.onSave?.({ trainingPreferences: nextTrainingPreferences });
  }

  function cancelProfileACB() {
    closeUsernameEditorACB();
    props.onCancel?.();
  }

  const content = (
    <View style={styles.screen}>
      {!isMainMode ? (
        <TouchableOpacity
          onPress={props.onBack}
          disabled={props.isSubmitting}
          style={styles.backButton}
        >
          <IBMPlexText style={styles.backButtonText}>Go Back</IBMPlexText>
        </TouchableOpacity>
      ) : null}
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
              : isPlanAdjustmentsMode
              ? Math.max(insets.bottom + 84, 108)
              : 24,
          },
        ]}
      >
        {isMainMode ? (
          <SubscriptionCard
            planName={props.subscriptionPlanName}
            timeRemainingText={props.subscriptionTimeRemainingText}
            subscriptionText={props.subscriptionText}
            isSubmitting={props.isSubmitting}
            showDetailsButton={props.isSubscriptionActive}
            onUpgradePress={props.onChangeSubscription}
            onDetailsPress={
              props.isSubscriptionActive
                ? props.onOpenSubscriptionDetails
                : props.onChangeSubscription
            }
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
              title="Adjust Plan"
              description="Sport, schedule, and training logic"
              actionLabel="Adjust"
              onPress={props.onOpenPlanAdjustments}
              obscureContent={shouldObscurePlanActions}
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
              obscureContent={shouldObscurePlanActions}
            />

            <ProfileNavigationCard
              title="Report Injury"
              description="Injuries and limitations"
              actionLabel="Report"
              onPress={props.onOpenInjuries}
              obscureContent={shouldObscurePlanActions}
            />
          </View>
        ) : null}

        {isMainMode ? (
          <View style={styles.navigationRow}>
            <ProfileNavigationCard
              title="My posts"
              description="Forum posts you created"
              actionLabel="View"
              onPress={props.onOpenMyPosts}
            />

            <ProfileNavigationCard
              title="Saved Posts"
              description="Forum posts you saved"
              actionLabel="View"
              onPress={props.onOpenSavedPosts}
            />
          </View>
        ) : null}

        {isMainMode ? (
          <TouchableOpacity
            onPress={props.onLogout}
            disabled={props.isSubmitting}
            style={styles.logoutButton}
          >
            <IBMPlexText style={styles.logoutButtonText}>Log out</IBMPlexText>
          </TouchableOpacity>
        ) : null}

        {isPersonalDetailsMode ? (
          <View style={styles.profileIdentity}>
            <TouchableOpacity
              activeOpacity={0.82}
              disabled={props.isSubmitting}
              onPress={props.onProfilePhotoChange}
              style={styles.profilePhotoButton}
            >
              {props.userPhotoUrl ? (
                <Image
                  source={{ uri: props.userPhotoUrl }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.profileGradientCircle}>
                  <BlackGradient />
                </View>
              )}
            </TouchableOpacity>
            <IBMPlexText style={styles.profileEmail} numberOfLines={1}>
              {props.email || props.emailPlaceholder || ""}
            </IBMPlexText>
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
          <RegisterEventView
            value={props.trainingPreferences?.eventPreparation}
            isSubmitting={props.isSubmitting}
            onChange={(value) =>
              props.onTrainingPreferencesChange?.({
                ...(props.trainingPreferences || {}),
                eventPreparation: value,
              })
            }
            onSaveChange={saveEventPreparationACB}
            onClearEvent={props.onClearEventPreparation}
          />
        ) : null}

        {isInjuriesMode ? (
          <ProfileReportInjuryView
            value={props.trainingPreferences?.injuriesInput}
            isSubmitting={props.isSubmitting}
            onChange={(value) =>
              props.onTrainingPreferencesChange?.({
                ...(props.trainingPreferences || {}),
                injuriesInput: value,
              })
            }
            onSaveChange={saveInjuryReportACB}
          />
        ) : null}

        {props.error ? <IBMPlexText style={styles.errorText}>{props.error}</IBMPlexText> : null}

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
              <IBMPlexText style={styles.primaryButtonText}>
                {props.isSubmitting ? "Saving..." : "Save changes"}
              </IBMPlexText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cancelProfileACB}
              disabled={props.isSubmitting}
              style={styles.secondaryButton}
            >
              <IBMPlexText style={styles.secondaryButtonText}>Cancel</IBMPlexText>
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
              <IBMPlexText style={styles.usernameEditorLabel}>Username</IBMPlexText>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!props.isSubmitting}
                onChangeText={props.onUsernameChange}
                onSubmitEditing={closeUsernameEditorACB}
                placeholder=""
                placeholderTextColor="#9ca3af"
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
                  ? styles.usernameEditorSaveButtonDisabled
                  : null,
              ]}
            >
              <IBMPlexText style={styles.usernameEditorSaveButtonText}>
                {props.isSubmitting ? "Saving..." : "Save"}
              </IBMPlexText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cancelProfileACB}
              disabled={props.isSubmitting}
              style={[
                styles.usernameEditorCancelButton,
                props.isSubmitting ? styles.usernameEditorButtonDisabled : null,
              ]}
            >
              <IBMPlexText style={styles.usernameEditorCancelButtonText}>Cancel</IBMPlexText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : null}

      <WhiteBottomMenu
        visible={isPersonalDetailsMode && isPasswordResetMenuVisible}
        onDismiss={closePasswordResetMenuACB}
        title="Did you forget your password?"
        description={`We will send a reset link to ${
          props.email || "your e-mail address"
        }.`}
        buttonText={props.isSubmitting ? "Sending..." : "Reset password"}
        buttonDisabled={props.isSubmitting}
        onButtonPress={props.onPasswordReset}
        panHandlers={passwordResetSheetDragResponder.panHandlers}
        sheetStyle={{ minHeight: Math.max(windowHeight / 3, 220) }}
        animatedStyle={{
          transform: [{ translateY: passwordResetSheetTranslateY }],
        }}
        content={
          <View style={styles.passwordResetMessages}>
            {props.passwordResetMessage ? (
              <IBMPlexText style={styles.passwordResetSuccessText}>
                {props.passwordResetMessage}
              </IBMPlexText>
            ) : null}

            {props.error ? (
              <IBMPlexText style={styles.passwordResetErrorText}>{props.error}</IBMPlexText>
            ) : null}
          </View>
        }
      />

      {shouldRenderFloatingActions ? (
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
              <IBMPlexText style={styles.floatingSaveButtonText}>
                {props.isSubmitting ? "Saving..." : "Save changes"}
              </IBMPlexText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cancelProfileACB}
              disabled={props.isSubmitting}
              style={styles.floatingCancelButton}
            >
              <IBMPlexText
                style={[
                  styles.floatingCancelButtonText,
                  props.isSubmitting ? styles.floatingCancelButtonTextDisabled : null,
                ]}
              >
                Cancel
              </IBMPlexText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );

  if (!isMainMode) {
    return (
      <ExpandingRouteView routeKey={mode}>
        {content}
      </ExpandingRouteView>
    );
  }

  return content;
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
    gap: 12,
  },
  personalDetailsContentContainer: {
    flexGrow: 1,
  },
  navigationRow: {
    flexDirection: "row",
    gap: 12,
  },
  pageHeader: {
    gap: 14,
  },
  profileIdentity: {
    alignItems: "center",
    gap: 0,
  },
  personalDetailsSpacer: {
    height: 24,
  },
  profileGradientCircle: {
    flex: 1,
  },
  profilePhotoButton: {
    alignSelf: "center",
    aspectRatio: 1,
    backgroundColor: "#1E1E1E",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: "10%",
    maxWidth: 150,
    minWidth: 112,
    overflow: "hidden",
    width: "34%",
  },
  profilePhoto: {
    height: "100%",
    width: "100%",
  },
  profileEmail: {
    color: "#C9B259",
    fontSize: 13, fontWeight: "600",
    lineHeight: 18,
    marginTop: "5%",
    maxWidth: "100%",
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
    zIndex: 20,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 14, fontWeight: "700",
    lineHeight: 18,
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
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#141414",
    fontSize: 16, fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  secondaryButtonText: {
    color: "#141414",
    fontSize: 16, fontWeight: "600",
  },
  floatingActionsWrap: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  floatingActionsBar: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#ffffff",
    padding: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 10,
  },
  floatingSaveButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#141414",
    borderRadius: 999,
    minHeight: 38,
    minWidth: 112,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  floatingSaveButtonDisabled: {
    backgroundColor: "rgba(20,20,20,0.38)",
  },
  floatingSaveButtonText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
    letterSpacing: 0.2,
  },
  floatingCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    minHeight: 38,
    minWidth: 82,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  floatingCancelButtonText: {
    color: "#141414",
    fontSize: 12, fontWeight: "700",
    letterSpacing: 0.2,
  },
  floatingCancelButtonTextDisabled: {
    color: "#9ca3af",
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
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
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
    fontSize: 15, fontWeight: "800",
    lineHeight: 18,
  },
  usernameEditorInput: {
    color: "#9ca3af",
    fontSize: 13, fontWeight: "600",
    lineHeight: 17,
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
  usernameEditorSaveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  usernameEditorCancelButton: {
    alignItems: "center",
    backgroundColor: "#141414",
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
    color: "#141414",
    fontSize: 12, fontWeight: "800",
  },
  usernameEditorCancelButtonText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
  },
  passwordResetMessages: {
    gap: 8,
  },
  passwordResetSuccessText: {
    color: "#047857",
    fontSize: 13, fontWeight: "700",
    lineHeight: 18,
  },
  passwordResetErrorText: {
    color: "#b91c1c",
    fontSize: 13, fontWeight: "700",
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
    fontSize: 16, fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
});
