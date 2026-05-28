import {
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  Pressable,
} from "react-native";

export default function PressedShadowButton({
  accessibilityLabel,
  accessibilityRole = "button",
  children,
  disabled = false,
  faceSelectedStyle,
  faceStyle,
  onPress,
  pressedTranslateX = -6,
  pressedTranslateY = -6,
  releaseOnPressOut = true,
  selected = false,
  shadowSelectedStyle,
  shadowStyle,
  style,
}) {
  const pressProgress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const faceTransform = {
    transform: [
      {
        translateX: pressProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, pressedTranslateX],
        }),
      },
      {
        translateY: pressProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, pressedTranslateY],
        }),
      },
    ],
  };

  useEffect(() => {
    Animated.timing(pressProgress, {
      toValue: selected ? 1 : 0,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [pressProgress, selected]);

  function animatePress(toValue) {
    Animated.timing(pressProgress, {
      toValue,
      duration: toValue ? 70 : 120,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => animatePress(1)}
      onPressOut={() => {
        if (releaseOnPressOut && !selected) {
          animatePress(0);
        }
      }}
      style={style}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          shadowStyle,
          selected ? shadowSelectedStyle : null,
        ]}
      />
      <Animated.View
        style={[
          faceStyle,
          faceTransform,
          selected ? faceSelectedStyle : null,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
