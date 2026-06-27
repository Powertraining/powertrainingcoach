import {
  Animated,
  Image,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  CIRCUIT_PRIORITY_OPTIONS,
  DESIRED_TRAINING_OPTIONS,
  ENDURANCE_FORMAT_OPTIONS,
  ENDURANCE_MODALITY_OPTIONS,
  EQUIPMENT_OPTIONS,
  getTrainingPreferencesFormState,
  HEAVY_BAG_ENDURANCE_TARGET_OPTIONS,
  SPRINTING_TARGET_OPTIONS,
} from "../constants/trainingPreferences.js";
import {
  DELOAD_STRATEGY_OPTIONS,
  LIFT_INTENSITY_METHOD_OPTIONS,
  LOADING_STRATEGY_OPTIONS,
  PERCENTAGE_REFERENCE_METHOD_OPTIONS,
  TRAINING_PHASE_OPTIONS,
} from "../constants/appLogicSettings.js";
import { WEEKDAY_OPTIONS } from "../constants/weekdays.js";
import ProfileFrequencySelector from "../components/profileComponents/ProfileFrequencySelector.jsx";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
const SESSION_DURATION_ITEM_WIDTH = 96;
const SESSION_DURATION_ITEM_HEIGHT = 70;
const LIFT_INTENSITY_CARD_WIDTH = 190;
const LIFT_INTENSITY_CARD_HEIGHT = 124;
const PROFILE_PILL_HEIGHT = 72;
const COMBAT_INTENSITY_METER_HEIGHT = 48;
const COMBAT_INTENSITY_VALUES = ["light", "moderate", "intense"];
const ARROW_IMAGE = require("../assets/icons/arrow.png");

const DESIRED_TRAINING_IMAGES = Object.freeze({
  endurance: require("../assets/icons/sports/power.png"),
  strength_power: require("../assets/icons/sports/fitness.png"),
  strength_power_endurance: require("../assets/icons/sports/balance.png"),
});

const DESIRED_TRAINING_LABELS = Object.freeze({
  endurance: "Endurance",
  strength_power: "Power",
  strength_power_endurance: "Balance",
});

const EQUIPMENT_IMAGES = Object.freeze({
  full_gym: require("../assets/icons/bench.png"),
  home_minimal: require("../assets/icons/dumbellpng.png"),
  bodyweight_only: require("../assets/icons/bicep.png"),
});

const EQUIPMENT_LABELS = Object.freeze({
  full_gym: "Full gym",
  home_minimal: "Minimal",
  bodyweight_only: "Bodyweight",
});

const TRAINING_PHASE_LABELS = Object.freeze({
  off_camp: "Off camp",
  in_camp: "In camp",
});

const ENDURANCE_MODALITY_LABELS = Object.freeze({
  rowing_ergometer: "Row",
  skiing_ergometer: "Ski",
  assault_bike: "Assault bike",
  running: "Run",
  sprinting: "Sprint",
  bicycling: "Bike",
  arm_crank_machine: "Arm crank",
  versaclimber: "Climber",
  swimming: "Swim",
  heavy_bag: "Heavy bag",
  circuit_training: "Circuit",
  sport_specific: "Sport",
});

const ENDURANCE_METHOD_ICONS = Object.freeze({
  arm_crank_machine: "arm-flex",
  assault_bike: "bike-fast",
  bicycling: "bicycle",
  circuit_training: "clipboard-pulse",
  heavy_bag: "boxing-glove",
  rowing_ergometer: "rowing",
  running: "run",
  skiing_ergometer: "ski",
  sprinting: "run-fast",
  sport_specific: "target",
  swimming: "swim",
  versaclimber: "stairs-up",
});

const ENDURANCE_FORMAT_LABELS = Object.freeze({
  low_intensity_aerobic: "Easy aerobic",
  aerobic_intervals: "Aerobic intervals",
  high_intensity_intervals: "Hard intervals",
  sport_specific_conditioning: "Sport-specific",
});

const CIRCUIT_PRIORITY_LABELS = Object.freeze({
  local_muscular_endurance: "Local endurance",
  repeated_high_effort_capacity: "Repeat efforts",
  whole_body_work_capacity: "Work capacity",
  sport_specific_fatigue_resistance: "Sport fatigue",
  aerobic_recovery_between_bursts: "Recovery",
  grip_endurance: "Grip",
  neck_endurance: "Neck",
  trunk_endurance: "Trunk",
  shoulder_endurance: "Shoulders",
  leg_endurance: "Legs",
});

const HEAVY_BAG_TARGET_LABELS = Object.freeze({
  aerobic_bag_work: "Aerobic bag",
  tempo_sustained_conditioning: "Tempo",
  repeated_burst_bag_work: "Repeat bursts",
  local_upper_body_endurance: "Upper endurance",
  sport_specific_fight_camp_simulation: "Fight camp",
});

const SPRINTING_TARGET_LABELS = Object.freeze({
  speed_explosiveness: "Speed",
  repeat_bursts: "Repeat bursts",
  hard_conditioning: "Hard conditioning",
});

const COMBAT_INTENSITY_LABELS = Object.freeze({
  light: "Light",
  moderate: "Moderate",
  intense: "Intense",
});

const DELOAD_OPTION_TEXT = Object.freeze({
  maintain_intensity_reduce_volume: {
    mediaText: "Maintain intensity",
    description: "Volume -30-50%",
    afterReps: "5r",
    afterWeight: "10kg",
  },
  maintain_volume_reduce_intensity: {
    mediaText: "Maintain volume",
    description: "Load down",
    afterReps: "10r",
    afterWeight: "5kg",
  },
});

const LIFT_INTENSITY_PROFILE_OPTIONS = Object.freeze([
  {
    label: "RPE",
    liftIntensityMethod: "rpe",
    percentageReferenceMethod: null,
    description:
      LIFT_INTENSITY_METHOD_OPTIONS.find((option) => option.value === "rpe")
        ?.description ?? "Use Rate of Perceived Exertion to autoregulate lift intensity.",
  },
  ...PERCENTAGE_REFERENCE_METHOD_OPTIONS.map((option) => ({
    label:
      option.value === "true_1rm"
        ? "True 1RM tests"
        : option.value === "multi_rm"
          ? "2-5RM + Epley"
          : option.value === "rpe_based_1rm"
            ? "RPE-based 1RM"
            : option.label,
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: option.value,
    description: option.description,
  })),
]);

const WEEKDAY_CHIP_OPTIONS = WEEKDAY_OPTIONS.filter((option) => option.value);
const WEEKDAY_INDEX_BY_VALUE = Object.freeze(
  WEEKDAY_CHIP_OPTIONS.reduce((lookup, option, index) => {
    lookup[option.value] = index;
    return lookup;
  }, {})
);
const WEEKDAY_SEQUENCE_LENGTH = WEEKDAY_CHIP_OPTIONS.length;

function canBuildOrderedWeekdaySequence(preferredWeekdays = []) {
  const resolvedWeekdays = preferredWeekdays.map((weekday) =>
    weekday ? WEEKDAY_INDEX_BY_VALUE[weekday] : null
  );

  if (resolvedWeekdays.length > WEEKDAY_SEQUENCE_LENGTH) {
    return false;
  }

  function search(rowIndex, previousOffset, startWeekdayIndex) {
    if (rowIndex >= resolvedWeekdays.length) {
      return true;
    }

    const fixedWeekdayIndex = resolvedWeekdays[rowIndex];
    const remainingRows = resolvedWeekdays.length - rowIndex - 1;
    const maxSelectableOffset = WEEKDAY_SEQUENCE_LENGTH - 1 - remainingRows;

    for (
      let offset = previousOffset + 1;
      offset <= maxSelectableOffset;
      offset += 1
    ) {
      const weekdayIndex = (startWeekdayIndex + offset) % WEEKDAY_SEQUENCE_LENGTH;

      if (
        (fixedWeekdayIndex === null || fixedWeekdayIndex === weekdayIndex) &&
        search(rowIndex + 1, offset, startWeekdayIndex)
      ) {
        return true;
      }
    }

    return false;
  }

  return WEEKDAY_CHIP_OPTIONS.some((_, startWeekdayIndex) =>
    search(0, -1, startWeekdayIndex)
  );
}

function OptionCard({ label, isSelected, onPress, imageSource, stretch = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.optionCard,
        stretch ? styles.optionCardStretch : null,
        isSelected ? styles.optionCardSelected : null,
      ]}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.optionImage, isSelected ? styles.optionImageSelected : null]}
          resizeMode="contain"
        />
      ) : null}
      <IBMPlexText
        numberOfLines={2}
        adjustsFontSizeToFit
        style={[styles.optionCardText, isSelected ? styles.optionCardTextSelected : null]}
      >
        {label}
      </IBMPlexText>
    </TouchableOpacity>
  );
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getMinuteLabelParts(label) {
  const match = /^(\d+)\s+(.+)$/.exec(label);
  return match ? { number: match[1], unit: match[2] } : null;
}

function getCombatIntensityFillRatioFromValue(value) {
  const index = COMBAT_INTENSITY_VALUES.indexOf(value);
  return index >= 0 ? 0.3 + index * 0.3 : 0.6;
}

