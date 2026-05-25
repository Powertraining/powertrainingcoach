import { StyleSheet, View } from "react-native";

export default function LockIcon({ color = "#ffffff", size = 34, style }) {
  const scale = size / 34;

  return (
    <View style={[styles.container, { height: size, width: size }, style]}>
      <View style={[styles.lockIcon, { transform: [{ scale }] }]}>
        <View style={[styles.lockShackle, { borderColor: color }]} />
        <View style={[styles.lockBody, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    alignItems: "center",
    height: 34,
    justifyContent: "flex-end",
    width: 34,
  },
  lockShackle: {
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 3,
    height: 16,
    marginBottom: -3,
    width: 20,
  },
  lockBody: {
    borderRadius: 5,
    height: 19,
    width: 26,
  },
});
