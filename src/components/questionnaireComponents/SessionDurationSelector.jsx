import {
  useEffect,
  useRef,
  useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

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
  const isInteractingRef = useRef(false);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  );
  const lastOffsetYRef = useRef(selectedIndex * ITEM_HEIGHT);
  const [displayedIndex, setDisplayedIndex] = useState(selectedIndex);

  useEffect(() => {
    if (isInteractingRef.current || !options.length) {
      return;
    }

    setDisplayedIndex(selectedIndex);
    lastOffsetYRef.current = selectedIndex * ITEM_HEIGHT;
    scrollRef.current?.scrollTo({
      y: selectedIndex * ITEM_HEIGHT,
      animated: false,
    });
  }, [options.length, selectedIndex]);

  function getIndexFromOffset(offsetY) {
    return clamp(
      Math.round(offsetY / ITEM_HEIGHT),
      0,
      options.length - 1
    );
  }

  function snapToSelection(offsetY) {
    if (!options.length) {
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
    onChange?.(options[nextIndex].value);
    isInteractingRef.current = false;
  }

  function handleScroll(event) {
    if (!options.length) {
      return;
    }

    lastOffsetYRef.current = event.nativeEvent.contentOffset.y;
    setDisplayedIndex(getIndexFromOffset(lastOffsetYRef.current));
  }

  return (
    <View style={styles.wheel}>
      <ScrollView
        ref={scrollRef}
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
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
          if (velocityY > 0.05) {
            return;
          }

          snapToSelection(lastOffsetYRef.current);
        }}
      >
        {options.map((option, index) => {
          const isSelected = index === displayedIndex;
          const minuteLabelParts = getMinuteLabelParts(option.label);

          return (
            <View key={option.value} style={styles.item}>
              {minuteLabelParts ? (
                <View style={[styles.minuteLabel, !isSelected ? styles.itemTextDimmed : null]}>
                  <IBMPlexText defaultWhite
                    style={[
                      styles.itemNumberText,
                      isSelected ? styles.itemNumberTextSelected : null,
                    ]}
                  >
                    {minuteLabelParts.number}
                  </IBMPlexText>
                  <IBMPlexText defaultWhite
                    style={[
                      styles.itemUnitText,
                      isSelected ? styles.itemUnitTextSelected : null,
                    ]}
                  >
                    {minuteLabelParts.unit}
                  </IBMPlexText>
                </View>
              ) : (
                <IBMPlexText defaultWhite
                  style={[
                    styles.itemText,
                    isSelected ? styles.itemTextSelected : null,
                  ]}
                >
                  {option.label}
                </IBMPlexText>
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