function getCombatIntensityValueFromFillRatio(fillRatio) {
  if (fillRatio < 0.45) {
    return "light";
  }

  if (fillRatio < 0.75) {
    return "moderate";
  }

  return "intense";
}

export function ProfileSessionDurationSelector({
  colorScheme = "dark",
  options,
  value,
  onChange,
}) {
  const scrollRef = useRef(null);
  const isInteractingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const selectedIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  );
  const lastOffsetXRef = useRef(selectedIndex * SESSION_DURATION_ITEM_WIDTH);
  const [displayedIndex, setDisplayedIndex] = useState(selectedIndex);
  const sidePadding = Math.max(
    (containerWidth - SESSION_DURATION_ITEM_WIDTH) / 2,
    0
  );

  useEffect(() => {
    if (isInteractingRef.current || !options.length || !containerWidth) {
      return;
    }

    setDisplayedIndex(selectedIndex);
    lastOffsetXRef.current = selectedIndex * SESSION_DURATION_ITEM_WIDTH;
    scrollRef.current?.scrollTo({
      x: selectedIndex * SESSION_DURATION_ITEM_WIDTH,
      animated: false,
    });
  }, [containerWidth, options.length, selectedIndex]);

  function getIndexFromOffset(offsetX) {
    return clamp(
      Math.round(offsetX / SESSION_DURATION_ITEM_WIDTH),
      0,
      options.length - 1
    );
  }

  function finalizeSelection(offsetX) {
    if (!options.length) {
      return;
    }

    const nextIndex = getIndexFromOffset(offsetX);
    const nextOffsetX = nextIndex * SESSION_DURATION_ITEM_WIDTH;

    lastOffsetXRef.current = nextOffsetX;
    setDisplayedIndex(nextIndex);
    scrollRef.current?.scrollTo({
      x: nextOffsetX,
      animated: true,
    });
    onChange?.(options[nextIndex].value);
    isInteractingRef.current = false;
  }

  function handleScroll(event) {
    if (!options.length) {
      return;
    }

    lastOffsetXRef.current = event.nativeEvent.contentOffset.x;
    setDisplayedIndex(getIndexFromOffset(lastOffsetXRef.current));
  }

  return (
    <View
      style={styles.durationWheel}
      onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        contentOffset={{ x: selectedIndex * SESSION_DURATION_ITEM_WIDTH, y: 0 }}
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.durationContent,
          { paddingHorizontal: sidePadding },
        ]}
        onScroll={handleScroll}
        onScrollBeginDrag={() => {
          isInteractingRef.current = true;
        }}
        onMomentumScrollEnd={(event) => {
          lastOffsetXRef.current = event.nativeEvent.contentOffset.x;
          finalizeSelection(lastOffsetXRef.current);
        }}
        onScrollEndDrag={(event) => {
          lastOffsetXRef.current = event.nativeEvent.contentOffset.x;
          const velocityX = Math.abs(event.nativeEvent.velocity?.x || 0);
          if (velocityX > 0.05) {
            return;
          }
          finalizeSelection(lastOffsetXRef.current);
        }}
      >
        {options.map((option, index) => {
          const isSelected = index === displayedIndex;
          const minuteLabelParts = getMinuteLabelParts(option.label);

          return (
            <View key={option.value} style={styles.durationItem}>
              {minuteLabelParts ? (
                <View
                  style={[
                    styles.durationMinuteLabel,
                    !isSelected ? styles.durationTextDimmed : null,
                  ]}
                >
                  <IBMPlexText defaultWhite
                    style={[
                    styles.durationNumberText,
                    colorScheme === "light" ? styles.durationNumberTextLight : null,
                    isSelected ? styles.durationNumberTextSelected : null,
                  ]}
                  >
                    {minuteLabelParts.number}
                  </IBMPlexText>
                  <IBMPlexText defaultWhite
                    style={[
                    styles.durationUnitText,
                    colorScheme === "light" ? styles.durationUnitTextLight : null,
                    isSelected ? styles.durationUnitTextSelected : null,
                  ]}
                  >
                    {minuteLabelParts.unit}
                  </IBMPlexText>
                </View>
              ) : (
                <IBMPlexText defaultWhite
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.durationText,
                    colorScheme === "light" ? styles.durationTextLight : null,
                    isSelected ? styles.durationTextSelected : null,
                  ]}
                >
                  {option.label}
                </IBMPlexText>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View
        pointerEvents="none"
        style={[
          styles.durationSelectedFrame,
          colorScheme === "light" ? styles.durationSelectedFrameLight : null,
        ]}
      />
    </View>
  );
}

function DesiredTrainingPills({ value, onChange, allowDeselect = true }) {
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;

  return (
    <View style={styles.desiredPills}>
      {DESIRED_TRAINING_OPTIONS.map((option, index) => {
        const isSelected = displayedValue === option.value;
        const optionPositionStyle =
          index === 0
            ? styles.desiredPillLeft
            : index === DESIRED_TRAINING_OPTIONS.length - 1
              ? styles.desiredPillRight
              : styles.desiredPillMiddle;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              if (isSelected && !allowDeselect) {
                return;
              }

              setIsSelectionCleared(isSelected);
              onChange?.(isSelected ? null : option.value);
            }}
            style={[
              styles.desiredPill,
              optionPositionStyle,
              isSelected ? styles.desiredPillSelected : null,
            ]}
          >
            <View style={styles.desiredPillImageSlot}>
              <Image
                source={DESIRED_TRAINING_IMAGES[option.value]}
                style={[
                  styles.desiredPillImage,
                  isSelected ? styles.desiredPillImageSelected : null,
                ]}
                resizeMode="contain"
              />
            </View>
            <IBMPlexText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.desiredPillText,
                isSelected ? styles.desiredPillTextSelected : null,
              ]}
            >
              {DESIRED_TRAINING_LABELS[option.value] ?? option.label}
            </IBMPlexText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EquipmentPills({
  allowDeselect = true,
  colorScheme = "dark",
  value,
  onChange,
}) {
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;

  return (
    <View style={styles.connectedPills}>
      {EQUIPMENT_OPTIONS.map((option, index) => {
        const isSelected = displayedValue === option.value;
        const optionPositionStyle =
          index === 0
            ? styles.connectedPillLeft
            : index === EQUIPMENT_OPTIONS.length - 1
              ? styles.connectedPillRight
              : styles.connectedPillMiddle;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              if (isSelected && !allowDeselect) {
                return;
              }

              setIsSelectionCleared(isSelected);
              onChange?.(isSelected ? null : option.value);
            }}
            style={[
              styles.connectedPill,
              colorScheme === "light" ? styles.connectedPillLight : null,
              optionPositionStyle,
              isSelected ? styles.connectedPillSelected : null,
              isSelected && colorScheme === "light" ?
                styles.connectedPillSelectedLight :
                null,
            ]}
          >
            <View style={styles.connectedPillImageSlot}>
              <Image
                source={EQUIPMENT_IMAGES[option.value]}
                style={[
                  styles.connectedPillImage,
                  colorScheme === "light" ? styles.connectedPillImageLight : null,
                  isSelected ? styles.connectedPillImageSelected : null,
                  isSelected && colorScheme === "light" ?
                    styles.connectedPillImageSelectedLight :
                    null,
                ]}
                resizeMode="contain"
              />
            </View>
            <IBMPlexText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.connectedPillText,
                colorScheme === "light" ? styles.connectedPillTextLight : null,
                isSelected ? styles.connectedPillTextSelected : null,
                isSelected && colorScheme === "light" ?
                  styles.connectedPillTextSelectedLight :
                  null,
              ]}
            >
              {EQUIPMENT_LABELS[option.value] ?? option.label}
            </IBMPlexText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TrainingPhasePills({ value, onChange, allowDeselect = true }) {
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;

  return (
    <View style={styles.phasePills}>
      {TRAINING_PHASE_OPTIONS.map((option, index) => {
        const isSelected = displayedValue === option.value;
        const optionPositionStyle =
          index === 0
            ? styles.phasePillLeft
            : index === TRAINING_PHASE_OPTIONS.length - 1
              ? styles.phasePillRight
              : styles.phasePillMiddle;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => {
              if (isSelected && !allowDeselect) {
                return;
              }

              setIsSelectionCleared(isSelected);
              onChange?.(isSelected ? null : option.value);
            }}
            style={[
              styles.phasePill,
              optionPositionStyle,
              isSelected ? styles.phasePillSelected : null,
            ]}
          >
            <IBMPlexText
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.phasePillText,
                isSelected ? styles.phasePillTextSelected : null,
              ]}
            >
              {TRAINING_PHASE_LABELS[option.value] ?? option.label}
            </IBMPlexText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function CombatTrainingIntensityMeter({ value, onChange, onDragChange }) {
  const initialFillRatio = getCombatIntensityFillRatioFromValue(value);
  const [selectedValue, setSelectedValue] = useState(() =>
    getCombatIntensityValueFromFillRatio(initialFillRatio)
  );
  const [meterWidth, setMeterWidth] = useState(0);
  const fillProgress = useRef(new Animated.Value(initialFillRatio)).current;
  const fillRatioRef = useRef(initialFillRatio);
  const dragStartXRef = useRef(0);
  const dragStartFillRatioRef = useRef(initialFillRatio);
  const isDraggingRef = useRef(false);
  const emittedValueRef = useRef(selectedValue);
  const selectedValueRef = useRef(selectedValue);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    const nextFillRatio = getCombatIntensityFillRatioFromValue(value);
    const nextValue = getCombatIntensityValueFromFillRatio(nextFillRatio);

    fillRatioRef.current = nextFillRatio;
    fillProgress.setValue(nextFillRatio);
    emittedValueRef.current = nextValue;
    selectedValueRef.current = nextValue;
    setSelectedValue(nextValue);
  }, [fillProgress, value]);

  function emitValue(nextValue) {
    if (emittedValueRef.current === nextValue) {
      return;
    }

    emittedValueRef.current = nextValue;
    onChange?.(nextValue);
  }

  function updateFill(nextFillRatio) {
    const clampedFillRatio = clamp(nextFillRatio, 0, 1);
    const nextValue = getCombatIntensityValueFromFillRatio(clampedFillRatio);

    fillRatioRef.current = clampedFillRatio;
    fillProgress.setValue(clampedFillRatio);

    if (selectedValueRef.current !== nextValue) {
      selectedValueRef.current = nextValue;
      setSelectedValue(nextValue);
    }
  }

  function beginDrag(event) {
    if (!meterWidth) {
      return;
    }

    const nextFillRatio = clamp(event.nativeEvent.locationX / meterWidth, 0, 1);

    isDraggingRef.current = true;
    onDragChange?.(true);
    dragStartXRef.current = event.nativeEvent.pageX;
    dragStartFillRatioRef.current = nextFillRatio;
    updateFill(nextFillRatio);
  }

  function updateDrag(event) {
    if (!isDraggingRef.current || !meterWidth) {
      return;
    }

    updateFill(
      dragStartFillRatioRef.current +
        (event.nativeEvent.pageX - dragStartXRef.current) / meterWidth
    );
  }

  function endDrag() {
    if (!isDraggingRef.current) {
      return;
    }

    isDraggingRef.current = false;
    onDragChange?.(false);
    emitValue(selectedValueRef.current);
  }

  const animatedFillWidth = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, meterWidth],
  });

  return (
    <View style={styles.combatIntensity}>
      <View
        style={styles.combatIntensityOutline}
        onLayout={(event) => setMeterWidth(event.nativeEvent.layout.width)}
        onTouchStart={beginDrag}
        onTouchMove={updateDrag}
        onTouchEnd={endDrag}
        onTouchCancel={endDrag}
      >
        <View pointerEvents="none" style={styles.combatIntensityTickLow} />
        <View pointerEvents="none" style={styles.combatIntensityTickMid} />
        <View style={styles.combatIntensityFillClip} pointerEvents="none">
          <Animated.View
            style={[
              styles.combatIntensityFill,
              { width: animatedFillWidth },
            ]}
          />
        </View>
      </View>
      <View style={styles.combatIntensityLabels}>
        {COMBAT_INTENSITY_VALUES.map((intensityValue) => {
          const isSelected = selectedValue === intensityValue;

          return (
            <IBMPlexText
              key={intensityValue}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.combatIntensityLabel,
                isSelected ? styles.combatIntensityLabelSelected : null,
              ]}
            >
              {COMBAT_INTENSITY_LABELS[intensityValue]}
            </IBMPlexText>
          );
        })}
      </View>
    </View>
  );
}

