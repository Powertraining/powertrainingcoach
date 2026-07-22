import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
  WheelColumn,
} from "../questionnaireComponents/DateSelector.jsx";

const VISIBLE_ROWS = 3;
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

export default function TimeDurationSelector({ value, compact = false, onChange }) {
  const itemHeight = compact ? 26 : TIME_ITEM_HEIGHT;
  const selectedFrameHeight = compact ? 36 : itemHeight;
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
    <View style={[styles.scrollRow, { height: itemHeight * VISIBLE_ROWS }]}>
      <WheelColumn
        values={hourValues}
        selectedIndex={hours}
        columnStyle={styles.wheelColumn}
        itemHeight={itemHeight}
        textStyle={compact ? styles.compactOptionText : null}
        selectedTextStyle={compact ? styles.compactOptionTextSelected : null}
        onSelect={(_, index) => commitDuration(index, minutes)}
      />
      <WheelColumn
        values={minuteValues}
        selectedIndex={minutes}
        columnStyle={styles.wheelColumn}
        itemHeight={itemHeight}
        textStyle={compact ? styles.compactOptionText : null}
        selectedTextStyle={compact ? styles.compactOptionTextSelected : null}
        onSelect={(_, index) => commitDuration(hours, index)}
      />
      <View
        pointerEvents="none"
        style={[
          styles.selectedFrameRow,
          {
            height: selectedFrameHeight,
            top: (itemHeight * VISIBLE_ROWS - selectedFrameHeight) / 2,
          },
        ]}
      >
        <View style={styles.selectedFrameColumn}>
          <View style={styles.selectedFrame} />
        </View>
        <View style={styles.selectedFrameColumn}>
          <View style={styles.selectedFrame} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollRow: {
    alignSelf: "center",
    flexDirection: "row",
    position: "relative",
    width: "100%",
  },
  wheelColumn: {
    zIndex: 1,
  },
  compactOptionText: {
    fontSize: 14,
    lineHeight: 17,
    opacity: 0.45,
  },
  compactOptionTextSelected: {
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 20,
    opacity: 1,
  },
  selectedFrameRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    zIndex: 0,
  },
  selectedFrameColumn: {
    alignItems: "center",
    flex: 1,
  },
  selectedFrame: {
    backgroundColor: "#000000",
    borderWidth: 1,
    borderRadius: 999,
    borderColor: "#34343A",
    height: 36,
    width: 64,
  },
});
