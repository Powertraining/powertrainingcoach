import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import StandardText from "../textComponents/StandardText.jsx";

const ITEM_HEIGHT = 70;
const VISIBLE_ROWS = 3;
const CENTER_ROW = Math.floor(VISIBLE_ROWS / 2);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getMinuteLabelParts(label) {
  const match = /^(\d+)\s+(.+)$/.exec(label);
  return match ? { number: match[1], unit: match[2] } : null;
}

export default function SessionDurationSelector({
  options,
  value,
  onChange,
}) {
  const scrollRef = useRef(null);
  const isDraggingRef = useRef(false);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  );

  useEffect(() => {
    if (isDraggingRef.current || !options.length) {
      return;
    }

    scrollRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [options.length, selectedIndex]);

  function finalizeSelection(offsetY) {
    if (!options.length) {
      return;
    }

    const nextIndex = clamp(
      Math.round(offsetY / ITEM_HEIGHT),
      0,
      options.length - 1
    );

    scrollRef.current?.scrollTo({
      y: nextIndex * ITEM_HEIGHT,
      animated: true,
    });
    onChange?.(options[nextIndex].value);
  }

  return (
    <View style={styles.wheel}>
      <ScrollView
        ref={scrollRef}
        contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
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
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const minuteLabelParts = getMinuteLabelParts(option.label);

          return (
            <View key={option.value} style={styles.item}>
              {minuteLabelParts ? (
                <View style={[styles.minuteLabel, !isSelected ? styles.itemTextDimmed : null]}>
                  <StandardText
                    style={[
                      styles.itemNumberText,
                      isSelected ? styles.itemNumberTextSelected : null,
                    ]}
                  >
                    {minuteLabelParts.number}
                  </StandardText>
                  <StandardText
                    style={[
                      styles.itemUnitText,
                      isSelected ? styles.itemUnitTextSelected : null,
                    ]}
                  >
                    {minuteLabelParts.unit}
                  </StandardText>
                </View>
              ) : (
                <StandardText
                  style={[
                    styles.itemText,
                    isSelected ? styles.itemTextSelected : null,
                  ]}
                >
                  {option.label}
                </StandardText>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View pointerEvents="none" style={styles.selectedFrame} />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    alignSelf: "center",
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    position: "relative",
    width: "65%",
  },
  content: {
    paddingVertical: ITEM_HEIGHT * CENTER_ROW,
  },
  item: {
    alignItems: "center",
    height: ITEM_HEIGHT,
    justifyContent: "center",
  },
  itemText: {
    color: "#ffffff",
    fontSize: 24,
    opacity: 0.5,
  },
  itemTextSelected: {
    fontSize: 28,
    opacity: 1,
  },
  itemTextDimmed: {
    opacity: 0.5,
  },
  minuteLabel: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 5,
  },
  itemNumberText: {
    color: "#ffffff",
    fontSize: 24,
  },
  itemNumberTextSelected: {
    fontSize: 28,
  },
  itemUnitText: {
    color: "#ffffff",
    fontSize: 12,
  },
  itemUnitTextSelected: {
    fontSize: 14,
  },
  selectedFrame: {
    position: "absolute",
    top: ITEM_HEIGHT * CENTER_ROW,
    left: "25%",
    right: "25%",
    height: ITEM_HEIGHT,
    borderWidth: 0.8,
    borderRadius: 20,
    borderColor: "#C9B259",
  },
});
