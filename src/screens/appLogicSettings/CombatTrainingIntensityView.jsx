import { useRef, useState } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import TitleText from "../../components/textComponents/TitleText.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";

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
        <TitleText height={130}>
          Combat training intensity
        </TitleText>
      </View>
      <View style={[styles.intensityOutline, { top: meterTop }]}>
        <View pointerEvents="none" style={[styles.tickLine, styles.tickLineTop]} />
        <View pointerEvents="none" style={[styles.tickLine, styles.tickLineMiddle]} />
        <View pointerEvents="none" style={[styles.tickLine, styles.tickLineBottom]} />
        <StandardText style={[styles.tickLabel, styles.tickLabelTop]}>
          Intense
        </StandardText>
        <StandardText style={[styles.tickLabel, styles.tickLabelMiddle]}>
          Moderate
        </StandardText>
        <StandardText style={[styles.tickLabel, styles.tickLabelBottom]}>
          Light
        </StandardText>
        <View style={styles.fillClip}>
          <View
            style={[
              styles.intensityFill,
              { height: METER_HEIGHT * fillRatio },
            ]}
          />
        </View>
      </View>
      <StandardText style={[styles.selectedValueText, { top: meterTop + METER_HEIGHT + 18 }]} center>
        {getValueFromFillRatio(fillRatio)}
      </StandardText>
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
  tickLine: {
    backgroundColor: "#6B6B6B",
    height: 2,
    left: -88,
    position: "absolute",
    width: 78,
  },
  tickLineTop: {
    top: METER_HEIGHT * 0.1 - 1,
  },
  tickLineMiddle: {
    top: METER_HEIGHT * 0.4 - 1,
  },
  tickLineBottom: {
    bottom: METER_HEIGHT * 0.3 - 1,
  },
  tickLabel: {
    color: "#6B6B6B",
    fontSize: 16,
    left: -88,
    position: "absolute",
    textAlign: "center",
    width: 78,
  },
  tickLabelTop: {
    top: METER_HEIGHT * 0.1 - 24,
  },
  tickLabelMiddle: {
    top: METER_HEIGHT * 0.4 - 24,
  },
  tickLabelBottom: {
    bottom: METER_HEIGHT * 0.3 + 4,
  },
  selectedValueText: {
    left: 0,
    position: "absolute",
    right: 0,
  },
});
