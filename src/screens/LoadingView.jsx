import { ActivityIndicator, StyleSheet, View } from "react-native";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
export default function LoadingView({ label = "" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.72)" />
      {label ? <IBMPlexText style={styles.label}>{label}</IBMPlexText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    marginTop: 14,
    color: "#ffffff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 20,
    lineHeight: 22,
  },
});
