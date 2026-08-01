import { Pressable, StyleSheet, View } from "react-native";

import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import {
  normalizeUnitSystem,
  UNIT_SYSTEMS,
} from "../../services/utils/measurementUnits.js";

const OPTIONS = Object.freeze([
  { label: "Metric", detail: "kg, km, cm", value: UNIT_SYSTEMS.METRIC },
  { label: "Imperial", detail: "lb, mi, in", value: UNIT_SYSTEMS.IMPERIAL },
]);

export default function MeasurementSystemCard({ value, disabled, onChange }) {
  const selectedValue = normalizeUnitSystem(value);

  return (
    <View style={[styles.card, disabled ? styles.cardDisabled : null]}>
      <View style={styles.copy}>
        <IBMPlexText style={styles.title}>Measurement system</IBMPlexText>
        <IBMPlexText style={styles.text}>
          Updates units throughout your program. Saved training data stays unchanged.
        </IBMPlexText>
      </View>

      <View accessibilityRole="radiogroup" style={styles.options}>
        {OPTIONS.map((option) => {
          const selected = selectedValue === option.value;

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              key={option.value}
              onPress={() => onChange?.(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : null,
                pressed && !disabled ? styles.optionPressed : null,
              ]}
            >
              <IBMPlexText style={[styles.optionLabel, selected ? styles.optionLabelSelected : null]}>
                {option.label}
              </IBMPlexText>
              <IBMPlexText style={[styles.optionDetail, selected ? styles.optionDetailSelected : null]}>
                {option.detail}
              </IBMPlexText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    gap: 14,
    minHeight: 142,
    padding: 16,
    width: "100%",
  },
  cardDisabled: {
    opacity: 0.58,
  },
  copy: {
    gap: 4,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  text: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  options: {
    backgroundColor: "#0D0D0D",
    borderRadius: 14,
    flexDirection: "row",
    gap: 6,
    padding: 5,
  },
  option: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  optionSelected: {
    backgroundColor: "rgba(10, 132, 255, 0.16)",
    borderColor: "#0A84FF",
  },
  optionPressed: {
    opacity: 0.72,
  },
  optionLabel: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  optionLabelSelected: {
    color: "#FFFFFF",
  },
  optionDetail: {
    color: "#71717A",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  optionDetailSelected: {
    color: "#7CC0FF",
  },
});
