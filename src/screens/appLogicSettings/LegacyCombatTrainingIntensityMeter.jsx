import { Animated, StyleSheet, View } from "react-native";
import { useEffect, useRef, useState } from "react";

const METER_HEIGHT = 180;
const DRAG_SENSITIVITY = 0.62;

export const LEGACY_COMBAT_INTENSITY_VALUES = Object.freeze([
  "light",
  "moderate",
  "high",
  "very_high",
]);

export function getLegacyCombatIntensityFillRatio(value) {
  const index = LEGACY_COMBAT_INTENSITY_VALUES.indexOf(value);
  return index >= 0 ? 0.2 + index * 0.25 : 0.45;
}

export function getLegacyCombatIntensityValue(fillRatio) {
  if (fillRatio < 0.325) return "light";
  if (fillRatio < 0.575) return "moderate";
  if (fillRatio < 0.825) return "high";
  return "very_high";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Preserved version of the original vertical drag meter. It is intentionally
// not used by the questionnaire, but remains available for future experiments.
export default function LegacyCombatTrainingIntensityMeter({ value, onChange }) {
  const initialFillRatio = getLegacyCombatIntensityFillRatio(value);
  const fillProgress = useRef(new Animated.Value(initialFillRatio)).current;
  const fillRatioRef = useRef(initialFillRatio);
  const dragStartYRef = useRef(0);
  const dragStartFillRatioRef = useRef(initialFillRatio);
  const selectedValueRef = useRef(getLegacyCombatIntensityValue(initialFillRatio));
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (dragging) return;
    const nextFillRatio = getLegacyCombatIntensityFillRatio(value);
    fillRatioRef.current = nextFillRatio;
    selectedValueRef.current = getLegacyCombatIntensityValue(nextFillRatio);
    fillProgress.setValue(nextFillRatio);
  }, [dragging, fillProgress, value]);

  function updateFromDrag(pageY) {
    const nextFillRatio = clamp(
      dragStartFillRatioRef.current -
        ((pageY - dragStartYRef.current) / METER_HEIGHT) * DRAG_SENSITIVITY,
      0,
      1
    );
    const nextValue = getLegacyCombatIntensityValue(nextFillRatio);

    fillRatioRef.current = nextFillRatio;
    fillProgress.setValue(nextFillRatio);
    if (selectedValueRef.current !== nextValue) {
      selectedValueRef.current = nextValue;
      onChange?.(nextValue);
    }
  }

  return (
    <View
      accessibilityRole="adjustable"
      onTouchStart={(event) => {
        setDragging(true);
        dragStartYRef.current = event.nativeEvent.pageY;
        dragStartFillRatioRef.current = fillRatioRef.current;
      }}
      onTouchMove={(event) => updateFromDrag(event.nativeEvent.pageY)}
      onTouchEnd={() => setDragging(false)}
      onTouchCancel={() => setDragging(false)}
      style={styles.outline}
    >
      <View pointerEvents="none" style={styles.fillClip}>
        <Animated.View
          style={[
            styles.fill,
            {
              height: fillProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, METER_HEIGHT],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outline: {
    borderColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    height: METER_HEIGHT,
    justifyContent: "flex-end",
    overflow: "hidden",
    width: 68,
  },
  fillClip: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  fill: { backgroundColor: "#FFFFFF", width: "100%" },
});
