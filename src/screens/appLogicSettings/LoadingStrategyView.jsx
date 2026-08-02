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
  LOADING_STRATEGY_OPTIONS,
} from "../../constants/appLogicSettings.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const RECOMMENDED_ACCENT = "#F3D04F";
const MAIN_DESCRIPTION =
  "Flat loading suits most beginners and intermediate athletes. Ascending and descending loading add variation for advanced athletes comfortable managing changing loads.";
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

const SCHEME_BAR_HEIGHTS = Object.freeze({
  flat_loading: Object.freeze([22, 22, 22, 22]),
  ascending_pyramid: Object.freeze([12, 18, 24, 30]),
  descending_pyramid: Object.freeze([30, 24, 18, 12]),
  double_pyramid: Object.freeze([14, 24, 30, 18]),
});

const LOADING_SCHEME_META = Object.freeze({
  flat_loading: Object.freeze({
    accent: "#0A84FF",
    accentMuted: "rgba(10, 132, 255, 0.14)",
  }),
  ascending_pyramid: Object.freeze({
    accent: "#34C759",
    accentMuted: "rgba(52, 199, 89, 0.14)",
  }),
  descending_pyramid: Object.freeze({
    accent: "#FF9F0A",
    accentMuted: "rgba(255, 159, 10, 0.14)",
  }),
});

function getSelectedValue(value) {
  return LOADING_STRATEGY_OPTIONS.some((option) => option.value === value)
    ? value
    : APP_LOGIC_SETTINGS_DEFAULTS.loadingStrategy;
}

function LoadingSchemeIcon({ value, accent }) {
  const heights =
    SCHEME_BAR_HEIGHTS[value] || SCHEME_BAR_HEIGHTS.flat_loading;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        styles.schemeIcon,
        value === "flat_loading" ? styles.schemeIconFlat : null,
      ]}
    >
      {heights.map((height, index) => (
        <View
          key={`${value}-bar-${index}`}
          style={[styles.schemeBar, { backgroundColor: accent, height }]}
        />
      ))}
    </View>
  );
}

function LoadingSchemeOption({ option, selected, onPress }) {
  const recommended = option.value === "flat_loading";
  const meta = LOADING_SCHEME_META[option.value] || LOADING_SCHEME_META.flat_loading;

  return (
    <Pressable
      accessibilityLabel={`${option.label}.${recommended ? " Recommended." : ""} ${option.description} Example: ${option.example}`}
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
        <LoadingSchemeIcon accent={meta.accent} value={option.value} />
      </View>

      <View style={styles.optionCopy}>
        <View style={styles.optionTitleRow}>
          <IBMPlexText defaultWhite style={styles.optionTitle}>
            {option.label}
          </IBMPlexText>
          {recommended ? (
            <View style={styles.recommendedBanner}>
              <IBMPlexText style={styles.recommendedBannerText}>
                RECOMMENDED
              </IBMPlexText>
            </View>
          ) : null}
        </View>
        <IBMPlexText style={styles.optionDescription}>
          {option.description}
        </IBMPlexText>
        <IBMPlexText
          adjustsFontSizeToFit
          defaultWhite
          minimumFontScale={0.72}
          numberOfLines={1}
          style={[styles.optionExample, { color: meta.accent }]}
        >
          Example: {option.example}
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

export default function LoadingStrategyView({
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
          {LOADING_STRATEGY_OPTIONS.map((option) => (
            <LoadingSchemeOption
              key={option.value}
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
          <IBMPlexText titleBlock height={EXPANDED_TITLE_HEIGHT}>
            Loading scheme
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
            Loading scheme
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
    backgroundColor: "rgba(142, 142, 150, 0.12)",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  schemeIcon: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 3,
    height: 32,
  },
  schemeIconFlat: {
    alignItems: "center",
  },
  schemeBar: {
    borderRadius: 2,
    width: 6,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  optionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  recommendedBanner: {
    backgroundColor: RECOMMENDED_ACCENT,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recommendedBannerText: {
    color: "#111111",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
    lineHeight: 11,
  },
  optionDescription: {
    color: "#9A9AA2",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  optionExample: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    marginTop: 2,
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
