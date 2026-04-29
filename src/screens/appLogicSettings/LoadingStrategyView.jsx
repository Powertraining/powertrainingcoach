import { Image, Pressable, StyleSheet, View } from "react-native";
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
  const parsed = widths.map((w, i) => ({
    index: i,
    value: parseFloat(w),
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
            width,
            opacity: isHidden ? 0 : 1,
          },
        ]}
      >
        <View pointerEvents="none" style={styles.loadingBlockShadow} />

        <View style={styles.loadingBlockFace}>
          <StandardText style={styles.blockText} textColor="#000000" center>
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

export default function LoadingStrategyView({
  value,
  onChange,
}) {
  const insets = useSafeAreaInsets();

  const activeIndex = getActiveIndex(value);
  const activeOption = LOADING_STRATEGY_OPTIONS[activeIndex];

  function moveSelection(direction) {
    const nextIndex =
      (activeIndex + direction + LOADING_STRATEGY_OPTIONS.length) %
      LOADING_STRATEGY_OPTIONS.length;

    onChange?.(LOADING_STRATEGY_OPTIONS[nextIndex]?.value);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <TitleText style={styles.titleText} height={160}>
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
        <Pressable onPress={() => moveSelection(-1)} style={styles.button}>
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

        <Pressable onPress={() => moveSelection(1)} style={styles.button}>
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
    gap: 0,
    alignItems: "center",
  },
  titleText: {
    color: "#ffffff",
    marginBottom: 84,
  },
  loadingVisual: {
    width: 250,
    alignItems: "center",
    gap: 20,
  },
  loadingBlockSlot: {
    width: "100%",
    height: 45,
    alignItems: "center",
  },
  loadingBlock: {
    position: "relative",
    height: 45,
    overflow: "visible",
  },
  loadingBlockShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    backgroundColor: "#E1E1E1",
    transform: [{ translateX: -6 }, { translateY: -5 }],
    zIndex: 0,
  },
  loadingBlockFace: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  blockText: {
    fontSize: 14,
  },
  optionText: {
    fontSize: 20,
    marginTop: 32,
  },
descriptionText: {
  marginTop: 84,
  marginBottom: 42,
  paddingHorizontal: 24,
  minHeight: 48,
  maxWidth: 320,
  alignSelf: "center",
},
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    position: "relative",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  arrowShadow: {
    position: "absolute",
    left: 3,
    top: 3,
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E1E1E1",
    zIndex: 0,
  },
  arrowWrap: {
    position: "relative",
    backgroundColor: "#ffffff",
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  arrowImage: {
    width: 34,
    height: 34,
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