import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  APP_LOGIC_SETTINGS_DEFAULTS,
  COMBAT_TRAINING_INTENSITY_OPTIONS,
} from "../../constants/appLogicSettings.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const MAIN_DESCRIPTION =
  "Select the option that best reflects your typical weekly sport-training intensity during this program.";
const DESCRIPTION_COLLAPSE_END = 64;
const HEADER_COLLAPSE_END = 142;
const TITLE_COLLAPSE_START = 84;
const TITLE_COLLAPSE_END = 116;
const COLLAPSED_HEADER_HEIGHT = 64;
const EXPANDED_TITLE_TOP = 58;
const EXPANDED_TITLE_HEIGHT = 88;
const EXPANDED_DESCRIPTION_TOP = 138;
const EXPANDED_HEADER_HEIGHT = 252;
const OPTIONS_TOP_GAP = 12;
const BOTTOM_ACTION_CLEARANCE = 96;

const INTENSITY_DETAILS = Object.freeze({
  light: Object.freeze({
    accent: "#34C759",
    accentMuted: "rgba(52, 199, 89, 0.14)",
    description:
      "Mostly technical, low-intensity training. You usually finish fresh and recover fully by the next day.",
  }),
  moderate: Object.freeze({
    accent: "#0A84FF",
    accentMuted: "rgba(10, 132, 255, 0.14)",
    description:
      "Regular training with some harder periods, but fatigue stays manageable.",
  }),
  high: Object.freeze({
    accent: "#FF9F0A",
    accentMuted: "rgba(255, 159, 10, 0.14)",
    description:
      "Several demanding sessions each week. Hard rounds or live work regularly affect recovery.",
  }),
  very_high: Object.freeze({
    accent: "#E3262E",
    accentMuted: "rgba(227, 38, 46, 0.14)",
    description:
      "Fight-like, near-maximal, or intensive camp training. Recovery is heavily affected.",
  }),
});

function getSelectedValue(value) {
  return COMBAT_TRAINING_INTENSITY_OPTIONS.some(
    (option) => option.value === value
  )
    ? value
    : APP_LOGIC_SETTINGS_DEFAULTS.combatTrainingIntensity;
}

function IntensityIcon({ accent, level }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={styles.intensityIcon}
    >
      {[1, 2, 3, 4].map((barLevel) => (
        <View
          key={`intensity-bar-${barLevel}`}
          style={[
            styles.intensityBar,
            {
              backgroundColor:
                barLevel <= level ? accent : "rgba(142, 142, 150, 0.24)",
              height: 8 + barLevel * 6,
            },
          ]}
        />
      ))}
    </View>
  );
}

