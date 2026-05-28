import {
  View,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { createPortalSession } from '../services/utils/stripeClient.js';
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
export default function PaymentSuccessView({ sessionId, onContinue }) {
  const handleManageBilling = async () => {
    try {
      await createPortalSession({ sessionId });
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <IBMPlexText style={styles.icon}>💪</IBMPlexText>
      <IBMPlexText style={styles.title}>Subscription Ready!</IBMPlexText>
      <IBMPlexText style={styles.copy}>
        Your subscription is set up and your app access is now active.
      </IBMPlexText>
      <TouchableOpacity style={styles.secondaryButton} onPress={handleManageBilling}>
        <IBMPlexText style={styles.secondaryButtonText}>Manage billing</IBMPlexText>
      </TouchableOpacity>
      {onContinue ? (
        <TouchableOpacity style={styles.primaryButton} onPress={onContinue}>
          <IBMPlexText style={styles.primaryButtonText}>Continue</IBMPlexText>
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
    fontSize: 22, fontWeight: "700",
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
    color: "#111827", fontWeight: "600",
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  primaryButtonText: {
    color: "#ffffff", fontWeight: "600",
  },
});
