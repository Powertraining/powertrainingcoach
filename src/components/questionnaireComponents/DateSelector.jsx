import { useEffect, useMemo, useRef, useState } from "react";
import { TextInput, StyleSheet, ScrollView, View } from "react-native";

import StandardText from "../textComponents/StandardText.jsx";

const ITEM_HEIGHT = 70;
const VISIBLE_ROWS = 3;
const CENTER_ROW = Math.floor(VISIBLE_ROWS / 2);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatDate(year, month, day) {
  return `${year}-${padNumber(month)}-${padNumber(day)}`;
}

function startOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function isBeforeMinDate(year, month, day, minDate) {
  return new Date(year, month - 1, day) < minDate;
}

function isAfterMaxDate(year, month, day, maxDate) {
  return new Date(year, month - 1, day) > maxDate;
}

function clampDateToRange(year, month, day, minDate, maxDate) {
  if (isBeforeMinDate(year, month, day, minDate)) {
    return {
      year: minDate.getFullYear(),
      month: minDate.getMonth() + 1,
      day: minDate.getDate(),
    };
  }

  if (isAfterMaxDate(year, month, day, maxDate)) {
    return {
      year: maxDate.getFullYear(),
      month: maxDate.getMonth() + 1,
      day: maxDate.getDate(),
    };
  }

  return { year, month, day };
}

function parseDateString(value = "") {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return null;
  }

  const maxDay = daysInMonth(month, year);
  if (day < 1 || day > maxDay) {
    return null;
  }

  return { year, month, day };
}

