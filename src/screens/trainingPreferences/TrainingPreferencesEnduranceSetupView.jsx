import {
  useEffect,
  useRef,
  useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import PreferenceOptionButton from "../../components/questionnaireComponents/PreferenceOptionButton.jsx";
import {
  CIRCUIT_GOAL_EXAMPLES,
  CIRCUIT_PRIORITY_OPTIONS,
  ENDURANCE_FORMAT_OPTIONS,
  HEAVY_BAG_ENDURANCE_TARGET_OPTIONS,
  SPRINTING_TARGET_OPTIONS,
} from "../../constants/trainingPreferences.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const ENDURANCE_FORMAT_DETAILS = Object.freeze({
  low_intensity_aerobic:
    "Easy steady work for base fitness and recovery. Usually the safest default.",
  aerobic_intervals:
    "Repeated moderate efforts with controlled rest. Good when steady work feels too flat.",
  high_intensity_intervals:
    "Hard intervals for repeat output. Best used sparingly around combat training.",
  sport_specific_conditioning:
    "Conditioning that stays close to your sport, rounds, or competition demands.",
});

const MIN_ENDURANCE_DAYS = 1;
// Dedicated endurance sessions cannot exceed the total weekly session count.
const MAX_ENDURANCE_DAYS = 5;
const ENDURANCE_THUMB_SIZE = 24;
const ENDURANCE_DAYS_LEGEND = Object.freeze({
  1: {
    label: "1 session/week",
    description:
      "Minimal conditioning. Best if your sport training load is already high or recovery is limited.",
  },
  2: {
    label: "2 sessions/week",
    description:
      "Balanced option. Good for most users who want conditioning without adding too much fatigue.",
  },
  3: {
    label: "3 sessions/week",
    description:
      "Moderate conditioning load. Choose this if you recover well and your sport training is not excessive.",
  },
  4: {
    label: "4 sessions/week",
    description:
      "High conditioning load. Best for experienced users with controlled sport training and strong recovery.",
  },
  5: {
    label: "5 sessions/week",
    description:
      "Very high conditioning load. Use only during a focused endurance block, or if your total training load is carefully managed.",
  },
});
const NURSE_ICON = require("../../assets/icons/nurse.png");
const ARROW_TEXT_ICON = require("../../assets/icons/arrowText.png");
const CLOSED_KEYBOARD_BOTTOM_OFFSET = 18;
const CIRCUIT_BOT_MESSAGES = Object.freeze([
  "What should circuit training help with?",
  "Write what usually fades first in rounds, sparring, or hard training.",
  "Some examples:",
]);
const CIRCUIT_FOCUS_SHORT_LABELS = Object.freeze({
  local_muscular_endurance: "Local endurance",
  repeated_high_effort_capacity: "Repeat efforts",
  whole_body_work_capacity: "Work capacity",
  sport_specific_fatigue_resistance: "Sport fatigue",
  aerobic_recovery_between_bursts: "Recovery",
  grip_endurance: "Grip",
  neck_endurance: "Neck",
  trunk_endurance: "Trunk",
  shoulder_endurance: "Shoulders",
  leg_endurance: "Legs",
});
const CIRCUIT_FOCUS_ICONS = Object.freeze({
  local_muscular_endurance: "arm-flex",
  repeated_high_effort_capacity: "repeat",
  whole_body_work_capacity: "run-fast",
  sport_specific_fatigue_resistance: "boxing-glove",
  aerobic_recovery_between_bursts: "heart-pulse",
  grip_endurance: "hand-back-left",
  neck_endurance: "head",
  trunk_endurance: "human-handsup",
  shoulder_endurance: "weight-lifter",
  leg_endurance: "shoe-print",
});
const SPRINTING_TARGET_ICONS = Object.freeze({
  speed_explosiveness: "run-fast",
  repeat_bursts: "repeat",
  hard_conditioning: "fire",
});
const GOLD_RAY_ANGLES = Object.freeze([0, 45, 90, 135, 180, 225, 270, 315]);
const HEAVY_BAG_TARGET_ICONS = Object.freeze({
  aerobic_bag_work: "heart-pulse",
  tempo_sustained_conditioning: "timer-sand",
  repeated_burst_bag_work: "repeat",
  local_upper_body_endurance: "arm-flex",
  sport_specific_fight_camp_simulation: "boxing-glove",
});

