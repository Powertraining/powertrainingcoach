import { useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import TitleText from "../../components/textComponents/TitleText.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import { ENDURANCE_MODALITY_OPTIONS } from "../../constants/trainingPreferences.js";

const ENDURANCE_METHOD_ICONS = Object.freeze({
  arm_crank_machine: "arm-flex",
  assault_bike: "bike-fast",
  bicycling: "bicycle",
  circuit_training: "clipboard-pulse",
  heavy_bag: "boxing-glove",
  rowing_ergometer: "rowing",
  running: "run",
  skiing_ergometer: "ski",
  sprinting: "run-fast",
  sport_specific: "target",
  swimming: "swim",
  versaclimber: "stairs-up",
});

export default function TrainingPreferencesEnduranceMethodsView({
  value = [],
  onChange,
  onInfoVisibilityChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [activeInfoValue, setActiveInfoValue] = useState(null);
  const didLongPressRef = useRef(false);
  const selectedValues = Array.isArray(value) ? value : [];
  const activeInfoOption = ENDURANCE_MODALITY_OPTIONS.find(
    (option) => option.value === activeInfoValue
  );
  const activeInfoIconName =
    activeInfoOption && (ENDURANCE_METHOD_ICONS[activeInfoOption.value] || "timer");
  const isActiveInfoSelected =
    activeInfoOption && selectedValues.includes(activeInfoOption.value);

  useEffect(() => {
    onInfoVisibilityChange?.(Boolean(activeInfoOption));

    return () => {
      onInfoVisibilityChange?.(false);
    };
  }, [activeInfoOption, onInfoVisibilityChange]);

  function toggleMethod(methodValue) {
    const nextValues = selectedValues.includes(methodValue)
      ? selectedValues.filter((entry) => entry !== methodValue)
      : [...selectedValues, methodValue];

    onChange?.(nextValues);
  }

  function closeInfo() {
    setActiveInfoValue(null);
  }

  function selectActiveInfoMethod() {
    if (!activeInfoOption) {
      return;
    }

    if (!selectedValues.includes(activeInfoOption.value)) {
      onChange?.([...selectedValues, activeInfoOption.value]);
    }

    closeInfo();
  }

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <ScrollView
        scrollEnabled={!activeInfoOption}
        showsVerticalScrollIndicator={false}
        style={activeInfoOption ? styles.blurredContent : null}
        contentContainerStyle={styles.scrollContent}
      >
        <TitleText height={118}>Endurance Methods</TitleText>
        <StandardText style={styles.helperText} textColor="#C9B259" center>
          Optional. Pick the tools you prefer, or leave this open so the coach can
          choose around your week.
        </StandardText>
        <View style={styles.infoHint}>
          <MaterialCommunityIcons
            name="gesture-tap-hold"
            size={15}
            color="#9CA3AF"
          />
          <Text style={styles.infoHintText}>
            Tap to select. Hold any method for details.
          </Text>
        </View>

        <View style={styles.grid}>
          {ENDURANCE_MODALITY_OPTIONS.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const iconName = ENDURANCE_METHOD_ICONS[option.value] || "timer";

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  if (didLongPressRef.current) {
                    didLongPressRef.current = false;
                    return;
                  }

                  toggleMethod(option.value);
                }}
                onLongPress={() => {
                  didLongPressRef.current = true;
                  setActiveInfoValue(option.value);
                }}
                delayLongPress={240}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={38}
                  color="#ffffff"
                  style={styles.optionIcon}
                />
                <Text style={styles.optionLabel}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {activeInfoOption ? (
        <>
          <Pressable
            onPress={closeInfo}
            style={[
              styles.dimLayer,
              { height: screenHeight * 2, top: -screenHeight / 2 },
            ]}
          />
          <View
            pointerEvents="box-none"
            style={[
              styles.infoOverlay,
              { minHeight: screenHeight },
            ]}
          >
            <View style={styles.infoCardRegion}>
              <View style={styles.infoCard}>
                <MaterialCommunityIcons
                  name={activeInfoIconName}
                  size={42}
                  color="#ffffff"
                  style={styles.infoCardIcon}
                />
                <Text style={styles.infoTitle}>{activeInfoOption.label}</Text>
              </View>
            </View>
            <View style={styles.infoBottomContent}>
              <Text style={styles.infoText}>{activeInfoOption.description}</Text>
              <View style={styles.infoActions}>
                <Pressable
                  onPress={selectActiveInfoMethod}
                  style={({ pressed }) => [
                    styles.infoSelectButton,
                    pressed ? styles.infoActionPressed : null,
                  ]}
                >
                  <Text style={styles.infoSelectButtonText}>
                    {isActiveInfoSelected ? "Selected" : "Select"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={closeInfo}
                  style={({ pressed }) => [
                    styles.infoCloseButton,
                    pressed ? styles.infoActionPressed : null,
                  ]}
                >
                  <Text style={styles.infoCloseButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 8,
    position: "relative",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 32,
    paddingTop: 88,
  },
  blurredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  helperText: {
    alignSelf: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    maxWidth: 330,
    paddingHorizontal: 18,
  },
  infoHint: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    marginBottom: 16,
  },
  infoHintText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  option: {
    alignItems: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 112,
    paddingBottom: 12,
    paddingHorizontal: 8,
    paddingTop: 12,
    position: "relative",
    width: "30%",
  },
  optionSelected: {
    borderColor: "#ffffff",
  },
  optionPressed: {
    opacity: 0.78,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  dimLayer: {
    backgroundColor: "rgba(0,0,0,0.48)",
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  infoOverlay: {
    alignItems: "center",
    justifyContent: "space-between",
    left: 0,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 11,
  },
  infoCardRegion: {
    alignItems: "center",
    height: "50%",
    justifyContent: "center",
    width: "100%",
  },
  infoCard: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 118,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    width: "30%",
    minWidth: 112,
    maxWidth: 132,
    elevation: 12,
  },
  infoCardIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center",
  },
  infoText: {
    color: "#E5E7EB",
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 340,
    textAlign: "center",
  },
  infoBottomContent: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  infoActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginTop: 14,
  },
  infoSelectButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoCloseButton: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  infoActionPressed: {
    opacity: 0.72,
  },
  infoSelectButtonText: {
    color: "#141414",
    fontSize: 12,
    fontWeight: "800",
  },
  infoCloseButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
});
