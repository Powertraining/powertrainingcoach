import { useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HYBRID_SESSION_STRUCTURE_OPTIONS } from "../../constants/trainingPreferences.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const OPTION_META = Object.freeze({
  separate_sessions: Object.freeze({
    icon: "calendar-outline",
    accent: "#34C759",
    accentMuted: "rgba(52, 199, 89, 0.14)",
  }),
  same_session: Object.freeze({
    icon: "layers-outline",
    accent: "#F3D04F",
    accentMuted: "rgba(243, 208, 79, 0.14)",
  }),
});

export default function TrainingPreferencesHybridSessionStructureView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <View style={styles.header}>
        <IBMPlexText titleBlock height={112}>
          How do you want to schedule power and endurance?
        </IBMPlexText>
        <IBMPlexText defaultWhite style={styles.helperText} center>
          Choose whether they should have their own training days or share a session.
        </IBMPlexText>
      </View>

      <View accessibilityRole="radiogroup" style={styles.options}>
        {HYBRID_SESSION_STRUCTURE_OPTIONS.map((option) => {
          const selected = displayedValue === option.value;
          const meta = OPTION_META[option.value];

          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={option.value}
              onPress={() => {
                setIsSelectionCleared(selected);
                onChange?.(selected ? null : option.value);
              }}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : null,
                selected ? { borderColor: meta.accent } : null,
                pressed ? styles.optionPressed : null,
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: meta.accentMuted },
                ]}
              >
                <Ionicons color={meta.accent} name={meta.icon} size={27} />
              </View>

              <View style={styles.optionCopy}>
                <IBMPlexText defaultWhite style={styles.optionTitle}>
                  {option.label}
                </IBMPlexText>
                <IBMPlexText style={styles.optionDescription}>
                  {option.description}
                </IBMPlexText>
              </View>

              <View
                style={[
                  styles.radio,
                  selected ? { borderColor: meta.accent } : null,
                ]}
              >
                {selected ? (
                  <View
                    style={[styles.radioFill, { backgroundColor: meta.accent }]}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 150,
    position: "relative",
  },
  header: {
    alignSelf: "stretch",
  },
  helperText: {
    alignSelf: "center",
    color: "#9A9AA2",
    fontSize: 15,
    lineHeight: 20,
    maxWidth: 340,
    width: "90%",
  },
  options: {
    alignSelf: "stretch",
    bottom: 104,
    gap: 12,
    left: 24,
    position: "absolute",
    right: 24,
  },
  option: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 108,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    backgroundColor: "#171717",
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  optionPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },
  iconContainer: {
    alignItems: "center",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  optionDescription: {
    color: "#9A9AA2",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  radio: {
    alignItems: "center",
    borderColor: "#56565F",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  radioFill: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
});