function FieldPanel({ label, children, bare = false }) {
  return (
    <View style={styles.field}>
      {label ? <IBMPlexText style={styles.label}>{label}</IBMPlexText> : null}
      {bare ? children : <View style={styles.panel}>{children}</View>}
    </View>
  );
}

function shouldShowEnduranceFields(values = {}) {
  return (
    values?.desiredTraining === "endurance" ||
    values?.desiredTraining === "strength_power_endurance"
  );
}

function toggleArrayValue(values = [], value) {
  const selectedValues = Array.isArray(values) ? values : [];

  return selectedValues.includes(value)
    ? selectedValues.filter((entry) => entry !== value)
    : [...selectedValues, value];
}

function CompactChoiceGrid({
  options,
  value,
  onChange,
  multi = false,
  labelMap,
  iconMap,
  minWidth = 96,
  large = false,
}) {
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <View style={styles.compactChoiceGrid}>
      {options.map((option) => {
        const isSelected = multi
          ? selectedValues.includes(option.value)
          : value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (multi) {
                onChange?.(toggleArrayValue(selectedValues, option.value));
                return;
              }

              onChange?.(isSelected ? null : option.value);
            }}
            style={({ pressed }) => [
              styles.compactChoice,
              large ? styles.compactChoiceLarge : { minWidth },
              isSelected ? styles.compactChoiceSelected : null,
              pressed ? styles.compactChoicePressed : null,
            ]}
          >
            {iconMap?.[option.value] ? (
              <MaterialCommunityIcons
                name={iconMap[option.value]}
                size={large ? 26 : 18}
                color={isSelected ? "#ffffff" : "#8E8E8E"}
                style={large ? styles.compactChoiceIconLarge : styles.compactChoiceIcon}
              />
            ) : null}
            <IBMPlexText
              numberOfLines={2}
              adjustsFontSizeToFit
              style={[
                styles.compactChoiceText,
                large ? styles.compactChoiceTextLarge : null,
                isSelected ? styles.compactChoiceTextSelected : null,
              ]}
            >
              {labelMap?.[option.value] ?? option.label}
            </IBMPlexText>
          </Pressable>
        );
      })}
    </View>
  );
}

function HorizontalChoiceSlider({
  options,
  value,
  onChange,
  labelMap,
  allowDeselect = true,
}) {
  return (
    <View style={styles.horizontalChoiceContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalChoiceContent}
      >
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                if (isSelected && !allowDeselect) {
                  return;
                }

                onChange?.(isSelected ? null : option.value);
              }}
              style={[
                styles.horizontalChoiceOption,
                isSelected ? styles.horizontalChoiceOptionSelected : null,
              ]}
            >
              <IBMPlexText
                numberOfLines={2}
                adjustsFontSizeToFit
                style={[
                  styles.horizontalChoiceText,
                  isSelected ? styles.horizontalChoiceTextSelected : null,
                ]}
              >
                {labelMap?.[option.value] ?? option.label}
              </IBMPlexText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CardOptions({ options, value, onChange, imageMap, scrollable = true, stretch = false }) {
  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable
    ? {
        horizontal: true,
        showsHorizontalScrollIndicator: false,
        contentContainerStyle: styles.cardOptions,
      }
    : {
        style: styles.cardOptionsStatic,
      };

  return (
    <Container {...containerProps}>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <OptionCard
            key={option.value}
            label={option.label}
            imageSource={imageMap?.[option.value]}
            stretch={stretch}
            isSelected={isSelected}
            onPress={() => onChange?.(isSelected ? null : option.value)}
          />
        );
      })}
    </Container>
  );
}

