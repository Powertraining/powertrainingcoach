import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import {
  getTrainingDayTypeGradient,
  getTrainingDayTypeOverlayGradient,
} from "../../constants/trainingDayTypes.js";

const DEFAULT_DAY_TYPE_GRADIENT = Object.freeze({
  colors: Object.freeze(["rgba(88, 88, 88, 0.35)", "#282828"]),
  locations: Object.freeze([0.2, 1]),
  start: Object.freeze({ x: 0, y: 1 }),
  end: Object.freeze({ x: 1, y: 0 }),
});

const DEFAULT_DAY_TYPE_OVERLAY_GRADIENT = Object.freeze({
  colors: Object.freeze(["#000000", "#1C1C1C"]),
  locations: Object.freeze([0, 1]),
  start: Object.freeze({ x: 1, y: 0 }),
  end: Object.freeze({ x: 0, y: 1 }),
  opacity: 0.85,
});

export default function TrainingDayTypeGradient({
  children,
  pointerEvents = "none",
  style,
  type = "rest",
}) {
  const gradient = getTrainingDayTypeGradient(type, DEFAULT_DAY_TYPE_GRADIENT);
  const overlayGradient = getTrainingDayTypeOverlayGradient(
    type,
    DEFAULT_DAY_TYPE_OVERLAY_GRADIENT
  );

  return (
    <View
      pointerEvents={pointerEvents}
      style={[StyleSheet.absoluteFill, style]}
    >
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        start={gradient.start}
        end={gradient.end}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={overlayGradient.colors}
        locations={overlayGradient.locations}
        start={overlayGradient.start}
        end={overlayGradient.end}
        style={[StyleSheet.absoluteFill, { opacity: overlayGradient.opacity }]}
      />
      {children}
    </View>
  );
}

export function StrengthGradient(props) {
  return <TrainingDayTypeGradient {...props} type="force" />;
}

export function PowerGradient(props) {
  return <TrainingDayTypeGradient {...props} type="power" />;
}

export function ConditioningGradient(props) {
  return <TrainingDayTypeGradient {...props} type="fatigue" />;
}

export function SpeedGradient(props) {
  return <TrainingDayTypeGradient {...props} type="speed" />;
}

export function HypertrophyGradient(props) {
  return <TrainingDayTypeGradient {...props} type="hypertrophy" />;
}

export function RecoveryGradient(props) {
  return <TrainingDayTypeGradient {...props} type="recovery" />;
}

export function RestDayGradient(props) {
  return <TrainingDayTypeGradient {...props} type="rest" />;
}