function IntensityOption({ level, onPress, option, selected }) {
  const details = INTENSITY_DETAILS[option.value];
  const displayLabel = option.label;

  return (
    <Pressable
      accessibilityLabel={`${level}. ${displayLabel}. ${details.description}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected ? styles.optionSelected : null,
        selected ? { borderColor: details.accent } : null,
        pressed ? styles.optionPressed : null,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: details.accentMuted },
        ]}
      >
        <IntensityIcon accent={details.accent} level={level} />
      </View>

      <View style={styles.optionCopy}>
        <IBMPlexText defaultWhite style={styles.optionTitle}>
          {displayLabel}
        </IBMPlexText>
        <IBMPlexText style={styles.optionDescription}>
          {details.description}
        </IBMPlexText>
      </View>

      <View
        style={[
          styles.radio,
          selected ? { borderColor: details.accent } : null,
        ]}
      >
        {selected ? (
          <View
            style={[styles.radioFill, { backgroundColor: details.accent }]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function CombatTrainingIntensityView({
  value,
  onChange,
  collapseTitleOnScroll = false,
}) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const selectedValue = getSelectedValue(value);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [optionsHeight, setOptionsHeight] = useState(0);
  const expandedHeaderHeight = insets.top + EXPANDED_HEADER_HEIGHT;
  const fixedTitleHeaderHeight =
    insets.top + EXPANDED_TITLE_TOP + EXPANDED_TITLE_HEIGHT + 16;
  const descriptionCollapsedHeaderHeight = collapseTitleOnScroll
    ? expandedHeaderHeight - 70
    : Math.max(expandedHeaderHeight - 70, fixedTitleHeaderHeight);
  const collapsedHeaderHeight = collapseTitleOnScroll
    ? COLLAPSED_HEADER_HEIGHT
    : fixedTitleHeaderHeight;
  const titleTravelX = Math.min(112, screenWidth * 0.28);
  const titleTravelY = -(insets.top + 75);
  const optionsBottom =
    expandedHeaderHeight + OPTIONS_TOP_GAP + optionsHeight;
  const requiredScrollRange = Math.max(
    0,
    optionsBottom - (screenHeight - BOTTOM_ACTION_CLEARANCE)
  );
  const needsScrolling = optionsHeight > 0 && requiredScrollRange > 0;
  let scrollRange = needsScrolling
    ? Math.max(requiredScrollRange, DESCRIPTION_COLLAPSE_END)
    : 0;

  if (
    collapseTitleOnScroll &&
    scrollRange > TITLE_COLLAPSE_START &&
    scrollRange < TITLE_COLLAPSE_END
  ) {
    scrollRange = TITLE_COLLAPSE_END;
  }

  const headerHeight = scrollY.interpolate({
    inputRange: [0, DESCRIPTION_COLLAPSE_END, HEADER_COLLAPSE_END],
    outputRange: [
      expandedHeaderHeight,
      descriptionCollapsedHeaderHeight,
      collapsedHeaderHeight,
    ],
    extrapolate: "clamp",
  });
  const descriptionOpacity = scrollY.interpolate({
    inputRange: [0, 38, DESCRIPTION_COLLAPSE_END],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });
  const descriptionScale = scrollY.interpolate({
    inputRange: [0, DESCRIPTION_COLLAPSE_END],
    outputRange: [1, 0.78],
    extrapolate: "clamp",
  });
  const expandedTitleOpacity = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, 102, TITLE_COLLAPSE_END],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, TITLE_COLLAPSE_END],
    outputRange: [1, 0.58],
    extrapolate: "clamp",
  });
  const titleTranslateX = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, TITLE_COLLAPSE_END],
    outputRange: [0, titleTravelX],
    extrapolate: "clamp",
  });
  const titleTranslateY = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, TITLE_COLLAPSE_END],
    outputRange: [0, titleTravelY],
    extrapolate: "clamp",
  });
  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [98, TITLE_COLLAPSE_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.screen, { height: screenHeight }]}>
      <Animated.ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.container,
          {
            minHeight: screenHeight + scrollRange,
            paddingTop: expandedHeaderHeight + OPTIONS_TOP_GAP,
          },
        ]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        scrollEnabled={needsScrolling}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View
          accessibilityRole="radiogroup"
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setOptionsHeight((currentHeight) =>
              currentHeight === nextHeight ? currentHeight : nextHeight
            );
          }}
          style={styles.options}
        >
          {COMBAT_TRAINING_INTENSITY_OPTIONS.map((option, index) => (
            <IntensityOption
              key={option.value}
              level={index + 1}
              onPress={() => onChange?.(option.value)}
              option={option}
              selected={selectedValue === option.value}
            />
          ))}
        </View>
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[styles.stickyHeader, { height: headerHeight }]}
      >
        <Animated.View
          style={[
            styles.expandedTitle,
            {
              opacity: collapseTitleOnScroll ? expandedTitleOpacity : 1,
              top: insets.top + EXPANDED_TITLE_TOP,
              transform: collapseTitleOnScroll
                ? [
                    { translateX: titleTranslateX },
                    { translateY: titleTranslateY },
                    { scale: titleScale },
                  ]
                : undefined,
            },
          ]}
        >
          <IBMPlexText
            titleBlock
            height={EXPANDED_TITLE_HEIGHT}
            style={styles.expandedTitleText}
          >
            How demanding will your sport training be?
          </IBMPlexText>
        </Animated.View>

        <Animated.View
          style={[
            styles.description,
            {
              opacity: descriptionOpacity,
              top: insets.top + EXPANDED_DESCRIPTION_TOP,
              transform: [{ scale: descriptionScale }],
            },
          ]}
        >
          <IBMPlexText defaultWhite style={styles.helperText} center>
            {MAIN_DESCRIPTION}
          </IBMPlexText>
        </Animated.View>

        <Animated.View
          style={[
            styles.compactTitle,
            {
              opacity: collapseTitleOnScroll ? compactTitleOpacity : 0,
            },
          ]}
        >
          <IBMPlexText defaultWhite style={styles.compactTitleText}>
            Sport training demand
          </IBMPlexText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignSelf: "stretch",
    position: "relative",
  },
  scrollView: {
    alignSelf: "stretch",
    flex: 1,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stickyHeader: {
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  expandedTitle: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  description: {
    left: 24,
    position: "absolute",
    right: 24,
  },
  compactTitle: {
    alignItems: "flex-end",
    justifyContent: "center",
    position: "absolute",
    right: 24,
    top: 17,
  },
  compactTitleText: {
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
  },
  expandedTitleText: {
    fontSize: 28,
    lineHeight: 34,
  },
  helperText: {
    alignSelf: "center",
    color: "#9A9AA2",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
    maxWidth: 340,
    width: "92%",
  },
  options: {
    alignSelf: "stretch",
    gap: 12,
  },
  option: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 116,
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
  intensityIcon: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    height: 32,
  },
  intensityBar: {
    borderRadius: 2,
    width: 6,
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
    paddingRight: 22,
  },
  optionDescription: {
    color: "#A0A0A8",
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
    position: "absolute",
    right: 16,
    top: 14,
    width: 24,
  },
  radioFill: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
});
