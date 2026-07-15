import {
  useEffect,
  useRef,
  useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { ENDURANCE_MODALITY_OPTIONS } from "../../constants/trainingPreferences.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
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
const MAX_SELECTED_ENDURANCE_METHODS = 3;
const GOLD_RAY_ANGLES = Object.freeze([0, 45, 90, 135, 180, 225, 270, 315]);

function EnduranceMethodOption({
  iconName,
  isSelected,
  label,
  onLongPress,
  onPress,
}) {
  const selectedProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;
  const wasSelectedRef = useRef(isSelected);

  useEffect(() => {
    Animated.timing(selectedProgress, {
      toValue: isSelected ? 1 : 0,
      duration: isSelected ? 160 : 120,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (isSelected && !wasSelectedRef.current) {
      burstProgress.setValue(0);
      Animated.timing(burstProgress, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }

    wasSelectedRef.current = isSelected;
  }, [burstProgress, isSelected, selectedProgress]);

  function animatePress(toValue) {
    Animated.timing(pressProgress, {
      toValue,
      duration: toValue ? 70 : 110,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const optionLiftStyle = {
    opacity: pressProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.78],
    }),
    transform: [
      {
        translateY: selectedProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -7],
        }),
      },
      {
        scale: selectedProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.025],
        }),
      },
    ],
  };
  const burstStyle = {
    opacity: burstProgress.interpolate({
      inputRange: [0, 0.18, 1],
      outputRange: [0, 0.95, 0],
    }),
    transform: [
      {
        scale: burstProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1.28],
        }),
      },
    ],
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => animatePress(0)}
      delayLongPress={240}
      style={styles.optionPressable}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.goldBurst, burstStyle]}
      >
        {GOLD_RAY_ANGLES.map((angle) => (
          <View
            key={`gold-ray-${angle}`}
            style={[
              styles.goldRay,
              { transform: [{ rotate: `${angle}deg` }, { translateY: -48 }] },
            ]}
          />
        ))}
      </Animated.View>
      <Animated.View
        style={[
          styles.option,
          isSelected ? styles.optionSelected : null,
          optionLiftStyle,
        ]}
      >
        <MaterialCommunityIcons
          name={iconName}
          size={38}
          color="#ffffff"
          style={styles.optionIcon}
        />
        <IBMPlexText style={styles.optionLabel}>{label}</IBMPlexText>
      </Animated.View>
    </Pressable>
  );
}

export default function TrainingPreferencesEnduranceMethodsView({
  value = [],
  allowHeavyBag = true,
  onChange,
  onInfoVisibilityChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [activeInfoValue, setActiveInfoValue] = useState(null);
  const didLongPressRef = useRef(false);
  const infoCardProgress = useRef(new Animated.Value(0)).current;
  const selectedValues = Array.isArray(value)
    ? value.slice(0, MAX_SELECTED_ENDURANCE_METHODS)
    : [];
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

  useEffect(() => {
    if (!activeInfoOption) {
      infoCardProgress.setValue(0);
      return;
    }

    Animated.timing(infoCardProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeInfoOption, infoCardProgress]);

  function toggleMethod(methodValue) {
    const nextValues = selectedValues.includes(methodValue)
      ? selectedValues.filter((entry) => entry !== methodValue)
      : selectedValues.length >= MAX_SELECTED_ENDURANCE_METHODS
        ? selectedValues
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

    if (
      !selectedValues.includes(activeInfoOption.value) &&
      selectedValues.length < MAX_SELECTED_ENDURANCE_METHODS
    ) {
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
        <IBMPlexText titleBlock height={118}>Endurance Methods</IBMPlexText>
        <IBMPlexText defaultWhite style={styles.helperText} textColor="#C9B259" center>
          Choose your top 3 preferred methods.{"\n"}We'll prioritize these when building your conditioning plan.
        </IBMPlexText>
        <View style={styles.infoHint}>
          <MaterialCommunityIcons
            name="gesture-tap-hold"
            size={15}
            color="#9CA3AF"
          />
          <IBMPlexText style={styles.infoHintText}>
            Tap to select. Hold any method for details.
          </IBMPlexText>
        </View>

        <View style={styles.grid}>
          {ENDURANCE_MODALITY_OPTIONS.filter(
            (option) => option.value !== "heavy_bag" || allowHeavyBag
          ).map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const iconName = ENDURANCE_METHOD_ICONS[option.value] || "timer";

            return (
              <EnduranceMethodOption
                key={option.value}
                iconName={iconName}
                isSelected={isSelected}
                label={option.label}
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
              />
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
              <Animated.View
                style={[
                  styles.infoCard,
                  isActiveInfoSelected ? styles.infoCardSelected : null,
                  {
                    opacity: infoCardProgress,
                    transform: [
                      {
                        translateY: infoCardProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [34, -8],
                        }),
                      },
                      {
                        scale: infoCardProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.96, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={activeInfoIconName}
                  size={42}
                  color="#ffffff"
                  style={styles.infoCardIcon}
                />
                <IBMPlexText style={styles.infoTitle}>{activeInfoOption.label}</IBMPlexText>
              </Animated.View>
            </View>
            <View style={styles.infoBottomContent}>
              <IBMPlexText style={styles.infoText}>{activeInfoOption.description}</IBMPlexText>
              <View style={styles.infoActions}>
                <Pressable
                  onPress={selectActiveInfoMethod}
                  style={({ pressed }) => [
                    styles.infoSelectButton,
                    pressed ? styles.infoActionPressed : null,
                  ]}
                >
                  <IBMPlexText style={styles.infoSelectButtonText}>
                    {isActiveInfoSelected ? "Selected" : "Select"}
                  </IBMPlexText>
                </Pressable>
                <Pressable
                  onPress={closeInfo}
                  style={({ pressed }) => [
                    styles.infoCloseButton,
                    pressed ? styles.infoActionPressed : null,
                  ]}
                >
                  <IBMPlexText style={styles.infoCloseButtonText}>Close</IBMPlexText>
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
    fontSize: 12, fontWeight: "700",
    lineHeight: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  optionPressable: {
    overflow: "visible",
    position: "relative",
    width: "30%",
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
    width: "100%",
  },
  optionSelected: {
    borderColor: "#C9B259",
    shadowColor: "#C9B259",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionLabel: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  goldBurst: {
    alignItems: "center",
    bottom: -14,
    justifyContent: "center",
    left: -14,
    position: "absolute",
    right: -14,
    top: -14,
    zIndex: 0,
  },
  goldRay: {
    backgroundColor: "#F2C94C",
    borderRadius: 2,
    height: 32,
    left: "50%",
    marginLeft: -1.5,
    marginTop: -16,
    position: "absolute",
    top: "50%",
    width: 3,
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
    borderColor: "#2D2D2D",
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
  infoCardSelected: {
    borderColor: "#C9B259",
    shadowColor: "#C9B259",
    shadowOpacity: 0.26,
  },
  infoCardIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    color: "#ffffff",
    fontSize: 15, fontWeight: "800",
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
    fontSize: 12, fontWeight: "800",
  },
  infoCloseButtonText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
  },
});
