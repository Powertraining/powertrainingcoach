import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import RowCard from "../components/homeComponents/RowCard.jsx";
import SubscriptionCard from "../components/profileComponents/SubscriptionCard.jsx";
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
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const actionBarProgress = useRef(new Animated.Value(0)).current;
  const mode = props.mode || "main";
  const isMainMode = mode === "main";
  const isPersonalDetailsMode = mode === "personalDetails";
  const isPlanAdjustmentsMode = mode === "planAdjustments";
  const isEventPreparationMode = mode === "eventPreparation";
  const isInjuriesMode = mode === "injuries";
  const showInlineActions =
    !isPersonalDetailsMode && (!isMainMode || props.canSave || props.isSubmitting);
  const showFloatingActions =
    isPersonalDetailsMode && (props.canSave || props.isSubmitting);
  const pageTitle = isPersonalDetailsMode
    ? "Personal Details"
    : isPlanAdjustmentsMode
      ? "Plan Adjustments"
      : isEventPreparationMode
        ? "Register Event"
        : isInjuriesMode
          ? "Report Injury"
          : "Profile";

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

  const actionBarTranslateY = actionBarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [96, 0],
  });
  const actionBarOpacity = actionBarProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.screen}>
      <ScrollView
        scrollEnabled={!isScrollLocked}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
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
            <Text style={styles.pageTitle}>{pageTitle}</Text>
          </View>
        ) : null}

        {isPersonalDetailsMode ? (
          <ProfilePersonalDetailsView
            email={props.email}
            emailPlaceholder={props.emailPlaceholder}
            username={props.username}
            usernamePlaceholder={props.usernamePlaceholder}
            password={props.password}
            hidePassword={props.hidePassword}
            isSubmitting={props.isSubmitting}
            onUsernameChange={props.onUsernameChange}
            onPasswordChange={props.onPasswordChange}
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
              onPress={props.onSave}
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
              onPress={props.onCancel}
              disabled={props.isSubmitting}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {isPersonalDetailsMode ? (
        <Animated.View
          pointerEvents={showFloatingActions ? "auto" : "none"}
          style={[
            styles.floatingActionsWrap,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              opacity: actionBarOpacity,
              transform: [{ translateY: actionBarTranslateY }],
            },
          ]}
        >
          <View style={styles.floatingActionsBar}>
            <TouchableOpacity
              onPress={props.onSave}
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
              onPress={props.onCancel}
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
  content: {
    padding: 20,
    gap: 14,
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
  pageTitle: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
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