function EnduranceStyleOptionButton({
  index,
  isSelected,
  label,
  description,
  onPress,
}) {
  const entranceProgress = useRef(new Animated.Value(0)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  const animatedStyle = {
    opacity: entranceProgress,
    transform: [
      {
        translateY: Animated.add(
          entranceProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [22, 0],
          }),
          pressProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -4],
          })
        ),
      },
    ],
  };

  useEffect(() => {
    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 340,
      delay: 80 + index * 70,
      useNativeDriver: true,
    }).start();
  }, [entranceProgress, index]);

  function animatePress(toValue) {
    Animated.timing(pressProgress, {
      toValue,
      duration: toValue ? 90 : 150,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={animatedStyle}>
      <PreferenceOptionButton
        isSelected={isSelected}
        label={label}
        description={description}
        buttonStyle={styles.styleOptionButton}
        selectedButtonStyle={styles.styleOptionButtonSelected}
        labelStyle={styles.styleOptionLabel}
        descriptionStyle={styles.styleOptionDescription}
        onPress={onPress}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
      />
    </Animated.View>
  );
}

function SprintingFocusOptionButton({
  iconName,
  isSelected,
  label,
  onPress,
}) {
  const selectedProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;
  const wasSelectedRef = useRef(isSelected);
  const [burstOrigin, setBurstOrigin] = useState({ x: "50%", y: "50%" });

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

  function animatePress(toValue, event) {
    if (event?.nativeEvent) {
      setBurstOrigin({
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
      });
    }

    Animated.timing(pressProgress, {
      toValue,
      duration: toValue ? 70 : 110,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const optionAnimatedStyle = {
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
    <View style={styles.sprintingOptionWrap}>
      <Animated.View style={[styles.sprintingOptionShell, optionAnimatedStyle]}>
        <PreferenceOptionButton
          isSelected={isSelected}
          label={label}
          icon={
            <MaterialCommunityIcons
              name={iconName}
              size={34}
              color={isSelected ? "#ffffff" : "#C9B259"}
            />
          }
          stacked
          buttonStyle={styles.sprintingOptionButton}
          selectedButtonStyle={styles.sprintingOptionButtonSelected}
          labelStyle={styles.sprintingOptionLabel}
          onPress={onPress}
          onPressIn={(event) => animatePress(1, event)}
          onPressOut={() => animatePress(0)}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.sprintingGoldBurst,
            burstStyle,
            {
              left: burstOrigin.x,
              top: burstOrigin.y,
            },
          ]}
        >
          {GOLD_RAY_ANGLES.map((angle) => (
            <View
              key={`sprinting-gold-ray-${angle}`}
              style={[
                styles.sprintingGoldRay,
                { transform: [{ rotate: `${angle}deg` }, { translateY: -54 }] },
              ]}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function ChoiceChip({ label, isSelected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isSelected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <IBMPlexText style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </IBMPlexText>
    </Pressable>
  );
}

function getClampedEnduranceDayCount(value, maxDays = MAX_ENDURANCE_DAYS) {
  const parsedValue = Number.parseInt(value, 10);
  const resolvedMaxDays = Math.max(
    MIN_ENDURANCE_DAYS,
    Math.min(MAX_ENDURANCE_DAYS, Number.parseInt(maxDays, 10) || MAX_ENDURANCE_DAYS)
  );

  if (!Number.isFinite(parsedValue)) {
    return MIN_ENDURANCE_DAYS;
  }

  return Math.min(Math.max(parsedValue, MIN_ENDURANCE_DAYS), resolvedMaxDays);
}

function EnduranceDaysSlider({
  value = MIN_ENDURANCE_DAYS,
  maxDays = MAX_ENDURANCE_DAYS,
  onChange,
}) {
  const resolvedMaxDays = Math.max(
    MIN_ENDURANCE_DAYS,
    Math.min(MAX_ENDURANCE_DAYS, Number.parseInt(maxDays, 10) || MAX_ENDURANCE_DAYS)
  );
  const resolvedValue = getClampedEnduranceDayCount(value, resolvedMaxDays);
  const [sliderWidth, setSliderWidth] = useState(0);
  const [dragValue, setDragValue] = useState(resolvedValue);
  const sliderShellRef = useRef(null);
  const activeTouchIdRef = useRef(null);
  const sliderPageXRef = useRef(0);
  const dragStartPageXRef = useRef(0);
  const dragStartValueRef = useRef(resolvedValue);
  const dragValueRef = useRef(resolvedValue);
  const activeValue = Math.round(dragValue);
  const selectedLegend =
    ENDURANCE_DAYS_LEGEND[getClampedEnduranceDayCount(activeValue, resolvedMaxDays)] ||
    ENDURANCE_DAYS_LEGEND[MIN_ENDURANCE_DAYS];
  const previousActiveValueRef = useRef(activeValue);
  const legendTransitionProgress = useRef(new Animated.Value(1)).current;
  const sliderProgress =
    resolvedMaxDays === MIN_ENDURANCE_DAYS
      ? 0
      : (dragValue - MIN_ENDURANCE_DAYS) / (resolvedMaxDays - MIN_ENDURANCE_DAYS);
  const thumbLeft = sliderWidth
    ? sliderProgress * (sliderWidth - ENDURANCE_THUMB_SIZE)
    : 0;

  useEffect(() => {
    const nextValue = getClampedEnduranceDayCount(value, resolvedMaxDays);
    dragValueRef.current = nextValue;
    setDragValue(nextValue);
  }, [resolvedMaxDays, value]);

  function setLiveDragValue(nextValue) {
    dragValueRef.current = nextValue;
    setDragValue(nextValue);
  }

  useEffect(() => {
    if (previousActiveValueRef.current === activeValue) {
      return;
    }

    previousActiveValueRef.current = activeValue;
    legendTransitionProgress.setValue(0);
    Animated.timing(legendTransitionProgress, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [activeValue, legendTransitionProgress]);

  function commitDragValue(nextValue = dragValueRef.current) {
    const roundedValue = getClampedEnduranceDayCount(
      Math.round(nextValue),
      resolvedMaxDays
    );
    dragValueRef.current = roundedValue;
    setDragValue(roundedValue);
    onChange?.(roundedValue);
  }

  function getResponderTouch(event) {
    const { changedTouches = [], touches = [], identifier } = event.nativeEvent;
    const activeTouchId = activeTouchIdRef.current;
    const allTouches = [...changedTouches, ...touches];

    if (activeTouchId != null) {
      return allTouches.find((touch) => touch.identifier === activeTouchId) || null;
    }

    return allTouches.find((touch) => touch.identifier === identifier) || allTouches[0] || event.nativeEvent;
  }

  function valueFromLocationX(locationX) {
    if (!sliderWidth) {
      return dragValueRef.current;
    }

    const clampedX = Math.min(Math.max(locationX, 0), sliderWidth);
    return (
      MIN_ENDURANCE_DAYS +
      (clampedX / sliderWidth) * (resolvedMaxDays - MIN_ENDURANCE_DAYS)
    );
  }

  function getFiniteNumber(...values) {
    return values.find((nextValue) => Number.isFinite(nextValue));
  }

  function measureSliderPageX() {
    sliderShellRef.current?.measure?.((_x, _y, _width, _height, pageX) => {
      if (Number.isFinite(pageX)) {
        sliderPageXRef.current = pageX;
      }
    });
  }

  function getPageXFromEvent(event, gestureState, touch, phase = "move") {
    if (phase === "start") {
      return getFiniteNumber(
        touch?.pageX,
        gestureState?.x0,
        gestureState?.moveX,
        event.nativeEvent.pageX
      );
    }

    return getFiniteNumber(
      touch?.pageX,
      gestureState?.moveX,
      gestureState?.x0,
      event.nativeEvent.pageX
    );
  }

  function getLocationXFromEvent(event, gestureState, touch, phase) {
    const pageX = getPageXFromEvent(event, gestureState, touch, phase);
    const locationX = getFiniteNumber(touch?.locationX, event.nativeEvent.locationX);

    if (Number.isFinite(locationX)) {
      return locationX;
    }

    if (Number.isFinite(pageX)) {
      return pageX - sliderPageXRef.current;
    }

    return null;
  }

  function valueFromPageX(pageX) {
    if (!sliderWidth || !Number.isFinite(pageX)) {
      return dragValueRef.current;
    }

    const deltaValue =
      ((pageX - dragStartPageXRef.current) / sliderWidth) *
      (resolvedMaxDays - MIN_ENDURANCE_DAYS);

    return Math.min(
      Math.max(dragStartValueRef.current + deltaValue, MIN_ENDURANCE_DAYS),
      resolvedMaxDays
    );
  }

  function startDrag(event, gestureState) {
    measureSliderPageX();
    const touch = getResponderTouch(event);
    const nextValue = valueFromLocationX(
      getLocationXFromEvent(event, gestureState, touch, "start") ?? 0
    );
    const pageX = getPageXFromEvent(event, gestureState, touch, "start");

    activeTouchIdRef.current = touch?.identifier ?? event.nativeEvent.identifier ?? null;
    dragStartPageXRef.current = pageX ?? 0;
    dragStartValueRef.current = nextValue;
    setLiveDragValue(nextValue);
  }

  function updateDrag(event, gestureState) {
    const touch = getResponderTouch(event);
    const pageX = getPageXFromEvent(event, gestureState, touch);

    if (!Number.isFinite(pageX)) {
      return;
    }

    setLiveDragValue(valueFromPageX(pageX));
  }

  function endDrag(event, gestureState) {
    updateDrag(event, gestureState);
    commitDragValue();
    activeTouchIdRef.current = null;
  }

  const sliderPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => activeTouchIdRef.current == null,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: startDrag,
    onPanResponderMove: updateDrag,
    onPanResponderRelease: endDrag,
    onPanResponderTerminate: endDrag,
  });

  return (
    <View style={styles.daysSliderBlock}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.daysLegend,
          {
            opacity: legendTransitionProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [0.35, 1],
            }),
            transform: [
              {
                translateY: legendTransitionProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          },
        ]}
      >
        <IBMPlexText defaultWhite style={styles.daysLegendLabel}>
          {selectedLegend.label}
        </IBMPlexText>
        <IBMPlexText defaultWhite style={styles.daysLegendDescription}>
          {selectedLegend.description}
        </IBMPlexText>
      </Animated.View>

      <View style={styles.sliderSection}>
        <View style={styles.sliderNumbers}>
          {Array.from({ length: resolvedMaxDays }, (_, index) => {
            const dayCount = index + 1;
            const isActive = activeValue === dayCount;

            return (
              <View key={dayCount} style={styles.sliderNumberSlot}>
                <IBMPlexText defaultWhite
                  style={[
                    styles.sliderNumber,
                    isActive ? styles.sliderNumberActive : null,
                  ]}
                >
                  {dayCount}
                </IBMPlexText>
              </View>
            );
          })}
        </View>

        <View
          ref={sliderShellRef}
          style={styles.sliderShell}
          onLayout={({ nativeEvent }) => {
            setSliderWidth(nativeEvent.layout.width);
            measureSliderPageX();
          }}
        >
          <View
            style={styles.sliderTouchArea}
            accessibilityRole="adjustable"
            accessibilityValue={{
              min: MIN_ENDURANCE_DAYS,
              max: resolvedMaxDays,
              now: activeValue,
            }}
            {...sliderPanResponder.panHandlers}
          />
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderTrackFill,
                { width: `${sliderProgress * 100}%` },
              ]}
            />
          </View>
          <View pointerEvents="none" style={[styles.sliderThumb, { left: thumbLeft }]} />
        </View>
      </View>
    </View>
  );
}

function OptionGroup({ title, hint, options, value, onChange, multi = false }) {
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <View style={styles.group}>
      {title ? <IBMPlexText style={styles.groupTitle}>{title}</IBMPlexText> : null}
      {hint ? <IBMPlexText style={styles.groupHint}>{hint}</IBMPlexText> : null}
      <View style={styles.chipRow}>
        {options.map((option) => {
          const isSelected = multi
            ? selectedValues.includes(option.value)
            : value === option.value;

          return (
            <ChoiceChip
              key={option.value}
              label={option.label}
              isSelected={isSelected}
              onPress={() => {
                if (!multi) {
                  onChange?.(isSelected ? "" : option.value);
                  return;
                }

                onChange?.(
                  isSelected
                    ? selectedValues.filter((entry) => entry !== option.value)
                    : [...selectedValues, option.value]
                );
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function CompactFocusGrid({
  options,
  value,
  onChange,
  onLongPress,
  shortLabels = {},
  icons = {},
  multi = false,
}) {
  const didLongPressRef = useRef(false);
  const selectedValues = multi
    ? Array.isArray(value)
      ? value
      : []
    : [];
  const hasSelection = multi ? selectedValues.length > 0 : Boolean(value);

  return (
    <View style={styles.circuitFocusGrid}>
      {options.map((option) => {
        const isSelected = multi
          ? selectedValues.includes(option.value)
          : value === option.value;
        const isDimmed = !multi && hasSelection && !isSelected;

        return (
          <Pressable
            key={option.value}
            delayLongPress={240}
            onPress={() => {
              if (didLongPressRef.current) {
                didLongPressRef.current = false;
                return;
              }

              if (!multi) {
                onChange?.(isSelected ? null : option.value);
                return;
              }

              onChange?.(
                isSelected
                  ? selectedValues.filter((entry) => entry !== option.value)
                  : [...selectedValues, option.value]
              );
            }}
            onLongPress={() => {
              didLongPressRef.current = true;
              onLongPress?.(option);
            }}
            style={({ pressed }) => [
              styles.circuitFocusOption,
              isSelected ? styles.circuitFocusOptionSelected : null,
              isDimmed ? styles.circuitFocusOptionDimmed : null,
              pressed ? styles.optionPressed : null,
            ]}
          >
            {icons[option.value] ? (
              <MaterialCommunityIcons
                name={icons[option.value]}
                size={20}
                color={isDimmed ? "#777777" : "#C9B259"}
                style={styles.circuitFocusOptionIcon}
              />
            ) : null}
            <IBMPlexText
              style={[
                styles.circuitFocusOptionText,
                isSelected ? styles.circuitFocusOptionTextSelected : null,
              ]}
            >
              {shortLabels[option.value] || option.label}
            </IBMPlexText>
          </Pressable>
        );
      })}
    </View>
  );
}

function LargeOptionGrid({ options, value, onChange, icons = {} }) {
  return (
    <View style={styles.largeOptionGrid}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange?.(isSelected ? "" : option.value)}
            style={({ pressed }) => [
              styles.largeOptionBorder,
              isSelected ? styles.largeOptionBorderSelected : null,
              pressed ? styles.optionPressed : null,
            ]}
          >
            <View style={styles.largeOptionFace}>
              {icons[option.value] ? (
                <MaterialCommunityIcons
                  name={icons[option.value]}
                  size={30}
                  color={isSelected ? "#ffffff" : "#C9B259"}
                  style={styles.largeOptionIcon}
                />
              ) : null}
              <IBMPlexText style={styles.largeOptionText}>{option.label}</IBMPlexText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TrainingPreferencesEnduranceSetupView({
  mode = "days",
  values,
  onChange,
  onContinue,
  onSkip,
  onInfoVisibilityChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [draftMessage, setDraftMessage] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [activeCircuitInfoValue, setActiveCircuitInfoValue] = useState(null);
  const [circuitMessages, setCircuitMessages] = useState(() =>
    values?.circuitTrainingGoalInput ? [values.circuitTrainingGoalInput] : []
  );
  const circuitInfoProgress = useRef(new Animated.Value(0)).current;
  const selectedCircuitFocusValues = [
    values?.circuitTrainingPrimaryPriority,
    ...(Array.isArray(values?.circuitTrainingSecondaryPriorities)
      ? values.circuitTrainingSecondaryPriorities
      : []),
  ].filter(Boolean);
  const maxEnduranceDays = Math.max(
    MIN_ENDURANCE_DAYS,
    Math.min(
      MAX_ENDURANCE_DAYS,
      Number.parseInt(values?.daysPerWeek, 10) || MAX_ENDURANCE_DAYS
    )
  );
  const activeCircuitInfoOption = CIRCUIT_PRIORITY_OPTIONS.find(
    (option) => option.value === activeCircuitInfoValue
  );
  const activeCircuitInfoIconName =
    activeCircuitInfoOption &&
    (CIRCUIT_FOCUS_ICONS[activeCircuitInfoOption.value] || "target");
  const isActiveCircuitInfoSelected =
    activeCircuitInfoOption &&
    selectedCircuitFocusValues.includes(activeCircuitInfoOption.value);

  useEffect(() => {
    const isVisible = mode === "circuitFocus" && Boolean(activeCircuitInfoOption);
    onInfoVisibilityChange?.(isVisible);

    return () => {
      onInfoVisibilityChange?.(false);
    };
  }, [activeCircuitInfoOption, mode, onInfoVisibilityChange]);

  useEffect(() => {
    if (!activeCircuitInfoOption) {
      circuitInfoProgress.setValue(0);
      return;
    }

    Animated.timing(circuitInfoProgress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeCircuitInfoOption, circuitInfoProgress]);

  function updateField(field, value) {
    onChange?.({
      ...values,
      [field]: value,
    });
  }

  function updateFields(nextFields) {
    onChange?.({
      ...values,
      ...nextFields,
    });
  }

  useEffect(() => {
    if (mode !== "days") {
      return;
    }

    const clampedEnduranceDays = getClampedEnduranceDayCount(
      values?.enduranceSessionsPerWeek,
      maxEnduranceDays
    );

    if (clampedEnduranceDays !== values?.enduranceSessionsPerWeek) {
      updateField("enduranceSessionsPerWeek", clampedEnduranceDays);
    }
  }, [maxEnduranceDays, mode, values?.enduranceSessionsPerWeek]);

  function commitCircuitMessage(message = draftMessage) {
    const nextMessage = String(message || "").trim();

    if (!nextMessage) {
      return false;
    }

    const nextMessages = [...circuitMessages, nextMessage];
    setCircuitMessages(nextMessages);
    setDraftMessage("");
    updateField("circuitTrainingGoalInput", nextMessages.join(", "));
    return true;
  }

  function addCircuitExampleToDraft(example) {
    const trimmedExample = String(example || "").trim().replace(/[.?!]+$/u, "");

    if (!trimmedExample) {
      return;
    }

    setDraftMessage((currentDraft) => {
      const currentText = String(currentDraft || "").trimEnd();
      const prefix = currentText ? `${currentText} ` : "";

      return `${prefix}${trimmedExample}. `;
    });
  }

  function continueCircuitGoal() {
    commitCircuitMessage();
    onContinue?.();
  }

  function closeCircuitInfo() {
    setActiveCircuitInfoValue(null);
  }

  function updateCircuitFocusValues(nextValues) {
    const selectedValues = Array.isArray(nextValues) ? nextValues : [];

    updateFields({
      circuitTrainingPrimaryPriority: selectedValues[0] || null,
      circuitTrainingSecondaryPriorities: selectedValues.slice(1),
    });
  }

  function selectActiveCircuitFocus() {
    if (!activeCircuitInfoOption) {
      return;
    }

    if (!selectedCircuitFocusValues.includes(activeCircuitInfoOption.value)) {
      updateCircuitFocusValues([
        ...selectedCircuitFocusValues,
        activeCircuitInfoOption.value,
      ]);
    }

    closeCircuitInfo();
  }

  useEffect(() => {
    if (mode !== "circuitGoal") {
      return undefined;
    }

    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(keyboardShowEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [mode]);

  if (mode === "days") {
    return (
      <View style={[styles.daysSection, { minHeight: screenHeight }]}>
        <View style={styles.daysContent}>
          <View style={styles.daysPromptArea}>
            <IBMPlexText titleBlock height={96} style={styles.daysTitle}>
              Endurance Sessions
            </IBMPlexText>
            <IBMPlexText defaultWhite style={styles.daysDescription} center>
              Choose how many conditioning sessions to add each week. More sessions can improve endurance, but they also increase fatigue and recovery demands.
            </IBMPlexText>
          </View>
          <EnduranceDaysSlider
            value={values?.enduranceSessionsPerWeek ?? MIN_ENDURANCE_DAYS}
            maxDays={maxEnduranceDays}
            onChange={(nextValue) =>
              updateField("enduranceSessionsPerWeek", nextValue)
            }
          />
        </View>
      </View>
    );
  }

  if (mode === "circuitGoal") {
    const contentBottomOffset =
      keyboardHeight > 0 ? keyboardHeight : CLOSED_KEYBOARD_BOTTOM_OFFSET;
    const canContinueCircuitGoal = circuitMessages.length > 0;

    return (
      <View style={[styles.chatSection, { height: screenHeight }]}>
        <View style={styles.topChatHeader}>
          <View style={styles.botAvatar}>
            <Image source={NURSE_ICON} style={styles.botAvatarImage} resizeMode="contain" />
          </View>
          <View style={styles.chatHeaderCopy}>
            <IBMPlexText defaultWhite style={styles.chatName}>Coach intake</IBMPlexText>
            <IBMPlexText defaultWhite style={styles.chatStatus}>Circuit goal</IBMPlexText>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity accessibilityRole="button" onPress={onSkip} style={styles.skipButton}>
              <IBMPlexText defaultWhite style={styles.skipButtonText}>Skip &gt;</IBMPlexText>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={!canContinueCircuitGoal}
              onPress={continueCircuitGoal}
              style={[
                styles.continueButton,
                !canContinueCircuitGoal ? styles.continueButtonDisabled : null,
              ]}
            >
              <IBMPlexText defaultWhite style={styles.continueButtonText}>Continue</IBMPlexText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.chatContentSlot, { bottom: contentBottomOffset }]}>
          <View style={styles.chatFeed}>
            <ScrollView
              style={styles.chatScroll}
              contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.timestampPill}>
                <IBMPlexText defaultWhite style={styles.timestampText}>Today</IBMPlexText>
              </View>

              {CIRCUIT_BOT_MESSAGES.map((message, index) => (
                <View key={`circuit-bot-message-${index}`} style={styles.messageRow}>
                  {index === CIRCUIT_BOT_MESSAGES.length - 1 ? (
                    <View style={styles.botIcon}>
                      <Image source={NURSE_ICON} style={styles.botIconImage} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={styles.botIconSpacer} />
                  )}
                  <View style={styles.messageBubble}>
                    <IBMPlexText defaultWhite style={styles.messageText} textColor="#000000">
                      {message}
                    </IBMPlexText>
                  </View>
                </View>
              ))}

              <View style={styles.exampleBubbleWrap}>
                {CIRCUIT_GOAL_EXAMPLES.slice(0, 6).map((example) => (
                  <Pressable
                    key={example}
                    onPress={() => addCircuitExampleToDraft(example)}
                    style={({ pressed }) => [
                      styles.exampleReplyButton,
                      pressed ? styles.optionPressed : null,
                    ]}
                  >
                    <IBMPlexText defaultWhite style={styles.exampleReplyText}>{example}</IBMPlexText>
                  </Pressable>
                ))}
              </View>

              {circuitMessages.length ? (
                <View style={styles.userMessages}>
                  {circuitMessages.map((message, index) => (
                    <View key={`user-circuit-message-${index}`} style={styles.userMessageRow}>
                      <View style={styles.userMessageBubble}>
                        <IBMPlexText defaultWhite style={styles.userMessageText} textColor="#ffffff">
                          {message}
                        </IBMPlexText>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyReplyHint}>
                  <IBMPlexText defaultWhite style={styles.emptyReplyText}>
                    No circuit goal added yet
                  </IBMPlexText>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputWrap}>
              <TextInput
                placeholder="Type what fades first..."
                placeholderTextColor="#8E8E8E"
                value={draftMessage}
                onChangeText={setDraftMessage}
                multiline
                numberOfLines={3}
                style={styles.chatTextarea}
              />
              <TouchableOpacity style={styles.sendButton} onPress={() => commitCircuitMessage()}>
                <Image source={ARROW_TEXT_ICON} style={styles.sendIcon} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (mode === "circuitFocus") {
    return (
      <View style={[styles.section, styles.circuitFocusSection, { minHeight: screenHeight }]}>
        <View style={activeCircuitInfoOption ? styles.blurredContent : null}>
          <IBMPlexText titleBlock height={130}>Circuit focus</IBMPlexText>
          <IBMPlexText defaultWhite style={styles.helperText} textColor="#C9B259" center>
            Pick the main quality your circuit sessions should target.
          </IBMPlexText>
          <View style={styles.infoHint}>
            <MaterialCommunityIcons
              name="gesture-tap-hold"
              size={15}
              color="#9CA3AF"
            />
            <IBMPlexText style={styles.infoHintText}>
              Tap to select. Hold any focus for details.
            </IBMPlexText>
          </View>
        </View>
        <View
          style={[
            styles.circuitFocusContent,
            activeCircuitInfoOption ? styles.blurredContent : null,
          ]}
        >
          <CompactFocusGrid
            options={CIRCUIT_PRIORITY_OPTIONS}
            value={selectedCircuitFocusValues}
            shortLabels={CIRCUIT_FOCUS_SHORT_LABELS}
            icons={CIRCUIT_FOCUS_ICONS}
            multi
            onLongPress={(option) => setActiveCircuitInfoValue(option.value)}
            onChange={updateCircuitFocusValues}
          />
        </View>
        {activeCircuitInfoOption ? (
          <>
            <Pressable
              onPress={closeCircuitInfo}
              style={[
                styles.dimLayer,
                { height: screenHeight * 2, top: -screenHeight / 2 },
              ]}
            />
            <View
              pointerEvents="box-none"
              style={[styles.infoOverlay, { minHeight: screenHeight }]}
            >
              <View style={styles.infoCardRegion}>
                <Animated.View
                  style={[
                    styles.infoCard,
                    isActiveCircuitInfoSelected ? styles.infoCardSelected : null,
                    {
                      opacity: circuitInfoProgress,
                      transform: [
                        {
                          translateY: circuitInfoProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [34, -8],
                          }),
                        },
                        {
                          scale: circuitInfoProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.96, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={activeCircuitInfoIconName}
                    size={42}
                    color="#ffffff"
                    style={styles.infoCardIcon}
                  />
                  <IBMPlexText style={styles.infoTitle}>
                    {activeCircuitInfoOption.label}
                  </IBMPlexText>
                </Animated.View>
              </View>
              <View style={styles.infoBottomContent}>
                <IBMPlexText style={styles.infoText}>
                  {activeCircuitInfoOption.description}
                </IBMPlexText>
                <View style={styles.infoActions}>
                  <Pressable
                    onPress={selectActiveCircuitFocus}
                    style={({ pressed }) => [
                      styles.infoSelectButton,
                      pressed ? styles.infoActionPressed : null,
                    ]}
                  >
                    <IBMPlexText style={styles.infoSelectButtonText}>
                      {isActiveCircuitInfoSelected ? "Selected" : "Select"}
                    </IBMPlexText>
                  </Pressable>
                  <Pressable
                    onPress={closeCircuitInfo}
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

  if (mode === "heavyBagFocus") {
    return (
      <View style={[styles.section, { minHeight: screenHeight }]}>
        <IBMPlexText titleBlock height={118}>Heavy bag focus</IBMPlexText>
        <IBMPlexText defaultWhite style={styles.heavyBagHelperText} textColor="#C9B259" center>
          Pick what your bag conditioning should mainly train.
        </IBMPlexText>
        <View style={styles.heavyBagOptionContent}>
          <LargeOptionGrid
            options={HEAVY_BAG_ENDURANCE_TARGET_OPTIONS}
            value={values?.heavyBagEnduranceTarget}
            icons={HEAVY_BAG_TARGET_ICONS}
            onChange={(nextValue) => updateField("heavyBagEnduranceTarget", nextValue)}
          />
        </View>
      </View>
    );
  }

  if (mode === "sprintingFocus") {
    return (
      <View style={[styles.section, { minHeight: screenHeight }]}>
        <IBMPlexText titleBlock height={130}>Sprinting focus</IBMPlexText>
        <IBMPlexText defaultWhite style={styles.helperText} center>
          Pick what sprint sessions should mainly train.
        </IBMPlexText>
        <View style={styles.sprintingOptions}>
          {SPRINTING_TARGET_OPTIONS.map((option) => {
            const isSelected = values?.sprintingTarget === option.value;

            return (
              <SprintingFocusOptionButton
                key={option.value}
                isSelected={isSelected}
                label={option.label}
                iconName={SPRINTING_TARGET_ICONS[option.value]}
                onPress={() =>
                  updateField("sprintingTarget", isSelected ? null : option.value)
                }
              />
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <IBMPlexText titleBlock height={130}>Endurance style</IBMPlexText>
      <IBMPlexText defaultWhite style={styles.helperText} textColor="#C9B259" center>
        Pick the type of endurance work you want the plan to favor when possible.
      </IBMPlexText>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.styleOptions}>
          {ENDURANCE_FORMAT_OPTIONS.map((option, index) => (
            <EnduranceStyleOptionButton
              key={option.value}
              index={index}
              isSelected={values?.preferredEnduranceFormat === option.value}
              label={option.label}
              description={ENDURANCE_FORMAT_DETAILS[option.value]}
              onPress={() =>
                updateField(
                  "preferredEnduranceFormat",
                  values?.preferredEnduranceFormat === option.value
                    ? null
                    : option.value
                )
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  daysSection: {
    justifyContent: "flex-start",
    paddingTop: 18,
  },
  section: {
    justifyContent: "flex-start",
    paddingTop: 88,
  },
  circuitFocusSection: {
    position: "relative",
  },
  blurredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  helperText: {
    alignSelf: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    maxWidth: 340,
    paddingHorizontal: 24,
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
  heavyBagHelperText: {
    alignSelf: "center",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 340,
    paddingHorizontal: 24,
  },
  daysWarningText: {
    alignSelf: "center",
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
    maxWidth: 320,
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 156,
    paddingHorizontal: 12,
  },
  daysContent: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 72,
  },
  daysPromptArea: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 82,
  },
  daysTitle: {
    fontSize: 35,
    lineHeight: 39,
  },
  daysDescription: {
    alignSelf: "center",
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 20,
    marginTop: 0,
    maxWidth: 340,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  daysSliderBlock: {
    gap: 18,
  },
  daysLegend: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    gap: 6,
    marginHorizontal: "6%",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  daysLegendLabel: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  daysLegendDescription: {
    color: "#d1d5db",
    fontSize: 12,
    lineHeight: 15,
  },
  sliderSection: {
    alignSelf: "center",
    maxWidth: 330,
    width: "82%",
  },
  sliderNumbers: {
    alignSelf: "center",
    flexDirection: "row",
    height: 42,
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: ENDURANCE_THUMB_SIZE / 2,
    width: "100%",
  },
  sliderNumberSlot: {
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
    width: ENDURANCE_THUMB_SIZE,
  },
  sliderNumber: {
    color: "#585858",
    fontSize: 16,
    lineHeight: 18,
    textAlign: "center",
  },
  sliderNumberActive: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 28,
  },
  sliderShell: {
    height: 64,
    position: "relative",
    width: "100%",
  },
  sliderTouchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  sliderTrack: {
    backgroundColor: "#2A2A2A",
    borderRadius: 999,
    height: 12,
    left: ENDURANCE_THUMB_SIZE / 2,
    overflow: "hidden",
    position: "absolute",
    right: ENDURANCE_THUMB_SIZE / 2,
    top: 24,
  },
  sliderTrackFill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: "100%",
  },
  sliderThumb: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: ENDURANCE_THUMB_SIZE,
    position: "absolute",
    top: 18,
    width: ENDURANCE_THUMB_SIZE,
    zIndex: 1,
  },
  styleOptions: {
    gap: 16,
  },
  styleOptionButton: {
    borderRadius: 20,
    minHeight: 124,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  styleOptionButtonSelected: {
    borderColor: "#ffffff",
    borderStyle: "solid",
  },
  styleOptionLabel: {
    bottom: "auto",
    fontSize: 14,
    lineHeight: 18,
    position: "relative",
  },
  styleOptionDescription: {
    color: "#8E8E8E",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  sprintingOptions: {
    gap: 16,
    marginTop: 56,
  },
  sprintingOptionWrap: {
    alignSelf: "center",
    overflow: "visible",
    position: "relative",
    width: "75%",
  },
  sprintingOptionShell: {
    overflow: "visible",
    position: "relative",
    width: "100%",
  },
  sprintingOptionButton: {
    minHeight: 118,
    paddingHorizontal: 14,
    paddingVertical: 14,
    width: "100%",
  },
  sprintingOptionButtonSelected: {
    borderColor: "#ffffff",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  sprintingOptionLabel: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
  },
  sprintingGoldBurst: {
    alignItems: "center",
    elevation: 12,
    height: 1,
    justifyContent: "center",
    position: "absolute",
    width: 1,
    zIndex: 4,
  },
  sprintingGoldRay: {
    backgroundColor: "#ffffff",
    borderRadius: 2,
    height: 34,
    left: "50%",
    marginLeft: -1.5,
    marginTop: -17,
    position: "absolute",
    top: "50%",
    width: 3,
  },
  circuitFocusContent: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 120,
  },
  circuitFocusGrid: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
    maxWidth: 340,
    width: "100%",
  },
  circuitFocusOption: {
    alignItems: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    justifyContent: "center",
    minHeight: 82,
    paddingHorizontal: 8,
    paddingVertical: 10,
    width: "30%",
  },
  circuitFocusOptionSelected: {
    borderColor: "#C9B259",
    elevation: 8,
    shadowColor: "#C9B259",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    transform: [{ translateY: -7 }, { scale: 1.025 }],
  },
  circuitFocusOptionDimmed: {
    backgroundColor: "#0B0B0B",
    borderColor: "#171717",
    opacity: 0.42,
  },
  circuitFocusOptionIcon: {
    marginBottom: 1,
  },
  circuitFocusOptionText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
    lineHeight: 15,
    textAlign: "center",
  },
  circuitFocusOptionTextSelected: {
    color: "#ffffff",
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
    width: "48%",
    minWidth: 148,
    maxWidth: 190,
    elevation: 12,
  },
  infoCardSelected: {
    borderColor: "#2D2D2D",
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
  largeOptionContent: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 120,
  },
  heavyBagOptionContent: {
    flex: 1,
    justifyContent: "flex-start",
    paddingBottom: 120,
    paddingTop: 64,
  },
  largeOptionGrid: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    justifyContent: "flex-start",
    width: 280,
  },
  largeOptionBorder: {
    backgroundColor: "#303030",
    borderRadius: 30,
    height: 138.2,
    paddingBottom: 12,
    paddingLeft: 1.2,
    paddingRight: 1.2,
    paddingTop: 1.2,
    width: 127.4,
  },
  largeOptionBorderSelected: {
    height: 127.4,
    paddingBottom: 1.2,
    transform: [{ translateY: 10.8 }],
  },
  largeOptionFace: {
    alignItems: "center",
    backgroundColor: "#0D0D0D",
    borderRadius: 28.8,
    gap: 8,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  largeOptionIcon: {
    marginBottom: 1,
  },
  largeOptionText: {
    color: "#ffffff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 18,
    lineHeight: 21,
    textAlign: "center",
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    color: "#ffffff",
    fontSize: 14, fontWeight: "800",
    textAlign: "center",
  },
  groupHint: {
    color: "#D1D5DB",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  exampleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
  },
  chip: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: "#C9B259",
    borderColor: "#ffffff",
  },
  optionPressed: {
    opacity: 0.78,
  },
  chipPressed: {
    opacity: 0.78,
  },
  chipText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  chipTextSelected: {
    color: "#111827",
  },
  textarea: {
    backgroundColor: "#F9FAFB",
    borderColor: "rgba(17,24,39,0.14)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 15,
    minHeight: 88,
    padding: 10,
    textAlignVertical: "top",
  },
  warningText: {
    color: "#FDE68A",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  chatSection: {
    paddingTop: 0,
    position: "relative",
  },
  topChatHeader: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderBottomColor: "#1E1E1E",
    borderBottomWidth: 2,
    flexDirection: "row",
    gap: 10,
    minHeight: 108,
    paddingHorizontal: 28,
    paddingTop: 50,
    width: "100%",
  },
  botAvatar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  botAvatarImage: {
    height: 27,
    width: 27,
  },
  chatHeaderCopy: {
    gap: 2,
  },
  chatName: {
    color: "#ffffff",
    fontSize: 16,
  },
  chatStatus: {
    color: "#C9B259",
    fontSize: 12,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginLeft: "auto",
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  skipButtonText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  continueButtonDisabled: {
    opacity: 0.28,
  },
  continueButtonText: {
    color: "#000000",
    fontSize: 14,
  },
  chatContentSlot: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 108,
  },
  chatFeed: {
    alignSelf: "center",
    flex: 1,
    gap: 12,
    width: "84%",
  },
  chatScroll: {
    flex: 1,
  },
  messages: {
    flexGrow: 1,
    gap: 4,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  timestampPill: {
    alignSelf: "center",
    backgroundColor: "#242424",
    borderRadius: 999,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timestampText: {
    color: "#8E8E8E",
    fontSize: 11,
  },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10,
  },
  botIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    marginBottom: 2,
    width: 34,
  },
  botIconSpacer: {
    height: 34,
    width: 34,
  },
  botIconImage: {
    height: 24,
    width: 24,
  },
  messageBubble: {
    backgroundColor: "#C9B259",
    borderRadius: 22,
    maxWidth: "76%",
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  exampleBubbleWrap: {
    alignItems: "flex-start",
    gap: 6,
    marginLeft: 44,
    marginTop: 10,
  },
  exampleReplyButton: {
    backgroundColor: "#242424",
    borderColor: "#3A3A3A",
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: "86%",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exampleReplyText: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 16,
  },
  userMessages: {
    gap: 4,
    marginTop: 14,
  },
  userMessageRow: {
    alignItems: "flex-end",
  },
  userMessageBubble: {
    backgroundColor: "#2F2F2F",
    borderRadius: 22,
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  emptyReplyHint: {
    alignSelf: "flex-end",
    borderColor: "#2A2A2A",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyReplyText: {
    color: "#6F6F6F",
    fontSize: 13,
  },
  inputWrap: {
    backgroundColor: "#1B1B1B",
    borderColor: "#2A2A2A",
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 58,
    position: "relative",
  },
  chatTextarea: {
    color: "#ffffff",
    fontSize: 16,
    maxHeight: 110,
    minHeight: 58,
    paddingLeft: 16,
    paddingRight: 58,
    paddingVertical: 10,
    textAlign: "left",
    textAlignVertical: "center",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#C9B259",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    width: 38,
  },
  sendIcon: {
    height: 20,
    tintColor: "#000000",
    width: 20,
  },
});
