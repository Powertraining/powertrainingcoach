import { EQUIPMENT_OPTIONS } from "../../constants/trainingPreferences.js";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

const OPTION_TRAVEL = 12;
const OPTION_FACE_HEIGHT = 118;
const OPTION_HEIGHT = OPTION_FACE_HEIGHT + 18;
const SHADOW_COLOR = "#ac8a00";

const EQUIPMENT_IMAGES = Object.freeze({
  full_gym: require("../../assets/icons/bench.png"),
  home_minimal: require("../../assets/icons/dumbellpng.png"),
  bodyweight_only: require("../../assets/icons/bicep.png"),
});

function EquipmentOptionButton({
  label,
  imageSource,
  imageSize,
  isSelected,
  onPress,
}) {
  const selectionProgress = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const isSelectedRef = useRef(isSelected);
  isSelectedRef.current = isSelected;

  function animateSelection(toValue, isTapFeedback = false) {
    selectionProgress.stopAnimation();

    if (isTapFeedback) {
      Animated.timing(selectionProgress, {
        toValue,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished && toValue === 1 && !isSelectedRef.current) {
          animateSelection(isSelectedRef.current ? 1 : 0);
        }
      });
      return;
    }

    Animated.spring(selectionProgress, {
      toValue,
      damping: 18,
      stiffness: 320,
      mass: 0.62,
      useNativeDriver: false,
    }).start();
  }

  useEffect(() => {
    animateSelection(isSelected ? 1 : 0);
  }, [isSelected, selectionProgress]);

  function handlePressIn() {
    animateSelection(isSelected ? 0 : 1, true);
    Animated.spring(pressScale, {
      toValue: isSelected ? 0.99 : 1.015,
      damping: 18,
      stiffness: 420,
      mass: 0.5,
      useNativeDriver: false,
    }).start();
    onPress?.();
  }

  function handlePressOut() {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 16,
      stiffness: 250,
      mass: 0.75,
      useNativeDriver: false,
    }).start();
  }

  const animatedShadowStyle = {
    opacity: selectionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    top: selectionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [OPTION_TRAVEL, 0],
    }),
    height: selectionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [OPTION_FACE_HEIGHT, OPTION_HEIGHT],
    }),
    backgroundColor: SHADOW_COLOR,
  };

  const animatedButtonStyle = {
    transform: [
      {
        translateY: selectionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [OPTION_TRAVEL, 0],
        }),
      },
      {
        scale: selectionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
      { scale: pressScale },
    ],
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.optionPressable}
    >
      <Animated.View style={[styles.optionShadow, animatedShadowStyle]} />
      <Animated.View
        style={[
          styles.optionButton,
          isSelected ? styles.optionButtonSelected : null,
          animatedButtonStyle,
        ]}
      >
        <Image
          source={imageSource}
          style={[styles.optionImage, { height: imageSize, width: imageSize }]}
          resizeMode="contain"
        />
        <IBMPlexText
          defaultWhite
          fontSize={14}
          lines={2}
          style={styles.optionLabel}
          textColor="#ffffff"
          center
        >
          {label}
        </IBMPlexText>
      </Animated.View>
    </Pressable>
  );
}

export default function TrainingPreferencesEquipmentView({
  value,
  onChange,
}) {
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const [isSelectionCleared, setIsSelectionCleared] = useState(false);
  const displayedValue = isSelectionCleared ? null : value;
  const imageSize = Math.min(Math.max(screenWidth * 0.12, 42), 56);

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <IBMPlexText titleBlock height={130}>Equipment available</IBMPlexText>
      <IBMPlexText defaultWhite style={styles.helperText} center>
        Pick the setup you can train with most often so exercises match your access.
      </IBMPlexText>
      <View style={styles.options}>
        {EQUIPMENT_OPTIONS.map((option) => {
          const isSelected = displayedValue === option.value;

          return (
            <EquipmentOptionButton
              key={option.value}
              onPress={() => {
                setIsSelectionCleared(isSelected);
                onChange?.(isSelected ? null : option.value);
              }}
              isSelected={isSelected}
              imageSource={EQUIPMENT_IMAGES[option.value]}
              imageSize={imageSize}
              label={option.label}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    transform: [{ translateY: 36 }],
  },
  helperText: {
    width: "82%",
    alignSelf: "center",
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  options: {
    gap: 16,
    marginTop: 56,
  },
  optionPressable: {
    alignSelf: "center",
    height: OPTION_HEIGHT,
    position: "relative",
    width: "75%",
  },
  optionShadow: {
    borderRadius: 22,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  optionButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#121212",
    borderColor: "#2D2D2D",
    borderRadius: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    height: OPTION_FACE_HEIGHT,
    justifyContent: "center",
    minHeight: OPTION_FACE_HEIGHT,
    paddingHorizontal: 14,
    paddingVertical: 14,
    position: "absolute",
    top: 0,
    width: "100%",
  },
  optionButtonSelected: {
    backgroundColor: "#171717",
    borderColor: "#C9B259",
    borderStyle: "solid",
  },
  optionImage: {
    flexShrink: 1,
  },
  optionLabel: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
  },
});
