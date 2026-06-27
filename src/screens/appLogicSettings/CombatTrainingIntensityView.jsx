import {
  useEffect,
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
const BOTTOM_ACTION_CLEARANCE = 96;
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

function IntensityLegendContent({ item }) {
  return (
    <>
      <IBMPlexText defaultWhite style={styles.legendLabel}>
        {item.label}
      </IBMPlexText>
      <IBMPlexText defaultWhite style={styles.legendMeaning}>
        {item.meaning}
      </IBMPlexText>
      <IBMPlexText defaultWhite style={styles.legendLoad}>
        {item.load}
      </IBMPlexText>
    </>
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
  if (fillRatio < 0.45) {
    return "light";
  }

  if (fillRatio < 0.75) {
    return "moderate";
  }

  return "intense";
}

export default function CombatTrainingIntensityView({
  value,
  onChange,
}) {
  const initialFillRatio = getFillRatioFromValue(value);
  const [selectedIntensity, setSelectedIntensity] = useState(() =>
    getValueFromFillRatio(initialFillRatio)
  );
  const [legendHeight, setLegendHeight] = useState(0);
  const fillProgress = useRef(new Animated.Value(initialFillRatio)).current;
  const fillRatioRef = useRef(initialFillRatio);
  const legendHeightsRef = useRef({});
  const dragStartYRef = useRef(0);
  const dragStartFillRatioRef = useRef(initialFillRatio);
  const isDraggingRef = useRef(false);
  const previousSelectedIntensityRef = useRef(selectedIntensity);
  const legendTransitionProgress = useRef(new Animated.Value(1)).current;
  const { height: screenHeight } = useWindowDimensions();
  const selectedLegendItem = getSelectedLegendItem(selectedIntensity);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    const nextFillRatio = getFillRatioFromValue(value);
    const nextIntensity = getValueFromFillRatio(nextFillRatio);

    fillRatioRef.current = nextFillRatio;
    fillProgress.setValue(nextFillRatio);
    previousSelectedIntensityRef.current = nextIntensity;
    setSelectedIntensity(nextIntensity);
  }, [fillProgress, value]);

  function updateFillFromDy(dy) {
    const nextFillRatio = clamp(
      dragStartFillRatioRef.current - (dy / METER_HEIGHT) * DRAG_SENSITIVITY,
      0,
      1
    );
    const nextIntensity = getValueFromFillRatio(nextFillRatio);

    fillRatioRef.current = nextFillRatio;
    fillProgress.setValue(nextFillRatio);

    if (nextIntensity !== previousSelectedIntensityRef.current) {
      previousSelectedIntensityRef.current = nextIntensity;
      setSelectedIntensity(nextIntensity);
      onChange?.(nextIntensity);
      legendTransitionProgress.setValue(0);
      Animated.timing(legendTransitionProgress, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }

  function captureLegendHeight(itemValue, height) {
    legendHeightsRef.current[itemValue] = Math.ceil(height);

    if (
      Object.keys(legendHeightsRef.current).length < INTENSITY_LEGEND.length
    ) {
      return;
    }

    const tallestHeight = Math.max(
      ...Object.values(legendHeightsRef.current)
    );

    setLegendHeight((currentHeight) =>
      currentHeight === tallestHeight ? currentHeight : tallestHeight
    );
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
  const animatedFillHeight = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, METER_HEIGHT],
  });

  return (
    <View style={[styles.container, { height: screenHeight }]}>
      <View
        style={styles.touchLayer}
        onTouchStart={(event) => {
          isDraggingRef.current = true;
          dragStartYRef.current = event.nativeEvent.pageY;
          dragStartFillRatioRef.current = fillRatioRef.current;
        }}
        onTouchMove={(event) => {
          updateFillFromDy(event.nativeEvent.pageY - dragStartYRef.current);
        }}
        onTouchEnd={() => {
          isDraggingRef.current = false;
        }}
        onTouchCancel={() => {
          isDraggingRef.current = false;
        }}
      />
      <View style={styles.section}>
        <IBMPlexText titleBlock height={TITLE_BLOCK_HEIGHT}>
          Combat training intensity
        </IBMPlexText>
      </View>
      <View style={styles.content}>
        {INTENSITY_LEGEND.map((item) => (
          <View
            key={`legend-measure-${item.value}`}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            onLayout={(event) =>
              captureLegendHeight(item.value, event.nativeEvent.layout.height)
            }
            style={[styles.legend, styles.legendMeasure]}
          >
            <IntensityLegendContent item={item} />
          </View>
        ))}
        <View style={styles.meterArea}>
          <View style={styles.intensityOutline}>
            <View style={styles.fillClip}>
              <Animated.View
                style={[
                  styles.intensityFill,
                  { height: animatedFillHeight },
                ]}
              />
            </View>
          </View>
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.legend,
            legendHeight ? { height: legendHeight } : null,
            legendAnimatedStyle,
          ]}
        >
          <IntensityLegendContent item={selectedLegendItem} />
        </Animated.View>
      </View>
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
    height: SECTION_TOP_PADDING + TITLE_BLOCK_HEIGHT,
    justifyContent: "flex-start",
    paddingTop: SECTION_TOP_PADDING,
  },
  content: {
    flex: 1,
    paddingBottom: BOTTOM_ACTION_CLEARANCE,
  },
  meterArea: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  intensityOutline: {
    borderColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    height: METER_HEIGHT,
    justifyContent: "flex-end",
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
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    gap: 6,
    marginHorizontal: "6%",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  legendMeasure: {
    left: "6%",
    marginHorizontal: 0,
    opacity: 0,
    position: "absolute",
    right: "6%",
    top: 0,
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
