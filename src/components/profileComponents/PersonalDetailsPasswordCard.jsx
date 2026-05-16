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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignSelf: "stretch",
    minHeight: 84,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    borderRadius: 18,
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
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  text: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
  },
});
