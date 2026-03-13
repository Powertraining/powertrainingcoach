import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { createPortalSession } from '../../services/utils/stripeClient.js';

export default function PaymentSuccessView({ customerId, sessionId, onContinue }) {
  const handleManageBilling = async () => {
    try {
      await createPortalSession({ customerId, sessionId });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💪</Text>
      <Text style={styles.title}>Subscription Successful!</Text>
      <Text style={styles.copy}>Thank you for your purchase. Your subscription is now active.</Text>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleManageBilling}>
        <Text style={styles.secondaryButtonText}>Manage billing</Text>
      </TouchableOpacity>
      {onContinue ? (
        <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  copy: {
    fontSize: 15,
    textAlign: "center",
    color: "#4b5563",
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
