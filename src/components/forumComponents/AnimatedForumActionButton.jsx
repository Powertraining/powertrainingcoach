import { useRef } from "react";
import { Animated, Pressable } from "react-native";

export default function AnimatedForumActionButton({
  children,
  disabled = false,
  onPress,
  pressOnPressIn = false,
  style,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    scale.stopAnimation();
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 45,
      useNativeDriver: true,
    }).start();

    if (pressOnPressIn) {
      onPress?.();
    }
  }

  function pressOut() {
    scale.stopAnimation();
    Animated.spring(scale, {
      toValue: 1,
      friction: 9,
      tension: 520,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ alignSelf: "flex-start", transform: [{ scale }] }}>
      <Pressable
        disabled={disabled}
        onPress={pressOnPressIn ? undefined : onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed }) => [
          style,
          pressed ? { opacity: 0.9 } : null,
          disabled ? { opacity: 0.48 } : null,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
