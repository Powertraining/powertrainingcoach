import { View, StyleSheet } from "react-native";

export default function RowCard ({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 0.8,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
  }

});
