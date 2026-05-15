import { useRef } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EffortRatingInput({ value, onChangeText }) {
  const inputRef = useRef(null);
  const focusInput = () => {
    inputRef.current?.focus?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardOuter}
      onPress={focusInput}
      onPressIn={focusInput}
    >
      <View style={styles.cardInner}>
        <Text style={styles.prompt} onPress={focusInput}>
          How hard did that feel?
        </Text>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.inputShell}
          onPress={focusInput}
          onPressIn={focusInput}
        >
          <View style={styles.valueRow}>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#fff"
              style={styles.input}
              textAlign="center"
              maxLength={2}
            />
            <Text style={styles.suffix} onPress={focusInput}>/10</Text>
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    width: "63%",
    maxWidth: 252,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#585858",
    borderRadius: 28,
    padding: 2,
    backgroundColor: "#1e1e1e",
  },
  cardInner: {
    minHeight: 82,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 6,
  },
  prompt: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 18,
  },
  inputShell: {
    width: "100%",
    minHeight: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 16,
    paddingVertical: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    minWidth: 24,
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  suffix: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },
});