function WheelColumn({
  values,
  selectedIndex = 0,
  onSelect,
  columnStyle,
  variant = "dark",
  useMomentumSnap = false,
}) {
  const scrollRef = useRef(null);
  const isInteractingRef = useRef(false);
  const safeSelectedIndex = clamp(
    selectedIndex,
    0,
    Math.max(values.length - 1, 0)
  );
  const lastOffsetYRef = useRef(safeSelectedIndex * ITEM_HEIGHT);
  const [displayedIndex, setDisplayedIndex] = useState(safeSelectedIndex);

  useEffect(() => {
    if (isInteractingRef.current || !values.length) {
      return;
    }

    setDisplayedIndex(safeSelectedIndex);
    lastOffsetYRef.current = safeSelectedIndex * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({
      y: safeSelectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [safeSelectedIndex, values.length]);

  function getIndexFromOffset(offsetY) {
    return clamp(
      Math.round(offsetY / ITEM_HEIGHT),
      0,
      values.length - 1
    );
  }

  function snapToSelection(offsetY) {
    if (!values.length) {
      return;
    }

    const nextIndex = getIndexFromOffset(offsetY);
    const nextOffsetY = nextIndex * ITEM_HEIGHT;

    lastOffsetYRef.current = nextOffsetY;
    setDisplayedIndex(nextIndex);
    scrollRef.current?.scrollTo({
      y: nextOffsetY,
      animated: true,
    });
    onSelect?.(values[nextIndex], nextIndex);
    isInteractingRef.current = false;
  }

  function handleScroll(event) {
    lastOffsetYRef.current = event.nativeEvent.contentOffset.y;
    setDisplayedIndex(getIndexFromOffset(lastOffsetYRef.current));
  }

  return (
    <View style={[styles.column, columnStyle]}>
      <ScrollView
        ref={scrollRef}
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={styles.columnContent}
        onScroll={handleScroll}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onMomentumScrollEnd={(event) => {
          lastOffsetYRef.current = event.nativeEvent.contentOffset.y;
          snapToSelection(lastOffsetYRef.current);
        }}
        onScrollEndDrag={(event) => {
          lastOffsetYRef.current = event.nativeEvent.contentOffset.y;
          const velocityY = Math.abs(event.nativeEvent.velocity?.y || 0);
          if (useMomentumSnap && velocityY > 0.05) {
            return;
          }

          snapToSelection(lastOffsetYRef.current);
        }}
      >
        {values.map((value, index) => (
          <View key={`${value}-${index}`} style={styles.item}>
            <StandardText
              style={[
                styles.itemText,
                variant === "light" ? styles.itemTextLight : null,
                index === displayedIndex && styles.itemTextSelected,
                variant === "light" && index === displayedIndex
                  ? styles.itemTextSelectedLight
                  : null,
              ]}
            >
              {value}
            </StandardText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export default function DateSelector({
  value = "",
  onChange,
  placeholder = "e.g. 2026-06-20 or 8 weeks out",
  showInput = true,
  variant = "dark",
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(
    () => new Date(today.getFullYear() + 10, 11, 31),
    [today]
  );
  const parsedValue = useMemo(() => parseDateString(value), [value]);
  const initialDate = useMemo(
    () =>
      parsedValue ?
        clampDateToRange(
          parsedValue.year,
          parsedValue.month,
          parsedValue.day,
          today,
          maxDate
        ) :
        {
          year: today.getFullYear(),
          month: today.getMonth() + 1,
          day: today.getDate(),
        },
    [maxDate, parsedValue, today]
  );

  const [selectedYear, setSelectedYear] = useState(
    initialDate.year
  );
  const [selectedMonth, setSelectedMonth] = useState(
    initialDate.month
  );
  const [selectedDay, setSelectedDay] = useState(
    initialDate.day
  );

  useEffect(() => {
    if (!parsedValue) {
      return;
    }

    const nextDate = clampDateToRange(
      parsedValue.year,
      parsedValue.month,
      parsedValue.day,
      today,
      maxDate
    );

    setSelectedYear(nextDate.year);
    setSelectedMonth(nextDate.month);
    setSelectedDay(nextDate.day);
    const nextDateValue = formatDate(nextDate.year, nextDate.month, nextDate.day);

    if (nextDateValue !== String(value).trim()) {
      onChange?.(nextDateValue);
    }
  }, [maxDate, onChange, parsedValue, today, value]);

  useEffect(() => {
    const nextDate = clampDateToRange(
      selectedYear,
      selectedMonth,
      selectedDay,
      today,
      maxDate
    );

    if (
      nextDate.year === selectedYear &&
      nextDate.month === selectedMonth &&
      nextDate.day === selectedDay
    ) {
      return;
    }

    setSelectedYear(nextDate.year);
    setSelectedMonth(nextDate.month);
    setSelectedDay(nextDate.day);
    onChange?.(formatDate(nextDate.year, nextDate.month, nextDate.day));
  }, [maxDate, selectedDay, selectedMonth, selectedYear, today, onChange]);

  const years = useMemo(() => {
    const minYear = today.getFullYear();
    const maxYear = maxDate.getFullYear();
    return Array.from(
      { length: maxYear - minYear + 1 },
      (_, index) => minYear + index
    );
  }, [maxDate, today]);

  const months = useMemo(() => {
    const minMonth = selectedYear === today.getFullYear() ? today.getMonth() + 1 : 1;
    return MONTHS.slice(minMonth - 1).map((label, index) => ({
      label,
      value: minMonth + index,
    }));
  }, [selectedYear, today]);

  const days = useMemo(
    () =>
      Array.from(
        {
          length:
            daysInMonth(selectedMonth, selectedYear) -
            (
              selectedYear === today.getFullYear() &&
              selectedMonth === today.getMonth() + 1 ?
                today.getDate() - 1 :
                0
            ),
        },
        (_, index) =>
          index +
          (
            selectedYear === today.getFullYear() &&
            selectedMonth === today.getMonth() + 1 ?
              today.getDate() :
              1
          )
      ),
    [selectedMonth, selectedYear, today]
  );
  const dayWheelKey = `${selectedYear}-${selectedMonth}-${days[0] ?? 0}-${days.length}`;

  function commitDate(nextYear, nextMonth, nextDay) {
    const safeDay = clamp(nextDay, 1, daysInMonth(nextMonth, nextYear));
    const safeDate = clampDateToRange(
      nextYear,
      nextMonth,
      safeDay,
      today,
      maxDate
    );

    setSelectedYear(safeDate.year);
    setSelectedMonth(safeDate.month);
    setSelectedDay(safeDate.day);
    onChange?.(formatDate(safeDate.year, safeDate.month, safeDate.day));
  }

  return (
    <View>
      <View style={styles.scrollRow}>
        <WheelColumn
          key={dayWheelKey}
          values={days.map((day) => padNumber(day))}
          selectedIndex={days.findIndex((day) => day === selectedDay)}
          variant={variant}
          onSelect={(_, index) => {
            commitDate(selectedYear, selectedMonth, days[index]);
          }}
        />
        <WheelColumn
          values={months.map((month) => month.label)}
          selectedIndex={months.findIndex((month) => month.value === selectedMonth)}
          variant={variant}
          onSelect={(_, index) => {
            commitDate(selectedYear, months[index].value, selectedDay);
          }}
        />
        <WheelColumn
          values={years.map(String)}
          selectedIndex={years.findIndex((year) => year === selectedYear)}
          variant={variant}
          useMomentumSnap
          onSelect={(_, index) => {
            commitDate(years[index], selectedMonth, selectedDay);
          }}
        />
        <View
          pointerEvents="none"
          style={[
            styles.selectedFrame,
            variant === "light" ? styles.selectedFrameLight : null,
          ]}
        />
      </View>

      {showInput ? (
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={(nextValue) => onChange?.(nextValue)}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollRow: {
    flexDirection: "row",
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    marginBottom: 8,
    position: "relative",
    width: "65%",
    alignSelf: "center",
  },
  column: {
    flex: 1,
    overflow: "hidden",
  },
  columnContent: {
    paddingVertical: ITEM_HEIGHT * CENTER_ROW,
  },
  item: {
    alignItems: "center",
    height: ITEM_HEIGHT,
    justifyContent: "center",
  },
  itemText: {
    fontSize: 20,
    color: "#fff",
    opacity: 0.5,
  },
  itemTextLight: {
    color: "#5f5f5f",
    opacity: 0.62,
  },
  itemTextSelected: {
    fontSize: 24,
    fontWeight: "600",
    opacity: 1,
  },
  itemTextSelectedLight: {
    color: "#141414",
    fontWeight: "900",
  },
  selectedFrame: {
    position: "absolute",
    top: ITEM_HEIGHT * CENTER_ROW,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderWidth: 0.8,
    borderRadius: 20,
    borderColor: "#C9B259",
    backgroundColor: "transparent",
  },
  selectedFrameLight: {
    backgroundColor: "rgba(20,20,20,0.05)",
    borderColor: "#141414",
  },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,

  },
});
