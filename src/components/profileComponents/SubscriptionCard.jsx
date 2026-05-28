import { View, TouchableOpacity, StyleSheet } from "react-native";

import BlackGradient from "../colorComponents/BlackGradient.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
const BENEFITS = [
  {
    title: "Analysis",
    description: "4 trainer video reviews/month",
  },
  {
    title: "Programs",
    description: "Personalized optimized plans",
  },
  {
    title: "Community",
    description: "Exclusive pro-led forum",
  },
];

export default function SubscriptionCard({
  planName = "No Plan",
  cardStyle,
  contentStyle,
  planLabelStyle,
  timeRemainingText,
  subscriptionText,
  benefits = BENEFITS,
  showActions = true,
  showBackground = true,
  showBraces = true,
  showDetailsButton = true,
  isSubmitting = false,
  onPress,
  onDetailsPress,
  onUpgradePress,
}) {
  const handleDetailsPress = onDetailsPress || onPress;
  const handleUpgradePress = onUpgradePress || onPress;
  const planLabel = planName;
  const displayedPlanLabel = showBraces ? `{ ${planLabel} }` : planLabel;

  return (
    <View style={[styles.card, !showBackground ? styles.cardPlain : null, cardStyle]}>
      {showBackground ? <BlackGradient /> : null}
      <View style={[styles.content, contentStyle]}>
        <View style={styles.planHeader}>
          <IBMPlexText style={[styles.planLabel, planLabelStyle]}>
            {displayedPlanLabel}
          </IBMPlexText>
          {timeRemainingText ? (
            <View style={styles.timePill}>
              <IBMPlexText style={styles.timePillText}>{timeRemainingText}</IBMPlexText>
            </View>
          ) : null}
        </View>

        <View style={styles.benefitsRow}>
          {benefits.map((benefit) => (
            <View key={benefit.title} style={styles.benefitItem}>
              <IBMPlexText numberOfLines={2} adjustsFontSizeToFit style={styles.benefitTitle}>
                {benefit.title}
              </IBMPlexText>
              <View style={styles.benefitDivider} />
              <IBMPlexText numberOfLines={4} style={styles.benefitDescription}>
                {benefit.description}
              </IBMPlexText>
            </View>
          ))}
        </View>

        {showActions ? (
          <View
            style={[
              styles.actionRow,
              !showDetailsButton ? styles.actionRowCentered : null,
            ]}
          >
            <TouchableOpacity
              onPress={handleUpgradePress}
              disabled={isSubmitting}
              style={[styles.actionButton, isSubmitting ? styles.buttonDisabled : null]}
            >
              <IBMPlexText style={styles.actionButtonText}>Subscribe</IBMPlexText>
            </TouchableOpacity>

            {showDetailsButton ? (
              <TouchableOpacity
                onPress={handleDetailsPress}
                disabled={isSubmitting}
                style={[
                  styles.actionButton,
                  styles.secondaryButton,
                  isSubmitting ? styles.buttonDisabled : null,
                ]}
              >
                <IBMPlexText style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Details
                </IBMPlexText>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1E1E1E",
    overflow: "hidden",
  },
  cardPlain: {
    borderRadius: 0,
    borderWidth: 0,
    overflow: "visible",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 22,
  },
  planHeader: {
    alignItems: "center",
    gap: 8,
  },
  planLabel: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 26, fontWeight: "700",
    textAlign: "center",
  },
  timePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timePillText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16, fontWeight: "700",
  },
  benefitsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 14,
  },
  benefitItem: {
    flex: 1,
    gap: 6,
  },
  benefitTitle: {
    color: "#ffffff",
    fontSize: 13,
    lineHeight: 17, fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: "#ffffff",
    opacity: 0.42,
  },
  benefitDescription: {
    color: "#9ca3af",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  actionRowCentered: {
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#ffffff",
    minWidth: 104,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  actionButtonText: {
    color: "#141414",
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  secondaryButtonText: {
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
