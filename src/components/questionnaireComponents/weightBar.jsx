import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import StandardText from "../textComponents/StandardText.jsx";

const TICK_SPACING = 10;
const MAJOR_TICK_INTERVAL = 5;

function getPrecision(step) {
  const decimals = `${step}`.split(".")[1];
  return decimals ? decimals.length : 0;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value, step) {
  const precision = getPrecision(step);
  return Number((Math.round(value / step) * step).toFixed(precision));
}

export default function WeightScroller({
  min = 30,
  max = 200,
  step = 1,
  initialValue = 65,
  unit = "kg",
  onChange,
}) {
  const scrollRef = useRef(null);
  const didInitialScroll = useRef(false);
  const lastOffset = useRef(0);
  const lastEmittedValue = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const precision = getPrecision(step);
  const totalTicks = Math.round((max - min) / step);
  const minValue = clamp(roundToStep(initialValue, step), min, max);
  const initialIndex = Math.round((minValue - min) / step);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  const indexToValue = useCallback(
    (index) => clamp(min + index * step, min, max),
    [max, min, step]
  );

  const valueToOffset = useCallback(
    (value) => ((clamp(roundToStep(value, step), min, max) - min) / step) * TICK_SPACING,
    [max, min, step]
  );

  useEffect(() => {
    if (containerWidth <= 0 || didInitialScroll.current || !scrollRef.current) {
      return;
    }

    const initialOffset = valueToOffset(minValue);
    didInitialScroll.current = true;
    lastOffset.current = initialOffset;
    lastEmittedValue.current = minValue;

    scrollRef.current.scrollTo({
      x: initialOffset,
      animated: false,
    });
  }, [containerWidth, minValue, valueToOffset]);

  const updateSelectedIndex = useCallback(
    (nextIndex) => {
      const clampedIndex = clamp(nextIndex, 0, totalTicks);
      const nextValue = indexToValue(clampedIndex);

      setSelectedIndex((previousIndex) =>
        previousIndex === clampedIndex ? previousIndex : clampedIndex
      );

      if (lastEmittedValue.current === nextValue) {
        return;
      }

      lastEmittedValue.current = nextValue;
      onChange?.(nextValue);
    },
    [indexToValue, onChange, totalTicks]
  );

  const handleScroll = useCallback(
    (event) => {
      const offset = clamp(
        event.nativeEvent.contentOffset.x,
        0,
        totalTicks * TICK_SPACING
      );
      const rawIndex = offset / TICK_SPACING;

      if (offset > lastOffset.current) {
        updateSelectedIndex(Math.floor(rawIndex));
      } else if (offset < lastOffset.current) {
        updateSelectedIndex(Math.ceil(rawIndex));
      }

      lastOffset.current = offset;
    },
    [totalTicks, updateSelectedIndex]
  );

  return (
    <View style={styles.container}>
      <StandardText style={styles.valueText} center>
        {indexToValue(selectedIndex).toFixed(precision)} {unit}
      </StandardText>

      <View
        style={styles.ruler}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        <View pointerEvents="none" style={styles.indicator} />

        <ScrollView
          ref={scrollRef}
          horizontal
          bounces={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollContent,
            containerWidth > 0
              ? { paddingHorizontal: containerWidth / 2 }
              : null,
          ]}
          onScroll={handleScroll}
        >
          <View style={styles.ticksRow}>
            {Array.from({ length: totalTicks + 1 }, (_, index) => {
              const tickValue = indexToValue(index);
              const isMajorTick = index % MAJOR_TICK_INTERVAL === 0;

              return (
                <View key={index} style={styles.tickColumn}>
                  {isMajorTick ? (
                    <View style={styles.tickLabelWrap}>
                      <StandardText style={styles.tickLabel}>
                        {tickValue.toFixed(precision)}
                      </StandardText>
                    </View>
                  ) : (
                    <View style={styles.tickLabelSpacer} />
                  )}
                  <View
                    style={[
                      styles.tick,
                      isMajorTick ? styles.majorTick : styles.minorTick,
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  valueText: {
    fontSize: 18,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  ruler: {
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: 8,
    left: "50%",
    width: 2,
    marginLeft: -1,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  ticksRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  tickColumn: {
    width: TICK_SPACING,
    alignItems: "center",
    overflow: "visible",
    paddingTop: 22,
  },
  tickLabelWrap: {
    position: "absolute",
    top: 0,
    left: "50%",
    minWidth: 32,
    marginLeft: -16,
    alignItems: "center",
  },
  tickLabel: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  tickLabelSpacer: {
    height: 22,
  },
  tick: {
    width: 2,
  },
  majorTick: {
    height: 50,
    backgroundColor: "#fff",
  },
  minorTick: {
    height: 50,
    backgroundColor: "#666666",
  },
});
