import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingView({ label = "" }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.72)" />
      {label ? <Text style={styles.label}>{label}</Text> : null}
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
    fontFamily: "BebasNeue",
    fontSize: 20,
    lineHeight: 22,
  },
});
