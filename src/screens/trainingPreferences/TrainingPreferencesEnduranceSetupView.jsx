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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QuestionnaireBottomActionButton from "../../components/questionnaireComponents/QuestionnaireBottomActionButton.jsx";
import {
  CIRCUIT_GOAL_EXAMPLES,
  ENDURANCE_FORMAT_OPTIONS,
  HEAVY_BAG_ENDURANCE_TARGET_OPTIONS,
  SPRINTING_TARGET_OPTIONS,
} from "../../constants/trainingPreferences.js";
import {
  CIRCUIT_FOCUS_MODES,
  CIRCUIT_FOCUS_MODE_OPTIONS,
  getCircuitRegionOptions,
} from "../../constants/circuitFocus.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
import QuestionnaireChatMessage from "../../components/questionnaireComponents/QuestionnaireChatMessage.jsx";
const ENDURANCE_FORMAT_DETAILS = Object.freeze({
  plan_decides:
    "The plan selects the right mix based on your sport, training phase, experience, weekly workload, and the rest of your answers.",
  low_intensity_aerobic:
    "Steady, low-intensity work to build aerobic capacity, improve efficiency, and support recovery.",
  aerobic_intervals:
    "Controlled intervals designed to improve aerobic power, pacing, and your ability to repeat longer efforts.",
  high_intensity_intervals:
    "Hard intervals designed to improve repeated bursts and maintain output as fatigue builds.",
  sport_specific_conditioning:
    "Conditioning matched to your sport’s round length, work-rest structure, and movement demands.",
});
const ENDURANCE_FORMAT_META = Object.freeze({
  plan_decides: Object.freeze({
    icon: "scale-balance",
    accent: "#F3C33C",
    accentMuted: "rgba(243, 195, 60, 0.14)",
  }),
  low_intensity_aerobic: Object.freeze({
    icon: "heart-outline",
    accent: "#30D158",
    accentMuted: "rgba(48, 209, 88, 0.14)",
  }),
  aerobic_intervals: Object.freeze({
    icon: "pulse",
    accent: "#0A84FF",
    accentMuted: "rgba(10, 132, 255, 0.14)",
  }),
  high_intensity_intervals: Object.freeze({
    icon: "lightning-bolt",
    accent: "#FF9F0A",
    accentMuted: "rgba(255, 159, 10, 0.14)",
  }),
  sport_specific_conditioning: Object.freeze({
    icon: "target",
    accent: "#FF453A",
    accentMuted: "rgba(255, 69, 58, 0.14)",
  }),
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
const CIRCUIT_REGION_ICONS = Object.freeze({
  grip_forearms: "hand-back-left",
  arms: "arm-flex",
  shoulders: "weight-lifter",
  neck: "head",
  upper_back: "human-handsup",
  trunk: "human-handsdown",
  hips: "run",
  legs: "shoe-print",
});
const CIRCUIT_MODE_META = Object.freeze({
  [CIRCUIT_FOCUS_MODES.SPECIFIC_REGIONS]: Object.freeze({
    accent: "#F3D04F",
    accentMuted: "rgba(243, 208, 79, 0.14)",
    icon: "locate",
  }),
  [CIRCUIT_FOCUS_MODES.WHOLE_BODY]: Object.freeze({
    accent: "#0A84FF",
    accentMuted: "rgba(10, 132, 255, 0.14)",
    icon: "body",
  }),
});
const CIRCUIT_REGION_OPTION_WIDTH = 127.4;
const CIRCUIT_REGION_OPTION_HEIGHT = 138.2;
const CIRCUIT_REGION_FACE_HEIGHT = 125;
const CIRCUIT_REGION_SELECTED_TRAVEL = 10.8;
const CIRCUIT_REGION_SHADOW_SCALE =
  (CIRCUIT_REGION_OPTION_HEIGHT - CIRCUIT_REGION_SELECTED_TRAVEL) /
  CIRCUIT_REGION_OPTION_HEIGHT;
const CIRCUIT_REGION_GRID_GAP = 15;
const CIRCUIT_REGION_GRID_WIDTH =
  CIRCUIT_REGION_OPTION_WIDTH * 2 + CIRCUIT_REGION_GRID_GAP;
const SPRINTING_TARGET_META = Object.freeze({
  speed_explosiveness: Object.freeze({
    icon: "run-fast",
    accent: "#0A84FF",
    accentMuted: "rgba(10, 132, 255, 0.14)",
  }),
  repeat_bursts: Object.freeze({
    icon: "repeat",
    accent: "#F3D04F",
    accentMuted: "rgba(243, 208, 79, 0.14)",
  }),
  hard_conditioning: Object.freeze({
    icon: "fire",
    accent: "#FF9F0A",
    accentMuted: "rgba(255, 159, 10, 0.14)",
  }),
});
const SPRINTING_TARGET_DETAILS = Object.freeze({
  speed_explosiveness:
    "Max-effort sprints with plenty of rest. Built to improve acceleration and top-end speed.\nUse when: Speed and explosiveness are the priority.",
  repeat_bursts:
    "Short sprints repeated with incomplete rest. Built to maintain speed across several hard efforts.\nUse when: You need repeated high-intensity output with less drop-off.",
  hard_conditioning:
    "Hard sprint intervals with limited recovery. Built to improve conditioning and your ability to keep working under fatigue.\nUse when: Conditioning and competition readiness are the priority.",
});
const SPRINTING_DESCRIPTION_COLLAPSE_END = 64;
const SPRINTING_HEADER_COLLAPSE_END = 142;
const SPRINTING_TITLE_COLLAPSE_START = 84;
const SPRINTING_TITLE_COLLAPSE_END = 116;
const SPRINTING_COLLAPSED_HEADER_HEIGHT = 64;
const SPRINTING_EXPANDED_TITLE_TOP = 58;
const SPRINTING_EXPANDED_TITLE_HEIGHT = 88;
const SPRINTING_EXPANDED_DESCRIPTION_TOP = 138;
const SPRINTING_EXPANDED_HEADER_HEIGHT = 252;
const SPRINTING_OPTIONS_TOP_GAP = 12;
const SPRINTING_BOTTOM_ACTION_CLEARANCE = 96;
const CONDITIONING_DESCRIPTION_COLLAPSE_END = 64;
const CONDITIONING_HEADER_COLLAPSE_END = 142;
const CONDITIONING_TITLE_COLLAPSE_START = 84;
const CONDITIONING_TITLE_COLLAPSE_END = 116;
const CONDITIONING_COLLAPSED_HEADER_HEIGHT = 64;
const CONDITIONING_EXPANDED_TITLE_TOP = 58;
const CONDITIONING_EXPANDED_TITLE_HEIGHT = 88;
const CONDITIONING_EXPANDED_DESCRIPTION_TOP = 132;
const CONDITIONING_EXPANDED_HEADER_HEIGHT = 236;
const CONDITIONING_OPTIONS_TOP_GAP = 12;
const CONDITIONING_BOTTOM_ACTION_CLEARANCE = 96;
const GOLD_RAY_ANGLES = Object.freeze([0, 45, 90, 135, 180, 225, 270, 315]);
const HEAVY_BAG_TARGET_ICONS = Object.freeze({
  aerobic_bag_work: "heart-pulse",
  tempo_sustained_conditioning: "timer-sand",
  repeated_burst_bag_work: "repeat",
  local_upper_body_endurance: "arm-flex",
  sport_specific_fight_camp_simulation: "boxing-glove",
});

function EnduranceStyleOptionButton({
  value,
  index,
  isSelected,
  label,
  description,
  onPress,
}) {
  const meta = ENDURANCE_FORMAT_META[value];
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
    <Animated.View style={[styles.styleOptionWrap, animatedStyle]}>
      <Pressable
        accessibilityLabel={[label, description].join(". ")}
        accessibilityRole="radio"
        accessibilityState={{ selected: isSelected }}
        onPress={onPress}
        onPressIn={() => animatePress(1)}
        onPressOut={() => animatePress(0)}
        style={({ pressed }) => [
          styles.styleOptionButton,
          isSelected ? styles.styleOptionButtonSelected : null,
          isSelected ? { borderColor: meta.accent } : null,
          pressed ? styles.styleOptionPressed : null,
        ]}
      >
        <View style={[styles.styleOptionIcon, { backgroundColor: meta.accentMuted }]}>
          <MaterialCommunityIcons name={meta.icon} size={29} color={meta.accent} />
        </View>

        <View style={styles.styleOptionCopy}>
          <View style={styles.styleOptionTitleRow}>
            <IBMPlexText defaultWhite style={styles.styleOptionLabel}>
              {label}
            </IBMPlexText>
            {value === "plan_decides" ? (
              <View style={styles.recommendedBadge}>
                <IBMPlexText style={styles.recommendedBadgeText}>
                  Recommended
                </IBMPlexText>
              </View>
            ) : null}
          </View>
          <IBMPlexText style={styles.styleOptionDescription}>
            {description}
          </IBMPlexText>
          {value === "sport_specific_conditioning" ? (
            <View style={styles.sportSpecificNote}>
              <MaterialCommunityIcons name="alert-outline" size={16} color={meta.accent} />
              <IBMPlexText style={styles.sportSpecificNoteText}>
                Best when preparing for competition. You can change this later.
              </IBMPlexText>
            </View>
          ) : null}
        </View>

        <View style={[styles.styleOptionRadio, isSelected ? { borderColor: meta.accent } : null]}>
          {isSelected ? (
            <View style={[styles.styleOptionRadioFill, { backgroundColor: meta.accent }]} />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ConditioningFocusView({ values, onChange }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);
  const expandedHeaderHeight = insets.top + CONDITIONING_EXPANDED_HEADER_HEIGHT;
  const contentBottom =
    expandedHeaderHeight + CONDITIONING_OPTIONS_TOP_GAP + contentHeight;
  const requiredScrollRange = Math.max(
    0,
    contentBottom - (screenHeight - CONDITIONING_BOTTOM_ACTION_CLEARANCE)
  );
  const needsScrolling = contentHeight > 0 && requiredScrollRange > 0;
  let scrollRange = needsScrolling
    ? Math.max(requiredScrollRange, CONDITIONING_TITLE_COLLAPSE_END)
    : 0;

  if (
    scrollRange > CONDITIONING_TITLE_COLLAPSE_START &&
    scrollRange < CONDITIONING_TITLE_COLLAPSE_END
  ) {
    scrollRange = CONDITIONING_TITLE_COLLAPSE_END;
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [
      0,
      CONDITIONING_DESCRIPTION_COLLAPSE_END,
      CONDITIONING_HEADER_COLLAPSE_END,
    ],
    outputRange: [
      expandedHeaderHeight,
      expandedHeaderHeight - 70,
      CONDITIONING_COLLAPSED_HEADER_HEIGHT,
    ],
    extrapolate: "clamp",
  });
  const descriptionOpacity = scrollY.interpolate({
    inputRange: [0, 38, CONDITIONING_DESCRIPTION_COLLAPSE_END],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });
  const descriptionScale = scrollY.interpolate({
    inputRange: [0, CONDITIONING_DESCRIPTION_COLLAPSE_END],
    outputRange: [1, 0.78],
    extrapolate: "clamp",
  });
  const expandedTitleOpacity = scrollY.interpolate({
    inputRange: [
      CONDITIONING_TITLE_COLLAPSE_START,
      102,
      CONDITIONING_TITLE_COLLAPSE_END,
    ],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [CONDITIONING_TITLE_COLLAPSE_START, CONDITIONING_TITLE_COLLAPSE_END],
    outputRange: [1, 0.58],
    extrapolate: "clamp",
  });
  const titleTranslateX = scrollY.interpolate({
    inputRange: [CONDITIONING_TITLE_COLLAPSE_START, CONDITIONING_TITLE_COLLAPSE_END],
    outputRange: [0, Math.min(112, screenWidth * 0.28)],
    extrapolate: "clamp",
  });
  const titleTranslateY = scrollY.interpolate({
    inputRange: [CONDITIONING_TITLE_COLLAPSE_START, CONDITIONING_TITLE_COLLAPSE_END],
    outputRange: [0, -(insets.top + 75)],
    extrapolate: "clamp",
  });
  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [98, CONDITIONING_TITLE_COLLAPSE_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.conditioningScreen, { height: screenHeight }]}>
      <Animated.ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.conditioningScrollContent,
          {
            minHeight: screenHeight + scrollRange,
            paddingTop: expandedHeaderHeight + CONDITIONING_OPTIONS_TOP_GAP,
          },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEnabled={needsScrolling}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.conditioningScroll}
      >
        <View
          accessibilityRole="radiogroup"
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setContentHeight((currentHeight) =>
              currentHeight === nextHeight ? currentHeight : nextHeight
            );
          }}
          style={styles.conditioningContent}
        >
          <View style={styles.styleOptions}>
            {ENDURANCE_FORMAT_OPTIONS.map((option, index) => (
              <EnduranceStyleOptionButton
                key={option.value}
                value={option.value}
                index={index}
                isSelected={values?.preferredEnduranceFormat === option.value}
                label={option.label}
                description={ENDURANCE_FORMAT_DETAILS[option.value]}
                onPress={() =>
                  onChange?.({
                    ...values,
                    preferredEnduranceFormat:
                      values?.preferredEnduranceFormat === option.value
                        ? null
                        : option.value,
                  })
                }
              />
            ))}
          </View>

          <View style={styles.styleReassurance}>
            <Ionicons name="information-circle-outline" size={22} color="#9A9AA2" />
            <IBMPlexText style={styles.styleReassuranceText}>
              You can change this later. Your plan will adapt as your progress and needs change.
            </IBMPlexText>
          </View>
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[styles.conditioningStickyHeader, { height: headerHeight }]}
      >
        <Animated.View
          style={[
            styles.conditioningExpandedTitle,
            {
              opacity: expandedTitleOpacity,
              top: insets.top + CONDITIONING_EXPANDED_TITLE_TOP,
              transform: [
                { translateX: titleTranslateX },
                { translateY: titleTranslateY },
                { scale: titleScale },
              ],
            },
          ]}
        >
          <IBMPlexText titleBlock height={CONDITIONING_EXPANDED_TITLE_HEIGHT}>
            Conditioning focus
          </IBMPlexText>
        </Animated.View>

        <Animated.View
          style={[
            styles.conditioningDescription,
            {
              opacity: descriptionOpacity,
              top: insets.top + CONDITIONING_EXPANDED_DESCRIPTION_TOP,
              transform: [{ scale: descriptionScale }],
            },
          ]}
        >
          <IBMPlexText defaultWhite style={styles.conditioningHelperText} center>
            Pick what you want the plan to favor when it makes sense.
            {"\n"}Other methods will still be used.
          </IBMPlexText>
        </Animated.View>

        <Animated.View
          style={[styles.conditioningCompactTitle, { opacity: compactTitleOpacity }]}
        >
          <IBMPlexText defaultWhite style={styles.conditioningCompactTitleText}>
            Conditioning focus
          </IBMPlexText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function SprintingFocusOptionButton({
  description,
  index,
  isSelected,
  label,
  meta,
  onPress,
}) {
  const entranceProgress = useRef(new Animated.Value(0)).current;
  const pressProgress = useRef(new Animated.Value(0)).current;
  const burstProgress = useRef(new Animated.Value(0)).current;
  const optionShellRef = useRef(null);
  const wasSelectedRef = useRef(isSelected);
  const [burstOrigin, setBurstOrigin] = useState({ x: "50%", y: "50%" });

  useEffect(() => {
    Animated.timing(entranceProgress, {
      toValue: 1,
      duration: 360,
      delay: index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entranceProgress, index]);

  useEffect(() => {
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
  }, [burstProgress, isSelected]);

  function animatePress(toValue, event) {
    if (event?.nativeEvent) {
      const {
        locationX,
        locationY,
        pageX,
        pageY,
      } = event.nativeEvent;

      if (Number.isFinite(locationX) && Number.isFinite(locationY)) {
        setBurstOrigin({ x: locationX, y: locationY });
      }

      if (
        Number.isFinite(pageX) &&
        Number.isFinite(pageY) &&
        optionShellRef.current?.measure
      ) {
        optionShellRef.current.measure(
          (_x, _y, shellWidth, shellHeight, shellPageX, shellPageY) => {
            setBurstOrigin({
              x: Math.min(Math.max(pageX - shellPageX, 0), shellWidth),
              y: Math.min(Math.max(pageY - shellPageY, 0), shellHeight),
            });
          }
        );
      }
    }

    Animated.timing(pressProgress, {
      toValue,
      duration: toValue ? 70 : 110,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const optionAnimatedStyle = {
    opacity: Animated.multiply(
      entranceProgress,
      pressProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.76],
      })
    ),
    transform: [
      {
        translateY: entranceProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
      {
        scale: pressProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.985],
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
      <Animated.View
        ref={optionShellRef}
        style={[styles.sprintingOptionShell, optionAnimatedStyle]}
      >
        <Pressable
          accessibilityLabel={`${label}. ${description}`}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected }}
          onPress={onPress}
          onPressIn={(event) => animatePress(1, event)}
          onPressOut={() => animatePress(0)}
          style={[
            styles.sprintingOptionButton,
            isSelected ? styles.sprintingOptionButtonSelected : null,
            isSelected ? { borderColor: meta.accent } : null,
          ]}
        >
          <View style={styles.sprintingOptionHeader}>
            <View
              style={[
                styles.sprintingOptionIcon,
                { backgroundColor: meta.accentMuted },
              ]}
            >
              <MaterialCommunityIcons
                name={meta.icon}
                size={29}
                color={meta.accent}
              />
            </View>

            <IBMPlexText defaultWhite style={styles.sprintingOptionLabel}>
              {label}
            </IBMPlexText>

            <View
              style={[
                styles.sprintingOptionRadio,
                isSelected ? { borderColor: meta.accent } : null,
              ]}
            >
              {isSelected ? (
                <View
                  style={[
                    styles.sprintingOptionRadioFill,
                    { backgroundColor: meta.accent },
                  ]}
                />
              ) : null}
            </View>
          </View>

          <IBMPlexText style={styles.sprintingOptionDescription}>
            {description}
          </IBMPlexText>
        </Pressable>
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
                { backgroundColor: meta.accent },
                { transform: [{ rotate: `${angle}deg` }, { translateY: -54 }] },
              ]}
            />
          ))}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function SprintingFocusView({ values, onChange }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [optionsHeight, setOptionsHeight] = useState(0);
  const expandedHeaderHeight = insets.top + SPRINTING_EXPANDED_HEADER_HEIGHT;
  const collapsedHeaderHeight = SPRINTING_COLLAPSED_HEADER_HEIGHT;
  const optionsBottom =
    expandedHeaderHeight + SPRINTING_OPTIONS_TOP_GAP + optionsHeight;
  const requiredScrollRange = Math.max(
    0,
    optionsBottom - (screenHeight - SPRINTING_BOTTOM_ACTION_CLEARANCE)
  );
  const needsScrolling = optionsHeight > 0 && requiredScrollRange > 0;
  let scrollRange = needsScrolling
    ? Math.max(requiredScrollRange, SPRINTING_TITLE_COLLAPSE_END)
    : 0;

  if (
    scrollRange > SPRINTING_TITLE_COLLAPSE_START &&
    scrollRange < SPRINTING_TITLE_COLLAPSE_END
  ) {
    scrollRange = SPRINTING_TITLE_COLLAPSE_END;
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [
      0,
      SPRINTING_DESCRIPTION_COLLAPSE_END,
      SPRINTING_HEADER_COLLAPSE_END,
    ],
    outputRange: [
      expandedHeaderHeight,
      expandedHeaderHeight - 70,
      collapsedHeaderHeight,
    ],
    extrapolate: "clamp",
  });
  const descriptionOpacity = scrollY.interpolate({
    inputRange: [0, 38, SPRINTING_DESCRIPTION_COLLAPSE_END],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });
  const descriptionScale = scrollY.interpolate({
    inputRange: [0, SPRINTING_DESCRIPTION_COLLAPSE_END],
    outputRange: [1, 0.78],
    extrapolate: "clamp",
  });
  const expandedTitleOpacity = scrollY.interpolate({
    inputRange: [SPRINTING_TITLE_COLLAPSE_START, 102, SPRINTING_TITLE_COLLAPSE_END],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [SPRINTING_TITLE_COLLAPSE_START, SPRINTING_TITLE_COLLAPSE_END],
    outputRange: [1, 0.58],
    extrapolate: "clamp",
  });
  const titleTranslateX = scrollY.interpolate({
    inputRange: [SPRINTING_TITLE_COLLAPSE_START, SPRINTING_TITLE_COLLAPSE_END],
    outputRange: [0, Math.min(112, screenWidth * 0.28)],
    extrapolate: "clamp",
  });
  const titleTranslateY = scrollY.interpolate({
    inputRange: [SPRINTING_TITLE_COLLAPSE_START, SPRINTING_TITLE_COLLAPSE_END],
    outputRange: [0, -(insets.top + 75)],
    extrapolate: "clamp",
  });
  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [98, SPRINTING_TITLE_COLLAPSE_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.sprintingScreen, { height: screenHeight }]}>
      <Animated.ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.sprintingScrollContent,
          {
            minHeight: screenHeight + scrollRange,
            paddingTop: expandedHeaderHeight + SPRINTING_OPTIONS_TOP_GAP,
          },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEnabled={needsScrolling}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={styles.sprintingScroll}
      >
        <View
          accessibilityRole="radiogroup"
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setOptionsHeight((currentHeight) =>
              currentHeight === nextHeight ? currentHeight : nextHeight
            );
          }}
          style={styles.sprintingOptions}
        >
          {SPRINTING_TARGET_OPTIONS.map((option, index) => {
            const isSelected = values?.sprintingTarget === option.value;

            return (
              <SprintingFocusOptionButton
                key={option.value}
                index={index}
                isSelected={isSelected}
                label={option.label}
                description={SPRINTING_TARGET_DETAILS[option.value]}
                meta={SPRINTING_TARGET_META[option.value]}
                onPress={() =>
                  onChange?.({
                    ...values,
                    sprintingTarget: isSelected ? null : option.value,
                  })
                }
              />
            );
          })}
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[styles.sprintingStickyHeader, { height: headerHeight }]}
      >
        <Animated.View
          style={[
            styles.sprintingExpandedTitle,
            {
              opacity: expandedTitleOpacity,
              top: insets.top + SPRINTING_EXPANDED_TITLE_TOP,
              transform: [
                { translateX: titleTranslateX },
                { translateY: titleTranslateY },
                { scale: titleScale },
              ],
            },
          ]}
        >
          <IBMPlexText titleBlock height={SPRINTING_EXPANDED_TITLE_HEIGHT}>
            Sprinting focus
          </IBMPlexText>
        </Animated.View>

        <Animated.View
          style={[
            styles.sprintingDescription,
            {
              opacity: descriptionOpacity,
              top: insets.top + SPRINTING_EXPANDED_DESCRIPTION_TOP,
              transform: [{ scale: descriptionScale }],
            },
          ]}
        >
          <IBMPlexText defaultWhite style={styles.sprintingHelperText} center>
            Pick what sprint sessions should mainly train.
          </IBMPlexText>
        </Animated.View>

        <Animated.View
          style={[
            styles.sprintingCompactTitle,
            { opacity: compactTitleOpacity },
          ]}
        >
          <IBMPlexText defaultWhite style={styles.sprintingCompactTitleText}>
            Sprinting focus
          </IBMPlexText>
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

