import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import StandardText from "../textComponents/IBMPlexText.jsx";

const TICK_SPACING = 10;
const MAJOR_TICK_INTERVAL = 5;
const INDICATOR_EXTENSION = 35;
const INDICATOR_LABEL_GAP = 8;

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
  height = 300,
  indicatorLabel = "Weight class",
  style,
  valueRowStyle,
  valueTextStyle,
  unitTextStyle,
  indicatorStyle,
  rulerHeight,
  rulerStyle,
  scrollStyle,
  scrollContainerStyle,
  compact = false,
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
    onChange?.(minValue);

    scrollRef.current.scrollTo({
      x: initialOffset,
      animated: false,
    });
  }, [containerWidth, minValue, onChange, valueToOffset]);

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
    <View style={[styles.container, { height }, style]}>
      <View style={[styles.valueRow, valueRowStyle]}>
        <StandardText style={[styles.valueText, valueTextStyle]}>
          {indexToValue(selectedIndex).toFixed(precision)}
        </StandardText>
        <StandardText style={[styles.unitText, unitTextStyle]}>
          {unit}
        </StandardText>
      </View>

      <View
        style={[
          styles.ruler,
          rulerHeight ? { height: rulerHeight } : null,
          rulerStyle,
        ]}
        onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
      >
        <View pointerEvents="none" style={[styles.indicator, indicatorStyle]} />
        {indicatorLabel ? (
          <View pointerEvents="none" style={styles.indicatorLabelWrap}>
            <StandardText style={styles.indicatorLabel}>{indicatorLabel}</StandardText>
          </View>
        ) : null}

        <View style={scrollContainerStyle}>
          <ScrollView
            ref={scrollRef}
            style={[compact ? styles.compactScroll : null, scrollStyle]}
            horizontal
            bounces={false}
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            contentContainerStyle={[
              styles.scrollContent,
              compact ? styles.compactScrollContent : null,
              containerWidth > 0
                ? { paddingHorizontal: containerWidth / 2 }
                : null,
            ]}
            onScroll={handleScroll}
          >
            <View style={[styles.ticksRow, compact ? styles.compactTicksRow : null]}>
              {Array.from({ length: totalTicks + 1 }, (_, index) => {
                const tickValue = indexToValue(index);
                const isMajorTick = index % MAJOR_TICK_INTERVAL === 0;

                return (
                  <View
                    key={index}
                    style={[styles.tickColumn, compact ? styles.compactTickColumn : null]}
                  >
                    {compact && isMajorTick ? (
                      <View style={styles.compactTickLabelWrap}>
                        <StandardText style={styles.compactTickLabel}>
                          {tickValue.toFixed(precision)}
                        </StandardText>
                      </View>
                    ) : !compact && isMajorTick ? (
                      <View style={styles.tickLabelWrap}>
                        <StandardText style={styles.tickLabel}>
                          {tickValue.toFixed(precision)}
                        </StandardText>
                      </View>
                    ) : !compact ? (
                      <View style={styles.tickLabelSpacer} />
                    ) : null}
                    <View
                      style={[
                        styles.tick,
                        isMajorTick ? styles.majorTick : styles.minorTick,
                        compact ? styles.compactTick : null,
                        compact
                          ? isMajorTick
                            ? styles.compactMajorTick
                            : styles.compactMinorTick
                          : null,
                      ]}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    justifyContent: "center",
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  valueText: {
    fontSize: 32,
    lineHeight: 32,
    includeFontPadding: false,
    color: "#fff",
  },
  unitText: {
    fontSize: 18,
    includeFontPadding: false,
    color: "#C9B259",
    bottom: 4
  },
  ruler: {
    position: "relative",
    overflow: "visible",
  },
  indicator: {
    position: "absolute",
    top: 0,
    bottom: -INDICATOR_EXTENSION,
    left: "50%",
    width: 2,
    marginLeft: -1,
    backgroundColor: "#fff",
    zIndex: 1,
  },
  indicatorLabelWrap: {
    position: "absolute",
    top: "100%",
    marginTop: INDICATOR_EXTENSION + INDICATOR_LABEL_GAP,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  indicatorLabel: {
    fontSize: 28,
    color: "#d1d1d1",
    textAlign: "center",
  },
  scrollContent: {
    paddingVertical: 8,
  },
  compactScroll: {
    height: "100%",
  },
  compactScrollContent: {
    height: "100%",
    paddingVertical: 0,
    alignItems: "center",
  },
  ticksRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  compactTicksRow: {
    height: "100%",
    alignItems: "center",
  },
  tickColumn: {
    width: TICK_SPACING,
    alignItems: "center",
    overflow: "visible",
    paddingTop: 22,
  },
  compactTickColumn: {
    height: "100%",
    paddingTop: 0,
    justifyContent: "center",
  },
  compactTickLabelWrap: {
    position: "absolute",
    top: 0,
    left: "50%",
    width: 32,
    marginLeft: -16,
    alignItems: "center",
  },
  compactTickLabel: {
    color: "#8A8A8A",
    fontSize: 7,
    lineHeight: 9,
    textAlign: "center",
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
    width: 2.5,
    height: 75,
  },
  majorTick: {
    backgroundColor: "#d1d1d1",
  },
  minorTick: {
    backgroundColor: "#666666",
  },
  compactMajorTick: {
    height: 33.6,
  },
  compactMinorTick: {
    height: 32,
  },
  compactTick: {
    width: 1.25,
  },
});
