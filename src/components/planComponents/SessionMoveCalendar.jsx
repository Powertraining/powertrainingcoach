import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import { getWeekdayNameFromIndex } from "../../constants/weekdays.js";
import { getTrainingDayTypeColor } from "../../constants/trainingDayTypes.js";

function startOfLocalDay(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getCalendarWeek(sourceDate, weekStartDate) {
  const explicitWeekStart = startOfLocalDay(weekStartDate);
  const source = startOfLocalDay(sourceDate);

  if (!source && !explicitWeekStart) {
    return [];
  }

  const firstDate = explicitWeekStart || (() => {
    const mondayOffset = source.getDay() === 0 ? -6 : 1 - source.getDay();
    const monday = new Date(source);
    monday.setDate(source.getDate() + mondayOffset);
    return monday;
  })();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);
    return date;
  });
}

export default function SessionMoveCalendar({
  sourceDate,
  weekStartDate,
  selectedDate,
  scheduledDays = [],
  onSelectDate,
}) {
  const today = startOfLocalDay(new Date());
  const source = startOfLocalDay(sourceDate);
  const selected = startOfLocalDay(selectedDate);
  const weekDates = useMemo(
    () => getCalendarWeek(sourceDate, weekStartDate),
    [sourceDate, weekStartDate]
  );
  const scheduledDayByWeekday = useMemo(
    () =>
      new Map(
        scheduledDays
          .filter((day) => day?.preferredWeekday)
          .map((day) => [day.preferredWeekday, day])
      ),
    [scheduledDays]
  );
  const sourceDay = source
    ? scheduledDayByWeekday.get(getWeekdayNameFromIndex(source.getDay()))
    : null;
  const monthLabel = weekDates.length
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
        weekDates[3]
      )
    : "Choose a day";

  return (
    <View style={styles.root}>
      <IBMPlexText style={styles.monthLabel}>{monthLabel}</IBMPlexText>
      <View style={styles.weekRow}>
        {weekDates.map((date) => {
          const weekday = getWeekdayNameFromIndex(date.getDay());
          const isSource = Boolean(source) && date.getTime() === source.getTime();
          const isSelected = Boolean(selected) && date.getTime() === selected.getTime();
          const isPast = Boolean(today) && date < today;
          const scheduledDay = scheduledDayByWeekday.get(weekday);
          const isOccupied = Boolean(scheduledDay) && !isSource;
          const disabled = isSource || isPast || isOccupied;
          const indicatorDay = isSelected ? sourceDay : scheduledDay;
          const primaryQuality = Array.isArray(indicatorDay?.sessionProfile?.qualities)
            ? indicatorDay.sessionProfile.qualities[0]
            : "";
          const isConditioningOnly =
            Array.isArray(indicatorDay?.exercises) &&
            indicatorDay.exercises.length > 0 &&
            indicatorDay.exercises.every((exercise) =>
              Boolean(exercise?.endurancePrescription)
            );
          const dayTypeColor = getTrainingDayTypeColor(
            primaryQuality || (isConditioningOnly ? "fatigue" : "rest"),
            "#585858"
          );

          return (
            <Pressable
              accessibilityLabel={`${weekday}, ${date.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}${isSource ? ", current session day" : isOccupied ? ", unavailable" : ""}`}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected: isSelected }}
              disabled={disabled}
              key={date.toDateString()}
              onPress={() => onSelectDate?.(date)}
              style={[
                styles.dayButton,
                disabled && styles.dayButtonDisabled,
                isSelected && styles.dayButtonSelected,
              ]}
            >
              <IBMPlexText
                style={[
                  styles.weekdayLabel,
                  isSelected && styles.selectedText,
                ]}
              >
                {weekday.slice(0, 2)}
              </IBMPlexText>
              <IBMPlexText
                style={[
                  styles.dayNumber,
                  isSelected && styles.selectedText,
                ]}
              >
                {date.getDate()}
              </IBMPlexText>
              <View
                style={[
                  styles.availabilityDot,
                  { backgroundColor: dayTypeColor },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <IBMPlexText style={styles.helperText}>
        Only open dates in this training week can be selected. Past dates, the current
        date, and days with another session are unavailable.
      </IBMPlexText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  monthLabel: {
    color: "#141414",
    fontSize: 15,
    fontWeight: "800",
  },
  weekRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
  },
  dayButton: {
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderColor: "#E0E0E0",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
    paddingHorizontal: 3,
    paddingVertical: 9,
  },
  dayButtonDisabled: {
    opacity: 0.34,
  },
  dayButtonSelected: {
    backgroundColor: "#141414",
    borderColor: "#141414",
    opacity: 1,
  },
  weekdayLabel: {
    color: "#686868",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  dayNumber: {
    color: "#141414",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 3,
  },
  selectedText: {
    color: "#FFFFFF",
  },
  availabilityDot: {
    backgroundColor: "#34C759",
    borderRadius: 999,
    height: 8,
    marginTop: 5,
    width: 8,
  },
  helperText: {
    color: "#686868",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
});
