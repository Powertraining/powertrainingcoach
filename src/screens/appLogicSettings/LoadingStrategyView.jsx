import {
  Animated,
  Easing,
  Image,
  ScrollView,
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
const LOADING_VISUAL_HEIGHT = 132;
const LOADING_VISUAL_WIDTH = 214;
const OPTION_LABEL_HEIGHT = 28;
const MAIN_DESCRIPTION =
  "Choose how the weight changes across your working sets. This affects fatigue, technique quality, and how heavy the session feels.";
const DESCRIPTION_HEIGHT = 72;
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
    return ["76%", "76%", "76%"];
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
  const labels = Array(widths.length).fill("");

  widths.forEach((width, index) => {
    if (parseFloat(width) > 0) {
      labels[index] = `Set ${index + 1}`;
    }
  });

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
    <View style={[styles.scrollHost, { minHeight: screenHeight }]}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.container,
          {
            minHeight: screenHeight,
            paddingTop: insets.top + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <IBMPlexText titleBlock style={styles.titleText} height={130}>
          Loading scheme
        </IBMPlexText>

        <IBMPlexText defaultWhite style={styles.mainDescriptionText} textColor="#9ca3af" center>
          {MAIN_DESCRIPTION}
        </IBMPlexText>

        <View style={styles.selectionArea}>
          <LoadingVisual value={activeOption?.value} />

          <IBMPlexText defaultWhite style={styles.optionText} textColor="#ffffff" center>
            {activeOption?.label}
          </IBMPlexText>

          <IBMPlexText defaultWhite style={styles.exampleText} textColor="#C9B259" center>
            {activeOption?.example ? `Example: ${activeOption.example}` : ""}
          </IBMPlexText>

          <IBMPlexText defaultWhite style={styles.descriptionText} textColor="#A6A6A6" center>
            {activeOption?.description}
          </IBMPlexText>
        </View>

        <View style={styles.buttonsRow}>
          <PressedShadowButton
            accessibilityLabel="Previous loading scheme"
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
            accessibilityLabel="Next loading scheme"
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollHost: {
    alignSelf: "stretch",
  },
  scrollView: {
    alignSelf: "stretch",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  titleText: {
    color: "#ffffff",
    transform: [{ translateY: 24 }],
  },
  loadingVisual: {
    alignItems: "center",
    gap: 10,
    height: LOADING_VISUAL_HEIGHT,
    marginTop: 132,
    width: LOADING_VISUAL_WIDTH,
  },
  mainDescriptionText: {
    alignSelf: "center",
    lineHeight: 19,
    marginTop: -12,
    maxWidth: 330,
    paddingHorizontal: 22,
    width: "100%",
  },
  selectionArea: {
    alignItems: "center",
  },
  loadingBlockSlot: {
    alignItems: "center",
    height: 34,
    width: "100%",
  },
  loadingBlock: {
    height: 34,
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
    fontSize: 12,
    paddingHorizontal: 6,
  },
  optionText: {
    fontSize: 20,
    height: OPTION_LABEL_HEIGHT,
    lineHeight: 24,
    marginTop: 28,
    textAlignVertical: "center",
  },
  descriptionText: {
    alignSelf: "center",
    height: DESCRIPTION_HEIGHT,
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 320,
    paddingHorizontal: 24,
    textAlignVertical: "center",
  },
  exampleText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 0,
    marginTop: 0,
    minHeight: 22,
    paddingHorizontal: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
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
