import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useEffect, useMemo, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  APP_LOGIC_SETTINGS_DEFAULTS,
  LOADING_STRATEGY_OPTIONS,
} from "../../constants/appLogicSettings.js";
import PressedShadowButton from "../../components/questionnaireComponents/PressedShadowButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const ARROW_IMAGE = require("../../assets/icons/arrow.png");
const LOADING_VISUAL_HEIGHT = 211;
const LOADING_VISUAL_WIDTH = 250;
const OPTION_LABEL_HEIGHT = 28;
const DESCRIPTION_HEIGHT = 78;
const LOADING_VISUAL_ANIMATION_MS = 260;

function getActiveIndex(value) {
  const foundIndex = LOADING_STRATEGY_OPTIONS.findIndex(
    (option) => option.value === value
  );

  if (foundIndex >= 0) {
    return foundIndex;
  }

  const defaultIndex = LOADING_STRATEGY_OPTIONS.findIndex(
    (option) => option.value === APP_LOGIC_SETTINGS_DEFAULTS.loadingStrategy
  );

  return defaultIndex >= 0 ? defaultIndex : 0;
}

function getLoadingBarWidths(value) {
  if (!value) {
    return ["0%", "0%", "0%"];
  }

  if (value === "flat_loading") {
    return ["0%", "76%", "0%"];
  }

  if (value === "descending_pyramid") {
    return ["100%", "76%", "52%"];
  }

  if (value === "ascending_pyramid") {
    return ["52%", "76%", "100%"];
  }

  if (value === "double_pyramid") {
    return ["60%", "100%", "60%"];
  }

  return ["100%", "100%", "100%"];
}

function getLabelsFromWidths(widths) {
  const parsed = widths.map((width, index) => ({
    index,
    value: parseFloat(width),
  }));

  const visibleParsed = parsed.filter((item) => item.value > 0);
  const sorted = [...visibleParsed].sort((a, b) => a.value - b.value);
  const labels = Array(widths.length).fill("");

  if (sorted.length === 1) {
    labels[sorted[0].index] = "Balanced";
  }

  if (sorted.length === 3) {
    labels[sorted[0].index] = "Intense";
    labels[sorted[1].index] = "Balanced";
    labels[sorted[2].index] = "High volume";
  }

  return labels;
}

function getWidthRatio(width) {
  const parsedWidth = parseFloat(width);

  return Number.isFinite(parsedWidth) ? parsedWidth / 100 : 0;
}

