import {
  useRef,
  useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const METER_HEIGHT = 290;
const METER_WIDTH = 76;
const INTENSITY_VALUES = ["light", "moderate", "intense"];

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
  const { height: screenHeight } = useWindowDimensions();
  const meterTop = Math.max(280, screenHeight / 2 - 60);
  const selectedIntensity = getValueFromFillRatio(fillRatio);
  const selectedLabelTop = meterTop + METER_HEIGHT * (1 - fillRatio) - 12;

  function updateFillFromDy(dy) {
    const nextFillRatio = clamp(
      dragStartFillRatioRef.current - dy / METER_HEIGHT,
      0,
      1
    );

    setFillRatio(nextFillRatio);
    onChange?.(getValueFromFillRatio(nextFillRatio));
  }

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
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
        <IBMPlexText titleBlock height={130}>
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
      <IBMPlexText
        defaultWhite
        pointerEvents="none"
        style={[
          styles.selectedValueText,
          {
            top: selectedLabelTop,
            transform: [{ translateX: -(METER_WIDTH / 2 + 104) }],
          },
        ]}
      >
        {selectedIntensity}
      </IBMPlexText>
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
    paddingTop: 120,
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
  selectedValueText: {
    color: "#C9B259",
    fontSize: 20,
    lineHeight: 24,
    left: "50%",
    position: "absolute",
    textAlign: "right",
    textTransform: "capitalize",
    width: 92,
  },
});
