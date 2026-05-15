import { useEffect, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";

const MIN_SESSIONS = 1;
const MAX_SESSIONS = 5;
const THUMB_SIZE = 18;
const SLIDER_TOUCH_HEIGHT = 38;

export default function ProfileFrequencySelector({ value = 3, onChange }) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [dragValue, setDragValue] = useState(value);
  const activeValue = Math.round(dragValue);
  const sliderProgress =
    (dragValue - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS);
  const thumbLeft = sliderWidth
    ? sliderProgress * (sliderWidth - THUMB_SIZE)
    : 0;

  useEffect(() => {
    setDragValue(value);
  }, [value]);

  function updateValueFromTouch(locationX, shouldCommit = false) {
    if (!sliderWidth) {
      return;
    }

    const clampedX = Math.min(Math.max(locationX, 0), sliderWidth);
    const rawValue =
      MIN_SESSIONS +
      (clampedX / sliderWidth) * (MAX_SESSIONS - MIN_SESSIONS);

    if (shouldCommit) {
      const roundedValue = Math.round(rawValue);
      setDragValue(roundedValue);
      onChange?.(roundedValue);
      return;
    }

    setDragValue(rawValue);
  }

  const sliderPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => {
      updateValueFromTouch(event.nativeEvent.locationX);
    },
    onPanResponderMove: (event) => {
      updateValueFromTouch(event.nativeEvent.locationX);
    },
    onPanResponderRelease: (event) => {
      updateValueFromTouch(event.nativeEvent.locationX, true);
    },
    onPanResponderTerminate: (event) => {
      updateValueFromTouch(event.nativeEvent.locationX, true);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.numbers}>
        {Array.from({ length: MAX_SESSIONS }, (_, index) => {
          const sessions = index + 1;
          const isActive = sessions === activeValue;

          return (
            <View key={sessions} style={styles.numberSlot}>
              <Text style={[styles.number, isActive ? styles.numberActive : null]}>
                {sessions}
              </Text>
            </View>
          );
        })}
      </View>

      <View
        style={styles.sliderShell}
        onLayout={({ nativeEvent }) => setSliderWidth(nativeEvent.layout.width)}
      >
        <View
          style={styles.sliderTouchArea}
          accessibilityRole="adjustable"
          accessibilityValue={{
            min: MIN_SESSIONS,
            max: MAX_SESSIONS,
            now: activeValue,
          }}
          {...sliderPanResponder.panHandlers}
        />

        <View style={styles.sliderTrack}>
          <View
            style={[
              styles.sliderTrackFill,
              { width: `${sliderProgress * 100}%` },
            ]}
          />
        </View>

        <View pointerEvents="none" style={[styles.sliderThumb, { left: thumbLeft }]} />
      </View>

      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>Full body</Text>
        <Text style={styles.sliderLabel}>Precise</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    width: "100%",
  },
  numbers: {
    height: 24,
    paddingHorizontal: THUMB_SIZE / 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  numberSlot: {
    width: THUMB_SIZE,
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  number: {
    color: "#585858",
    fontFamily: "BebasNeue",
    fontSize: 14,
    lineHeight: 16,
  },
  numberActive: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 22,
  },
  sliderShell: {
    height: SLIDER_TOUCH_HEIGHT,
    position: "relative",
  },
  sliderTouchArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  sliderTrack: {
    position: "absolute",
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: 10,
    top: 10,
    borderRadius: 999,
    backgroundColor: "#2A2A2A",
    overflow: "hidden",
  },
  sliderTrackFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  sliderThumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    top: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    zIndex: 1,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  sliderLabel: {
    color: "#585858",
    fontSize: 11,
    fontWeight: "600",
  },
});
