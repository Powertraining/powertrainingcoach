import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DESIRED_TRAINING_OPTIONS } from "../../constants/trainingPreferences.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const FOCUS_META = Object.freeze({
  strength_power: Object.freeze({
    label: "Power",
    description: "Max strength, explosive power, and fast force production.",
    icon: "flash",
    accent: "#F82929",
    accentMuted: "rgba(248, 41, 41, 0.14)",
  }),
  strength_power_endurance: Object.freeze({
    label: "Hybrid",
    description: "Balanced strength, power, and conditioning.",
    icon: "hybrid",
    accent: "#F3D04F",
    accentMuted: "rgba(243, 208, 79, 0.14)",
  }),
  endurance: Object.freeze({
    label: "Endurance",
    description: "Stamina, repeat efforts, pace, and recovery.",
    icon: "pulse",
    accent: "#34C759",
    accentMuted: "rgba(52, 199, 89, 0.14)",
  }),
});

const OPTIONS_BOTTOM_OFFSET = 104;

function HybridFocusIcon() {
  return (
    <View style={styles.hybridIcon}>
      <View style={[styles.hybridIconHalf, styles.hybridIconLeft]}>
        <Ionicons color="#F3D04F" name="flash" size={22} />
      </View>
      <View style={[styles.hybridIconHalf, styles.hybridIconRight]}>
        <Ionicons color="#F3D04F" name="pulse" size={22} />
      </View>
    </View>
  );
}

function FocusOption({ option, selected, onPress }) {
  const meta = FOCUS_META[option.value] || {
    label: option.label,
    description: "",
    icon: "fitness",
    accent: "#0A84FF",
    accentMuted: "rgba(10, 132, 255, 0.14)",
  };

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
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
        {meta.icon === "hybrid" ? (
          <HybridFocusIcon />
        ) : (
          <Ionicons color={meta.accent} name={meta.icon} size={27} />
        )}
      </View>

      <View style={styles.optionCopy}>
        <IBMPlexText defaultWhite style={styles.optionTitle}>
          {meta.label}
        </IBMPlexText>
        <IBMPlexText style={styles.optionDescription}>
          {meta.description}
        </IBMPlexText>
      </View>

      <View
        style={[
          styles.radio,
          selected ? { borderColor: meta.accent } : null,
        ]}
      >
        {selected ? (
          <View style={[styles.radioFill, { backgroundColor: meta.accent }]} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function TrainingPreferencesDesiredTrainingView({
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
          What should your plan focus on?
        </IBMPlexText>
        <IBMPlexText defaultWhite style={styles.helperText} center>
          Choose the training priority that best matches your goal.
        </IBMPlexText>
      </View>

      <View accessibilityRole="radiogroup" style={styles.options}>
        {DESIRED_TRAINING_OPTIONS.map((option) => {
          const selected = displayedValue === option.value;

          return (
            <FocusOption
              key={option.value}
              option={option}
              selected={selected}
              onPress={() => {
                setIsSelectionCleared(selected);
                onChange?.(selected ? null : option.value);
              }}
            />
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
    maxWidth: 330,
    width: "88%",
  },
  options: {
    alignSelf: "stretch",
    bottom: OPTIONS_BOTTOM_OFFSET,
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
    minHeight: 96,
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
  hybridIcon: {
    flexDirection: "row",
    height: 30,
    width: 42,
  },
  hybridIconHalf: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  hybridIconLeft: {
    alignItems: "flex-end",
    paddingRight: 1,
  },
  hybridIconRight: {
    alignItems: "flex-start",
    paddingLeft: 1,
  },
  optionCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
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
