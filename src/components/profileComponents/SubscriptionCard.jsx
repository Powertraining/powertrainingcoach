import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import BlackGradient from "../colorComponents/BlackGradient.jsx";

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
  planName,
  timeRemainingText,
  subscriptionText,
  isActive = false,
  isSubmitting = false,
  onPress,
  onDetailsPress,
  onUpgradePress,
}) {
  const handleDetailsPress = onDetailsPress || onPress;
  const handleUpgradePress = onUpgradePress || onPress;
  const planLabel = planName || (isActive ? "Pro Plan" : "No Plan");

  return (
    <View style={styles.card}>
      <BlackGradient />
      <View style={styles.content}>
        <View style={styles.planHeader}>
          <Text style={styles.planLabel}>{`{ ${planLabel} }`}</Text>
          {timeRemainingText ? (
            <View style={styles.timePill}>
              <Text style={styles.timePillText}>{timeRemainingText}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.benefitsRow}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.title} style={styles.benefitItem}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <View style={styles.benefitDivider} />
              <Text style={styles.benefitDescription}>{benefit.description}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleUpgradePress}
            disabled={isSubmitting}
            style={[styles.actionButton, isSubmitting ? styles.buttonDisabled : null]}
          >
            <Text style={styles.actionButtonText}>Upgrade</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDetailsPress}
            disabled={isSubmitting}
            style={[
              styles.actionButton,
              styles.secondaryButton,
              isSubmitting ? styles.buttonDisabled : null,
            ]}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 40,
    borderWidth: 0.6,
    borderColor: "rgba(255,255,255,0.85)",
    overflow: "hidden",
  },
  content: {
    padding: 20,
    gap: 20,
  },
  planHeader: {
    alignItems: "center",
    gap: 8,
  },
  planLabel: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
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
    color: "#e5e7eb",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  benefitsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  benefitItem: {
    flex: 1,
    gap: 5,
  },
  benefitTitle: {
    color: "#ffffff",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  benefitDivider: {
    height: 1,
    backgroundColor: "#ffffff",
    opacity: 0.8,
  },
  benefitDescription: {
    color: "#cbd5e1",
    fontSize: 10,
    lineHeight: 14,
    textAlign: "center",
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
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
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryButtonText: {
    color: "#ffffff",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
