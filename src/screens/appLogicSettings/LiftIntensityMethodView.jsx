import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LIFT_INTENSITY_METHOD_OPTIONS,
} from "../../constants/appLogicSettings.js";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const LIFT_INTENSITY_META = Object.freeze({
  rpe: {
    title: "Adjust by effort",
    marker: "RPE",
    description: "Let perceived effort guide the load from session to session.",
    accent: "#AF52DE",
    accentMuted: "rgba(175, 82, 222, 0.14)",
  },
  percentage: {
    title: "Use percentages",
    marker: "%",
    description: "Prescribe loads from your established 1RM reference.",
    accent: "#0A84FF",
    accentMuted: "rgba(10, 132, 255, 0.14)",
  },
});

const DESCRIPTION_COLLAPSE_END = 64;
const HEADER_COLLAPSE_END = 142;
const TITLE_COLLAPSE_START = 84;
const TITLE_COLLAPSE_END = 116;
const COLLAPSED_HEADER_HEIGHT = 64;
const EXPANDED_TITLE_TOP = 58;
const EXPANDED_TITLE_HEIGHT = 88;
const EXPANDED_HEADER_HEIGHT = 252;
const OPTIONS_TOP_GAP = 12;
const BOTTOM_ACTION_CLEARANCE = 96;
const LIFT_INTENSITY_DISPLAY_ORDER = Object.freeze(["rpe", "percentage"]);

function FadeInOption({ children, delay = 0 }) {
  const enterProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enterProgress.setValue(0);
    Animated.timing(enterProgress, {
      toValue: 1,
      duration: 360,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, enterProgress]);

  const animatedStyle = {
    opacity: enterProgress,
    transform: [
      {
        translateY: enterProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.fadeInOption, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

function LiftIntensityOption({ option, selected, onPress }) {
  const meta = LIFT_INTENSITY_META[option.value];

  if (!meta) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel={`${meta.title}. ${meta.description}`}
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
          styles.markerContainer,
          { backgroundColor: meta.accentMuted },
        ]}
      >
        <IBMPlexText
          defaultWhite
          numberOfLines={1}
          style={[styles.markerText, { color: meta.accent }]}
        >
          {meta.marker}
        </IBMPlexText>
      </View>

      <View style={styles.optionCopy}>
        <IBMPlexText defaultWhite style={styles.optionTitle}>
          {meta.title}
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

export default function LiftIntensityMethodView({
  value,
  onChange,
  collapseTitleOnScroll = true,
}) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
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
    ? Math.max(
        requiredScrollRange,
        collapseTitleOnScroll
          ? TITLE_COLLAPSE_END
          : DESCRIPTION_COLLAPSE_END
      )
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
        scrollEnabled={needsScrolling}
        scrollEventThrottle={16}
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
          {LIFT_INTENSITY_DISPLAY_ORDER.map((optionValue, index) => {
            const option = LIFT_INTENSITY_METHOD_OPTIONS.find(
              (methodOption) => methodOption.value === optionValue
            );
            if (!option) {
              return null;
            }

            return (
              <FadeInOption key={option.value} delay={index * 70}>
                <LiftIntensityOption
                  option={option}
                  selected={value === option.value}
                  onPress={() =>
                    onChange?.(value === option.value ? null : option.value)
                  }
                />
              </FadeInOption>
            );
          })}
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
          <IBMPlexText titleBlock height={EXPANDED_TITLE_HEIGHT}>
            Lift intensity method
          </IBMPlexText>
        </Animated.View>

        <Animated.View
          style={[
            styles.compactTitle,
            { opacity: collapseTitleOnScroll ? compactTitleOpacity : 0 },
          ]}
        >
          <IBMPlexText defaultWhite style={styles.compactTitleText}>
            Lift intensity method
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
  options: {
    alignSelf: "stretch",
    gap: 12,
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
  fadeInOption: {
    width: "100%",
  },
  option: {
    alignItems: "center",
    backgroundColor: "#111111",
    borderColor: "#252525",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    minHeight: 104,
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
  markerContainer: {
    alignItems: "center",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  markerText: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 22,
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