function LiftIntensityOptions({
  liftIntensityMethod,
  percentageReferenceMethod,
  onChange,
  allowDeselect = true,
}) {
  return (
    <View style={styles.liftIntensityCarousel}>
      <ScrollView
        horizontal
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        scrollEventThrottle={16}
        contentContainerStyle={styles.liftIntensityCarouselContent}
      >
        {LIFT_INTENSITY_PROFILE_OPTIONS.map((option) => {
          const isSelected =
            liftIntensityMethod === option.liftIntensityMethod &&
            (option.liftIntensityMethod === "rpe" ||
              percentageReferenceMethod === option.percentageReferenceMethod);

          return (
            <TouchableOpacity
              key={`${option.liftIntensityMethod}-${option.percentageReferenceMethod || "none"}`}
              onPress={() => {
                if (isSelected && !allowDeselect) {
                  return;
                }

                onChange?.({
                  liftIntensityMethod: isSelected ? null : option.liftIntensityMethod,
                  percentageReferenceMethod: isSelected
                    ? null
                    : option.percentageReferenceMethod,
                });
              }}
              style={[
                styles.liftIntensityCard,
                isSelected ? styles.liftIntensityCardSelected : null,
              ]}
            >
              <IBMPlexText
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.liftIntensityCardTitle,
                  isSelected ? styles.liftIntensityCardTitleSelected : null,
                ]}
              >
                {option.label}
              </IBMPlexText>
              {option.liftIntensityMethod === "rpe" ? (
                <IBMPlexText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    styles.liftIntensityCardTag,
                    isSelected ? styles.liftIntensityCardTagSelected : null,
                  ]}
                >
                  Recommended
                </IBMPlexText>
              ) : null}
              <IBMPlexText
                style={[
                  styles.liftIntensityCardDescription,
                  isSelected ? styles.liftIntensityCardDescriptionSelected : null,
                ]}
              >
                {option.description}
              </IBMPlexText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function getLoadingBarWidths(value) {
  if (value === "flat_loading") {
    return ["0%", "76%", "0%"];
  }

  if (value === "descending_pyramid") {
    return ["100%", "76%", "52%"];
  }

  if (value === "ascending_pyramid") {
    return ["52%", "76%", "100%"];
  }

  if (value === "double_pyramid") {
    return ["60%", "100%", "60%"];
  }

  return ["100%", "100%", "100%"];
}

function getActiveLoadingStrategyIndex(value) {
  const foundIndex = LOADING_STRATEGY_OPTIONS.findIndex(
    (option) => option.value === value
  );

  return foundIndex >= 0 ? foundIndex : 0;
}

function getLoopedLoadingStrategyOptions() {
  if (LOADING_STRATEGY_OPTIONS.length < 2) {
    return LOADING_STRATEGY_OPTIONS;
  }

  return [
    LOADING_STRATEGY_OPTIONS[LOADING_STRATEGY_OPTIONS.length - 1],
    ...LOADING_STRATEGY_OPTIONS,
    LOADING_STRATEGY_OPTIONS[0],
  ];
}

function getActiveDeloadStrategyIndex(value) {
  const foundIndex = DELOAD_STRATEGY_OPTIONS.findIndex(
    (option) => option.value === value
  );

  return foundIndex >= 0 ? foundIndex : 0;
}

function getLoopedDeloadStrategyOptions() {
  if (DELOAD_STRATEGY_OPTIONS.length < 2) {
    return DELOAD_STRATEGY_OPTIONS;
  }

  return [
    DELOAD_STRATEGY_OPTIONS[DELOAD_STRATEGY_OPTIONS.length - 1],
    ...DELOAD_STRATEGY_OPTIONS,
    DELOAD_STRATEGY_OPTIONS[0],
  ];
}

function ProfileLoadingBlock({ width, isSelected }) {
  const isHidden = parseFloat(width) <= 0;

  return (
    <View style={styles.loadingBlockSlot}>
      <View
        style={[
          styles.loadingBlock,
          {
            opacity: isHidden ? 0 : 1,
            width,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={styles.loadingBlockShadow}
        />
        <View style={styles.loadingBlockFace} />
      </View>
    </View>
  );
}

export function ProfileDeloadStrategyOptions({ value, onChange, compact = false }) {
  const scrollRef = useRef(null);
  const isAdjustingRef = useRef(false);
  const { width: screenWidth } = useWindowDimensions();
  const [viewportWidth, setViewportWidth] = useState(0);
  const activeIndex = getActiveDeloadStrategyIndex(value);
  const slideWidth = viewportWidth || Math.min(screenWidth - 112, 280);
  const loopedOptions = getLoopedDeloadStrategyOptions();
  const loopedActiveIndex =
    DELOAD_STRATEGY_OPTIONS.length < 2 ? activeIndex : activeIndex + 1;

  useEffect(() => {
    if (!slideWidth) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: loopedActiveIndex * slideWidth,
      animated: false,
    });
  }, [activeIndex, loopedActiveIndex, slideWidth]);

  function selectIndex(index, animated = true) {
    const nextIndex =
      (index + DELOAD_STRATEGY_OPTIONS.length) %
      DELOAD_STRATEGY_OPTIONS.length;

    scrollRef.current?.scrollTo({
      x: (DELOAD_STRATEGY_OPTIONS.length < 2 ? nextIndex : nextIndex + 1) * slideWidth,
      animated,
    });
    onChange?.(DELOAD_STRATEGY_OPTIONS[nextIndex]?.value);
  }

  function selectFromOffset(offsetX) {
    if (!slideWidth || isAdjustingRef.current) {
      return;
    }

    if (DELOAD_STRATEGY_OPTIONS.length < 2) {
      onChange?.(DELOAD_STRATEGY_OPTIONS[0]?.value);
      return;
    }

    const rawIndex = Math.round(offsetX / slideWidth);
    const lastRealIndex = DELOAD_STRATEGY_OPTIONS.length;

    if (rawIndex <= 0) {
      isAdjustingRef.current = true;
      scrollRef.current?.scrollTo({
        x: lastRealIndex * slideWidth,
        animated: false,
      });
      onChange?.(DELOAD_STRATEGY_OPTIONS[lastRealIndex - 1]?.value);
      setTimeout(() => {
        isAdjustingRef.current = false;
      }, 0);
      return;
    }

    if (rawIndex >= lastRealIndex + 1) {
      isAdjustingRef.current = true;
      scrollRef.current?.scrollTo({
        x: slideWidth,
        animated: false,
      });
      onChange?.(DELOAD_STRATEGY_OPTIONS[0]?.value);
      setTimeout(() => {
        isAdjustingRef.current = false;
      }, 0);
      return;
    }

    onChange?.(loopedOptions[rawIndex]?.value);
  }

  return (
    <View style={styles.loadingStrategyCarousel}>
      <Pressable
        accessibilityLabel="Previous deload strategy"
        accessibilityRole="button"
        onPress={() => selectIndex(activeIndex - 1)}
        style={styles.loadingStrategyArrowButton}
      >
        <Image
          source={ARROW_IMAGE}
          style={[styles.loadingStrategyArrow, styles.loadingStrategyArrowLeft]}
          resizeMode="contain"
        />
      </Pressable>

      <View
        style={styles.loadingStrategyViewport}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          snapToInterval={slideWidth}
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) =>
            selectFromOffset(event.nativeEvent.contentOffset.x)
          }
          onScrollEndDrag={(event) => {
            const velocityX = Math.abs(event.nativeEvent.velocity?.x || 0);
            if (velocityX > 0.05) {
              return;
            }
            selectFromOffset(event.nativeEvent.contentOffset.x);
          }}
        >
          {loopedOptions.map((option, index) => {
            const content = DELOAD_OPTION_TEXT[option.value];
            const repsChange =
              option.value === "maintain_intensity_reduce_volume";
            const loadChange =
              option.value === "maintain_volume_reduce_intensity";

            return (
              <View
                key={`deload-strategy-${option.value}-${index}`}
                style={[
                  styles.loadingStrategySlide,
                  compact ? styles.loadingStrategySlideCompact : null,
                  { width: slideWidth },
                ]}
              >
                <View
                  style={[
                    styles.deloadVisualCompact,
                    compact ? styles.deloadVisualCompactDense : null,
                  ]}
                >
                  <View style={styles.deloadMetricPair}>
                    <IBMPlexText
                      style={[
                        styles.deloadMetric,
                        repsChange ? styles.deloadMetricChanged : null,
                      ]}
                    >
                      10r
                    </IBMPlexText>
                    <IBMPlexText
                      style={[
                        styles.deloadMetric,
                        loadChange ? styles.deloadMetricChanged : null,
                      ]}
                    >
                      10kg
                    </IBMPlexText>
                  </View>
                  <Image
                    source={ARROW_IMAGE}
                    style={styles.deloadMetricArrow}
                    resizeMode="contain"
                  />
                  <View style={styles.deloadMetricPair}>
                    <IBMPlexText
                      style={[
                        styles.deloadMetric,
                        repsChange ? styles.deloadMetricChanged : null,
                      ]}
                    >
                      {content?.afterReps ?? "5r"}
                    </IBMPlexText>
                    <IBMPlexText
                      style={[
                        styles.deloadMetric,
                        loadChange ? styles.deloadMetricChanged : null,
                      ]}
                    >
                      {content?.afterWeight ?? "10kg"}
                    </IBMPlexText>
                  </View>
                </View>
                <IBMPlexText
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  style={styles.loadingStrategyText}
                >
                  {content?.mediaText ?? option.label}
                </IBMPlexText>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <Pressable
        accessibilityLabel="Next deload strategy"
        accessibilityRole="button"
        onPress={() => selectIndex(activeIndex + 1)}
        style={styles.loadingStrategyArrowButton}
      >
        <Image
          source={ARROW_IMAGE}
          style={styles.loadingStrategyArrow}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

export function ProfileLoadingStrategyOptions({ value, onChange, compact = false }) {
  const scrollRef = useRef(null);
  const isAdjustingRef = useRef(false);
  const { width: screenWidth } = useWindowDimensions();
  const [viewportWidth, setViewportWidth] = useState(0);
  const activeIndex = getActiveLoadingStrategyIndex(value);
  const slideWidth = viewportWidth || Math.min(screenWidth - 112, 280);
  const loopedOptions = getLoopedLoadingStrategyOptions();
  const loopedActiveIndex = LOADING_STRATEGY_OPTIONS.length < 2 ? activeIndex : activeIndex + 1;

  useEffect(() => {
    if (!slideWidth) {
      return;
    }

    scrollRef.current?.scrollTo({
      x: loopedActiveIndex * slideWidth,
      animated: false,
    });
  }, [activeIndex, loopedActiveIndex, slideWidth]);

  function selectIndex(index, animated = true) {
    const nextIndex =
      (index + LOADING_STRATEGY_OPTIONS.length) %
      LOADING_STRATEGY_OPTIONS.length;

    scrollRef.current?.scrollTo({
      x: (LOADING_STRATEGY_OPTIONS.length < 2 ? nextIndex : nextIndex + 1) * slideWidth,
      animated,
    });
    onChange?.(LOADING_STRATEGY_OPTIONS[nextIndex]?.value);
  }

  function selectFromOffset(offsetX) {
    if (!slideWidth || isAdjustingRef.current) {
      return;
    }

    if (LOADING_STRATEGY_OPTIONS.length < 2) {
      onChange?.(LOADING_STRATEGY_OPTIONS[0]?.value);
      return;
    }

    const rawIndex = Math.round(offsetX / slideWidth);
    const lastRealIndex = LOADING_STRATEGY_OPTIONS.length;

    if (rawIndex <= 0) {
      isAdjustingRef.current = true;
      scrollRef.current?.scrollTo({
        x: lastRealIndex * slideWidth,
        animated: false,
      });
      onChange?.(LOADING_STRATEGY_OPTIONS[lastRealIndex - 1]?.value);
      setTimeout(() => {
        isAdjustingRef.current = false;
      }, 0);
      return;
    }

    if (rawIndex >= lastRealIndex + 1) {
      isAdjustingRef.current = true;
      scrollRef.current?.scrollTo({
        x: slideWidth,
        animated: false,
      });
      onChange?.(LOADING_STRATEGY_OPTIONS[0]?.value);
      setTimeout(() => {
        isAdjustingRef.current = false;
      }, 0);
      return;
    }

    onChange?.(loopedOptions[rawIndex]?.value);
  }

  return (
    <View style={styles.loadingStrategyCarousel}>
      <Pressable
        accessibilityLabel="Previous loading strategy"
        accessibilityRole="button"
        onPress={() => selectIndex(activeIndex - 1)}
        style={styles.loadingStrategyArrowButton}
      >
        <Image
          source={ARROW_IMAGE}
          style={[styles.loadingStrategyArrow, styles.loadingStrategyArrowLeft]}
          resizeMode="contain"
        />
      </Pressable>

      <View
        style={styles.loadingStrategyViewport}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          snapToInterval={slideWidth}
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
          scrollEventThrottle={16}
          onMomentumScrollEnd={(event) =>
            selectFromOffset(event.nativeEvent.contentOffset.x)
          }
          onScrollEndDrag={(event) => {
            const velocityX = Math.abs(event.nativeEvent.velocity?.x || 0);
            if (velocityX > 0.05) {
              return;
            }
            selectFromOffset(event.nativeEvent.contentOffset.x);
          }}
        >
          {loopedOptions.map((option, index) => {
            const isSelected = value === option.value;
            const barWidths = getLoadingBarWidths(option.value);

            return (
              <View
                key={`loading-strategy-${option.value}-${index}`}
                style={[
                  styles.loadingStrategySlide,
                  compact ? styles.loadingStrategySlideCompact : null,
                  { width: slideWidth },
                ]}
              >
                <View style={styles.loadingVisualCompact}>
                  {barWidths.map((barWidth, index) => (
                    <ProfileLoadingBlock
                      key={`${option.value}-${index}`}
                      width={barWidth}
                      isSelected={isSelected}
                    />
                  ))}
                </View>
                <IBMPlexText
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  style={styles.loadingStrategyText}
                >
                  {option.label}
                </IBMPlexText>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <Pressable
        accessibilityLabel="Next loading strategy"
        accessibilityRole="button"
        onPress={() => selectIndex(activeIndex + 1)}
        style={styles.loadingStrategyArrowButton}
      >
        <Image
          source={ARROW_IMAGE}
          style={styles.loadingStrategyArrow}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
}

export default function ProfileTrainingPreferencesFields({
  title,
  description,
  sections = "all",
  visiblePlanFields,
  hiddenPlanFields,
  values,
  onChange,
  onCombatIntensityDragChange,
  allowDeselect = true,
  colorScheme = "dark",
  endurancePreferencesBare = false,
  endurancePreferencesLabel = "Endurance preferences",
}) {
  const safeValues = values && typeof values === "object" ? values : {};
  const resolvedValues = getTrainingPreferencesFormState(safeValues);
  const [activeWeekdayMenu, setActiveWeekdayMenu] = useState(null);
  const showPlanFields = sections !== "constraints";
  const showConstraintFields = sections !== "plan";
  const visiblePlanFieldSet = Array.isArray(visiblePlanFields)
    ? new Set(visiblePlanFields)
    : null;
  const hiddenPlanFieldSet = Array.isArray(hiddenPlanFields)
    ? new Set(hiddenPlanFields)
    : null;

  function shouldShowPlanField(field) {
    if (visiblePlanFieldSet && !visiblePlanFieldSet.has(field)) {
      return false;
    }

    return !hiddenPlanFieldSet?.has(field);
  }

  function updateFields(patch) {
    onChange?.({
      ...safeValues,
      ...resolvedValues,
      ...patch,
    });
  }

  function updateField(field, value) {
    updateFields({ [field]: value });
  }

  function updateDesiredTraining(value) {
    const includesEndurance = shouldShowEnduranceFields({
      desiredTraining: value,
    });

    updateFields({
      desiredTraining: value,
      preferredEnduranceModalities: includesEndurance
        ? resolvedValues.preferredEnduranceModalities
        : [],
      enduranceSessionsPerWeek: includesEndurance
        ? resolvedValues.enduranceSessionsPerWeek
        : null,
      preferredEnduranceFormat: includesEndurance
        ? resolvedValues.preferredEnduranceFormat
        : null,
      circuitTrainingGoalInput: includesEndurance
        ? resolvedValues.circuitTrainingGoalInput
        : "",
      circuitTrainingPrimaryPriority: includesEndurance
        ? resolvedValues.circuitTrainingPrimaryPriority
        : "",
      circuitTrainingSecondaryPriorities: includesEndurance
        ? resolvedValues.circuitTrainingSecondaryPriorities
        : [],
      heavyBagEnduranceTarget: includesEndurance
        ? resolvedValues.heavyBagEnduranceTarget
        : "",
      sprintingTarget: includesEndurance ? resolvedValues.sprintingTarget : "",
    });
  }

  function updateEnduranceModalities(nextModalities) {
    const selectedModalities = Array.isArray(nextModalities) ? nextModalities : [];

    updateFields({
      preferredEnduranceModalities: selectedModalities,
      circuitTrainingGoalInput: selectedModalities.includes("circuit_training")
        ? resolvedValues.circuitTrainingGoalInput
        : "",
      circuitTrainingPrimaryPriority: selectedModalities.includes("circuit_training")
        ? resolvedValues.circuitTrainingPrimaryPriority
        : "",
      circuitTrainingSecondaryPriorities: selectedModalities.includes("circuit_training")
        ? resolvedValues.circuitTrainingSecondaryPriorities
        : [],
      heavyBagEnduranceTarget: selectedModalities.includes("heavy_bag")
        ? resolvedValues.heavyBagEnduranceTarget
        : "",
      sprintingTarget: selectedModalities.includes("sprinting")
        ? resolvedValues.sprintingTarget
        : "",
    });
  }

  function updatePreferredWeekday(index, value) {
    const nextPreferredWeekdays = Array.from(
      { length: resolvedValues.daysPerWeek },
      (_, currentIndex) => resolvedValues.preferredWeekdays[currentIndex] || ""
    );

    nextPreferredWeekdays[index] = value || "";
    updateField("preferredWeekdays", nextPreferredWeekdays);
  }

  function getPreferredWeekdaysWithAssignment(dayIndex, value) {
    return Array.from(
      { length: resolvedValues.daysPerWeek },
      (_, currentIndex) => {
        if (currentIndex === dayIndex) {
          return value;
        }

        return resolvedValues.preferredWeekdays[currentIndex] === value
          ? ""
          : resolvedValues.preferredWeekdays[currentIndex] || "";
      }
    );
  }

  function canAssignWeekdayToDay(dayIndex, value) {
    return canBuildOrderedWeekdaySequence(
      getPreferredWeekdaysWithAssignment(dayIndex, value)
    );
  }

  function assignPreferredWeekdayToDay(dayIndex, value) {
    updateField(
      "preferredWeekdays",
      getPreferredWeekdaysWithAssignment(dayIndex, value)
    );
    setActiveWeekdayMenu(null);
  }

  function clearPreferredWeekday(dayIndex) {
    updatePreferredWeekday(dayIndex, "");
    setActiveWeekdayMenu(null);
  }

  return (
    <View style={styles.section}>
      {(title || description) && (
        <View style={styles.header}>
          {title ? <IBMPlexText style={styles.title}>{title}</IBMPlexText> : null}
          {description ? <IBMPlexText style={styles.description}>{description}</IBMPlexText> : null}
        </View>
      )}

      {showPlanFields ? (
        <>
          {shouldShowPlanField("desiredTraining") ? (
            <FieldPanel label="Desired training" bare>
              <DesiredTrainingPills
                value={resolvedValues.desiredTraining}
                onChange={updateDesiredTraining}
                allowDeselect={allowDeselect}
              />
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("endurancePreferences") &&
          shouldShowEnduranceFields(resolvedValues) ? (
            <FieldPanel
              label={endurancePreferencesLabel}
              bare={endurancePreferencesBare}
            >
              <View style={styles.enduranceFields}>
                <View style={styles.enduranceSubfield}>
                  <IBMPlexText style={styles.enduranceSubfieldLabel}>Methods</IBMPlexText>
                  <CompactChoiceGrid
                    options={ENDURANCE_MODALITY_OPTIONS}
                    value={resolvedValues.preferredEnduranceModalities}
                    onChange={updateEnduranceModalities}
                    labelMap={ENDURANCE_MODALITY_LABELS}
                    iconMap={ENDURANCE_METHOD_ICONS}
                    multi
                    large
                  />
                </View>

                <View style={styles.enduranceSubfield}>
                  <IBMPlexText style={styles.enduranceSubfieldLabel}>Sessions per week</IBMPlexText>
                  <ProfileFrequencySelector
                    value={resolvedValues.enduranceSessionsPerWeek ?? 1}
                    onChange={(value) => updateField("enduranceSessionsPerWeek", value)}
                  />
                </View>

                <View style={styles.enduranceSubfield}>
                  <IBMPlexText style={styles.enduranceSubfieldLabel}>Style</IBMPlexText>
                  <HorizontalChoiceSlider
                    options={ENDURANCE_FORMAT_OPTIONS}
                    value={resolvedValues.preferredEnduranceFormat}
                    onChange={(value) => updateField("preferredEnduranceFormat", value)}
                    labelMap={ENDURANCE_FORMAT_LABELS}
                    allowDeselect={false}
                  />
                </View>

                {resolvedValues.preferredEnduranceModalities.includes(
                  "circuit_training"
                ) ? (
                  <View style={styles.enduranceSubfield}>
                    <IBMPlexText style={styles.enduranceSubfieldLabel}>Circuit focus</IBMPlexText>
                    <CompactChoiceGrid
                      options={CIRCUIT_PRIORITY_OPTIONS}
                      value={[
                        resolvedValues.circuitTrainingPrimaryPriority,
                        ...resolvedValues.circuitTrainingSecondaryPriorities,
                      ].filter(Boolean)}
                      onChange={(selectedValues) =>
                        updateFields({
                          circuitTrainingGoalInput:
                            selectedValues.length > 0
                              ? resolvedValues.circuitTrainingGoalInput
                              : "",
                          circuitTrainingPrimaryPriority: selectedValues[0] || "",
                          circuitTrainingSecondaryPriorities: selectedValues.slice(1),
                        })
                      }
                      labelMap={CIRCUIT_PRIORITY_LABELS}
                      multi
                    />
                  </View>
                ) : null}

                {resolvedValues.preferredEnduranceModalities.includes("heavy_bag") ? (
                  <View style={styles.enduranceSubfield}>
                    <IBMPlexText style={styles.enduranceSubfieldLabel}>Heavy bag focus</IBMPlexText>
                    <CompactChoiceGrid
                      options={HEAVY_BAG_ENDURANCE_TARGET_OPTIONS}
                      value={resolvedValues.heavyBagEnduranceTarget}
                      onChange={(value) => updateField("heavyBagEnduranceTarget", value)}
                      labelMap={HEAVY_BAG_TARGET_LABELS}
                    />
                  </View>
                ) : null}

                {resolvedValues.preferredEnduranceModalities.includes("sprinting") ? (
                  <View style={styles.enduranceSubfield}>
                    <IBMPlexText style={styles.enduranceSubfieldLabel}>Sprinting focus</IBMPlexText>
                    <CompactChoiceGrid
                      options={SPRINTING_TARGET_OPTIONS}
                      value={resolvedValues.sprintingTarget}
                      onChange={(value) => updateField("sprintingTarget", value)}
                      labelMap={SPRINTING_TARGET_LABELS}
                    />
                  </View>
                ) : null}
              </View>
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("equipment") ? (
            <FieldPanel
              label={colorScheme === "light" ? null : "Equipment"}
              bare
            >
              <EquipmentPills
                value={resolvedValues.equipment}
                onChange={(value) => updateField("equipment", value)}
                allowDeselect={allowDeselect}
                colorScheme={colorScheme}
              />
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("trainingPhase") ? (
            <FieldPanel label="Training phase" bare>
              <TrainingPhasePills
                value={resolvedValues.trainingPhase}
                onChange={(value) => updateField("trainingPhase", value)}
                allowDeselect={allowDeselect}
              />
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("combatTrainingIntensity") ? (
            <FieldPanel label="Combat training intensity">
              <CombatTrainingIntensityMeter
                value={resolvedValues.combatTrainingIntensity}
                onChange={(value) => updateField("combatTrainingIntensity", value)}
                onDragChange={onCombatIntensityDragChange}
              />
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("liftIntensityLogic") ? (
            <FieldPanel label="Lift intensity logic" bare>
              <LiftIntensityOptions
                liftIntensityMethod={resolvedValues.liftIntensityMethod}
                percentageReferenceMethod={resolvedValues.percentageReferenceMethod}
                onChange={updateFields}
                allowDeselect={allowDeselect}
              />
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("loadingStrategy") ? (
            <FieldPanel label="Loading strategy">
              <ProfileLoadingStrategyOptions
                value={resolvedValues.loadingStrategy}
                onChange={(value) => updateField("loadingStrategy", value)}
              />
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("deloadStrategy") ? (
            <FieldPanel label="Deload strategy">
              <ProfileDeloadStrategyOptions
                value={resolvedValues.deloadStrategy}
                onChange={(value) => updateField("deloadStrategy", value)}
              />
            </FieldPanel>
          ) : null}

          {shouldShowPlanField("preferredWeekdays") ? (
            <FieldPanel
              bare={colorScheme === "light"}
              label={colorScheme === "light" ? null : "Preferred weekdays"}
            >
              <View style={styles.weekdayButtonRow}>
                {WEEKDAY_CHIP_OPTIONS.map((option) => {
                  const selectedIndex = resolvedValues.preferredWeekdays.findIndex(
                    (weekday) => weekday === option.value
                  );
                  const isSelected = selectedIndex >= 0;
                  const assignableDayIndexes = Array.from(
                    { length: resolvedValues.daysPerWeek },
                    (_, index) => index
                  ).filter((dayIndex) =>
                    canAssignWeekdayToDay(dayIndex, option.value)
                  );
                  const hasMenuOptions = isSelected || assignableDayIndexes.length > 0;
                  const isMenuOpen = activeWeekdayMenu === option.value;

                  return (
                    <View
                      key={option.value}
                      style={[
                        styles.weekdayButtonSlot,
                        isMenuOpen ? styles.weekdayButtonSlotActive : null,
                      ]}
                    >
                      <Pressable
                        disabled={!hasMenuOptions}
                        onLongPress={() => setActiveWeekdayMenu(option.value)}
                        onPress={() => {
                          if (isSelected && !isMenuOpen) {
                            clearPreferredWeekday(selectedIndex);
                            return;
                          }

                          setActiveWeekdayMenu(isMenuOpen ? null : option.value);
                        }}
                        style={({ pressed }) => [
                          styles.weekdayButton,
                          colorScheme === "light" ? styles.weekdayButtonLight : null,
                          isSelected ? styles.weekdayButtonSelected : null,
                          isSelected && colorScheme === "light" ?
                            styles.weekdayButtonSelectedLight :
                            null,
                          !hasMenuOptions ? styles.weekdayButtonDisabled : null,
                          pressed ? styles.weekdayButtonPressed : null,
                        ]}
                      >
                        <IBMPlexText
                          adjustsFontSizeToFit={colorScheme === "light"}
                          minimumFontScale={colorScheme === "light" ? 0.7 : undefined}
                          numberOfLines={colorScheme === "light" ? 1 : undefined}
                          style={[
                            styles.weekdayAssignmentText,
                            colorScheme === "light" ?
                              styles.weekdayAssignmentTextLight :
                              null,
                            isSelected ? styles.weekdayAssignmentTextSelected : null,
                            isSelected && colorScheme === "light" ?
                              styles.weekdayAssignmentTextSelectedLight :
                              null,
                            !hasMenuOptions ? styles.weekdayButtonTextDisabled : null,
                          ]}
                        >
                          {isSelected ? `Day ${selectedIndex + 1}` : " "}
                        </IBMPlexText>
                        <IBMPlexText
                          adjustsFontSizeToFit={colorScheme === "light"}
                          minimumFontScale={colorScheme === "light" ? 0.7 : undefined}
                          numberOfLines={colorScheme === "light" ? 1 : undefined}
                          style={[
                            styles.weekdayButtonText,
                            colorScheme === "light" ? styles.weekdayButtonTextLight : null,
                            isSelected ? styles.weekdayButtonTextSelected : null,
                            isSelected && colorScheme === "light" ?
                              styles.weekdayButtonTextSelectedLight :
                              null,
                            !hasMenuOptions ? styles.weekdayButtonTextDisabled : null,
                          ]}
                        >
                          {option.label.slice(0, 3)}
                        </IBMPlexText>
                      </Pressable>

                      {isMenuOpen ? (
                        <View
                          style={[
                            styles.weekdayDropdown,
                            colorScheme === "light" ? styles.weekdayDropdownLight : null,
                          ]}
                        >
                          {assignableDayIndexes.map((dayIndex) => {
                            const isCurrentAssignment = selectedIndex === dayIndex;

                            return (
                              <Pressable
                                key={`${option.value}-day-${dayIndex + 1}`}
                                onPress={() =>
                                  assignPreferredWeekdayToDay(dayIndex, option.value)
                                }
                                style={({ pressed }) => [
                                  styles.weekdayDropdownItem,
                                  colorScheme === "light" ?
                                    styles.weekdayDropdownItemLight :
                                    null,
                                  isCurrentAssignment
                                    ? styles.weekdayDropdownItemSelected
                                    : null,
                                  isCurrentAssignment && colorScheme === "light"
                                    ? styles.weekdayDropdownItemSelectedLight
                                    : null,
                                  pressed ? styles.weekdayDropdownItemPressed : null,
                                ]}
                              >
                                <IBMPlexText
                                  adjustsFontSizeToFit={colorScheme === "light"}
                                  minimumFontScale={colorScheme === "light" ? 0.74 : undefined}
                                  numberOfLines={colorScheme === "light" ? 1 : undefined}
                                  style={[
                                    styles.weekdayDropdownText,
                                    colorScheme === "light" ?
                                      styles.weekdayDropdownTextLight :
                                      null,
                                    isCurrentAssignment
                                      ? styles.weekdayDropdownTextSelected
                                      : null,
                                    isCurrentAssignment && colorScheme === "light"
                                      ? styles.weekdayDropdownTextSelectedLight
                                      : null,
                                  ]}
                                >
                                  Day {dayIndex + 1}
                                </IBMPlexText>
                              </Pressable>
                            );
                          })}
                          {isSelected ? (
                            <Pressable
                              onPress={() => clearPreferredWeekday(selectedIndex)}
                              style={({ pressed }) => [
                                styles.weekdayDropdownItem,
                                styles.weekdayDropdownClearItem,
                                colorScheme === "light" ?
                                  styles.weekdayDropdownClearItemLight :
                                  null,
                                pressed ? styles.weekdayDropdownItemPressed : null,
                              ]}
                            >
                              <IBMPlexText
                                adjustsFontSizeToFit={colorScheme === "light"}
                                minimumFontScale={colorScheme === "light" ? 0.74 : undefined}
                                numberOfLines={colorScheme === "light" ? 1 : undefined}
                                style={[
                                  styles.weekdayDropdownText,
                                  styles.weekdayDropdownClearText,
                                  colorScheme === "light" ?
                                    styles.weekdayDropdownClearTextLight :
                                    null,
                                ]}
                              >
                                Clear
                              </IBMPlexText>
                            </Pressable>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </FieldPanel>
          ) : null}
        </>
      ) : null}

      {showConstraintFields ? (
        <>
          <FieldPanel label="Event preparation">
            <TextInput
              value={resolvedValues.eventPreparation}
              onChangeText={(value) => updateField("eventPreparation", value)}
              placeholder="e.g. 2026-06-20 or 8 weeks out"
              placeholderTextColor="#585858"
              style={styles.input}
            />
          </FieldPanel>

          <FieldPanel label="Injuries or limitations">
            <TextInput
              value={resolvedValues.injuriesInput}
              onChangeText={(value) => updateField("injuriesInput", value)}
              placeholder="e.g. left shoulder, knee pain"
              placeholderTextColor="#585858"
              multiline
              style={[styles.input, styles.textarea]}
            />
          </FieldPanel>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#8E8E8E",
    fontSize: 12, fontWeight: "800",
    lineHeight: 15,
    textTransform: "uppercase",
  },
  description: {
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 21,
  },
  field: {
    gap: 5,
  },
  label: {
    color: "#8E8E8E",
    fontSize: 12, fontWeight: "800",
    lineHeight: 15,
    textTransform: "uppercase",
  },
  panel: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
  },
  enduranceFields: {
    gap: 14,
  },
  enduranceSubfield: {
    gap: 8,
  },
  enduranceSubfieldLabel: {
    color: "#8E8E8E",
    fontSize: 10, fontWeight: "800",
    lineHeight: 13,
    textTransform: "uppercase",
  },
  compactChoiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  compactChoice: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  compactChoiceLarge: {
    height: 74,
    width: "31%",
    minHeight: 74,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  compactChoiceSelected: {
    borderColor: "#C9B259",
    borderWidth: 0.5,
  },
  compactChoicePressed: {
    opacity: 0.78,
  },
  compactChoiceText: {
    color: "#8E8E8E",
    fontSize: 11, fontWeight: "700",
    lineHeight: 14,
    textAlign: "center",
  },
  compactChoiceTextLarge: {
    fontSize: 12,
    lineHeight: 15,
  },
  compactChoiceIcon: {
    marginBottom: 4,
  },
  compactChoiceIconLarge: {
    marginBottom: 8,
  },
  compactChoiceTextSelected: {
    color: "#ffffff",
  },
  horizontalChoiceContainer: {
    marginHorizontal: -12,
  },
  horizontalChoiceContent: {
    gap: 8,
    paddingHorizontal: 12,
  },
  horizontalChoiceOption: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 24,
    borderWidth: 2,
    height: 100,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 118,
  },
  horizontalChoiceOptionSelected: {
    borderColor: "#C9B259",
    borderWidth: 0.5,
  },
  horizontalChoiceText: {
    color: "#8E8E8E",
    fontSize: 15, fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  horizontalChoiceTextSelected: {
    color: "#ffffff",
  },
  desiredPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  desiredPill: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 24,
    borderColor: "#1E1E1E",
    borderWidth: 2,
    height: 100,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
  },
  desiredPillSelected: {
    borderColor: "#C9B259",
    borderWidth: 0.5,
  },
  desiredPillLeft: {
    borderRadius: 24,
  },
  desiredPillMiddle: {
    borderRadius: 24,
  },
  desiredPillRight: {
    borderRadius: 24,
  },
  desiredPillImageSlot: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: "100%",
  },
  desiredPillImage: {
    height: 34,
    tintColor: "#8E8E8E",
    width: 34,
  },
  desiredPillImageSelected: {
    tintColor: "#ffffff",
  },
  desiredPillText: {
    color: "#8E8E8E",
    fontSize: 11, fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
  desiredPillTextSelected: {
    color: "#ffffff",
  },
  connectedPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  connectedPill: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 24,
    borderColor: "#1E1E1E",
    borderWidth: 2,
    height: 100,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
  },
  connectedPillLight: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  connectedPillSelected: {
    borderColor: "#C9B259",
    borderWidth: 0.5,
  },
  connectedPillSelectedLight: {
    backgroundColor: "#141414",
    borderColor: "#141414",
    borderWidth: 2,
  },
  connectedPillLeft: {
    borderRadius: 24,
  },
  connectedPillMiddle: {
    borderRadius: 24,
  },
  connectedPillRight: {
    borderRadius: 24,
  },
  connectedPillImageSlot: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: "100%",
  },
  connectedPillImage: {
    height: 34,
    tintColor: "#8E8E8E",
    width: 34,
  },
  connectedPillImageLight: {
    tintColor: "#141414",
  },
  connectedPillImageSelected: {
    tintColor: "#ffffff",
  },
  connectedPillImageSelectedLight: {
    tintColor: "#ffffff",
  },
  connectedPillText: {
    color: "#8E8E8E",
    fontSize: 11, fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
  connectedPillTextLight: {
    color: "#141414",
  },
  connectedPillTextSelected: {
    color: "#ffffff",
  },
  connectedPillTextSelectedLight: {
    color: "#ffffff",
  },
  phasePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
  },
  phasePill: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 22,
    borderColor: "#1E1E1E",
    borderWidth: 2,
    flexBasis: "48%",
    flexGrow: 1,
    height: PROFILE_PILL_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  phasePillSelected: {
    borderColor: "#C9B259",
    borderWidth: 0.5,
  },
  phasePillLeft: {
    borderRadius: 22,
  },
  phasePillMiddle: {
    borderRadius: 22,
  },
  phasePillRight: {
    borderRadius: 22,
  },
  phasePillText: {
    color: "#8E8E8E",
    fontSize: 12, fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  phasePillTextSelected: {
    color: "#ffffff",
  },
  liftIntensityCarousel: {
    width: "100%",
    position: "relative",
  },
  liftIntensityCarouselContent: {
    gap: 8,
    alignItems: "stretch",
  },
  liftIntensityCard: {
    width: LIFT_INTENSITY_CARD_WIDTH,
    minHeight: LIFT_INTENSITY_CARD_HEIGHT,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#1E1E1E",
    backgroundColor: "#141414",
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: "center",
  },
  liftIntensityCardSelected: {
    borderColor: "#C9B259",
    borderWidth: 0.5,
  },
  liftIntensityCardTitle: {
    color: "#ffffff",
    fontSize: 14, fontWeight: "800",
    textTransform: "uppercase",
  },
  liftIntensityCardTitleSelected: {
    color: "#ffffff",
  },
  liftIntensityCardTag: {
    color: "#C9B259",
    fontSize: 9, fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  liftIntensityCardTagSelected: {
    color: "#C9B259",
  },
  liftIntensityCardDescription: {
    color: "#8E8E8E",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
  liftIntensityCardDescriptionSelected: {
    color: "#ffffff",
  },
  loadingStrategyCarousel: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    width: "100%",
  },
  loadingStrategyArrowButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    height: 32,
    justifyContent: "center",
    marginTop: -14,
    opacity: 0.9,
    width: 32,
  },
  loadingStrategyArrow: {
    height: 16,
    tintColor: "#ffffff",
    width: 16,
  },
  loadingStrategyArrowLeft: {
    marginLeft: 0,
    transform: [{ rotate: "180deg" }],
  },
  loadingStrategyViewport: {
    flex: 1,
    overflow: "hidden",
  },
  loadingStrategySlide: {
    alignItems: "center",
    justifyContent: "center",
    height: 112,
  },
  loadingStrategySlideCompact: {
    height: 92,
  },
  loadingVisualCompact: {
    alignItems: "center",
    gap: 6,
    width: 78,
  },
  loadingBlockSlot: {
    alignItems: "center",
    height: 14,
    width: "100%",
  },
  loadingBlock: {
    height: 14,
    overflow: "visible",
    position: "relative",
  },
  loadingBlockShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#5F5F5F",
    borderRadius: 4,
    transform: [{ translateX: -3 }, { translateY: -3 }],
    zIndex: 0,
  },
  loadingBlockFace: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    zIndex: 1,
  },
  loadingStrategyText: {
    color: "#8E8E8E",
    fontSize: 11, fontWeight: "700",
    lineHeight: 14,
    marginTop: 8,
    minHeight: 28,
    textAlign: "center",
    textTransform: "uppercase",
  },
  combatIntensity: {
    gap: 8,
  },
  combatIntensityOutline: {
    borderColor: "#1E1E1E",
    borderRadius: 16,
    borderWidth: 2,
    height: COMBAT_INTENSITY_METER_HEIGHT,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  combatIntensityFillClip: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  combatIntensityFill: {
    backgroundColor: "#ffffff",
    height: "100%",
  },
  combatIntensityTickLow: {
    backgroundColor: "#6B6B6B",
    bottom: 0,
    left: "33.3333%",
    position: "absolute",
    top: 0,
    width: 1,
    zIndex: 2,
  },
  combatIntensityTickMid: {
    backgroundColor: "#6B6B6B",
    bottom: 0,
    left: "66.6667%",
    position: "absolute",
    top: 0,
    width: 1,
    zIndex: 2,
  },
  combatIntensityLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  combatIntensityLabel: {
    color: "#6B6B6B",
    flex: 1,
    fontSize: 11, fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
  },
  combatIntensityLabelSelected: {
    color: "#ffffff",
  },
  durationWheel: {
    height: SESSION_DURATION_ITEM_HEIGHT,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  durationContent: {
    alignItems: "center",
  },
  durationItem: {
    alignItems: "center",
    height: SESSION_DURATION_ITEM_HEIGHT,
    justifyContent: "center",
    width: SESSION_DURATION_ITEM_WIDTH,
  },
  durationText: {
    color: "#ffffff",
    fontSize: 18,
    opacity: 0.5,
    textAlign: "center",
  },
  durationTextLight: {
    color: "#141414",
  },
  durationTextSelected: {
    fontSize: 20,
    opacity: 1,
  },
  durationTextDimmed: {
    opacity: 0.5,
  },
  durationMinuteLabel: {
    alignItems: "baseline",
    flexDirection: "row",
    gap: 5,
  },
  durationNumberText: {
    color: "#ffffff",
    fontSize: 24,
  },
  durationNumberTextLight: {
    color: "#141414",
  },
  durationNumberTextSelected: {
    fontSize: 28,
  },
  durationUnitText: {
    color: "#C9B259",
    fontSize: 12,
  },
  durationUnitTextLight: {
    color: "#4f4f4f",
  },
  durationUnitTextSelected: {
    fontSize: 14,
  },
  durationSelectedFrame: {
    borderColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 0.8,
    height: SESSION_DURATION_ITEM_HEIGHT,
    left: "50%",
    marginLeft: -SESSION_DURATION_ITEM_WIDTH / 2,
    position: "absolute",
    top: 0,
    width: SESSION_DURATION_ITEM_WIDTH,
  },
  durationSelectedFrameLight: {
    borderColor: "#141414",
  },
  deloadVisualCompact: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    minHeight: 52,
  },
  deloadVisualCompactDense: {
    minHeight: 42,
  },
  deloadMetricPair: {
    gap: 4,
    width: 46,
  },
  deloadMetric: {
    backgroundColor: "#ffffff",
    borderRadius: 4,
    color: "#000000",
    fontSize: 11, fontWeight: "800",
    lineHeight: 17,
    overflow: "hidden",
    textAlign: "center",
  },
  deloadMetricChanged: {
    backgroundColor: "#C9B259",
  },
  deloadMetricArrow: {
    height: 14,
    tintColor: "#ffffff",
    width: 14,
  },
  cardOptions: {
    gap: 10,
  },
  cardOptionsStatic: {
    flexDirection: "row",
    gap: 8,
  },
  optionCard: {
    width: 108,
    height: 100,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1E1E1E",
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
  },
  optionCardStretch: {
    flex: 1,
    width: 0,
    minWidth: 0,
  },
  optionCardSelected: {
    borderStyle: "solid",
    borderColor: "#ffffff",
  },
  optionImage: {
    width: 42,
    height: 42,
    marginBottom: 8,
    tintColor: "#8E8E8E",
  },
  optionImageSelected: {
    tintColor: "#ffffff",
  },
  optionCardText: {
    color: "#8E8E8E",
    fontSize: 12, fontWeight: "700",
    textAlign: "center",
  },
  optionCardTextSelected: {
    color: "#ffffff",
  },
  input: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#1E1E1E",
    backgroundColor: "#141414",
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#ffffff",
  },
  textarea: {
    minHeight: 74,
    textAlignVertical: "top",
  },
  weekdayButtonRow: {
    flexDirection: "row",
    gap: 4,
    overflow: "visible",
    width: "100%",
    zIndex: 5,
  },
  weekdayButtonSlot: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    zIndex: 1,
  },
  weekdayButtonSlotActive: {
    zIndex: 10,
  },
  weekdayButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 54,
    minWidth: 0,
    borderColor: "transparent",
    borderWidth: 1,
    paddingHorizontal: 2,
    paddingVertical: 5,
    width: "100%",
  },
  weekdayButtonLight: {
    borderColor: "transparent",
  },
  weekdayButtonSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  weekdayButtonSelectedLight: {
    backgroundColor: "#141414",
    borderColor: "#141414",
  },
  weekdayButtonDisabled: {
    opacity: 1,
  },
  weekdayButtonPressed: {
    opacity: 0.78,
  },
  weekdayButtonText: {
    color: "#ffffff",
    fontSize: 14, fontWeight: "700",
  },
  weekdayButtonTextLight: {
    color: "#141414",
    flexShrink: 1,
    maxWidth: "100%",
    textAlign: "center",
  },
  weekdayButtonTextSelected: {
    color: "#000000",
  },
  weekdayButtonTextSelectedLight: {
    color: "#ffffff",
  },
  weekdayButtonTextDisabled: {
    opacity: 0.2,
  },
  weekdayAssignmentText: {
    color: "#ffffff",
    fontSize: 11, fontWeight: "700",
    lineHeight: 13,
    minHeight: 13,
    textAlign: "center",
  },
  weekdayAssignmentTextLight: {
    color: "#141414",
    flexShrink: 1,
    maxWidth: "100%",
  },
  weekdayAssignmentTextSelected: {
    color: "#000000",
  },
  weekdayAssignmentTextSelectedLight: {
    color: "#ffffff",
  },
  weekdayDropdown: {
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 8,
    borderWidth: 2,
    left: "50%",
    marginLeft: -39,
    minWidth: 78,
    overflow: "hidden",
    position: "absolute",
    bottom: 58,
    zIndex: 20,
  },
  weekdayDropdownLight: {
    backgroundColor: "#ffffff",
    borderColor: "#141414",
  },
  weekdayDropdownItem: {
    alignItems: "center",
    borderColor: "transparent",
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 35,
    paddingHorizontal: 9,
  },
  weekdayDropdownItemLight: {
    borderColor: "#e3e3e3",
  },
  weekdayDropdownItemSelected: {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
  },
  weekdayDropdownItemSelectedLight: {
    backgroundColor: "#141414",
    borderColor: "#141414",
  },
  weekdayDropdownItemPressed: {
    opacity: 0.78,
  },
  weekdayDropdownClearItem: {
    borderColor: "#1E1E1E",
    borderTopWidth: 2,
  },
  weekdayDropdownClearItemLight: {
    borderColor: "#d7d7d7",
  },
  weekdayDropdownText: {
    color: "#ffffff",
    fontSize: 14, fontWeight: "700",
  },
  weekdayDropdownTextLight: {
    color: "#141414",
    flexShrink: 1,
    maxWidth: "100%",
    textAlign: "center",
  },
  weekdayDropdownTextSelected: {
    color: "#000000",
  },
  weekdayDropdownTextSelectedLight: {
    color: "#ffffff",
  },
  weekdayDropdownClearText: {
    color: "#8E8E8E",
  },
  weekdayDropdownClearTextLight: {
    color: "#6f6f6f",
  },
});