function LoadingBlock({ width, label }) {
  const isHidden = parseFloat(width) <= 0;
  const targetWidth = getWidthRatio(width) * LOADING_VISUAL_WIDTH;
  const animatedWidth = useRef(new Animated.Value(targetWidth)).current;
  const animatedOpacity = useRef(new Animated.Value(isHidden ? 0 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: targetWidth,
        duration: LOADING_VISUAL_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedOpacity, {
        toValue: isHidden ? 0 : 1,
        duration: LOADING_VISUAL_ANIMATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [animatedOpacity, animatedWidth, isHidden, targetWidth]);

  return (
    <View style={styles.loadingBlockSlot}>
      <Animated.View
        style={[
          styles.loadingBlock,
          {
            opacity: animatedOpacity,
            width: animatedWidth,
          },
        ]}
      >
        <View pointerEvents="none" style={styles.loadingBlockShadow} />
        <View style={styles.loadingBlockFace}>
          <IBMPlexText defaultWhite
            lines={1}
            style={styles.blockText}
            textColor="#000000"
            center
          >
            {label}
          </IBMPlexText>
        </View>
      </Animated.View>
    </View>
  );
}

function LoadingVisual({ value }) {
  const barWidths = useMemo(() => getLoadingBarWidths(value), [value]);
  const labels = useMemo(() => getLabelsFromWidths(barWidths), [barWidths]);

  return (
    <View style={styles.loadingVisual}>
      {barWidths.map((barWidth, index) => (
        <LoadingBlock
          key={`loading-block-${index}`}
          width={barWidth}
          label={labels[index]}
        />
      ))}
    </View>
  );
}

export default function LoadingStrategyView({ value, onChange }) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const activeIndex = getActiveIndex(value);
  const activeOption = activeIndex >= 0 ? LOADING_STRATEGY_OPTIONS[activeIndex] : null;

  function moveSelection(direction) {
    if (!LOADING_STRATEGY_OPTIONS.length) {
      return;
    }

    const nextIndex =
      (activeIndex + direction + LOADING_STRATEGY_OPTIONS.length) %
      LOADING_STRATEGY_OPTIONS.length;

    onChange?.(LOADING_STRATEGY_OPTIONS[nextIndex]?.value);
  }

  return (
    <View
      style={[
        styles.container,
        {
          minHeight: screenHeight,
          paddingTop: insets.top + 24,
        },
      ]}
    >
      <IBMPlexText titleBlock style={styles.titleText} height={130}>
        Loading strategy
      </IBMPlexText>

      <View style={styles.selectionArea}>
        <LoadingVisual value={activeOption?.value} />

        <IBMPlexText defaultWhite style={styles.optionText} textColor="#ffffff" center>
          {activeOption?.label}
        </IBMPlexText>

        <IBMPlexText defaultWhite style={styles.descriptionText} textColor="#C9B259" center>
          {activeOption?.description}
        </IBMPlexText>
      </View>

      <View style={styles.buttonsRow}>
        <PressedShadowButton
          accessibilityLabel="Previous loading strategy"
          faceStyle={styles.arrowWrap}
          onPress={() => moveSelection(-1)}
          pressedTranslateX={-5}
          pressedTranslateY={-5}
          shadowStyle={styles.arrowShadow}
          style={styles.button}
        >
          <Image
            source={ARROW_IMAGE}
            style={[
              styles.arrowImage,
              styles.arrowImageLeft,
              styles.arrowImageLeftOffset,
            ]}
            resizeMode="contain"
          />
        </PressedShadowButton>

        <PressedShadowButton
          accessibilityLabel="Next loading strategy"
          faceStyle={styles.arrowWrap}
          onPress={() => moveSelection(1)}
          pressedTranslateX={-5}
          pressedTranslateY={-5}
          shadowStyle={styles.arrowShadow}
          style={styles.button}
        >
          <Image
            source={ARROW_IMAGE}
            style={[styles.arrowImage, styles.arrowImageRightOffset]}
            resizeMode="contain"
          />
        </PressedShadowButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  titleText: {
    color: "#ffffff",
  },
  loadingVisual: {
    alignItems: "center",
    gap: 20,
    height: LOADING_VISUAL_HEIGHT,
    marginTop: 36,
    width: LOADING_VISUAL_WIDTH,
  },
  selectionArea: {
    alignItems: "center",
  },
  loadingBlockSlot: {
    alignItems: "center",
    height: 45,
    width: "100%",
  },
  loadingBlock: {
    height: 45,
    overflow: "visible",
    position: "relative",
  },
  loadingBlockShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E1E1E1",
    borderRadius: 8,
    transform: [{ translateX: -6 }, { translateY: -5 }],
    zIndex: 0,
  },
  loadingBlockFace: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  blockText: {
    fontSize: 14,
    paddingHorizontal: 6,
  },
  optionText: {
    fontSize: 20,
    height: OPTION_LABEL_HEIGHT,
    lineHeight: 24,
    marginTop: 32,
    textAlignVertical: "center",
  },
  descriptionText: {
    alignSelf: "center",
    height: DESCRIPTION_HEIGHT,
    lineHeight: 20,
    marginBottom: 42,
    marginTop: 42,
    maxWidth: 320,
    paddingHorizontal: 24,
    textAlignVertical: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: "relative",
  },
  arrowShadow: {
    backgroundColor: "#E1E1E1",
    borderRadius: 12,
    height: 64,
    left: 3,
    position: "absolute",
    top: 3,
    width: 64,
    zIndex: 0,
  },
  arrowWrap: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    height: 64,
    justifyContent: "center",
    position: "relative",
    width: 64,
    zIndex: 1,
  },
  arrowImage: {
    height: 34,
    width: 34,
  },
  arrowImageLeft: {
    transform: [{ rotate: "180deg" }],
  },
  arrowImageLeftOffset: {
    marginLeft: -6,
  },
  arrowImageRightOffset: {
    marginLeft: 6,
  },
});
