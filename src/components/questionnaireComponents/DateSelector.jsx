import { useEffect, useMemo, useRef, useState } from "react";
import { Text, TextInput, StyleSheet, ScrollView, View } from "react-native";

const ITEM_HEIGHT = 48;
const VISIBLE_ROWS = 5;
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

function clampDateToMin(year, month, day, minDate) {
  if (!isBeforeMinDate(year, month, day, minDate)) {
    return { year, month, day };
  }

  return {
    year: minDate.getFullYear(),
    month: minDate.getMonth() + 1,
    day: minDate.getDate(),
  };
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
}) {
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    scrollRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [selectedIndex]);

  function finalizeSelection(offsetY) {
    const nextIndex = clamp(
      Math.round(offsetY / ITEM_HEIGHT),
      0,
      values.length - 1
    );

    scrollRef.current?.scrollTo({
      y: nextIndex * ITEM_HEIGHT,
      animated: true,
    });
    onSelect?.(values[nextIndex], nextIndex);
  }

  return (
    <View style={[styles.column, columnStyle]}>
      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={styles.columnContent}
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onMomentumScrollEnd={(event) => {
          isDraggingRef.current = false;
          finalizeSelection(event.nativeEvent.contentOffset.y);
        }}
        onScrollEndDrag={(event) => {
          const velocityY = Math.abs(event.nativeEvent.velocity?.y || 0);
          if (velocityY > 0.05) {
            return;
          }
          isDraggingRef.current = false;
          finalizeSelection(event.nativeEvent.contentOffset.y);
        }}
      >
        {values.map((value, index) => (
          <View key={`${value}-${index}`} style={styles.item}>
            <Text
              style={[
                styles.itemText,
                index === selectedIndex && styles.itemTextSelected,
              ]}
            >
              {value}
            </Text>
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
}) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const parsedValue = useMemo(() => parseDateString(value), [value]);
  const initialDate = useMemo(
    () =>
      parsedValue ?
        clampDateToMin(parsedValue.year, parsedValue.month, parsedValue.day, today) :
        {
          year: today.getFullYear(),
          month: today.getMonth() + 1,
          day: today.getDate(),
        },
    [parsedValue, today]
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

    const nextDate = clampDateToMin(
      parsedValue.year,
      parsedValue.month,
      parsedValue.day,
      today
    );

    setSelectedYear(nextDate.year);
    setSelectedMonth(nextDate.month);
    setSelectedDay(nextDate.day);
  }, [parsedValue, today]);

  const years = useMemo(() => {
    const minYear = today.getFullYear();
    const maxYear = Math.max(today.getFullYear() + 10, selectedYear + 1);
    return Array.from(
      { length: maxYear - minYear + 1 },
      (_, index) => minYear + index
    );
  }, [selectedYear, today]);

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

  function commitDate(nextYear, nextMonth, nextDay) {
    const safeDay = clamp(nextDay, 1, daysInMonth(nextMonth, nextYear));
    const safeDate = clampDateToMin(nextYear, nextMonth, safeDay, today);

    setSelectedYear(safeDate.year);
    setSelectedMonth(safeDate.month);
    setSelectedDay(safeDate.day);
    onChange?.(formatDate(safeDate.year, safeDate.month, safeDate.day));
  }

  return (
    <View>
      <View style={styles.scrollRow}>
        <WheelColumn
          values={days.map((day) => padNumber(day))}
          selectedIndex={days.findIndex((day) => day === selectedDay)}
          onSelect={(_, index) => {
            commitDate(selectedYear, selectedMonth, days[index]);
          }}
        />
        <WheelColumn
          values={months.map((month) => month.label)}
          selectedIndex={months.findIndex((month) => month.value === selectedMonth)}
          onSelect={(_, index) => {
            commitDate(selectedYear, months[index].value, selectedDay);
          }}
        />
        <WheelColumn
          values={years.map(String)}
          selectedIndex={years.findIndex((year) => year === selectedYear)}
          onSelect={(_, index) => {
            commitDate(years[index], selectedMonth, selectedDay);
          }}
        />
      </View>

      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={(nextValue) => onChange?.(nextValue)}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollRow: {
    flexDirection: "row",
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    marginBottom: 8,
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
    fontSize: 16,
    color: "#fff",
    opacity: 0.5,
  },
  itemTextSelected: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 1,
  },
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
});
