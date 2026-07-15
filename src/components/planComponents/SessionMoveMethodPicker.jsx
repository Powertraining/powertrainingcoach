import { Pressable, StyleSheet, View } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

function MethodButton({ title, onPress, disabled, primary = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.methodButton,
        primary && styles.methodButtonPrimary,
        disabled && styles.methodButtonDisabled,
      ]}
    >
      <IBMPlexText
        style={[styles.methodTitle, primary && styles.methodTitlePrimary]}
      >
        {title}
      </IBMPlexText>
    </Pressable>
  );
}

export default function SessionMoveMethodPicker({
  onChangeDate,
  onDelaySession,
  disabled = false,
}) {
  return (
    <View style={styles.root}>
      <MethodButton
        primary
        disabled={disabled}
        title="Change date"
        onPress={onChangeDate}
      />
      <MethodButton
        disabled={disabled}
        title="Delay session"
        onPress={onDelaySession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  methodButton: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderColor: "#141414",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  methodButtonPrimary: {
    backgroundColor: "#141414",
    borderColor: "#141414",
  },
  methodButtonDisabled: {
    opacity: 0.55,
  },
  methodTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },
  methodTitlePrimary: {
    color: "#FFFFFF",
  },
});
