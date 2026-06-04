import {
  useEffect,
  useRef,
  useState } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
const MIN_SESSIONS = 1;
const MAX_SESSIONS = 5;
const THUMB_SIZE = 18;
const SLIDER_TOUCH_HEIGHT = 38;

export default function ProfileFrequencySelector({
  colorScheme = "dark",
  value = 3,
  onChange,
}) {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [dragValue, setDragValue] = useState(value);
  const activeTouchIdRef = useRef(null);
  const dragStartPageXRef = useRef(0);
  const dragStartValueRef = useRef(value);
  const dragValueRef = useRef(value);
  const activeValue = Math.round(dragValue);
  const sliderProgress =
    (dragValue - MIN_SESSIONS) / (MAX_SESSIONS - MIN_SESSIONS);
  const thumbLeft = sliderWidth
    ? sliderProgress * (sliderWidth - THUMB_SIZE)
    : 0;

  useEffect(() => {
    dragValueRef.current = value;
    setDragValue(value);
  }, [value]);

  function setLiveDragValue(nextValue) {
    dragValueRef.current = nextValue;
    setDragValue(nextValue);
  }

  function commitDragValue(nextValue = dragValueRef.current) {
    const roundedValue = Math.round(nextValue);
    dragValueRef.current = roundedValue;
    setDragValue(roundedValue);
    onChange?.(roundedValue);
  }

  function getResponderTouch(event) {
    const { changedTouches = [], touches = [], identifier } = event.nativeEvent;
    const activeTouchId = activeTouchIdRef.current;
    const allTouches = [...changedTouches, ...touches];

    if (activeTouchId != null) {
      return allTouches.find((touch) => touch.identifier === activeTouchId) || null;
    }

    return allTouches.find((touch) => touch.identifier === identifier) || allTouches[0] || event.nativeEvent;
  }

  function valueFromLocationX(locationX) {
    if (!sliderWidth) {
      return dragValueRef.current;
    }

    const clampedX = Math.min(Math.max(locationX, 0), sliderWidth);
    return (
      MIN_SESSIONS +
      (clampedX / sliderWidth) * (MAX_SESSIONS - MIN_SESSIONS)
    );
  }

  function valueFromPageX(pageX) {
    if (!sliderWidth) {
      return dragValueRef.current;
    }

    const deltaValue =
      ((pageX - dragStartPageXRef.current) / sliderWidth) *
      (MAX_SESSIONS - MIN_SESSIONS);

    return Math.min(
      Math.max(dragStartValueRef.current + deltaValue, MIN_SESSIONS),
      MAX_SESSIONS
    );
  }

  function startDrag(event) {
    const touch = getResponderTouch(event);
    const nextValue = valueFromLocationX(touch?.locationX ?? event.nativeEvent.locationX ?? 0);

    activeTouchIdRef.current = touch?.identifier ?? event.nativeEvent.identifier ?? null;
    dragStartPageXRef.current = touch?.pageX ?? event.nativeEvent.pageX ?? 0;
    dragStartValueRef.current = nextValue;
    setLiveDragValue(nextValue);
  }

  function updateDrag(event) {
    const touch = getResponderTouch(event);

    if (!touch) {
      return;
    }

    setLiveDragValue(valueFromPageX(touch.pageX));
  }

  function endDrag(event) {
    updateDrag(event);
    commitDragValue();
    activeTouchIdRef.current = null;
  }

  const sliderPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => activeTouchIdRef.current == null,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: startDrag,
    onPanResponderMove: updateDrag,
    onPanResponderRelease: endDrag,
    onPanResponderTerminate: endDrag,
  });

  return (
    <View style={styles.container}>
      <View style={styles.numbers}>
        {Array.from({ length: MAX_SESSIONS }, (_, index) => {
          const sessions = index + 1;
          const isActive = sessions === activeValue;

          return (
            <View key={sessions} style={styles.numberSlot}>
              <IBMPlexText
                style={[
                  styles.number,
                  colorScheme === "light" ? styles.numberLight : null,
                  isActive ? styles.numberActive : null,
                  isActive && colorScheme === "light" ? styles.numberActiveLight : null,
                ]}
              >
                {sessions}
              </IBMPlexText>
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

        <View
          style={[
            styles.sliderTrack,
            colorScheme === "light" ? styles.sliderTrackLight : null,
          ]}
        >
          <View
            style={[
              styles.sliderTrackFill,
              colorScheme === "light" ? styles.sliderTrackFillLight : null,
              { width: `${sliderProgress * 100}%` },
            ]}
          />
        </View>

        <View
          pointerEvents="none"
          style={[
            styles.sliderThumb,
            colorScheme === "light" ? styles.sliderThumbLight : null,
            { left: thumbLeft },
          ]}
        />
      </View>

      <View style={styles.sliderLabels}>
        <IBMPlexText
          style={[
            styles.sliderLabel,
            colorScheme === "light" ? styles.sliderLabelLight : null,
          ]}
        >
          Full body
        </IBMPlexText>
        <IBMPlexText
          style={[
            styles.sliderLabel,
            colorScheme === "light" ? styles.sliderLabelLight : null,
          ]}
        >
          Precise
        </IBMPlexText>
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
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
  },
  numberActive: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 22,
  },
  numberLight: {
    color: "#8a8a8a",
  },
  numberActiveLight: {
    color: "#141414",
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
  sliderTrackLight: {
    backgroundColor: "#e3e3e3",
  },
  sliderTrackFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  sliderTrackFillLight: {
    backgroundColor: "#141414",
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
  sliderThumbLight: {
    backgroundColor: "#141414",
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  sliderLabel: {
    color: "#585858",
    fontSize: 11, fontWeight: "600",
  },
  sliderLabelLight: {
    color: "#6f6f6f",
  },
});
