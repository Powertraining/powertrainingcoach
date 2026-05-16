import { Image, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LOADING_STRATEGY_OPTIONS } from "../../constants/appLogicSettings.js";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const ARROW_IMAGE = require("../../assets/icons/arrow.png");

function getActiveIndex(value) {
  const foundIndex = LOADING_STRATEGY_OPTIONS.findIndex(
    (option) => option.value === value
  );

  return foundIndex >= 0 ? foundIndex : 0;
}

function getLoadingBarWidths(value) {
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

function LoadingBlock({ width, label }) {
  const isHidden = parseFloat(width) <= 0;

  return (
    <View style={styles.loadingBlockSlot}>
      <View
        style={[
          styles.loadingBlock,
          {
            opacity: isHidden ? 0 : 1,
            width,
          },
        ]}
      >
        <View pointerEvents="none" style={styles.loadingBlockShadow} />
        <View style={styles.loadingBlockFace}>
          <StandardText
            lines={1}
            style={styles.blockText}
            textColor="#000000"
            center
          >
            {label}
          </StandardText>
        </View>
      </View>
    </View>
  );
}

function LoadingVisual({ value }) {
  const barWidths = getLoadingBarWidths(value);
  const labels = getLabelsFromWidths(barWidths);

  return (
    <View style={styles.loadingVisual}>
      {barWidths.map((barWidth, index) => (
        <LoadingBlock
          key={`${value}-${index}`}
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
  const activeOption = LOADING_STRATEGY_OPTIONS[activeIndex];

  function moveSelection(direction) {
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
      <TitleText style={styles.titleText} height={130}>
        Loading strategy
      </TitleText>

      <LoadingVisual value={activeOption?.value} />

      <StandardText style={styles.optionText} textColor="#ffffff" center>
        {activeOption?.label}
      </StandardText>

      <StandardText style={styles.descriptionText} textColor="#C9B259" center>
        {activeOption?.description}
      </StandardText>

      <View style={styles.buttonsRow}>
        <Pressable
          accessibilityLabel="Previous loading strategy"
          accessibilityRole="button"
          onPress={() => moveSelection(-1)}
          style={styles.button}
        >
          <View style={styles.arrowShadow} />
          <View style={styles.arrowWrap}>
            <Image
              source={ARROW_IMAGE}
              style={[
                styles.arrowImage,
                styles.arrowImageLeft,
                styles.arrowImageLeftOffset,
              ]}
              resizeMode="contain"
            />
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel="Next loading strategy"
          accessibilityRole="button"
          onPress={() => moveSelection(1)}
          style={styles.button}
        >
          <View style={styles.arrowShadow} />
          <View style={styles.arrowWrap}>
            <Image
              source={ARROW_IMAGE}
              style={[styles.arrowImage, styles.arrowImageRightOffset]}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 120,
  },
  titleText: {
    color: "#ffffff",
  },
  loadingVisual: {
    alignItems: "center",
    gap: 20,
    marginTop: 36,
    width: 250,
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
    marginTop: 32,
  },
  descriptionText: {
    alignSelf: "center",
    marginBottom: 42,
    marginTop: 42,
    maxWidth: 320,
    minHeight: 48,
    paddingHorizontal: 24,
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