function CircuitFocusModeCard({ option, selected, onPress }) {
  const meta = CIRCUIT_MODE_META[option.value] || CIRCUIT_MODE_META[
    CIRCUIT_FOCUS_MODES.SPECIFIC_REGIONS
  ];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.circuitModeCard,
        selected ? styles.circuitModeCardSelected : null,
        selected ? { borderColor: meta.accent } : null,
        pressed ? styles.optionPressed : null,
      ]}
    >
      <View style={styles.circuitModeCardHeader}>
        <View
          style={[
            styles.circuitModeIcon,
            { backgroundColor: meta.accentMuted },
          ]}
        >
          <Ionicons name={meta.icon} size={27} color={meta.accent} />
        </View>
        <View style={styles.circuitModeCopy}>
          <IBMPlexText defaultWhite style={styles.circuitModeTitle}>
            {option.label}
          </IBMPlexText>
          <IBMPlexText style={styles.circuitModeDescription}>
            {option.description}
          </IBMPlexText>
        </View>
        <View style={[styles.circuitModeRadio, selected ? { borderColor: meta.accent } : null]}>
          {selected ? (
            <View style={[styles.circuitModeRadioFill, { backgroundColor: meta.accent }]} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function CircuitRegionChip({ option, selected, onPress }) {
  const selectionProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    selectionProgress.stopAnimation();
    Animated.spring(selectionProgress, {
      toValue: selected ? 1 : 0,
      damping: 20,
      stiffness: 340,
      mass: 0.62,
      useNativeDriver: true,
    }).start();
  }, [selected, selectionProgress]);

  function handlePressIn() {
    pressScale.stopAnimation();
    Animated.spring(pressScale, {
      toValue: 0.982,
      damping: 22,
      stiffness: 520,
      mass: 0.45,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    pressScale.stopAnimation();
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 16,
      stiffness: 260,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  }

  const shadowContainerStyle = {
    transform: [{
      translateY: selectionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, CIRCUIT_REGION_SELECTED_TRAVEL / 2],
      }),
    }],
  };
  const shadowStyle = {
    transform: [{
      scaleY: selectionProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, CIRCUIT_REGION_SHADOW_SCALE],
      }),
    }],
  };
  const optionStyle = {
    transform: [
      {
        translateY: selectionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, CIRCUIT_REGION_SELECTED_TRAVEL],
        }),
      },
      { scale: pressScale },
    ],
  };

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.circuitRegionChip}
    >
      <Animated.View style={[styles.circuitRegionShadowContainer, shadowContainerStyle]}>
        <Animated.View style={[styles.circuitRegionShadow, shadowStyle]} />
      </Animated.View>
      <Animated.View style={[styles.circuitRegionFace, optionStyle]}>
        <View style={styles.circuitRegionIcon}>
          <MaterialCommunityIcons
            name={CIRCUIT_REGION_ICONS[option.value] || "target"}
            size={34}
            color="#FFFFFF"
          />
        </View>
        <IBMPlexText numberOfLines={2} style={styles.circuitRegionChipText}>
          {option.label}
        </IBMPlexText>
        {selected ? (
          <View style={styles.circuitRegionCheck}>
            <Ionicons name="checkmark" size={13} color="#111111" />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
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
  onBack,
  onSkip,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [draftMessage, setDraftMessage] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [circuitFocusStage, setCircuitFocusStage] = useState("choice");
  const [circuitMessages, setCircuitMessages] = useState(() =>
    values?.circuitTrainingGoalInput ? [values.circuitTrainingGoalInput] : []
  );
  const circuitChatScrollRef = useRef(null);
  const selectedCircuitRegions = Array.isArray(values?.circuitTrainingRegions)
    ? values.circuitTrainingRegions
    : [];
  const circuitRegionOptions = getCircuitRegionOptions(values?.primaryCombatSport);
  const maxEnduranceDays = Math.max(
    MIN_ENDURANCE_DAYS,
    Math.min(
      MAX_ENDURANCE_DAYS,
      Number.parseInt(values?.daysPerWeek, 10) || MAX_ENDURANCE_DAYS
    )
  );
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

  function selectCircuitFocusMode(focusMode) {
    const isWholeBody = focusMode === CIRCUIT_FOCUS_MODES.WHOLE_BODY;

    updateFields({
      circuitTrainingFocusMode: focusMode,
      circuitTrainingRegions: isWholeBody ? [] : selectedCircuitRegions,
      circuitTrainingGoalInput: "",
      circuitTrainingPrimaryPriority: isWholeBody ? "whole_body_work_capacity" : "",
      circuitTrainingSecondaryPriorities: [],
    });
  }

  function updateCircuitRegions(nextRegions) {
    updateFields({
      circuitTrainingFocusMode: CIRCUIT_FOCUS_MODES.SPECIFIC_REGIONS,
      circuitTrainingRegions: nextRegions,
      circuitTrainingGoalInput: "",
      circuitTrainingPrimaryPriority: "",
      circuitTrainingSecondaryPriorities: [],
    });
  }

  function toggleCircuitRegion(region) {
    updateCircuitRegions(
      selectedCircuitRegions.includes(region)
        ? selectedCircuitRegions.filter((value) => value !== region)
        : [...selectedCircuitRegions, region]
    );
  }

  function continueCircuitFocus() {
    if (circuitFocusStage === "choice") {
      if (values?.circuitTrainingFocusMode === CIRCUIT_FOCUS_MODES.SPECIFIC_REGIONS) {
        setCircuitFocusStage("regions");
        return;
      }

      if (values?.circuitTrainingFocusMode === CIRCUIT_FOCUS_MODES.WHOLE_BODY) {
        onContinue?.();
      }
      return;
    }

    if (selectedCircuitRegions.length > 0) {
      onContinue?.();
    }
  }

  function goBackFromCircuitFocus() {
    if (circuitFocusStage === "regions") {
      setCircuitFocusStage("choice");
      return;
    }

    onBack?.();
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

  useEffect(() => {
    if (mode !== "circuitGoal") {
      return undefined;
    }

    const scrollTimeout = setTimeout(() => {
      circuitChatScrollRef.current?.scrollToEnd({
        animated: circuitMessages.length > 0,
      });
    }, 0);

    return () => clearTimeout(scrollTimeout);
  }, [circuitMessages.length, keyboardHeight, mode]);

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
              ref={circuitChatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.messages}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.timestampPill}>
                <IBMPlexText defaultWhite style={styles.timestampText}>Today</IBMPlexText>
              </View>

              {CIRCUIT_BOT_MESSAGES.map((message, index) => (
                <QuestionnaireChatMessage
                  key={`circuit-bot-message-${index}`}
                  delay={120 + index * 180}
                  direction="received"
                  style={styles.messageRow}
                >
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
                </QuestionnaireChatMessage>
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
                    <QuestionnaireChatMessage
                      key={`user-circuit-message-${index}`}
                      delay={
                        index === 0 && values?.circuitTrainingGoalInput ? 620 : 0
                      }
                      direction="sent"
                      style={styles.userMessageRow}
                    >
                      <View style={styles.userMessageBubble}>
                        <IBMPlexText defaultWhite style={styles.userMessageText} textColor="#ffffff">
                          {message}
                        </IBMPlexText>
                      </View>
                    </QuestionnaireChatMessage>
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
    const isRegionStage = circuitFocusStage === "regions";
    const selectedFocusMode = values?.circuitTrainingFocusMode;
    const canAdvance = isRegionStage
      ? selectedCircuitRegions.length > 0
      : Boolean(selectedFocusMode);
    const actionText = !isRegionStage && selectedFocusMode !== CIRCUIT_FOCUS_MODES.WHOLE_BODY
      ? "Continue"
      : "Build my circuit";

    return (
      <View style={[styles.section, styles.circuitFocusSection, { minHeight: screenHeight }]}>
        <ScrollView
          contentContainerStyle={styles.circuitFocusScrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.circuitFocusScroll}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBackFromCircuitFocus}
            style={styles.circuitBackButton}
          >
            <Ionicons name="arrow-back" size={24} color="#9A9AA2" />
          </TouchableOpacity>

          <View style={styles.circuitFocusHeader}>
            <IBMPlexText titleBlock height={108}>
              {isRegionStage ? "Where do you fatigue?" : "What gives out first?"}
            </IBMPlexText>
            <IBMPlexText defaultWhite style={styles.circuitFocusHelper} center>
              {isRegionStage
                ? "To tailor your circuit training, choose every area that tends to fatigue first."
                : "This follow-up helps tailor your circuit training. Choose what usually fatigues first during hard circuits."}
            </IBMPlexText>
          </View>

          {isRegionStage ? (
            <>
              <View style={styles.circuitRegionGrid}>
                {circuitRegionOptions.map((option) => (
                  <CircuitRegionChip
                    key={option.value}
                    option={option}
                    selected={selectedCircuitRegions.includes(option.value)}
                    onPress={() => toggleCircuitRegion(option.value)}
                  />
                ))}
              </View>
              <View style={styles.circuitReassuranceRow}>
                <Ionicons name="information-circle" size={19} color="#0A84FF" />
                <IBMPlexText style={styles.circuitReassuranceText}>
                  These areas get extra work. The rest of your body still gets trained.
                </IBMPlexText>
              </View>
            </>
          ) : (
            <View accessibilityRole="radiogroup" style={styles.circuitModeList}>
              {CIRCUIT_FOCUS_MODE_OPTIONS.map((option) => (
                <CircuitFocusModeCard
                  key={option.value}
                  option={option}
                  selected={selectedFocusMode === option.value}
                  onPress={() => selectCircuitFocusMode(option.value)}
                />
              ))}
            </View>
          )}

        </ScrollView>
        <QuestionnaireBottomActionButton
          animateTextChanges
          canContinue={canAdvance}
          contentSized
          hideBack
          hideWhenDisabled
          text={actionText}
          onContinue={continueCircuitFocus}
        />
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
    return <SprintingFocusView values={values} onChange={onChange} />;
  }

  return <ConditioningFocusView values={values} onChange={onChange} />;
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
    backgroundColor: "#000000",
    paddingTop: 0,
    position: "relative",
  },
  circuitFocusScroll: {
    flex: 1,
  },
  circuitFocusScrollContent: {
    flexGrow: 1,
    paddingBottom: 112,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  circuitBackButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  circuitFocusHeader: {
    alignSelf: "stretch",
    marginBottom: 34,
    marginTop: 30,
  },
  circuitFocusHelper: {
    alignSelf: "center",
    color: "#9A9AA2",
    fontSize: 15,
    lineHeight: 20,
    maxWidth: 330,
    width: "90%",
  },
  circuitModeList: {
    gap: 12,
    marginTop: "auto",
  },
  circuitModeCard: {
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 104,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  circuitModeCardSelected: {
    backgroundColor: "#171717",
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  circuitModeCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  circuitModeIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  circuitModeCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  circuitModeTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  circuitModeDescription: {
    color: "#9A9AA2",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  circuitModeRadio: {
    alignItems: "center",
    borderColor: "#56565F",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  circuitModeRadioFill: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  circuitRegionGrid: {
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CIRCUIT_REGION_GRID_GAP,
    width: CIRCUIT_REGION_GRID_WIDTH,
  },
  circuitRegionChip: {
    height: CIRCUIT_REGION_OPTION_HEIGHT,
    width: CIRCUIT_REGION_OPTION_WIDTH,
  },
  circuitRegionShadowContainer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  circuitRegionShadow: {
    backgroundColor: "#303030",
    borderRadius: 30,
    height: "100%",
    width: "100%",
  },
  circuitRegionFace: {
    alignItems: "center",
    backgroundColor: "#0D0D0D",
    borderRadius: 28.8,
    height: CIRCUIT_REGION_FACE_HEIGHT,
    justifyContent: "center",
    left: 1.2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: "absolute",
    right: 1.2,
    top: 1.2,
  },
  circuitRegionIcon: {
    alignItems: "center",
    height: 50,
    justifyContent: "center",
    marginBottom: 7,
    width: 58,
  },
  circuitRegionChipText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 18,
    minHeight: 36,
    textAlign: "center",
  },
  circuitRegionCheck: {
    alignItems: "center",
    backgroundColor: "#F3D04F",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 18,
  },
  circuitReassuranceRow: {
    alignItems: "center",
    borderTopColor: "#252525",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    paddingHorizontal: 2,
    paddingTop: 16,
  },
  circuitReassuranceText: {
    color: "#9A9AA2",
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
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
  conditioningScreen: {
    alignSelf: "stretch",
    position: "relative",
  },
  conditioningScroll: {
    alignSelf: "stretch",
    flex: 1,
  },
  conditioningScrollContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  conditioningContent: {
    alignSelf: "stretch",
    gap: 14,
  },
  conditioningStickyHeader: {
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  conditioningExpandedTitle: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  conditioningDescription: {
    left: 24,
    position: "absolute",
    right: 24,
  },
  conditioningHelperText: {
    alignSelf: "center",
    color: "#9A9AA2",
    fontSize: 15,
    lineHeight: 20,
    maxWidth: 340,
    width: "92%",
  },
  conditioningCompactTitle: {
    alignItems: "flex-end",
    justifyContent: "center",
    position: "absolute",
    right: 24,
    top: 17,
  },
  conditioningCompactTitleText: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  styleOptions: {
    gap: 12,
  },
  styleOptionWrap: {
    width: "100%",
  },
  styleOptionButton: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 112,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  styleOptionButtonSelected: {
    backgroundColor: "#171717",
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  styleOptionPressed: {
    opacity: 0.76,
  },
  styleOptionIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 54,
    justifyContent: "center",
    width: 54,
  },
  styleOptionCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0,
  },
  styleOptionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  styleOptionLabel: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  styleOptionDescription: {
    color: "#9A9AA2",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  recommendedBadge: {
    backgroundColor: "#F3C33C",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendedBadgeText: {
    color: "#111111",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 12,
    textTransform: "uppercase",
  },
  styleOptionRadio: {
    alignItems: "center",
    borderColor: "#56565F",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  styleOptionRadioFill: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  sportSpecificNote: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 5,
    marginTop: 3,
  },
  sportSpecificNoteText: {
    color: "#FF665E",
    flex: 1,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  styleReassurance: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  styleReassuranceText: {
    color: "#9A9AA2",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  sprintingOptions: {
    alignSelf: "stretch",
    gap: 12,
  },
  sprintingScreen: {
    alignSelf: "stretch",
    position: "relative",
  },
  sprintingScroll: {
    alignSelf: "stretch",
    flex: 1,
  },
  sprintingScrollContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sprintingOptionWrap: {
    alignSelf: "center",
    overflow: "visible",
    position: "relative",
    width: "100%",
  },
  sprintingOptionShell: {
    overflow: "visible",
    position: "relative",
    width: "100%",
  },
  sprintingOptionButton: {
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    minHeight: 154,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: "100%",
  },
  sprintingOptionButtonSelected: {
    backgroundColor: "#171717",
    borderWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  sprintingOptionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  sprintingOptionIcon: {
    alignItems: "center",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  sprintingOptionLabel: {
    color: "#ffffff",
    flex: 1,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
    minWidth: 0,
  },
  sprintingOptionDescription: {
    color: "#9A9AA2",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "left",
  },
  sprintingOptionRadio: {
    alignItems: "center",
    borderColor: "#56565F",
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  sprintingOptionRadioFill: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  sprintingStickyHeader: {
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  sprintingExpandedTitle: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  sprintingDescription: {
    left: 24,
    position: "absolute",
    right: 24,
  },
  sprintingHelperText: {
    alignSelf: "center",
    color: "#9A9AA2",
    fontSize: 15,
    lineHeight: 20,
    maxWidth: 330,
    width: "88%",
  },
  sprintingCompactTitle: {
    alignItems: "flex-end",
    justifyContent: "center",
    position: "absolute",
    right: 24,
    top: 17,
  },
  sprintingCompactTitleText: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
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
