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
  const sliderShellRef = useRef(null);
  const activeTouchIdRef = useRef(null);
  const sliderPageXRef = useRef(0);
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

  function getFiniteNumber(...values) {
    return values.find((nextValue) => Number.isFinite(nextValue));
  }

  function measureSliderPageX() {
    sliderShellRef.current?.measure?.((_x, _y, _width, _height, pageX) => {
      if (Number.isFinite(pageX)) {
        sliderPageXRef.current = pageX;
      }
    });
  }

  function getPageXFromEvent(event, gestureState, touch) {
    return getFiniteNumber(
      touch?.pageX,
      event.nativeEvent.pageX,
      gestureState?.moveX,
      gestureState?.x0
    );
  }

  function getLocationXFromEvent(event, gestureState, touch) {
    const pageX = getPageXFromEvent(event, gestureState, touch);
    const locationX = getFiniteNumber(touch?.locationX, event.nativeEvent.locationX);

    if (Number.isFinite(locationX)) {
      return locationX;
    }

    if (Number.isFinite(pageX)) {
      return pageX - sliderPageXRef.current;
    }

    return null;
  }

  function valueFromPageX(pageX) {
    if (!sliderWidth || !Number.isFinite(pageX)) {
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

  function startDrag(event, gestureState) {
    measureSliderPageX();
    const touch = getResponderTouch(event);
    const nextValue = valueFromLocationX(
      getLocationXFromEvent(event, gestureState, touch) ?? 0
    );
    const pageX = getPageXFromEvent(event, gestureState, touch);

    activeTouchIdRef.current = touch?.identifier ?? event.nativeEvent.identifier ?? null;
    dragStartPageXRef.current = pageX ?? 0;
    dragStartValueRef.current = nextValue;
    setLiveDragValue(nextValue);
  }

  function updateDrag(event, gestureState) {
    const touch = getResponderTouch(event);
    const pageX = getPageXFromEvent(event, gestureState, touch);

    if (!Number.isFinite(pageX)) {
      return;
    }

    setLiveDragValue(valueFromPageX(pageX));
  }

  function endDrag(event, gestureState) {
    updateDrag(event, gestureState);
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
        ref={sliderShellRef}
        style={styles.sliderShell}
        onLayout={({ nativeEvent }) => {
          setSliderWidth(nativeEvent.layout.width);
          measureSliderPageX();
        }}
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
});
