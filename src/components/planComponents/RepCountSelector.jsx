import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
import { fonts } from "../../theme/colors.js";

const ITEM_WIDTH = 64;
const ITEM_HEIGHT = 70;
const INITIAL_MAX_REPS = 100;
const EXTEND_BY_REPS = 100;
const EXTEND_THRESHOLD = 12;

function toRepCount(value) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
}

export default function RepCountSelector({
  value,
  valueChangeKey,
  compact = false,
  editable = false,
  onInputFocus,
  onInputBlur,
  onChange,
}) {
  const itemWidth = ITEM_WIDTH;
  const itemHeight = compact ? 52 : ITEM_HEIGHT;
  const scrollRef = useRef(null);
  const isInteractingRef = useRef(false);
  const hasPositionedRef = useRef(false);
  const previousValueChangeKeyRef = useRef(valueChangeKey);
  const isSyncingValueRef = useRef(false);
  const isEditingRef = useRef(false);
  const syncTimerRef = useRef(null);
  const selectedValue = toRepCount(value);
  const [containerWidth, setContainerWidth] = useState(0);
  const [displayedValue, setDisplayedValue] = useState(selectedValue);
  const [inputValue, setInputValue] = useState(String(selectedValue));
  const [maxRep, setMaxRep] = useState(() =>
    Math.max(INITIAL_MAX_REPS, selectedValue + EXTEND_BY_REPS)
  );
  const sidePadding = Math.max((containerWidth - itemWidth) / 2, 0);

  function extendRangeIfNeeded(repCount) {
    if (repCount >= maxRep - EXTEND_THRESHOLD) {
      setMaxRep((currentMax) => currentMax + EXTEND_BY_REPS);
    }
  }

  function getValueFromOffset(offsetX) {
    return Math.max(0, Math.round(offsetX / itemWidth));
  }

  function finalizeSelection(offsetX) {
    const nextValue = getValueFromOffset(offsetX);

    extendRangeIfNeeded(nextValue);
    setDisplayedValue(nextValue);
    setInputValue(String(nextValue));
    scrollRef.current?.scrollTo({
      x: nextValue * itemWidth,
      animated: true,
    });
    if (!isSyncingValueRef.current) {
      onChange?.(String(nextValue));
    }
    isInteractingRef.current = false;
  }

  function commitTypedValue() {
    const nextValue = toRepCount(inputValue);

    isEditingRef.current = false;
    isInteractingRef.current = false;
    extendRangeIfNeeded(nextValue);
    setDisplayedValue(nextValue);
    setInputValue(String(nextValue));
    scrollRef.current?.scrollTo({
      x: nextValue * itemWidth,
      animated: true,
    });
    onChange?.(String(nextValue));
    onInputBlur?.();
  }

  useEffect(() => {
    if (isInteractingRef.current || !containerWidth) {
      return;
    }

    const isInitialPosition = !hasPositionedRef.current;
    const didValueChangeKeyChange =
      previousValueChangeKeyRef.current !== valueChangeKey;

    if (!isInitialPosition && !didValueChangeKeyChange) {
      return;
    }

    previousValueChangeKeyRef.current = valueChangeKey;

    if (selectedValue > maxRep) {
      setMaxRep(selectedValue + EXTEND_BY_REPS);
    }
    setDisplayedValue(selectedValue);
    setInputValue(String(selectedValue));
    isSyncingValueRef.current = hasPositionedRef.current;
    scrollRef.current?.scrollTo({
      x: selectedValue * itemWidth,
      animated: hasPositionedRef.current,
    });
    hasPositionedRef.current = true;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
    }

    syncTimerRef.current = setTimeout(() => {
      isSyncingValueRef.current = false;
      syncTimerRef.current = null;
    }, 320);
  }, [containerWidth, itemWidth, maxRep, selectedValue, valueChangeKey]);

  useEffect(
    () => () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    },
    []
  );

  return (
    <View
      style={[styles.wheel, { height: itemHeight }]}
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
        snapToInterval={itemWidth}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: sidePadding },
        ]}
        onScroll={(event) => {
          const nextValue = getValueFromOffset(event.nativeEvent.contentOffset.x);
          setDisplayedValue(nextValue);
          if (!isEditingRef.current) {
            setInputValue(String(nextValue));
          }
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
            <View
              key={repCount}
              style={[styles.item, { height: itemHeight, width: itemWidth }]}
            >
              <IBMPlexText
                style={[
                  styles.itemText,
                  compact ? styles.compactItemText : null,
                  isSelected ? styles.itemTextSelected : null,
                  isSelected && compact ? styles.compactItemTextSelected : null,
                ]}
              >
                {repCount}
              </IBMPlexText>
            </View>
          );
        })}
      </ScrollView>
      <Svg pointerEvents="none" style={[styles.edgeFade, styles.edgeFadeLeft]}>
        <Defs>
          <SvgLinearGradient id="reps-fade-left" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#101010" stopOpacity="1" />
            <Stop offset="1" stopColor="#101010" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#reps-fade-left)" />
      </Svg>
      <Svg pointerEvents="none" style={[styles.edgeFade, styles.edgeFadeRight]}>
        <Defs>
          <SvgLinearGradient id="reps-fade-right" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#101010" stopOpacity="0" />
            <Stop offset="1" stopColor="#101010" stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#reps-fade-right)" />
      </Svg>
      {editable ? (
        <TextInput
          accessibilityHint="Enter completed reps or swipe the scale"
          accessibilityLabel="Reps completed"
          cursorColor="#FFFFFF"
          keyboardType="number-pad"
          maxLength={3}
          selectTextOnFocus
          value={inputValue}
          onBlur={commitTypedValue}
          onChangeText={(nextValue) => {
            if (/^\d{0,3}$/.test(nextValue)) {
              setInputValue(nextValue);
            }
          }}
          onFocus={() => {
            isEditingRef.current = true;
            isInteractingRef.current = true;
            onInputFocus?.();
          }}
          onSubmitEditing={commitTypedValue}
          style={[
            styles.selectedFrame,
            styles.editableSelectedValue,
            compact ? styles.compactEditableSelectedValue : null,
            {
              height: compact ? 36 : 42,
              marginLeft: -itemWidth / 2,
              top: (itemHeight - (compact ? 36 : 42)) / 2,
              width: itemWidth,
            },
          ]}
        />
      ) : (
        <View
          pointerEvents="none"
          style={[
            styles.selectedFrame,
            {
              height: compact ? 36 : 42,
              marginLeft: -itemWidth / 2,
              top: (itemHeight - (compact ? 36 : 42)) / 2,
              width: itemWidth,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: {
    width: "100%",
    position: "relative",
  },
  content: {
    alignItems: "center",
  },
  scroll: {
    zIndex: 1,
  },
  edgeFade: {
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 24,
    zIndex: 2,
  },
  edgeFadeLeft: {
    left: 0,
  },
  edgeFadeRight: {
    right: 0,
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
  compactItemText: {
    fontSize: 14,
    lineHeight: 17,
  },
  compactItemTextSelected: {
    fontFamily: fonts.body,
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 20,
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
    borderColor: "#34343A",
    backgroundColor: "#000",
    zIndex: 0,
  },
  editableSelectedValue: {
    color: "#FFFFFF",
    fontFamily: fonts.body,
    fontSize: 20,
    fontWeight: "400",
    paddingHorizontal: 0,
    textAlign: "center",
    textAlignVertical: "center",
    zIndex: 3,
  },
  compactEditableSelectedValue: {
    fontSize: 17,
    lineHeight: 20,
  },
});
