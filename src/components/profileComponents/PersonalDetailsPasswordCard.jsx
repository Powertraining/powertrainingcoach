import { Pressable, View, Text, StyleSheet } from "react-native";

export default function PersonalDetailsPasswordCard({ onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        pressed && !disabled ? styles.cardPressed : null,
        disabled ? styles.cardDisabled : null,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>Password</Text>
          <Text style={styles.text}>*****</Text>
        </View>
        <Text style={styles.actionText}>Reset &gt;</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignSelf: "stretch",
    minHeight: 84,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
    borderRadius: 20,
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  cardDisabled: {
    opacity: 0.58,
  },
  content: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  copy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  text: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  actionText: {
    color: "#ffffff",
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
