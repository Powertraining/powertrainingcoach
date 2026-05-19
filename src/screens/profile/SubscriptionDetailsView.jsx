import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";

const ANALYSIS_SLOTS = ["1", "2", "3", "4"];

export default function SubscriptionDetailsView({
  planName = "No Plan",
  subscribedText = "",
  nextBillingText = "",
  isSubmitting = false,
  error = null,
  onBack,
  onChangePaymentMethod,
  onCancelSubscription,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <BlackGradient />
      <TouchableOpacity
        onPress={onBack}
        disabled={isSubmitting}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: Math.max(insets.bottom + 32, 56),
          },
        ]}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>{`{ ${planName} }`}</Text>
          {subscribedText ? (
            <Text style={styles.subscribedText}>{subscribedText}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analyses</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.analysisRow}>
            {ANALYSIS_SLOTS.map((slot) => (
              <TouchableOpacity key={slot} style={styles.analysisButton}>
                <Text style={styles.analysisButtonText}>+</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Options</Text>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.optionRows}>
            <TouchableOpacity
              onPress={onChangePaymentMethod}
              disabled={isSubmitting}
              style={styles.optionRow}
            >
              <Text style={styles.optionRowText}>Change payment method</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancelSubscription}
              disabled={isSubmitting}
              style={styles.optionRow}
            >
              <Text style={styles.optionRowText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {nextBillingText ? (
            <Text style={styles.nextBillingText}>{nextBillingText}</Text>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
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
    flexGrow: 1,
    gap: 34,
    paddingHorizontal: 20,
  },
  pageHeader: {
    gap: 14,
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
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  planHeader: {
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    minHeight: 170,
  },
  planTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
  },
  subscribedText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 23,
    textAlign: "center",
  },
  sectionDivider: {
    backgroundColor: "#ffffff",
    height: 1,
    opacity: 0.42,
    width: "100%",
  },
  analysisRow: {
    flexDirection: "row",
    gap: 10,
  },
  analysisButton: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 24,
    borderWidth: 2,
    flex: 1,
    height: 200,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  analysisButtonText: {
    color: "#8E8E8E",
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 54,
  },
  optionRows: {
    gap: 10,
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 4,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionRowText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center",
  },
  nextBillingText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
  error: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
});
