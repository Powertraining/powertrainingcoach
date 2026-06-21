import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import StandardText from "../textComponents/IBMPlexText.jsx";
import { fonts } from "../../theme/colors.js";

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
  editableValue = false,
  emitInitialValue = true,
  animateValueChanges = false,
  valueChangeKey,
  edgeFade = false,
  edgeFadeColor = "#0F0F0F",
  edgeFadeWidth = 32,
  onChange,
}) {
  const scrollRef = useRef(null);
  const didInitialScroll = useRef(false);
  const previousValueChangeKey = useRef(valueChangeKey);
  const isApplyingInitialValue = useRef(false);
  const initialValueAnimationTimer = useRef(null);
  const lastOffset = useRef(0);
  const lastEmittedValue = useRef(null);
  const isValueFocused = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);

  const precision = getPrecision(step);
  const totalTicks = Math.round((max - min) / step);
  const minValue = clamp(roundToStep(initialValue, step), min, max);
  const initialIndex = Math.round((minValue - min) / step);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [inputValue, setInputValue] = useState(minValue.toFixed(precision));

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
    previousValueChangeKey.current = valueChangeKey;
    lastOffset.current = initialOffset;
    lastEmittedValue.current = emitInitialValue ? minValue : null;

    if (emitInitialValue) {
      onChange?.(minValue);
    }

    scrollRef.current.scrollTo({
      x: initialOffset,
      animated: false,
    });
  }, [containerWidth, emitInitialValue, minValue, onChange, valueChangeKey, valueToOffset]);

  useEffect(() => {
    if (
      !didInitialScroll.current ||
      previousValueChangeKey.current === valueChangeKey ||
      !scrollRef.current
    ) {
      return;
    }

    previousValueChangeKey.current = valueChangeKey;

    const nextIndex = Math.round((minValue - min) / step);
    const nextOffset = valueToOffset(minValue);
    lastOffset.current = nextOffset;
    lastEmittedValue.current = null;
    isApplyingInitialValue.current = animateValueChanges;

    if (!animateValueChanges) {
      setSelectedIndex(nextIndex);
      setInputValue(minValue.toFixed(precision));
    }

    scrollRef.current.scrollTo({
      x: nextOffset,
      animated: animateValueChanges,
    });

    if (initialValueAnimationTimer.current) {
      clearTimeout(initialValueAnimationTimer.current);
    }

    initialValueAnimationTimer.current = setTimeout(() => {
      isApplyingInitialValue.current = false;
      setSelectedIndex(nextIndex);
      setInputValue(minValue.toFixed(precision));
      initialValueAnimationTimer.current = null;
    }, animateValueChanges ? 320 : 0);
  }, [animateValueChanges, min, minValue, precision, step, valueChangeKey, valueToOffset]);

  useEffect(
    () => () => {
      if (initialValueAnimationTimer.current) {
        clearTimeout(initialValueAnimationTimer.current);
      }
    },
    []
  );

  const updateSelectedIndex = useCallback(
    (nextIndex) => {
      const clampedIndex = clamp(nextIndex, 0, totalTicks);
      const nextValue = indexToValue(clampedIndex);

      setSelectedIndex((previousIndex) =>
        previousIndex === clampedIndex ? previousIndex : clampedIndex
      );

      if (!isValueFocused.current) {
        setInputValue(nextValue.toFixed(precision));
      }

      if (isApplyingInitialValue.current) {
        return;
      }

      if (lastEmittedValue.current === nextValue) {
        return;
      }

      lastEmittedValue.current = nextValue;
      onChange?.(nextValue);
    },
    [indexToValue, onChange, precision, totalTicks]
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

  const normalizedInputValue = inputValue.replace(/,/g, ".");
  const hasValidInputFormat = /^\d{1,3}(?:\.\d)?$/.test(normalizedInputValue);
  const parsedInputValue = Number.parseFloat(normalizedInputValue);
  const inputError = !hasValidInputFormat
    ? "Enter 1–3 digits with up to 1 decimal place."
    : parsedInputValue < min || parsedInputValue > max
      ? `Enter a value from ${min} to ${max}.`
      : "";

  function updateInputValue(value) {
    const rawValue = String(value);
    const normalizedValue = /^\d{4}$/.test(rawValue)
      ? `${rawValue.slice(0, 3)}.${rawValue.slice(3)}`
      : rawValue.replace(/,/g, ".");
    const numericValue = Number.parseFloat(normalizedValue);

    if (Number.isFinite(numericValue) && numericValue > max) {
      setInputValue(max.toFixed(precision));
      return;
    }

    setInputValue(normalizedValue);
  }

  function commitInputValue() {
    isValueFocused.current = false;
    if (inputError) {
      return;
    }

    const nextValue = clamp(roundToStep(parsedInputValue, step), min, max);
    const nextIndex = Math.round((nextValue - min) / step);
    const nextOffset = nextIndex * TICK_SPACING;
    setInputValue(nextValue.toFixed(precision));
    updateSelectedIndex(nextIndex);
    lastOffset.current = nextOffset;
    scrollRef.current?.scrollTo({ x: nextOffset, animated: true });
  }

  const selectedValueContent = (
    <>
      <View style={styles.valueSlot}>
        <StandardText
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.valueText, valueTextStyle, styles.valueSizer]}
        >
          {max.toFixed(precision)}
        </StandardText>
        {editableValue ? (
          <TextInput
            accessibilityHint="Enter a weight or swipe the scale below"
            accessibilityLabel={`Weight in ${unit}`}
            cursorColor="#ffffff"
            keyboardType="decimal-pad"
            maxLength={5}
            onBlur={commitInputValue}
            onChangeText={updateInputValue}
            onFocus={() => {
              isValueFocused.current = true;
            }}
            onSubmitEditing={commitInputValue}
            returnKeyType="done"
            selectTextOnFocus
            selectionColor="rgba(201, 178, 89, 0.38)"
            style={[styles.valueText, valueTextStyle, styles.valueInput]}
            underlineColorAndroid="transparent"
            value={inputValue}
          />
        ) : (
          <StandardText style={[styles.valueText, valueTextStyle, styles.valueDisplay]}>
            {indexToValue(selectedIndex).toFixed(precision)}
          </StandardText>
        )}
      </View>
        <StandardText style={[styles.unitText, unitTextStyle]}>
          {unit}
        </StandardText>
    </>
  );

  return (
    <View style={[styles.container, { height }, style]}>
      <View style={styles.valueEditorArea}>
        <View style={[styles.valueRow, valueRowStyle]}>
          {selectedValueContent}
        </View>
        {editableValue && inputError ? (
          <View style={styles.inputErrorDropdown}>
            <StandardText style={styles.inputErrorText}>{inputError}</StandardText>
          </View>
        ) : null}
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

        <View style={[edgeFade ? styles.scrollViewport : null, scrollContainerStyle]}>
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
                const isMajorTick =
                  Math.abs(
                    tickValue / MAJOR_TICK_INTERVAL -
                      Math.round(tickValue / MAJOR_TICK_INTERVAL)
                  ) < 0.000001;

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
          {edgeFade ? (
            <>
              <Svg
                pointerEvents="none"
                style={[styles.edgeFade, styles.edgeFadeLeft, { width: edgeFadeWidth }]}
              >
                <Defs>
                  <SvgLinearGradient id="weight-fade-left" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={edgeFadeColor} stopOpacity="1" />
                    <Stop offset="1" stopColor={edgeFadeColor} stopOpacity="0" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#weight-fade-left)" />
              </Svg>
              <Svg
                pointerEvents="none"
                style={[styles.edgeFade, styles.edgeFadeRight, { width: edgeFadeWidth }]}
              >
                <Defs>
                  <SvgLinearGradient id="weight-fade-right" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor={edgeFadeColor} stopOpacity="0" />
                    <Stop offset="1" stopColor={edgeFadeColor} stopOpacity="1" />
                  </SvgLinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#weight-fade-right)" />
              </Svg>
            </>
          ) : null}
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
  valueEditorArea: {
    alignItems: "center",
    position: "relative",
    zIndex: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  inputErrorDropdown: {
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    position: "absolute",
    top: "100%",
    width: 210,
  },
  inputErrorText: {
    color: "#c7c7c7",
    fontSize: 10,
    lineHeight: 13,
    textAlign: "center",
  },
  valueText: {
    fontSize: 32,
    lineHeight: 32,
    includeFontPadding: false,
    color: "#fff",
  },
  valueSlot: {
    position: "relative",
  },
  valueSizer: {
    opacity: 0,
  },
  valueDisplay: {
    ...StyleSheet.absoluteFillObject,
    textAlign: "center",
  },
  valueInput: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    fontFamily: fonts.body,
    fontWeight: "400",
    padding: 0,
    textAlign: "center",
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
  scrollViewport: {
    position: "relative",
  },
  edgeFade: {
    bottom: 0,
    position: "absolute",
    top: 0,
    zIndex: 2,
  },
  edgeFadeLeft: {
    left: 0,
  },
  edgeFadeRight: {
    right: 0,
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
