import {
  useRef,
  useState } from "react";
import {
  Animated,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const METER_HEIGHT = 220;
const METER_WIDTH = 76;
const DRAG_SENSITIVITY = 0.62;
const SECTION_TOP_PADDING = 120;
const TITLE_BLOCK_HEIGHT = 130;
const COMPONENT_VERTICAL_GAP = 24;
const INTENSITY_VALUES = ["light", "moderate", "intense"];
const INTENSITY_LEGEND = Object.freeze([
  {
    value: "light",
    label: "Light",
    meaning:
      "Mostly technical work, drilling, pad work, positional work, or low-stress classes. Little to no hard sparring/live rounds. You usually feel recovered within 24 hours.",
    load: "1-3 sessions/week or <4 total hours. Average session difficulty 3-5/10.",
  },
  {
    value: "moderate",
    label: "Moderate",
    meaning:
      "A mix of technical training and harder rounds. Some sparring, wrestling, rolling, clinch, or conditioning, but recovery is still manageable.",
    load: "3-5 sessions/week or 4-7 total hours. 1-2 hard sessions/week. Average session difficulty 5-7/10.",
  },
  {
    value: "intense",
    label: "Intense",
    meaning:
      "Fight camp, competition prep, frequent sparring/live rounds, hard wrestling/rolling, clinch rounds, heavy pad rounds, or added sport conditioning. You may feel sore, drained, or need 48+ hours to recover.",
    load: "5+ sessions/week or 8+ total hours. 2+ hard sessions/week. Average session difficulty 7-9+/10.",
  },
]);

function getSelectedLegendItem(value) {
  return (
    INTENSITY_LEGEND.find((item) => item.value === value) ||
    INTENSITY_LEGEND[1]
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getFillRatioFromValue(value) {
  const index = INTENSITY_VALUES.indexOf(value);
  return index >= 0 ? 0.3 + index * 0.3 : 0.3;
}

function getValueFromFillRatio(fillRatio) {
  if (fillRatio < 0.3) {
    return "light";
  }

  if (fillRatio < 0.6) {
    return "moderate";
  }

  return "intense";
}

export default function CombatTrainingIntensityView({
  value,
  onChange,
}) {
  const [fillRatio, setFillRatio] = useState(() =>
    getFillRatioFromValue(value)
  );
  const dragStartYRef = useRef(0);
  const dragStartFillRatioRef = useRef(fillRatio);
  const previousSelectedIntensityRef = useRef(getValueFromFillRatio(fillRatio));
  const legendTransitionProgress = useRef(new Animated.Value(1)).current;
  const { height: screenHeight } = useWindowDimensions();
  const meterTop = SECTION_TOP_PADDING + TITLE_BLOCK_HEIGHT + COMPONENT_VERTICAL_GAP;
  const selectedIntensity = getValueFromFillRatio(fillRatio);
  const selectedLegendItem = getSelectedLegendItem(selectedIntensity);
  const legendTop = meterTop + METER_HEIGHT + COMPONENT_VERTICAL_GAP;
  const contentMinHeight = Math.max(screenHeight, legendTop + 170);

  function updateFillFromDy(dy) {
    const nextFillRatio = clamp(
      dragStartFillRatioRef.current - (dy / METER_HEIGHT) * DRAG_SENSITIVITY,
      0,
      1
    );
    const nextIntensity = getValueFromFillRatio(nextFillRatio);

    setFillRatio(nextFillRatio);
    onChange?.(nextIntensity);

    if (nextIntensity !== previousSelectedIntensityRef.current) {
      previousSelectedIntensityRef.current = nextIntensity;
      legendTransitionProgress.setValue(0);
      Animated.timing(legendTransitionProgress, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }

  const legendAnimatedStyle = {
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
  };

  return (
    <View style={[styles.container, { minHeight: contentMinHeight }]}>
      <View
        style={styles.touchLayer}
        onTouchStart={(event) => {
          dragStartYRef.current = event.nativeEvent.pageY;
          dragStartFillRatioRef.current = fillRatio;
        }}
        onTouchMove={(event) => {
          updateFillFromDy(event.nativeEvent.pageY - dragStartYRef.current);
        }}
      />
      <View style={styles.section}>
        <IBMPlexText titleBlock height={TITLE_BLOCK_HEIGHT}>
          Combat training intensity
        </IBMPlexText>
      </View>
      <View style={[styles.intensityOutline, { top: meterTop }]}>
        <View style={styles.fillClip}>
          <View
            style={[
              styles.intensityFill,
              { height: METER_HEIGHT * fillRatio },
            ]}
          />
        </View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.legend, { top: legendTop }, legendAnimatedStyle]}
      >
        <IBMPlexText defaultWhite style={styles.legendLabel}>
          {selectedLegendItem.label}
        </IBMPlexText>
        <IBMPlexText defaultWhite style={styles.legendMeaning}>
          {selectedLegendItem.meaning}
        </IBMPlexText>
        <IBMPlexText defaultWhite style={styles.legendLoad}>
          {selectedLegendItem.load}
        </IBMPlexText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  touchLayer: {
    bottom: 120,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 10,
  },
  section: {
    justifyContent: "flex-start",
    paddingTop: SECTION_TOP_PADDING,
  },
  intensityOutline: {
    borderColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    height: METER_HEIGHT,
    justifyContent: "flex-end",
    left: "50%",
    position: "absolute",
    transform: [{ translateX: -METER_WIDTH / 2 }],
    width: METER_WIDTH,
  },
  fillClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 23,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  intensityFill: {
    backgroundColor: "#ffffff",
    width: "100%",
  },
  legend: {
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    gap: 6,
    left: "6%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: "absolute",
    right: "6%",
  },
  legendLabel: {
    color: "#d1d5db",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
    textTransform: "uppercase",
  },
  legendMeaning: {
    color: "#d1d5db",
    fontSize: 12,
    lineHeight: 15,
  },
  legendLoad: {
    color: "#C9B259",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 14,
  },
});
