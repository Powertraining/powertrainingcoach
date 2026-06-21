import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  WheelColumn,
} from "../questionnaireComponents/DateSelector.jsx";

const VISIBLE_ROWS = 3;
const CENTER_ROW = Math.floor(VISIBLE_ROWS / 2);
const MAX_HOURS = 23;
const TIME_ITEM_HEIGHT = 44;

function toDurationParts(value) {
  const totalMinutes = Number.parseInt(value, 10);
  const safeTotalMinutes = Number.isFinite(totalMinutes)
    ? Math.min(Math.max(totalMinutes, 0), MAX_HOURS * 60 + 59)
    : 0;

  return {
    hours: Math.floor(safeTotalMinutes / 60),
    minutes: safeTotalMinutes % 60,
  };
}

export default function TimeDurationSelector({ value, onChange }) {
  const { hours, minutes } = toDurationParts(value);
  const hourValues = useMemo(
    () => Array.from({ length: MAX_HOURS + 1 }, (_, hour) => `${hour} hr`),
    []
  );
  const minuteValues = useMemo(
    () => Array.from({ length: 60 }, (_, minute) => `${minute} min`),
    []
  );

  function commitDuration(nextHours, nextMinutes) {
    onChange?.(String(nextHours * 60 + nextMinutes));
  }

  return (
    <View style={styles.scrollRow}>
      <WheelColumn
        values={hourValues}
        selectedIndex={hours}
        columnStyle={styles.wheelColumn}
        itemHeight={TIME_ITEM_HEIGHT}
        onSelect={(_, index) => commitDuration(index, minutes)}
      />
      <WheelColumn
        values={minuteValues}
        selectedIndex={minutes}
        columnStyle={styles.wheelColumn}
        itemHeight={TIME_ITEM_HEIGHT}
        onSelect={(_, index) => commitDuration(hours, index)}
      />
      <View pointerEvents="none" style={styles.selectedFrame} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollRow: {
    alignSelf: "center",
    flexDirection: "row",
    height: TIME_ITEM_HEIGHT * VISIBLE_ROWS,
    position: "relative",
    width: "82%",
  },
  wheelColumn: {
    zIndex: 1,
  },
  selectedFrame: {
    position: "absolute",
    top: TIME_ITEM_HEIGHT * CENTER_ROW,
    left: 0,
    right: 0,
    height: TIME_ITEM_HEIGHT,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: "#2A2A2A",
    backgroundColor: "#000",
    zIndex: 0,
  },
});
