import { View, StyleSheet } from "react-native";
import IBMPlexText from "../src/components/textComponents/IBMPlexText.jsx";
export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <IBMPlexText style={styles.title}>Modal</IBMPlexText>
      <IBMPlexText style={styles.subtitle}>This screen is ready for future modal content.</IBMPlexText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 24, fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
