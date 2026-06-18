import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const ITEM_WIDTH = 64;
const ITEM_HEIGHT = 70;
const INITIAL_MAX_REPS = 100;
const EXTEND_BY_REPS = 100;
const EXTEND_THRESHOLD = 12;

function toRepCount(value) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

export default function RepCountSelector({ value, onChange }) {
  const scrollRef = useRef(null);
  const isInteractingRef = useRef(false);
  const selectedValue = toRepCount(value);
  const [containerWidth, setContainerWidth] = useState(0);
  const [displayedValue, setDisplayedValue] = useState(selectedValue);
  const [maxRep, setMaxRep] = useState(() =>
    Math.max(INITIAL_MAX_REPS, selectedValue + EXTEND_BY_REPS)
  );
  const sidePadding = Math.max((containerWidth - ITEM_WIDTH) / 2, 0);

  function extendRangeIfNeeded(repCount) {
    if (repCount >= maxRep - EXTEND_THRESHOLD) {
      setMaxRep((currentMax) => currentMax + EXTEND_BY_REPS);
    }
  }

  function getValueFromOffset(offsetX) {
    return Math.max(0, Math.round(offsetX / ITEM_WIDTH));
  }

  function finalizeSelection(offsetX) {
    const nextValue = getValueFromOffset(offsetX);

    extendRangeIfNeeded(nextValue);
    setDisplayedValue(nextValue);
    scrollRef.current?.scrollTo({
      x: nextValue * ITEM_WIDTH,
      animated: true,
    });
    onChange?.(String(nextValue));
    isInteractingRef.current = false;
  }

  useEffect(() => {
    if (isInteractingRef.current || !containerWidth) {
      return;
    }

    if (selectedValue > maxRep) {
      setMaxRep(selectedValue + EXTEND_BY_REPS);
    }
    setDisplayedValue(selectedValue);
    scrollRef.current?.scrollTo({
      x: selectedValue * ITEM_WIDTH,
      animated: false,
    });
  }, [containerWidth, maxRep, selectedValue]);

  return (
    <View
      style={styles.wheel}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        horizontal
        bounces={false}
        decelerationRate="fast"
        disableIntervalMomentum
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: sidePadding },
        ]}
        onScroll={(event) => {
          const nextValue = getValueFromOffset(event.nativeEvent.contentOffset.x);
          setDisplayedValue(nextValue);
          extendRangeIfNeeded(nextValue);
        }}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onMomentumScrollEnd={(event) =>
          finalizeSelection(event.nativeEvent.contentOffset.x)
        }
        onScrollEndDrag={(event) => {
          const velocityX = Math.abs(event.nativeEvent.velocity?.x || 0);

          if (velocityX <= 0.05) {
            finalizeSelection(event.nativeEvent.contentOffset.x);
          }
        }}
      >
        {Array.from({ length: maxRep + 1 }, (_, repCount) => {
          const isSelected = repCount === displayedValue;

          return (
            <View key={repCount} style={styles.item}>
              <IBMPlexText
                style={[
                  styles.itemText,
                  isSelected ? styles.itemTextSelected : null,
                ]}
              >
                {repCount}
              </IBMPlexText>
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
    width: "100%",
    height: ITEM_HEIGHT,
    position: "relative",
  },
  content: {
    alignItems: "center",
  },
  scroll: {
    zIndex: 1,
  },
  item: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 22,
    opacity: 0.45,
  },
  itemTextSelected: {
    fontSize: 20,
    lineHeight: 24,
    opacity: 1,
  },
  selectedFrame: {
    position: "absolute",
    top: (ITEM_HEIGHT - 42) / 2,
    left: "50%",
    width: ITEM_WIDTH,
    height: 42,
    marginLeft: -ITEM_WIDTH / 2,
    borderWidth: 1,
    borderRadius: 999,
    borderColor: "#2A2A2A",
    backgroundColor: "#000",
    zIndex: 0,
  },
});
